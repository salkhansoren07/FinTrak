import { NextResponse } from "next/server";
import { verifyPassword, hashPassword } from "../../lib/passwords";
import {
  clearPasscodeAttemptStateCookie,
  readSessionFromRequest,
} from "../../lib/serverAuth";
import { getSupabaseAdmin, hasSupabaseAdminConfig } from "../../lib/supabaseAdmin";
import {
  clearFintrakUserPasscode,
  getFintrakUserById,
  updateFintrakUserPasscode,
} from "../../lib/fintrakUsers";

function getSessionUser(req) {
  const session = readSessionFromRequest(req);
  return session?.id ? session : null;
}

function isValidPasscode(passcode) {
  return /^\d{6}$/.test(passcode);
}

export async function POST(req) {
  try {
    const session = getSessionUser(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasSupabaseAdminConfig()) {
      return NextResponse.json(
        { error: "Supabase is not configured for passcodes." },
        { status: 500 }
      );
    }

    const body = await req.json();
    const passcode = String(body?.passcode || "");

    if (!isValidPasscode(passcode)) {
      return NextResponse.json(
        { error: "Passcode must be exactly 6 digits." },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();
    const passcodeHash = await hashPassword(passcode);
    const { error } = await updateFintrakUserPasscode(
      supabase,
      session.id,
      passcodeHash
    );

    if (error) {
      console.error("Failed to save FinTrak passcode:", error);
      return NextResponse.json(
        { error: "Could not save your passcode." },
        { status: 500 }
      );
    }

    const response = NextResponse.json({ ok: true, hasPasscode: true });
    clearPasscodeAttemptStateCookie(response);
    return response;
  } catch (error) {
    console.error("Unexpected passcode save error:", error);
    return NextResponse.json(
      { error: "Unexpected passcode save error." },
      { status: 500 }
    );
  }
}

export async function DELETE(req) {
  try {
    const session = getSessionUser(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasSupabaseAdminConfig()) {
      return NextResponse.json(
        { error: "Supabase is not configured for passcodes." },
        { status: 500 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const password = String(body?.password || "");

    if (!password) {
      return NextResponse.json(
        { error: "Current account password is required to reset your passcode." },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();
    const { user, error: userError } = await getFintrakUserById(
      supabase,
      session.id
    );

    if (userError || !user) {
      if (userError) {
        console.error("Failed to load FinTrak user for passcode reset:", userError);
      }
      return NextResponse.json(
        { error: "Could not verify your account before resetting the passcode." },
        { status: 500 }
      );
    }

    const passwordMatches = await verifyPassword(password, user.passwordHash);
    if (!passwordMatches) {
      return NextResponse.json(
        { error: "Incorrect account password." },
        { status: 401 }
      );
    }

    const { error } = await clearFintrakUserPasscode(supabase, session.id);

    if (error) {
      console.error("Failed to clear FinTrak passcode:", error);
      return NextResponse.json(
        { error: "Could not clear your passcode." },
        { status: 500 }
      );
    }

    const response = NextResponse.json({ ok: true, hasPasscode: false });
    clearPasscodeAttemptStateCookie(response);
    return response;
  } catch (error) {
    console.error("Unexpected passcode clear error:", error);
    return NextResponse.json(
      { error: "Unexpected passcode clear error." },
      { status: 500 }
    );
  }
}
