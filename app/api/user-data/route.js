import { NextResponse } from "next/server";
import {
  getSupabaseAdmin,
  hasSupabaseAdminConfig,
} from "../../lib/supabaseAdmin";
import { getUserFromAccessToken } from "../../lib/googleIdentity";

function isMissingColumn(error, columnName) {
  return (
    error?.code === "42703" &&
    typeof error?.message === "string" &&
    error.message.includes(columnName)
  );
}

async function readUserProfile(supabase, user) {
  const primaryResult = await supabase
    .from("user_profiles")
    .select("category_overrides")
    .eq("user_sub", user.sub)
    .maybeSingle();

  if (!isMissingColumn(primaryResult.error, "user_profiles.user_sub")) {
    return primaryResult;
  }

  return supabase
    .from("user_profiles")
    .select("category_overrides")
    .eq("user_id", user.sub)
    .maybeSingle();
}

async function upsertUserProfile(supabase, user, categoryOverrides) {
  const primaryResult = await supabase.from("user_profiles").upsert(
    {
      user_sub: user.sub,
      email: user.email || null,
      category_overrides: categoryOverrides,
    },
    { onConflict: "user_sub" }
  );

  if (!isMissingColumn(primaryResult.error, "user_profiles.user_sub")) {
    return primaryResult;
  }

  return supabase.from("user_profiles").upsert(
    {
      user_id: user.sub,
      email: user.email || null,
      category_overrides: categoryOverrides,
    },
    { onConflict: "user_id" }
  );
}

async function getUserFromRequest(req) {
  const auth = req.headers.get("authorization") || "";
  const accessToken = auth.startsWith("Bearer ") ? auth.slice(7) : "";

  if (!accessToken) return null;

  return getUserFromAccessToken(accessToken);
}

export async function GET(req) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasSupabaseAdminConfig()) {
      return NextResponse.json({
        categoryOverrides: {},
        userKey: user.sub,
        cloudSyncAvailable: false,
      });
    }

    const supabase = getSupabaseAdmin();

    const { data, error } = await readUserProfile(supabase, user);

    if (error) {
      console.error("Failed to read user profile from Supabase:", error);
      return NextResponse.json({
        categoryOverrides: {},
        userKey: user.sub,
        cloudSyncAvailable: false,
      });
    }

    return NextResponse.json({
      categoryOverrides: data?.category_overrides || {},
      userKey: user.sub,
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
    const user = await getUserFromRequest(req);
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

    const { error } = await upsertUserProfile(
      supabase,
      user,
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
