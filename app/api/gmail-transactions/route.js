import { NextResponse } from "next/server";
import { parseTransaction } from "../../lib/parseTransaction";
import { getSupabaseAdmin, hasSupabaseAdminConfig } from "../../lib/supabaseAdmin";
import { readSessionFromRequest } from "../../lib/serverAuth";
import { getServerGmailAccessToken } from "../../lib/googleSession";

const QUERY =
  '(debited OR credited OR transaction OR txn OR upi OR utr OR withdrawn OR deposited OR "available bal" OR "a/c")';
const PAGE_SIZE = 100;
const MAX_MESSAGES = 200;
const DETAIL_CONCURRENCY = 8;
const SERVER_CACHE_TTL_MS = 2 * 60 * 1000;

const transactionCache = new Map();

function getCachedTransactions(userKey) {
  const entry = transactionCache.get(userKey);
  if (!entry) return null;

  if (Date.now() - entry.savedAt > SERVER_CACHE_TTL_MS) {
    transactionCache.delete(userKey);
    return null;
  }

  return entry;
}

function setCachedTransactions(userKey, payload) {
  transactionCache.set(userKey, {
    ...payload,
    savedAt: Date.now(),
  });
}

async function listMessageIds(accessToken) {
  const headers = { Authorization: `Bearer ${accessToken}` };
  const messages = [];
  let pageToken = null;

  do {
    const params = new URLSearchParams({
      q: QUERY,
      maxResults: String(Math.min(PAGE_SIZE, MAX_MESSAGES - messages.length)),
    });
    if (pageToken) params.set("pageToken", pageToken);

    const res = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?${params.toString()}`,
      { headers, cache: "no-store" }
    );

    if (!res.ok) {
      const errorBody = await res.json().catch(() => ({}));
      const gmailMessage = errorBody?.error?.message || "Gmail list fetch failed";
      const gmailStatus = errorBody?.error?.status || "";
      const error = new Error(
        `Gmail list fetch failed: ${res.status}${gmailStatus ? ` ${gmailStatus}` : ""}${gmailMessage ? ` - ${gmailMessage}` : ""}`
      );
      error.status = res.status;
      throw error;
    }

    const data = await res.json();
    if (Array.isArray(data.messages)) {
      messages.push(...data.messages);
    }
    pageToken = data.nextPageToken || null;
  } while (pageToken && messages.length < MAX_MESSAGES);

  return messages;
}

async function fetchMessageDetail(accessToken, id, attempt = 0) {
  const res = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?format=full`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    }
  );

  if (!res.ok) {
    if (attempt < 1 && res.status >= 500) {
      return fetchMessageDetail(accessToken, id, attempt + 1);
    }

    const error = new Error(`Gmail message fetch failed: ${res.status} (${id})`);
    error.status = res.status;
    throw error;
  }

  return res.json();
}

async function mapWithConcurrency(items, concurrency, mapper) {
  const results = new Array(items.length);
  let index = 0;

  async function worker() {
    while (index < items.length) {
      const current = index;
      index += 1;

      try {
        results[current] = await mapper(items[current], current);
      } catch (error) {
        results[current] = { error };
      }
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, () => worker())
  );

  return results;
}

export async function GET(req) {
  try {
    const user = readSessionFromRequest(req);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasSupabaseAdminConfig()) {
      return NextResponse.json(
        {
          error:
            "Server-side Gmail sync is not configured. Add Supabase and Google OAuth server credentials.",
        },
        { status: 500 }
      );
    }

    const supabase = getSupabaseAdmin();
    const accessToken = await getServerGmailAccessToken(supabase, user);

    const cached = getCachedTransactions(user.id);
    if (cached) {
      return NextResponse.json({
        transactions: cached.transactions,
        userKey: user.id,
        cached: true,
        meta: cached.meta,
      });
    }

    const messages = await listMessageIds(accessToken);
    const details = await mapWithConcurrency(
      messages,
      DETAIL_CONCURRENCY,
      (message) => fetchMessageDetail(accessToken, message.id)
    );

    const successfulDetails = details
      .filter((entry) => entry && !entry.error)
      .map((entry) => entry);

    const transactions = successfulDetails
      .map(parseTransaction)
      .filter(Boolean)
      .sort((a, b) => {
        if (b.timestamp !== a.timestamp) return b.timestamp - a.timestamp;
        return a.id.localeCompare(b.id);
      });

    const meta = {
      matchedMessages: messages.length,
      fetchedMessages: successfulDetails.length,
      parsedTransactions: transactions.length,
      detailFailures: details.filter((entry) => entry?.error).length,
    };

    setCachedTransactions(user.id, {
      transactions,
      meta,
    });

    return NextResponse.json({
      transactions,
      userKey: user.id,
      cached: false,
      meta,
    });
  } catch (error) {
    const message = error?.message || "Failed to sync Gmail";
    const normalized = message.toLowerCase();
    const status =
      error?.status === 401
        ? 401
        : normalized.includes("quota exceeded") ||
            normalized.includes("queries per minute") ||
            normalized.includes("rate limit")
          ? 429
          : 500;

    return NextResponse.json({ error: message }, { status });
  }
}
