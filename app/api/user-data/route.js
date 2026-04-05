import { NextResponse } from "next/server";
import {
  getSupabaseAdmin,
  hasSupabaseAdminConfig,
} from "../../lib/supabaseAdmin";
import { readSessionFromRequest } from "../../lib/serverAuth";
import {
  getFintrakUserById,
  updateFintrakUserCategoryOverrides,
} from "../../lib/fintrakUsers";

export async function GET(req) {
  try {
    const user = readSessionFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasSupabaseAdminConfig()) {
      return NextResponse.json({
        categoryOverrides: {},
        userKey: user.id,
        cloudSyncAvailable: false,
      });
    }

    const supabase = getSupabaseAdmin();
    const { user: appUser, error } = await getFintrakUserById(supabase, user.id);

    if (error) {
      console.error("Failed to read user profile from Supabase:", error);
      return NextResponse.json({
        categoryOverrides: {},
        userKey: user.id,
        cloudSyncAvailable: false,
      });
    }

    return NextResponse.json({
      categoryOverrides: appUser?.categoryOverrides || {},
      userKey: user.id,
      cloudSyncAvailable: true,
    });
  } catch (error) {
    console.error("Failed to load user data:", error);
    return NextResponse.json(
      { categoryOverrides: {}, userKey: null, cloudSyncAvailable: false },
      { status: 200 }
    );
  }
}

export async function PUT(req) {
  try {
    const user = readSessionFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const categoryOverrides =
      body?.categoryOverrides && typeof body.categoryOverrides === "object"
        ? body.categoryOverrides
        : {};

    if (!hasSupabaseAdminConfig()) {
      return NextResponse.json({ ok: true, cloudSyncAvailable: false });
    }

    const supabase = getSupabaseAdmin();
    const { error } = await updateFintrakUserCategoryOverrides(
      supabase,
      user.id,
      categoryOverrides
    );

    if (error) {
      console.error("Failed to save user profile to Supabase:", error);
      return NextResponse.json({ ok: true, cloudSyncAvailable: false });
    }

    return NextResponse.json({ ok: true, cloudSyncAvailable: true });
  } catch (error) {
    console.error("Failed to save user data:", error);
    return NextResponse.json({ ok: true, cloudSyncAvailable: false });
  }
}
