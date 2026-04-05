export async function fetchCloudUserData() {
  const res = await fetch("/api/user-data", {
    cache: "no-store",
  });

  if (!res.ok) return null;

  return res.json();
}

export async function saveCloudUserData(payload) {
  const res = await fetch("/api/user-data", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload || {}),
  });

  return res.ok;
}
