import { NextResponse } from "next/server.js";
import {
  getSupabaseAdmin,
  hasSupabaseAdminConfig,
} from "../../lib/supabaseAdmin.js";
import { readSessionFromRequest } from "../../lib/serverAuth.js";
import {
  getFintrakUserById,
  updateFintrakUserDataProfile,
} from "../../lib/fintrakUsers.js";

export async function GET(req) {
  try {
    const user = readSessionFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasSupabaseAdminConfig()) {
      return NextResponse.json({
        categoryOverrides: {},
        budgetTargets: {},
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
        budgetTargets: {},
        userKey: user.id,
        cloudSyncAvailable: false,
      });
    }

    return NextResponse.json({
      categoryOverrides: appUser?.categoryOverrides || {},
      budgetTargets: appUser?.budgetTargets || {},
      userKey: user.id,
      cloudSyncAvailable: true,
    });
  } catch (error) {
    console.error("Failed to load user data:", error);
    return NextResponse.json(
      {
        categoryOverrides: {},
        budgetTargets: {},
        userKey: null,
        cloudSyncAvailable: false,
      },
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
        : null;
    const budgetTargets =
      body?.budgetTargets && typeof body.budgetTargets === "object"
        ? body.budgetTargets
        : null;

    if (!hasSupabaseAdminConfig()) {
      return NextResponse.json(
        {
          ok: false,
          cloudSyncAvailable: false,
          error: "Cloud sync is not configured on the server.",
        },
        { status: 503 }
      );
    }

    const supabase = getSupabaseAdmin();
    const { user: currentUser, error: currentUserError } = await getFintrakUserById(
      supabase,
      user.id
    );

    if (currentUserError || !currentUser) {
      console.error("Failed to load user profile before save:", currentUserError);
      return NextResponse.json(
        {
          ok: false,
          cloudSyncAvailable: false,
          error: "Could not load your cloud profile before saving.",
        },
        { status: 503 }
      );
    }

    const { error } = await updateFintrakUserDataProfile(supabase, user.id, {
      categoryOverrides: categoryOverrides ?? currentUser.categoryOverrides,
      budgetTargets: budgetTargets ?? currentUser.budgetTargets,
    });

    if (error) {
      console.error("Failed to save user profile to Supabase:", error);
      return NextResponse.json(
        {
          ok: false,
          cloudSyncAvailable: false,
          error: "Could not save your data to cloud storage.",
        },
        { status: 503 }
      );
    }

    return NextResponse.json({ ok: true, cloudSyncAvailable: true });
  } catch (error) {
    console.error("Failed to save user data:", error);
    return NextResponse.json(
      {
        ok: false,
        cloudSyncAvailable: false,
        error: "Unexpected cloud sync error.",
      },
      { status: 500 }
    );
  }
}
