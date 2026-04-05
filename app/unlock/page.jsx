"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import {
  clearPinVerification,
  setPinVerified,
} from "../lib/clientSession";

export default function Unlock() {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [showResetForm, setShowResetForm] = useState(false);
  const [resetPassword, setResetPassword] = useState("");
  const [resetError, setResetError] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const { logout, user } = useAuth();

  const verify = async () => {
    if (!user?.id) {
      router.replace("/");
      return;
    }

    startTransition(async () => {
      const res = await fetch("/api/passcode/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ passcode: pin }),
      });

      const payload = await res.json().catch(() => ({}));

      if (res.ok) {
        setPinVerified(user.id, true);
        router.push("/");
        return;
      }

      setError(payload?.error || "Incorrect passcode.");
      if (res.status !== 429) {
        setPin("");
        setTimeout(() => setError(""), 1000);
      }
    });
  };

  const resetPin = () => {
    if (!showResetForm) {
      setShowResetForm(true);
      setResetError("");
      return;
    }

    if (!resetPassword) {
      setResetError("Enter your current account password to reset the passcode.");
      return;
    }

    if (!confirm("Reset PIN? FinTrak sign-in will be required again.")) return;

    startTransition(async () => {
      if (user?.id) {
        const res = await fetch("/api/passcode", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ password: resetPassword }),
        }).catch(() => null);

        if (!res?.ok) {
          const payload = await res?.json().catch(() => ({}));
          setResetError(payload?.error || "Could not reset your passcode.");
          return;
        }

        clearPinVerification(user.id);
      }

      await logout();
      router.replace("/");
    });
  };

  return (
    <div className="h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-[#020617] dark:to-[#020617]">

      <div
        className={`glass-card p-10 rounded-3xl w-[340px] text-center transition ${
          error && !error.includes("Too many incorrect") ? "animate-shake" : ""
        }`}
      >
        <div className="mx-auto w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-4">
          <Lock className="text-blue-600" />
        </div>

        <h2 className="text-2xl font-semibold mb-1">Unlock FinTrak</h2>
        <p className="text-slate-500 text-sm mb-6">
          Enter your 6 digit passcode
        </p>

        {error ? (
          <p className="mb-4 rounded-xl bg-rose-100 px-3 py-2 text-sm text-rose-700 dark:bg-rose-950/30 dark:text-rose-300">
            {error}
          </p>
        ) : null}

        {/* PIN DOTS */}
        <div className="flex justify-center gap-3 mb-6">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className={`w-3 h-3 rounded-full transition ${
                pin.length > i
                  ? "bg-blue-600"
                  : "bg-slate-300 dark:bg-slate-700"
              }`}
            />
          ))}
        </div>

        <input
          type="password"
          inputMode="numeric"
          maxLength={6}
          autoFocus
          value={pin}
          onChange={e => setPin(e.target.value.replace(/\D/g, ""))}
          className="w-full mb-4 text-center tracking-[0.5em] text-xl font-semibold bg-transparent border-b border-slate-300 dark:border-slate-600 outline-none pb-2"
        />

        <button
          disabled={pin.length !== 6 || isPending}
          onClick={verify}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white py-3 rounded-xl font-semibold shadow-lg active:scale-95 transition"
        >
          {isPending ? "Checking..." : "Unlock"}
        </button>

        {/* FORGOT PIN */}
        <button
          disabled={isPending}
          onClick={resetPin}
          className="mt-4 text-sm text-slate-400 hover:text-red-500 transition"
        >
          {showResetForm ? "Confirm PIN reset" : "Forgot PIN?"}
        </button>

        {showResetForm ? (
          <div className="mt-4 space-y-3 text-left">
            <input
              type="password"
              value={resetPassword}
              onChange={(event) => setResetPassword(event.target.value)}
              placeholder="Current account password"
              className="w-full rounded-xl border border-slate-300 bg-white/80 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />
            {resetError ? (
              <p className="rounded-xl bg-rose-100 px-3 py-2 text-sm text-rose-700 dark:bg-rose-950/30 dark:text-rose-300">
                {resetError}
              </p>
            ) : null}
            <p className="text-xs text-slate-400">
              Resetting the passcode now requires your account password.
            </p>
          </div>
        ) : null}

        <p className="text-xs text-slate-400 mt-4">
          Protected by your FinTrak account
        </p>
      </div>

      <style jsx>{`
        .animate-shake {
          animation: shake 0.3s;
        }
        @keyframes shake {
          0% { transform: translateX(0); }
          25% { transform: translateX(-6px); }
          50% { transform: translateX(6px); }
          75% { transform: translateX(-6px); }
          100% { transform: translateX(0); }
        }
      `}</style>

    </div>
  );
}
