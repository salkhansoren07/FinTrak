"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useAuth } from "./context/AuthContext";
import { fetchCloudUserData, saveCloudUserData } from "./lib/userDataClient";
import { fetchGmailTransactions } from "./lib/gmailSyncClient";
import Layout from "./components/Layout";
import SummaryCards from "./components/SummaryCards";
import TransactionTable from "./components/TransactionTable";
import ExpenseChart from "./components/ExpenseChart";
import { useTransactions } from "./context/TransactionContext";
import BankSummary from "./components/BankSummary";
import CategoryChart from "./components/CategoryChart";
import { useRouter } from "next/navigation";

const TRANSACTION_CACHE_VERSION = 1;
const TRANSACTION_CACHE_TTL_MS = 5 * 60 * 1000;

function readCategoryOverrides() {
  try {
    const raw = localStorage.getItem("categoryOverrides");
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function buildTransactionCacheKey(userKey) {
  return `transactionCache:${userKey}`;
}

function readTransactionCache(userKey) {
  try {
    const raw = localStorage.getItem(buildTransactionCacheKey(userKey));
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (
      parsed?.version !== TRANSACTION_CACHE_VERSION ||
      !Array.isArray(parsed?.transactions)
    ) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

function writeTransactionCache(userKey, transactions) {
  localStorage.setItem(
    buildTransactionCacheKey(userKey),
    JSON.stringify({
      version: TRANSACTION_CACHE_VERSION,
      savedAt: Date.now(),
      transactions,
    })
  );
}

function applyOverrides(transactions, overrides) {
  return transactions.map((transaction) => ({
    ...transaction,
    category: overrides[transaction.id] || transaction.category,
  }));
}

function isQuotaError(message) {
  const normalized = message.toLowerCase();
  return (
    normalized.includes("quota exceeded") ||
    normalized.includes("queries per minute") ||
    normalized.includes("rate limit")
  );
}



export default function Home() {
  const { token, login, clearSession } = useAuth();
  const { setTransactions, filteredTransactions } = useTransactions();
  const router = useRouter();
  const idleTimer = useRef(null);

  const [loading, setLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [syncError, setSyncError] = useState("");
  const [syncWarning, setSyncWarning] = useState("");


  // INITIAL AUTH + PIN CHECK
  useEffect(() => {
    setIsInitializing(false);

    if (!token) return;

    const pin = localStorage.getItem("user_pin");
    const verified = sessionStorage.getItem("pin_verified");

    if (!pin) router.replace("/passcode");
    else if (!verified) router.replace("/unlock");
  }, [token, router]);

  // AUTO LOCK AFTER 5 MIN IDLE
  useEffect(() => {
    if (!token) return;

    const IDLE_TIME = 5 * 60 * 1000; // 5 minutes

    const resetTimer = () => {
      clearTimeout(idleTimer.current);

      idleTimer.current = setTimeout(() => {
        sessionStorage.removeItem("pin_verified");
        router.replace("/unlock");
      }, IDLE_TIME);
    };

    const events = ["mousemove", "keydown", "click", "touchstart"];

    events.forEach(e => window.addEventListener(e, resetTimer));

    resetTimer();

    return () => {
      events.forEach(e => window.removeEventListener(e, resetTimer));
      clearTimeout(idleTimer.current);
    };
  }, [token, router]);

  // FETCH EMAILS
  useEffect(() => {
    if (!token) return;

    async function load() {
      setLoading(true);
      setSyncError("");
      setSyncWarning("");
      let cachedTransactions = [];

      try {
        const localOverrides = readCategoryOverrides();
        let cloudOverrides = {};
        let userKey = "default";

        try {
          const cloudData = await fetchCloudUserData(token);
          if (cloudData?.categoryOverrides && typeof cloudData.categoryOverrides === "object") {
            cloudOverrides = cloudData.categoryOverrides;
          }
          if (cloudData?.userKey) {
            userKey = cloudData.userKey;
          }
        } catch (error) {
          console.warn("Cloud sync read failed:", error);
        }

        const overrides = { ...cloudOverrides, ...localOverrides };
        localStorage.setItem("categoryOverrides", JSON.stringify(overrides));

        if (
          Object.keys(localOverrides).length > 0 &&
          Object.keys(cloudOverrides).length === 0
        ) {
          saveCloudUserData(token, overrides).catch((error) => {
            console.warn("Cloud sync write failed:", error);
          });
        }

        const cache = readTransactionCache(userKey);
        cachedTransactions = applyOverrides(cache?.transactions || [], overrides);

        if (cachedTransactions.length > 0) {
          setTransactions(cachedTransactions);
        }

        if (
          cache?.savedAt &&
          Date.now() - Number(cache.savedAt) < TRANSACTION_CACHE_TTL_MS
        ) {
          setLoading(false);
          return;
        }

        const gmailData = await fetchGmailTransactions(token);

        const parsed = applyOverrides(
          gmailData?.transactions || [],
          overrides
        );

        setTransactions(parsed);
        writeTransactionCache(gmailData?.userKey || userKey, parsed);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to sync Gmail";

        if (err?.status === 429 || isQuotaError(message)) {
          console.warn("Gmail quota limited sync:", message);
          if (cachedTransactions.length > 0) {
            setSyncWarning(
              "Showing saved data. Gmail rate limit was hit, so live sync will resume automatically in a few minutes."
            );
            return;
          }
          setSyncError(
            "Gmail rate limit was hit. Wait a minute, then refresh and try again."
          );
          return;
        }

        if (err?.status === 401 || message.includes("401") || message.includes("403")) {
          console.warn("Gmail auth error:", message);
          clearSession();
          setTransactions([]);
          setSyncError(
            "Gmail access expired or is missing permission. Please reconnect and allow Gmail read access."
          );
          return;
        }

        console.error("Fetch Error:", err);
        setSyncError(message);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [clearSession, token, setTransactions]);


  // LOADING
  if (isInitializing) {
    return (
      <div className="flex items-center justify-center h-screen">
        FinTrack is warming up...
      </div>
    );
  }

  // NOT LOGGED IN
  if (!token) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-[#020617] dark:to-[#020617]">

        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl p-10 rounded-3xl shadow-2xl border border-white/20 text-center animate-in fade-in zoom-in duration-500">

          <div className="text-4xl mb-2">💰</div>

          <h1 className="text-3xl font-bold text-blue-600 mb-1">
            FinTrack
          </h1>

          <p className="text-slate-500 dark:text-gray-400 mb-8">
            Smart expense tracking from Gmail
          </p>

          <button
            onClick={login}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-semibold shadow-lg transition-all active:scale-95"
          >
            Connect Gmail Account
          </button>

          <p className="text-xs text-slate-400 mt-6">
            Data sync is enabled across your devices.
          </p>

          <div className="mt-6 flex items-center justify-center gap-4 text-sm text-slate-500 dark:text-slate-400">
            <Link
              href="/privacy"
              className="transition hover:text-blue-600 dark:hover:text-blue-300"
            >
              Privacy
            </Link>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <Link
              href="/terms"
              className="transition hover:text-blue-600 dark:hover:text-blue-300"
            >
              Terms
            </Link>
          </div>
        </div>

      </div>
    );
  }


  // DASHBOARD
  return (
    <Layout>
      {loading ? (
        <div className="flex justify-center py-24">Syncing...</div>
      ) : syncError ? (
        <div className="text-center py-24 space-y-4">
          <p className="text-rose-500">{syncError}</p>
          <button
            onClick={login}
            className="bg-blue-600 hover:bg-blue-700 text-white py-4 px-6 rounded-xl font-semibold shadow-lg transition-all active:scale-95"
          >
            Reconnect Gmail
          </button>
        </div>
      ) : filteredTransactions.length > 0 ? (
        <>
          {syncWarning ? (
            <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-200">
              {syncWarning}
            </div>
          ) : null}
          <SummaryCards transactions={filteredTransactions} />
          <BankSummary transactions={filteredTransactions} />

          <div className="grid md:grid-cols-2 gap-8 mt-8">
            <ExpenseChart transactions={filteredTransactions} />
            <CategoryChart transactions={filteredTransactions} />
          </div>

          <TransactionTable transactions={filteredTransactions} token={token} />
        </>
      ) : (
        <div className="text-center py-24">
          No transactions found.
        </div>
      )}
    </Layout>
  );
}
