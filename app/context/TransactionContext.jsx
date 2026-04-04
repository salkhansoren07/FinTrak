"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "./AuthContext";
import { fetchCloudUserData, saveCloudUserData } from "../lib/userDataClient";
import { fetchGmailTransactions } from "../lib/gmailSyncClient";
import { isSessionSetupRoute, readClientSession } from "../lib/clientSession";

const TransactionContext = createContext();

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

export function TransactionProvider({ children }) {
  const { token, clearSession } = useAuth();
  const pathname = usePathname();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [syncError, setSyncError] = useState("");
  const [syncWarning, setSyncWarning] = useState("");

  const [dateFilter, setDateFilter] = useState({
    type: "month",
    month: new Date().toLocaleDateString("en-CA").slice(0, 7),
    start: null,
    end: null,
  });

  useEffect(() => {
    if (!token) {
      setTransactions([]);
      setLoading(false);
      setSyncError("");
      setSyncWarning("");
      return;
    }

    const { isUnlocked } = readClientSession();

    if (!isUnlocked || isSessionSetupRoute(pathname)) {
      setTransactions([]);
      setLoading(false);
      setSyncError("");
      setSyncWarning("");
      return;
    }

    let cancelled = false;

    async function loadTransactions() {
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
          if (
            cloudData?.categoryOverrides &&
            typeof cloudData.categoryOverrides === "object"
          ) {
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

        if (!cancelled && cachedTransactions.length > 0) {
          setTransactions(cachedTransactions);
        }

        if (
          cache?.savedAt &&
          Date.now() - Number(cache.savedAt) < TRANSACTION_CACHE_TTL_MS
        ) {
          if (!cancelled) {
            setLoading(false);
          }
          return;
        }

        const gmailData = await fetchGmailTransactions(token);
        const parsed = applyOverrides(gmailData?.transactions || [], overrides);

        if (cancelled) return;

        setTransactions(parsed);
        writeTransactionCache(gmailData?.userKey || userKey, parsed);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to sync Gmail";

        if (cancelled) return;

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

        if (
          err?.status === 401 ||
          message.includes("401") ||
          message.includes("403")
        ) {
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
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadTransactions();

    return () => {
      cancelled = true;
    };
  }, [clearSession, pathname, token]);

  const filteredTransactions = useMemo(() => {
    if (!transactions.length) return [];

    return transactions.filter((t) => {
      const txnDate = new Date(t.timestamp);

      if (dateFilter.type === "all") return true;

      if (dateFilter.type === "month") {
        if (!dateFilter.month) return true;

        const [year, month] = dateFilter.month.split("-");

        return (
          txnDate.getFullYear() === Number(year) &&
          txnDate.getMonth() === Number(month) - 1
        );
      }

      if (dateFilter.type === "custom") {
        if (!dateFilter.start || !dateFilter.end) return true;

        const start = new Date(dateFilter.start);
        const end = new Date(dateFilter.end);
        end.setHours(23, 59, 59, 999);

        return txnDate >= start && txnDate <= end;
      }

      return true;
    });
  }, [transactions, dateFilter]);

  return (
    <TransactionContext.Provider
      value={{
        transactions,
        setTransactions,
        loading,
        syncError,
        syncWarning,
        dateFilter,
        setDateFilter,
        filteredTransactions,
      }}
    >
      {children}
    </TransactionContext.Provider>
  );
}

export const useTransactions = () => useContext(TransactionContext);
