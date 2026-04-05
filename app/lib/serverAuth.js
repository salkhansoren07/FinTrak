import crypto from "node:crypto";
import { deriveSecret } from "./serverSecrets";

const SESSION_COOKIE_NAME = "fintrak_session";
const OAUTH_COOKIE_NAME = "fintrak_oauth";
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 30;
const OAUTH_DURATION_SECONDS = 60 * 10;

function isProduction() {
  return process.env.NODE_ENV === "production";
}

function sign(value) {
  return crypto
    .createHmac("sha256", deriveSecret("session-signing"))
    .update(value)
    .digest("base64url");
}

function encodeSignedPayload(payload) {
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encoded}.${sign(encoded)}`;
}

function decodeSignedPayload(value) {
  if (!value) return null;

  const [encoded, signature] = value.split(".");
  if (!encoded || !signature) return null;

  const expected = sign(encoded);
  const matches =
    signature.length === expected.length &&
    crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));

  if (!matches) return null;

  try {
    const parsed = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
    if (!parsed?.exp || Date.now() > parsed.exp) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function readSessionFromRequest(req) {
  const value = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  return decodeSignedPayload(value);
}

export function applySessionCookie(response, user) {
  const payload = {
    id: user.id,
    username: user.username || null,
    email: user.email || null,
    exp: Date.now() + SESSION_DURATION_SECONDS * 1000,
  };

  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: encodeSignedPayload(payload),
    httpOnly: true,
    sameSite: "lax",
    secure: isProduction(),
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  });
}

export function clearSessionCookie(response) {
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: isProduction(),
    path: "/",
    maxAge: 0,
  });
}

export function readOAuthFlowFromRequest(req) {
  const value = req.cookies.get(OAUTH_COOKIE_NAME)?.value;
  return decodeSignedPayload(value);
}

export function applyOAuthFlowCookie(response, payload) {
  response.cookies.set({
    name: OAUTH_COOKIE_NAME,
    value: encodeSignedPayload({
      ...payload,
      exp: Date.now() + OAUTH_DURATION_SECONDS * 1000,
    }),
    httpOnly: true,
    sameSite: "lax",
    secure: isProduction(),
    path: "/",
    maxAge: OAUTH_DURATION_SECONDS,
  });
}

export function clearOAuthFlowCookie(response) {
  response.cookies.set({
    name: OAUTH_COOKIE_NAME,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: isProduction(),
    path: "/",
    maxAge: 0,
  });
}
