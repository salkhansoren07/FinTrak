import { NextResponse } from "next/server";
import { getSupabaseAdmin, hasSupabaseAdminConfig } from "../../../../lib/supabaseAdmin";
import {
  clearOAuthFlowCookie,
  readOAuthFlowFromRequest,
  readSessionFromRequest,
} from "../../../../lib/serverAuth";
import { exchangeGoogleCode } from "../../../../lib/googleOAuth";
import { getUserFromAccessToken } from "../../../../lib/googleIdentity";
import { encryptSecretValue } from "../../../../lib/serverSecrets";
import {
  getFintrakUserById,
  updateFintrakUserGmailConnection,
} from "../../../../lib/fintrakUsers";

function redirectWithStatus(req, params = {}) {
  const url = new URL("/", req.url);
  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      url.searchParams.set(key, value);
    }
  });
  return url;
}

function finalizeRedirect(req, params = {}) {
  const response = NextResponse.redirect(redirectWithStatus(req, params));
  clearOAuthFlowCookie(response);
  return response;
}

export async function GET(req) {
  const requestUrl = new URL(req.url);
  const state = requestUrl.searchParams.get("state");
  const code = requestUrl.searchParams.get("code");
  const authError = requestUrl.searchParams.get("error");
  const oauthFlow = readOAuthFlowFromRequest(req);

  if (authError) {
    return finalizeRedirect(req, { authError });
  }

  if (!state || !code || !oauthFlow || oauthFlow.state !== state) {
    return finalizeRedirect(req, { authError: "oauth_state_invalid" });
  }

  const session = readSessionFromRequest(req);
  if (!session?.id || oauthFlow.userId !== session.id) {
    return finalizeRedirect(req, { authError: "login_required" });
  }

  if (!hasSupabaseAdminConfig()) {
    return finalizeRedirect(req, { authError: "supabase_not_configured" });
  }

  try {
    const tokenResponse = await exchangeGoogleCode(req, code, oauthFlow.verifier);
    const user = await getUserFromAccessToken(tokenResponse.access_token);

    if (!user?.sub) {
      return finalizeRedirect(req, { authError: "google_user_missing" });
    }

    const supabase = getSupabaseAdmin();
    const { user: appUser, error: appUserError } = await getFintrakUserById(
      supabase,
      session.id
    );

    if (appUserError || !appUser) {
      console.error("Failed to read FinTrak account before Gmail connect:", appUserError);
      return finalizeRedirect(req, { authError: "profile_read_failed" });
    }

    const storedEncryptedRefreshToken = appUser.gmailRefreshToken || "";
    const hasFreshRefreshToken = Boolean(tokenResponse.refresh_token);
    const nextEncryptedRefreshToken = hasFreshRefreshToken
      ? encryptSecretValue(tokenResponse.refresh_token)
      : storedEncryptedRefreshToken;

    if (!nextEncryptedRefreshToken || (oauthFlow.forceConsent && !hasFreshRefreshToken)) {
      if (!oauthFlow.forceConsent) {
        const retryUrl = new URL("/api/auth/google/start", requestUrl.origin);
        retryUrl.searchParams.set("consent", "1");
        const retryResponse = NextResponse.redirect(retryUrl);
        clearOAuthFlowCookie(retryResponse);
        return retryResponse;
      }

      console.error("Google OAuth callback did not return a refresh token");
      return finalizeRedirect(req, { authError: "refresh_token_missing" });
    }

    const upsertResult = await updateFintrakUserGmailConnection(supabase, {
      userId: appUser.id,
      encryptedRefreshToken: nextEncryptedRefreshToken,
      gmailEmail: user.email || null,
      gmailSubject: user.sub,
    });

    if (upsertResult.error) {
      console.error("Failed to save Google refresh token:", upsertResult.error);
      return finalizeRedirect(req, { authError: "profile_write_failed" });
    }

    const response = NextResponse.redirect(new URL("/", req.url));
    clearOAuthFlowCookie(response);
    return response;
  } catch (error) {
    console.error("Google OAuth callback failed:", error);
    return finalizeRedirect(req, { authError: "oauth_callback_failed" });
  }
}
