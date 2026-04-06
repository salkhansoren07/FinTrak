import { NextResponse } from "next/server";
import { clearSessionCookie, readSessionFromRequest } from "../../lib/serverAuth";
import { revokeGoogleToken } from "../../lib/googleOAuth";
import { getSupabaseAdmin, hasSupabaseAdminConfig } from "../../lib/supabaseAdmin";
import {
  deleteFintrakUserById,
  getFintrakUserById,
} from "../../lib/fintrakUsers";
import { verifyPassword } from "../../lib/passwords";
import { decryptSecretValue } from "../../lib/serverSecrets";

function normalizeConfirmation(value) {
  return String(value || "").trim().toLowerCase();
}

export async function DELETE(req) {
  try {
    const session = readSessionFromRequest(req);
    if (!session?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasSupabaseAdminConfig()) {
      return NextResponse.json(
        { error: "Supabase is not configured for account deletion." },
        { status: 500 }
      );
    }

    const body = await req.json();
    const password = String(body?.password || "");
    const confirmation = normalizeConfirmation(body?.confirmation);

    if (!password) {
      return NextResponse.json(
        { error: "Password is required to delete your account." },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();
    const { user, error } = await getFintrakUserById(supabase, session.id);

    if (error || !user) {
      if (error) {
        console.error("Failed to load FinTrak user for deletion:", error);
      }
      return NextResponse.json(
        { error: "Could not load your account for deletion." },
        { status: 500 }
      );
    }

    const allowedConfirmations = [user.username, user.email].filter(Boolean);
    if (!allowedConfirmations.includes(confirmation)) {
      return NextResponse.json(
        {
          error:
            "Type your username or account email exactly to confirm deletion.",
        },
        { status: 400 }
      );
    }

    const passwordMatches = await verifyPassword(password, user.passwordHash);
    if (!passwordMatches) {
      return NextResponse.json(
        { error: "Incorrect password." },
        { status: 401 }
      );
    }

    let warning = "";

    if (user.gmailRefreshToken) {
      let refreshToken = "";

      try {
        refreshToken = decryptSecretValue(user.gmailRefreshToken);
      } catch (decryptError) {
        console.error("Failed to decrypt Gmail refresh token during deletion:", decryptError);
        warning =
          "Your account was deleted, but Gmail access could not be revoked automatically.";
      }

      if (refreshToken) {
        try {
          await revokeGoogleToken(refreshToken);
        } catch (revokeError) {
          const message =
            revokeError instanceof Error
              ? revokeError.message
              : "Google token revocation failed";

          if (revokeError?.status !== 400) {
            console.error("Failed to revoke Gmail access during deletion:", revokeError);
            warning =
              "Your account was deleted, but Gmail access may still need to be removed from your Google account manually.";
          } else {
            console.warn(
              "Google reported the Gmail token was already invalid during deletion:",
              message
            );
          }
        }
      }
    }

    const { error: deleteError } = await deleteFintrakUserById(
      supabase,
      user.id
    );

    if (deleteError) {
      console.error("Failed to delete FinTrak user:", deleteError);
      return NextResponse.json(
        { error: "Could not delete your account right now." },
        { status: 500 }
      );
    }

    const response = NextResponse.json({ ok: true, warning: warning || null });
    clearSessionCookie(response);
    return response;
  } catch (error) {
    console.error("Unexpected account deletion error:", error);
    return NextResponse.json(
      { error: "Unexpected account deletion error." },
      { status: 500 }
    );
  }
}
