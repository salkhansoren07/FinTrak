"use client";

import Link from "next/link";
import Image from "next/image";
import { useAuth } from "./context/AuthContext";
import Layout from "./components/Layout";
import SummaryCards from "./components/SummaryCards";
import TransactionTable from "./components/TransactionTable";
import ExpenseChart from "./components/ExpenseChart";
import { useTransactions } from "./context/TransactionContext";
import BankSummary from "./components/BankSummary";
import CategoryChart from "./components/CategoryChart";

export default function Home() {
  const { token, login } = useAuth();
  const { filteredTransactions, loading, syncError, syncWarning } =
    useTransactions();

  // NOT LOGGED IN
  if (!token) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-[#020617] dark:to-[#020617]">

        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl p-10 rounded-3xl shadow-2xl border border-white/20 text-center animate-in fade-in zoom-in duration-500">

          <div className="mb-4 flex justify-center">
            <Image
              src="/fintrak-logo.png"
              alt="FinTrak logo"
              width={120}
              height={120}
              className="h-auto w-28 rounded-2xl shadow-lg"
              priority
            />
          </div>

          <h1 className="text-3xl font-bold text-blue-600 mb-1">
            FinTrak
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
