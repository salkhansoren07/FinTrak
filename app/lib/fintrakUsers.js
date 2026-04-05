import crypto from "node:crypto";
import {
  encodeUserDataProfile,
  normalizeStoredUserDataProfile,
} from "./userDataProfile.mjs";

const TABLE_NAME = "fintrak_users";

function normalizeEmail(email) {
  return email ? String(email).trim().toLowerCase() : "";
}

function normalizeUsername(username) {
  return String(username).trim().toLowerCase();
}

function mapUser(row) {
  if (!row) return null;

  return {
    ...normalizeStoredUserDataProfile(row.category_overrides),
    id: row.id,
    username: row.username,
    email: row.email || null,
    passwordHash: row.password_hash || "",
    passcodeHash: row.passcode_hash || "",
    gmailRefreshToken: row.gmail_refresh_token || null,
    gmailEmail: row.gmail_email || null,
    gmailSubject: row.gmail_subject || null,
  };
}

export async function getFintrakUserById(supabase, id) {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select(
      "id, username, email, password_hash, passcode_hash, gmail_refresh_token, gmail_email, gmail_subject, category_overrides"
    )
    .eq("id", id)
    .maybeSingle();

  return { user: mapUser(data), error };
}

export async function getFintrakUserByIdentifier(supabase, identifier) {
  const normalized = normalizeUsername(identifier);
  const normalizedEmail = normalizeEmail(identifier);

  const byUsername = await supabase
    .from(TABLE_NAME)
    .select(
      "id, username, email, password_hash, passcode_hash, gmail_refresh_token, gmail_email, gmail_subject, category_overrides"
    )
    .eq("username", normalized)
    .maybeSingle();

  if (byUsername.error || byUsername.data) {
    return { user: mapUser(byUsername.data), error: byUsername.error };
  }

  const byEmail = await supabase
    .from(TABLE_NAME)
    .select(
      "id, username, email, password_hash, passcode_hash, gmail_refresh_token, gmail_email, gmail_subject, category_overrides"
    )
    .eq("email", normalizedEmail)
    .maybeSingle();

  return { user: mapUser(byEmail.data), error: byEmail.error };
}

export async function createFintrakUser(
  supabase,
  { username, email, passwordHash }
) {
  const normalizedUsername = normalizeUsername(username);
  const normalizedEmail = normalizeEmail(email);

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .insert({
      id: crypto.randomUUID(),
      username: normalizedUsername,
      email: normalizedEmail || null,
      password_hash: passwordHash,
      category_overrides: encodeUserDataProfile(),
    })
    .select("id, username, email, gmail_refresh_token, passcode_hash")
    .single();

  return {
    user: data
      ? {
          id: data.id,
          username: data.username,
          email: data.email || null,
          gmailConnected: Boolean(data.gmail_refresh_token),
          hasPasscode: Boolean(data.passcode_hash),
        }
      : null,
    error,
  };
}

export async function updateFintrakUserGmailConnection(
  supabase,
  { userId, encryptedRefreshToken, gmailEmail, gmailSubject }
) {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .update({
      gmail_refresh_token: encryptedRefreshToken,
      gmail_email: gmailEmail || null,
      gmail_subject: gmailSubject || null,
    })
    .eq("id", userId)
    .select("id, username, email, gmail_refresh_token, passcode_hash")
    .single();

  return {
    user: data
      ? {
          id: data.id,
          username: data.username,
          email: data.email || null,
          gmailConnected: Boolean(data.gmail_refresh_token),
          hasPasscode: Boolean(data.passcode_hash),
        }
      : null,
    error,
  };
}

export async function clearFintrakUserGmailConnection(supabase, userId) {
  return supabase
    .from(TABLE_NAME)
    .update({
      gmail_refresh_token: null,
      gmail_email: null,
      gmail_subject: null,
    })
    .eq("id", userId);
}

export async function updateFintrakUserPasscode(supabase, userId, passcodeHash) {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .update({
      passcode_hash: passcodeHash,
    })
    .eq("id", userId)
    .select("id, passcode_hash")
    .single();

  return { data, error };
}

export async function clearFintrakUserPasscode(supabase, userId) {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .update({
      passcode_hash: null,
    })
    .eq("id", userId)
    .select("id, passcode_hash")
    .single();

  return { data, error };
}

export async function deleteFintrakUserById(supabase, userId) {
  const { error } = await supabase
    .from(TABLE_NAME)
    .delete()
    .eq("id", userId);

  return { error };
}

export async function updateFintrakUserCategoryOverrides(
  supabase,
  userId,
  categoryOverrides
) {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .update({
      category_overrides: encodeUserDataProfile({ categoryOverrides }),
    })
    .eq("id", userId)
    .select("id, category_overrides")
    .single();

  return { data, error };
}

export async function updateFintrakUserDataProfile(
  supabase,
  userId,
  { categoryOverrides, budgetTargets }
) {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .update({
      category_overrides: encodeUserDataProfile({
        categoryOverrides,
        budgetTargets,
      }),
    })
    .eq("id", userId)
    .select("id, category_overrides")
    .single();

  return { data, error };
}

export async function isUsernameTaken(supabase, username) {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select("id")
    .eq("username", normalizeUsername(username))
    .maybeSingle();

  return { taken: Boolean(data), error };
}

export async function isEmailTaken(supabase, email) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) {
    return { taken: false, error: null };
  }

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select("id")
    .eq("email", normalizedEmail)
    .maybeSingle();

  return { taken: Boolean(data), error };
}

export function normalizeLoginIdentifier(identifier) {
  return String(identifier).trim().toLowerCase();
}
