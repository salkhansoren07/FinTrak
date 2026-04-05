import { NextResponse } from "next/server";
import {
  clearSessionCookie,
  readSessionFromRequest,
} from "../../../lib/serverAuth";
import { getSupabaseAdmin, hasSupabaseAdminConfig } from "../../../lib/supabaseAdmin";
import { getFintrakUserById } from "../../../lib/fintrakUsers";

export async function GET(req) {
  const session = readSessionFromRequest(req);
  if (!session?.id) {
    const response = NextResponse.json({
      authenticated: false,
      user: null,
      gmailConnected: false,
      hasPasscode: false,
    });
    if (session) {
      clearSessionCookie(response);
    }
    return response;
  }

  if (!session) {
    return NextResponse.json({
      authenticated: false,
      user: null,
      gmailConnected: false,
      hasPasscode: false,
    });
  }

  if (!hasSupabaseAdminConfig()) {
    return NextResponse.json({
      authenticated: true,
      user: {
        id: session.id,
        username: session.username,
        email: session.email,
      },
      gmailConnected: false,
      hasPasscode: false,
    });
  }

  const { user, error } = await getFintrakUserById(getSupabaseAdmin(), session.id);
  if (error || !user) {
    if (error) {
      console.error("Failed to load FinTrak session user:", error);
    }

    const response = NextResponse.json({
      authenticated: false,
      user: null,
      gmailConnected: false,
      hasPasscode: false,
    });
    clearSessionCookie(response);
    return response;
  }

  return NextResponse.json({
    authenticated: true,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
    },
    gmailConnected: Boolean(user.gmailRefreshToken),
    hasPasscode: Boolean(user.passcodeHash),
  });
}
