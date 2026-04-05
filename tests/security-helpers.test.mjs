import test from "node:test";
import assert from "node:assert/strict";
import {
  buildCategoryOverridesStorageKey,
  readCategoryOverrides,
  writeCategoryOverrides,
} from "../app/lib/categoryOverridesStorage.mjs";
import {
  MAX_PASSCODE_FAILURES,
  PASSCODE_LOCKOUT_MS,
  PASSCODE_ATTEMPT_WINDOW_MS,
  buildPasscodeAttemptCookiePayload,
  getPasscodeRetryAfterSeconds,
  isPasscodeLocked,
  registerFailedPasscodeAttempt,
} from "../app/lib/passcodeSecurity.mjs";

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
