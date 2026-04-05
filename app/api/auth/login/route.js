import { NextResponse } from "next/server";
import { getSupabaseAdmin, hasSupabaseAdminConfig } from "../../../lib/supabaseAdmin";
import { applySessionCookie } from "../../../lib/serverAuth";
import {
  getFintrakUserByIdentifier,
  normalizeLoginIdentifier,
} from "../../../lib/fintrakUsers";
import { verifyPassword } from "../../../lib/passwords";

export async function POST(req) {
  try {
    if (!hasSupabaseAdminConfig()) {
      return NextResponse.json(
        { error: "Supabase is not configured for FinTrak accounts." },
        { status: 500 }
      );
    }

    const body = await req.json();
    const identifier = normalizeLoginIdentifier(body?.identifier);
    const password = String(body?.password || "");

    if (!identifier || !password) {
      return NextResponse.json(
        { error: "Username/email and password are required." },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();
    const { user, error } = await getFintrakUserByIdentifier(
      supabase,
      identifier
    );

    if (error) {
      console.error("Failed to read FinTrak account:", error);
      return NextResponse.json(
        { error: "Could not sign in right now." },
        { status: 500 }
      );
    }

    if (!user) {
      return NextResponse.json(
        { error: "No FinTrak account was found for those credentials." },
        { status: 401 }
      );
    }

    const passwordMatches = await verifyPassword(password, user.passwordHash);
    if (!passwordMatches) {
      return NextResponse.json(
        { error: "Incorrect password." },
        { status: 401 }
      );
    }

    const response = NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
      gmailConnected: Boolean(user.gmailRefreshToken),
      hasPasscode: Boolean(user.passcodeHash),
    });

    applySessionCookie(response, user);
    return response;
  } catch (error) {
    console.error("FinTrak login failed:", error);
    return NextResponse.json(
      { error: "Unexpected login error." },
      { status: 500 }
    );
  }
}
