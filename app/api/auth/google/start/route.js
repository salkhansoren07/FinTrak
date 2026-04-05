import { NextResponse } from "next/server";
import {
  buildGoogleAuthUrl,
  createCodeVerifier,
  createOAuthState,
} from "../../../../lib/googleOAuth";
import {
  applyOAuthFlowCookie,
  readSessionFromRequest,
} from "../../../../lib/serverAuth";

export async function GET(req) {
  const session = readSessionFromRequest(req);
  if (!session?.id) {
    return NextResponse.redirect(new URL("/?authError=login_required", req.url));
  }

  const url = new URL(req.url);
  const forceConsent = url.searchParams.get("consent") === "1";
  const state = createOAuthState();
  const verifier = createCodeVerifier();
  const authUrl = buildGoogleAuthUrl(req, {
    state,
    verifier,
    forceConsent,
  });

  const response = NextResponse.redirect(authUrl);
  applyOAuthFlowCookie(response, {
    state,
    verifier,
    forceConsent,
    userId: session.id,
  });

  return response;
}
