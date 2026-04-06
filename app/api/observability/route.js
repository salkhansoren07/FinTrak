import { NextResponse } from "next/server.js";
import { reportServerEvent } from "../../lib/observability.server.js";

function sanitizeClientEvent(body = {}) {
  return {
    level: ["info", "warn", "error"].includes(body?.level) ? body.level : "error",
    event: body?.event || "client.event",
    message: body?.message || "Client event reported.",
    context:
      body?.context && typeof body.context === "object" ? body.context : {},
    error:
      body?.error && typeof body.error === "object" ? body.error : body?.error || null,
  };
}

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const payload = sanitizeClientEvent(body);

    await reportServerEvent({
      level: payload.level,
      event: payload.event,
      message: payload.message,
      context: {
        source: "client",
        ...payload.context,
      },
      error: payload.error,
      request: req,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    await reportServerEvent({
      level: "error",
      event: "observability.client_report_failed",
      message: "Failed to ingest client observability event.",
      error,
      request: req,
    });

    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
