"use client";

import { useEffect, useState } from "react";
import { saveCloudUserData } from "../lib/userDataClient";
import {
  readCategoryOverrides,
  writeCategoryOverrides,
} from "../lib/categoryOverridesStorage.mjs";
import { useAuth } from "../context/AuthContext";
import { DEFAULT_CATEGORIES } from "../lib/categoryConfig.mjs";
import { reportClientWarning } from "../lib/observability.client.js";

export default function TransactionTable({ transactions = [] }) {
  const { user } = useAuth();
  const [displayTransactions, setDisplayTransactions] = useState(transactions);
  const [syncNotice, setSyncNotice] = useState("");

  useEffect(() => {
    setDisplayTransactions(transactions);
  }, [transactions]);

  const updateCategory = async (id, category) => {
    const existing = readCategoryOverrides(user?.id);

    existing[id] = category;

    setDisplayTransactions((current) =>
      current.map((transaction) =>
        transaction.id === id
          ? {
              ...transaction,
              category,
            }
          : transaction
      )
    );
    writeCategoryOverrides(user?.id, existing);
    setSyncNotice("");

    try {
      await saveCloudUserData({ categoryOverrides: existing });
      setSyncNotice("Category synced to your account.");
    } catch (error) {
      reportClientWarning({
        event: "transactions.category_sync_failed",
        message: "Cloud sync write failed while updating a transaction category.",
        error,
        context: { userId: user?.id || null, transactionId: id },
      });
      setSyncNotice("Category saved on this device. Cloud sync is unavailable right now.");
    }
  };

  return (
    <section className="mt-8 overflow-hidden rounded-[32px] border border-slate-200/80 bg-white/90 shadow-[0_20px_60px_-34px_rgba(15,23,42,0.45)] backdrop-blur dark:border-slate-800/80 dark:bg-slate-950/70">
      <div className="border-b border-slate-200/80 px-5 py-5 dark:border-slate-800/80 md:px-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
              Transactions
            </p>
            <h3 className="mt-2 text-xl font-bold text-slate-900 dark:text-white">
              Detailed transaction review
            </h3>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {displayTransactions.length} entries with editable categories
          </p>
        </div>
        {syncNotice ? (
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
            {syncNotice}
          </p>
        ) : null}
      </div>

      <div className="divide-y divide-slate-100 dark:divide-slate-800 md:hidden">
        {displayTransactions.map((t) => (
          <div key={t.id} className="space-y-4 px-4 py-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-base font-semibold text-slate-800 dark:text-slate-100">
                  {t.bank}
                </p>
                <p className="mt-1 text-xs uppercase tracking-[0.22em] text-slate-400">
                  {t.dateLabel}
                </p>
              </div>
              <p
                className={`rounded-full px-3 py-1 text-sm font-bold ${
                  t.type === "Debit" ? "text-rose-500" : "text-emerald-500"
                } ${
                  t.type === "Debit"
                    ? "bg-rose-50 dark:bg-rose-950/20"
                    : "bg-emerald-50 dark:bg-emerald-950/20"
                }`}
              >
                {t.type === "Debit" ? "-" : "+"} ₹{t.amount}
              </p>
            </div>

            <div className="flex items-center justify-between gap-3">
              <select
                id={`transaction-category-mobile-${t.id}`}
                name={`category-${t.id}`}
                value={t.category}
                onChange={(e) => updateCategory(t.id, e.target.value)}
                className="max-w-[52%] rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
              >
                {DEFAULT_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              <p className="truncate rounded-xl bg-slate-100 px-3 py-2 text-right font-mono text-xs text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                {t.vpa}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50/80 text-slate-500 dark:bg-slate-900/60 dark:text-slate-400">
            <tr>
              <th className="p-6 text-xs uppercase">Bank</th>
              <th className="p-6 text-xs uppercase">Date</th>
              <th className="p-6 text-xs uppercase">Category</th>
              <th className="p-6 text-xs uppercase">VPA</th>
              <th className="p-6 text-xs uppercase text-right">Amount</th>
            </tr>
          </thead>

          <tbody>
            {displayTransactions.map((t) => (
              <tr
                key={t.id}
                className="border-t border-slate-200/70 transition hover:bg-slate-50/80 dark:border-slate-800/80 dark:hover:bg-slate-900/40"
              >
                <td className="p-6 font-semibold text-slate-800 dark:text-slate-100">
                  {t.bank}
                </td>
                <td className="p-6 text-slate-500 dark:text-slate-400">
                  {t.dateLabel}
                </td>
                <td className="p-6">
                  <select
                    id={`transaction-category-desktop-${t.id}`}
                    name={`category-${t.id}`}
                    value={t.category}
                    onChange={(e) => updateCategory(t.id, e.target.value)}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                  >
                    {DEFAULT_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </td>

                <td className="max-w-xs truncate p-6 font-mono text-slate-500 dark:text-slate-400">
                  {t.vpa}
                </td>

                <td
                  className={`p-6 text-right font-bold ${
                    t.type === "Debit" ? "text-rose-500" : "text-emerald-500"
                  }`}
                >
                  {t.type === "Debit" ? "-" : "+"} ₹{t.amount}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
