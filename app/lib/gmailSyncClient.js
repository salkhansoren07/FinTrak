export async function fetchGmailTransactions(token) {
  if (!token) return null;

  const res = await fetch("/api/gmail-transactions", {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    const error = new Error(body?.error || "Failed to sync Gmail");
    error.status = res.status;
    throw error;
  }

  return body;
}
