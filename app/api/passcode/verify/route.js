import { NextResponse } from "next/server";
import { verifyPassword } from "../../../lib/passwords";
import { readSessionFromRequest } from "../../../lib/serverAuth";
import { getSupabaseAdmin, hasSupabaseAdminConfig } from "../../../lib/supabaseAdmin";
import { getFintrakUserById } from "../../../lib/fintrakUsers";

export async function POST(req) {
  try {
    const session = readSessionFromRequest(req);
    if (!session?.id) {
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

    if (!/^\d{6}$/.test(passcode)) {
      return NextResponse.json(
        { error: "Passcode must be exactly 6 digits." },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();
    const { user, error } = await getFintrakUserById(supabase, session.id);

    if (error || !user) {
      if (error) {
        console.error("Failed to load user for passcode verify:", error);
      }
      return NextResponse.json(
        { error: "Could not verify passcode." },
        { status: 500 }
      );
    }

    if (!user.passcodeHash) {
      return NextResponse.json(
        { error: "No passcode has been set for this account." },
        { status: 400 }
      );
    }

    const matches = await verifyPassword(passcode, user.passcodeHash);

    if (!matches) {
      return NextResponse.json(
        { error: "Incorrect passcode." },
        { status: 401 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Unexpected passcode verify error:", error);
    return NextResponse.json(
      { error: "Unexpected passcode verify error." },
      { status: 500 }
    );
  }
}
