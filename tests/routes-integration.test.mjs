import test from "node:test";
import assert from "node:assert/strict";
import { NextResponse } from "next/server.js";
import { hashPassword } from "../app/lib/passwords.js";
import { encryptSecretValue } from "../app/lib/serverSecrets.js";
import {
  applySessionCookie,
  clearSessionCookie,
} from "../app/lib/serverAuth.js";
import {
  clearSupabaseAdminForTests,
  setSupabaseAdminForTests,
} from "../app/lib/supabaseAdmin.js";
import {
  clearTrackedLoginAttemptState,
  resetTrackedLoginAttemptsForTests,
} from "../app/lib/loginSecurity.mjs";

function cloneRow(row) {
  return row ? JSON.parse(JSON.stringify(row)) : row;
}

function pickColumns(row, columns) {
  if (!row || !columns) {
    return cloneRow(row);
  }

  const keys = String(columns)
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  return keys.reduce((result, key) => {
    result[key] = row[key];
    return result;
  }, {});
}

function createSupabaseMock({ users = [], updateError = null } = {}) {
  const state = {
    users: users.map((user) => cloneRow(user)),
    updateError,
  };

  function matches(row, filters) {
    return filters.every(([column, value]) => row?.[column] === value);
  }

  function createQuery(tableName) {
    const query = {
      action: "select",
      filters: [],
      payload: null,
      selectedColumns: null,
      select(columns) {
        this.selectedColumns = columns;
        return this;
      },
      eq(column, value) {
        this.filters.push([column, value]);
        return this;
      },
      insert(payload) {
        this.action = "insert";
        this.payload = cloneRow(payload);
        return this;
      },
      update(payload) {
        this.action = "update";
        this.payload = cloneRow(payload);
        return this;
      },
      delete() {
        this.action = "delete";
        return this;
      },
      maybeSingle() {
        if (tableName !== "fintrak_users") {
          return { data: null, error: new Error("Unknown table") };
        }

        const row = state.users.find((entry) => matches(entry, this.filters)) || null;
        return {
          data: row ? pickColumns(row, this.selectedColumns) : null,
          error: null,
        };
      },
      single() {
        if (tableName !== "fintrak_users") {
          return { data: null, error: new Error("Unknown table") };
        }

        if (this.action === "insert") {
          state.users.push(cloneRow(this.payload));
          return {
            data: pickColumns(this.payload, this.selectedColumns),
            error: null,
          };
        }

        if (this.action === "update") {
          if (state.updateError) {
            return { data: null, error: state.updateError };
          }

          const row = state.users.find((entry) => matches(entry, this.filters)) || null;
          if (!row) {
            return { data: null, error: new Error("Row not found") };
          }

          Object.assign(row, cloneRow(this.payload));
          return {
            data: pickColumns(row, this.selectedColumns),
            error: null,
          };
        }

        return this.maybeSingle();
      },
      then(resolve) {
        if (this.action === "delete") {
          state.users = state.users.filter((entry) => !matches(entry, this.filters));
          return Promise.resolve({ error: null }).then(resolve);
        }

        return Promise.resolve(this.single()).then(resolve);
      },
    };

    return query;
  }

  return {
    state,
    from(tableName) {
      return createQuery(tableName);
    },
  };
}

function createRequest({
  url,
  method = "GET",
  body,
  headers = {},
  cookies = {},
}) {
  return {
    url,
    method,
    headers: new Headers(headers),
    cookies: {
      get(name) {
        const value = cookies[name];
        return value ? { value } : undefined;
      },
    },
    async json() {
      return body ?? {};
    },
  };
}

function createSessionCookie(user) {
  const response = NextResponse.json({ ok: true });
  applySessionCookie(response, user);
  return response.cookies.get("fintrak_session")?.value || "";
}

function setBaseEnv() {
  process.env.APP_SESSION_SECRET = "test-session-secret";
  process.env.SUPABASE_URL = "https://example.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key";
  process.env.GOOGLE_CLIENT_SECRET = "google-client-secret";
}

function resetTestState() {
  resetTrackedLoginAttemptsForTests();
  clearSupabaseAdminForTests();
}

async function withCapturedConsole(run) {
  const originalError = console.error;
  const originalWarn = console.warn;
  const captured = {
    error: [],
    warn: [],
  };

  console.error = (...args) => {
    captured.error.push(args);
  };
  console.warn = (...args) => {
    captured.warn.push(args);
  };

  try {
    return await run(captured);
  } finally {
    console.error = originalError;
    console.warn = originalWarn;
  }
}

test("login route throttles repeated failures across requests", async () => {
  setBaseEnv();
  resetTestState();

  const passwordHash = await hashPassword("correct-password");
  const supabase = createSupabaseMock({
    users: [
      {
        id: "user-1",
        username: "aarav_mehta",
        email: "aarav@example.com",
        password_hash: passwordHash,
        passcode_hash: null,
        gmail_refresh_token: null,
        gmail_email: null,
        gmail_subject: null,
        category_overrides: null,
      },
    ],
  });
  setSupabaseAdminForTests(supabase);

  const { POST } = await import("../app/api/auth/login/route.js");

  let response;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    response = await POST(
      createRequest({
        url: "http://localhost/api/auth/login",
        method: "POST",
        headers: { "x-forwarded-for": "203.0.113.9" },
        body: {
          identifier: "aarav_mehta",
          password: "wrong-password",
        },
      })
    );
  }

  assert.equal(response.status, 429);
  assert.match((await response.json()).error, /Too many login attempts/i);

  const blockedSuccess = await POST(
    createRequest({
      url: "http://localhost/api/auth/login",
      method: "POST",
      headers: { "x-forwarded-for": "203.0.113.9" },
      body: {
        identifier: "aarav_mehta",
        password: "correct-password",
      },
    })
  );

  assert.equal(blockedSuccess.status, 429);

  clearTrackedLoginAttemptState("aarav_mehta::203.0.113.9");
  resetTestState();
});

test("user-data route returns a failing status when cloud profile save fails", async () => {
  setBaseEnv();
  resetTestState();

  const supabase = createSupabaseMock({
    users: [
      {
        id: "user-2",
        username: "riya",
        email: "riya@example.com",
        password_hash: "unused",
        passcode_hash: null,
        gmail_refresh_token: null,
        gmail_email: null,
        gmail_subject: null,
        category_overrides: {
          categoryOverrides: {},
          budgetTargets: {},
        },
      },
    ],
    updateError: new Error("write failed"),
  });
  setSupabaseAdminForTests(supabase);

  const { PUT } = await import("../app/api/user-data/route.js");
  const sessionCookie = createSessionCookie({
    id: "user-2",
    username: "riya",
    email: "riya@example.com",
  });

  await withCapturedConsole(async (captured) => {
    const response = await PUT(
      createRequest({
        url: "http://localhost/api/user-data",
        method: "PUT",
        cookies: {
          fintrak_session: sessionCookie,
        },
        body: {
          budgetTargets: { Food: 5000 },
        },
      })
    );

    assert.equal(response.status, 503);
    assert.deepEqual(await response.json(), {
      ok: false,
      cloudSyncAvailable: false,
      error: "Could not save your data to cloud storage.",
    });
    assert.equal(captured.error.length, 1);
  });

  resetTestState();
});

test("account deletion still succeeds when Google token revocation fails", async () => {
  setBaseEnv();
  resetTestState();

  const passwordHash = await hashPassword("correct-password");
  const encryptedRefreshToken = encryptSecretValue("refresh-token-value");
  const supabase = createSupabaseMock({
    users: [
      {
        id: "user-3",
        username: "neha",
        email: "neha@example.com",
        password_hash: passwordHash,
        passcode_hash: null,
        gmail_refresh_token: encryptedRefreshToken,
        gmail_email: "neha@gmail.com",
        gmail_subject: "google-sub",
        category_overrides: null,
      },
    ],
  });
  setSupabaseAdminForTests(supabase);

  const originalFetch = global.fetch;
  global.fetch = async (url) => {
    if (String(url).includes("oauth2.googleapis.com/revoke")) {
      return new Response("revocation failed", { status: 500 });
    }

    throw new Error(`Unexpected fetch call in test: ${url}`);
  };

  try {
    const { DELETE } = await import("../app/api/account/route.js");
    const sessionCookie = createSessionCookie({
      id: "user-3",
      username: "neha",
      email: "neha@example.com",
    });

    await withCapturedConsole(async (captured) => {
      const response = await DELETE(
        createRequest({
          url: "http://localhost/api/account",
          method: "DELETE",
          cookies: {
            fintrak_session: sessionCookie,
          },
          body: {
            password: "correct-password",
            confirmation: "neha",
          },
        })
      );

      assert.equal(response.status, 200);
      const payload = await response.json();
      assert.equal(payload.ok, true);
      assert.match(payload.warning, /Gmail access/i);
      assert.equal(supabase.state.users.length, 0);
      assert.equal(captured.error.length, 1);

      const logoutResponse = NextResponse.json({ ok: true });
      clearSessionCookie(logoutResponse);
      assert.equal(logoutResponse.cookies.get("fintrak_session")?.value, "");
    });
  } finally {
    global.fetch = originalFetch;
    resetTestState();
  }
});
