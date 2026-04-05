import { NextResponse } from "next/server";
import { verifyPassword, hashPassword } from "../../lib/passwords";
import { readSessionFromRequest } from "../../lib/serverAuth";
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

    return NextResponse.json({ ok: true, hasPasscode: true });
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

    const supabase = getSupabaseAdmin();
    const { error } = await clearFintrakUserPasscode(supabase, session.id);

    if (error) {
      console.error("Failed to clear FinTrak passcode:", error);
      return NextResponse.json(
        { error: "Could not clear your passcode." },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, hasPasscode: false });
  } catch (error) {
    console.error("Unexpected passcode clear error:", error);
    return NextResponse.json(
      { error: "Unexpected passcode clear error." },
      { status: 500 }
    );
  }
}
