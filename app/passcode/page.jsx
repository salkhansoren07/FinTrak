"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import { setPinVerified } from "../lib/clientSession";

export default function PasscodePage() {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const { refreshSession, user } = useAuth();

  const savePin = async () => {
    if (pin.length !== 6) return alert("Enter 6 digit pin");
    if (!user?.id) return alert("Sign in to FinTrak first.");

    setError("");
    startTransition(async () => {
      const res = await fetch("/api/passcode", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ passcode: pin }),
      });

      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(payload?.error || "Could not save your passcode.");
        return;
      }

      setPinVerified(user.id, true);
      await refreshSession();
      router.push("/");
    });
  };

  return (
    <div className="h-screen flex items-center justify-center">
      <div className="bg-white p-8 rounded-xl shadow text-center">
        <h2 className="text-xl font-bold mb-4">Create 6 Digit Passcode</h2>
        <p className="mb-4 text-sm text-slate-500">
          This passcode is saved securely to your FinTrak account.
        </p>
        {error ? (
          <p className="mb-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">
            {error}
          </p>
        ) : null}

        <input
          type="password"
          maxLength={6}
          value={pin}
          onChange={e => setPin(e.target.value.replace(/\D/g, ""))}
          className="border p-3 rounded w-full mb-4 text-center"
        />

        <button
          disabled={isPending}
          onClick={savePin}
          className="bg-blue-600 text-white px-6 py-2 rounded disabled:opacity-70"
        >
          {isPending ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
}
