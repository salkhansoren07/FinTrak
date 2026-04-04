"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Unlock() {
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const router = useRouter();
  const { logout } = useAuth();

  const verify = async () => {
    const saved = localStorage.getItem("user_pin");

    const hash = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(pin)
    );

    const hex = Array.from(new Uint8Array(hash))
      .map(b => b.toString(16).padStart(2, "0"))
      .join("");

    if (hex === saved) {
      sessionStorage.setItem("pin_verified", "true");
      router.push("/");
    } else {
      setError(true);
      setPin("");
      setTimeout(() => setError(false), 400);
    }
  };

  const resetPin = () => {
    if (!confirm("Reset PIN? Gmail login will be required again.")) return;

    localStorage.removeItem("user_pin");
    sessionStorage.clear();

    logout(); // revoke gmail token

    router.replace("/");
  };

  return (
    <div className="h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-[#020617] dark:to-[#020617]">

      <div
        className={`glass-card p-10 rounded-3xl w-[340px] text-center transition ${
          error ? "animate-shake" : ""
        }`}
      >
        <div className="mx-auto w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-4">
          <Lock className="text-blue-600" />
        </div>

        <h2 className="text-2xl font-semibold mb-1">Unlock FinTrak</h2>
        <p className="text-slate-500 text-sm mb-6">
          Enter your 6 digit passcode
        </p>

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
          disabled={pin.length !== 6}
          onClick={verify}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white py-3 rounded-xl font-semibold shadow-lg active:scale-95 transition"
        >
          Unlock
        </button>

        {/* FORGOT PIN */}
        <button
          onClick={resetPin}
          className="mt-4 text-sm text-slate-400 hover:text-red-500 transition"
        >
          Forgot PIN?
        </button>

        <p className="text-xs text-slate-400 mt-4">
          Secured locally 🔐
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
