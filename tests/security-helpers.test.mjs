import test from "node:test";
import assert from "node:assert/strict";
import {
  buildCategoryOverridesStorageKey,
  readCategoryOverrides,
  writeCategoryOverrides,
} from "../app/lib/categoryOverridesStorage.mjs";
import { getSessionRedirect } from "../app/lib/clientSession.js";
import {
  isValidUsername,
  USERNAME_REQUIREMENTS_MESSAGE,
} from "../app/lib/authValidation.mjs";
import {
  MAX_PASSCODE_FAILURES,
  PASSCODE_LOCKOUT_MS,
  PASSCODE_ATTEMPT_WINDOW_MS,
  buildPasscodeAttemptCookiePayload,
  getPasscodeRetryAfterSeconds,
  isPasscodeLocked,
  registerFailedPasscodeAttempt,
} from "../app/lib/passcodeSecurity.mjs";
import {
  encodeUserDataProfile,
  normalizeStoredUserDataProfile,
} from "../app/lib/userDataProfile.mjs";
import {
  buildTransactionCacheKey,
  resolveTransactionCacheUserKey,
} from "../app/lib/transactionCache.mjs";
import {
  LOGIN_ATTEMPT_WINDOW_MS,
  MAX_LOGIN_FAILURES,
  buildLoginThrottleKey,
  clearTrackedLoginAttemptState,
  createLoginLockedMessage,
  isLoginLocked,
  readTrackedLoginAttemptState,
  resetTrackedLoginAttemptsForTests,
  trackFailedLoginAttempt,
} from "../app/lib/loginSecurity.mjs";

function createStorage() {
  const values = new Map();

  return {
    getItem(key) {
      return values.has(key) ? values.get(key) : null;
    },
    setItem(key, value) {
      values.set(key, value);
    },
    removeItem(key) {
      values.delete(key);
    },
  };
}

test("passcode attempts lock after repeated failures in one window", () => {
  let state = null;
  const now = 1_000_000;

  for (let index = 0; index < MAX_PASSCODE_FAILURES; index += 1) {
    state = registerFailedPasscodeAttempt(state, now + index);
  }

  assert.equal(isPasscodeLocked(state, now + MAX_PASSCODE_FAILURES), true);
  assert.equal(
    getPasscodeRetryAfterSeconds(state, now + MAX_PASSCODE_FAILURES),
    Math.ceil((PASSCODE_LOCKOUT_MS - MAX_PASSCODE_FAILURES) / 1000)
  );
});

test("passcode attempts reset after the rolling window expires", () => {
  const initialState = registerFailedPasscodeAttempt(null, 5_000);
  const nextState = registerFailedPasscodeAttempt(
    initialState,
    5_000 + PASSCODE_ATTEMPT_WINDOW_MS + 1
  );

  assert.equal(nextState.count, 1);
  assert.equal(nextState.lockedUntil, null);
});

test("cookie payload expires when the attempt state should expire", () => {
  const lockedState = {
    count: MAX_PASSCODE_FAILURES,
    windowStartedAt: 10_000,
    lockedUntil: 10_000 + PASSCODE_LOCKOUT_MS,
  };

  const payload = buildPasscodeAttemptCookiePayload(lockedState, 10_000);
  assert.equal(payload.exp, lockedState.lockedUntil);
});

test("category overrides are scoped per user", () => {
  const storage = createStorage();

  writeCategoryOverrides("user-a", { txn1: "Food" }, storage);
  writeCategoryOverrides("user-b", { txn2: "Bills" }, storage);

  assert.deepEqual(readCategoryOverrides("user-a", storage), { txn1: "Food" });
  assert.deepEqual(readCategoryOverrides("user-b", storage), { txn2: "Bills" });
  assert.equal(
    buildCategoryOverridesStorageKey("user-a"),
    "categoryOverrides:user-a"
  );
});

test("legacy shared category overrides are ignored", () => {
  const storage = createStorage();

  storage.setItem("categoryOverrides", JSON.stringify({ txn0: "Transfer" }));

  assert.deepEqual(readCategoryOverrides("user-c", storage), {});
});

test("user data profile preserves budgets and category overrides", () => {
  const encoded = encodeUserDataProfile({
    categoryOverrides: { txn1: "Food" },
    budgetTargets: { Food: 5000, Bills: 2500 },
  });

  assert.deepEqual(normalizeStoredUserDataProfile(encoded), {
    categoryOverrides: { txn1: "Food" },
    budgetTargets: { Food: 5000, Bills: 2500 },
  });
});

test("username validation matches production signup requirements", () => {
  assert.equal(isValidUsername("aarav_mehta"), true);
  assert.equal(isValidUsername("Aarav Mehta"), false);
  assert.match(USERNAME_REQUIREMENTS_MESSAGE, /3-24 characters/);
});

test("login attempts lock after repeated failures for one identifier and client", () => {
  resetTrackedLoginAttemptsForTests();
  const key = buildLoginThrottleKey("aarav_mehta", "203.0.113.5");
  const now = 2_000_000;
  let state = null;

  for (let index = 0; index < MAX_LOGIN_FAILURES; index += 1) {
    state = trackFailedLoginAttempt(key, now + index);
  }

  assert.equal(isLoginLocked(state, now + MAX_LOGIN_FAILURES), true);
  assert.equal(
    readTrackedLoginAttemptState(key, now + MAX_LOGIN_FAILURES)?.count,
    MAX_LOGIN_FAILURES
  );
  assert.match(createLoginLockedMessage(state), /Too many login attempts/);

  clearTrackedLoginAttemptState(key);
  assert.equal(readTrackedLoginAttemptState(key), null);
});

test("login attempt tracking expires after the rolling window", () => {
  resetTrackedLoginAttemptsForTests();
  const key = buildLoginThrottleKey("aarav_mehta", "203.0.113.5");
  const now = 3_000_000;

  trackFailedLoginAttempt(key, now);

  assert.equal(readTrackedLoginAttemptState(key, now + LOGIN_ATTEMPT_WINDOW_MS + 1), null);
});

test("transaction cache keys stay scoped to the authenticated user", () => {
  assert.equal(
    resolveTransactionCacheUserKey({
      authenticatedUserId: "user-123",
    }),
    "user-123"
  );

  assert.equal(
    resolveTransactionCacheUserKey({
      authenticatedUserId: "user-123",
      cloudUserKey: "cloud-user-123",
    }),
    "cloud-user-123"
  );

  assert.equal(buildTransactionCacheKey("user-123"), "transactionCache:user-123");
  assert.equal(buildTransactionCacheKey(""), null);
});

test("session redirect handles partial auth states safely", () => {
  assert.equal(getSessionRedirect("/profile", false), "/");
  assert.equal(getSessionRedirect("/get-started", false), null);
  assert.equal(getSessionRedirect("/profile", true, "user-1", false), "/passcode");
  assert.equal(getSessionRedirect("/budget", true, "user-1", true), "/unlock");
  assert.equal(getSessionRedirect("/passcode", true, "user-1", false), null);
  assert.equal(getSessionRedirect("/unlock", true, "user-1", true), null);
});
