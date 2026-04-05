"use client";

import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  BarChart3,
  Building2,
  CheckCircle2,
  LifeBuoy,
  Lock,
  Mail,
  MailCheck,
  ShieldCheck,
  Sparkles,
  WalletCards,
} from "lucide-react";
import { useAuth } from "./context/AuthContext";
import Layout from "./components/Layout";
import SummaryCards from "./components/SummaryCards";
import TransactionTable from "./components/TransactionTable";
import ExpenseChart from "./components/ExpenseChart";
import { useTransactions } from "./context/TransactionContext";
import BankSummary from "./components/BankSummary";
import CategoryChart from "./components/CategoryChart";

const SUPPORT_EMAIL = "support@fintrak.online";

const FEATURE_CARDS = [
  {
    icon: MailCheck,
    title: "Reads transaction emails only",
    description:
      "FinTrak uses Gmail read-only access to identify bank and payment transaction emails.",
  },
  {
    icon: BarChart3,
    title: "Turns inbox data into insights",
    description:
      "See expenses, income, charts, and summaries without manually entering transactions.",
  },
  {
    icon: WalletCards,
    title: "Organizes spending clearly",
    description:
      "Track categories, merchants, banks, and UPI-based payments in one dashboard.",
  },
  {
    icon: Lock,
    title: "Protected with a passcode lock",
    description:
      "Your session can be protected locally with a passcode and automatic idle locking.",
  },
];

const FAQS = [
  {
    question: "Why does FinTrak need Gmail read-only access?",
    answer:
      "FinTrak reads transaction-related emails from banks and payment providers so it can extract amounts, dates, merchants, and account details to build your dashboard.",
  },
  {
    question: "Can FinTrak send, delete, or modify my emails?",
    answer:
      "No. FinTrak requests Gmail read-only access only. It cannot send, edit, delete, or move messages in your inbox.",
  },
  {
    question: "What do users see after connecting Gmail?",
    answer:
      "Users see transaction history, bank-wise summaries, category charts, and individual payment insights based on parsed transaction emails.",
  },
  {
    question: "Is there a public support contact?",
    answer:
      "Yes. Users and reviewers can contact FinTrak support anytime at support@fintrak.online.",
  },
];

export default function Home() {
  const { token, login } = useAuth();
  const { filteredTransactions, loading, syncError, syncWarning } =
    useTransactions();

  // NOT LOGGED IN
  if (!token) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.16),_transparent_38%),linear-gradient(180deg,_#f8fbff_0%,_#edf4ff_48%,_#f8fafc_100%)] text-slate-900 dark:bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.18),_transparent_32%),linear-gradient(180deg,_#020617_0%,_#081225_48%,_#020617_100%)] dark:text-slate-50">
        <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-3 py-3 sm:px-6 sm:py-4 lg:px-8">
          <header className="glass-card sticky top-2 z-20 rounded-xl px-3 py-3 sm:top-3 sm:rounded-2xl sm:px-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-3">
                <Image
                  src="/fintrak-logo.png"
                  alt="FinTrak logo"
                  width={52}
                  height={52}
                  className="h-12 w-12 rounded-xl shadow-md"
                  priority
                />
                <div>
                  <p className="text-lg font-bold text-blue-600">FinTrak</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Smart expense tracking from Gmail
                  </p>
                </div>
              </div>

              <nav className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center sm:justify-end sm:gap-3">
                <a
                  href="#faq"
                  className="inline-flex items-center justify-center rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                >
                  FAQs
                </a>
                <a
                  href="#contact"
                  className="inline-flex items-center justify-center rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                >
                  Contact
                </a>
                <Link
                  href="/privacy"
                  className="inline-flex items-center justify-center rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                >
                  Privacy
                </Link>
                <Link
                  href="/terms"
                  className="inline-flex items-center justify-center rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                >
                  Terms
                </Link>
                <a
                  href={`mailto:${SUPPORT_EMAIL}`}
                  className="col-span-2 inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 sm:col-span-1 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                >
                  <LifeBuoy size={16} />
                  Support
                </a>
                <button
                  onClick={login}
                  className="col-span-2 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:bg-blue-700 sm:col-span-1"
                >
                  Connect Gmail
                </button>
              </nav>
            </div>
          </header>

          <main className="flex-1 py-7 sm:py-10 lg:py-14">
            <section className="grid items-center gap-6 sm:gap-8 lg:grid-cols-[1.15fr,0.85fr]">
              <div>
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-200/70 bg-white/80 px-4 py-2 text-xs font-medium text-blue-700 shadow-sm sm:text-sm dark:border-blue-900/60 dark:bg-slate-900/70 dark:text-blue-300">
                  <Sparkles size={16} />
                  Designed for effortless expense visibility
                </div>

                <h1 className="max-w-3xl text-[2rem] font-black leading-[1.05] tracking-tight text-slate-900 sm:text-5xl lg:text-6xl dark:text-white">
                  Turn Gmail transaction alerts into a clear, organized money
                  dashboard with{" "}
                  <span className="text-blue-600 dark:text-blue-400">
                    FinTrak
                  </span>
                </h1>

                <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:mt-6 sm:text-lg sm:leading-8 dark:text-slate-300">
                  FinTrak detects transaction-related emails from banks and
                  payment apps, then turns them into clean summaries, charts,
                  and categorized spending insights for the user.
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <button
                    onClick={login}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 py-4 text-base font-semibold text-white shadow-xl transition hover:bg-blue-700"
                  >
                    Connect Gmail
                    <ArrowRight size={18} />
                  </button>
                  <a
                    href={`mailto:${SUPPORT_EMAIL}`}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white/70 px-6 py-4 text-base font-semibold text-slate-700 transition hover:bg-white dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200 dark:hover:bg-slate-900"
                  >
                    <LifeBuoy size={18} />
                    Contact Support
                  </a>
                </div>

                <div className="mt-6 flex flex-col gap-3 text-sm text-slate-500 dark:text-slate-400 sm:flex-row sm:flex-wrap sm:items-center">
                  <span className="inline-flex items-center gap-2">
                    <ShieldCheck size={16} className="text-emerald-500" />
                    Gmail read-only access only
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-500" />
                    No email sending, deleting, or editing
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <Building2 size={16} className="text-emerald-500" />
                    Public homepage, privacy, and support contact
                  </span>
                </div>
              </div>

              <div className="glass-card overflow-hidden rounded-[1.75rem] border border-white/30 shadow-2xl sm:rounded-3xl">
                <div className="border-b border-slate-200/70 bg-white/80 px-5 py-4 sm:px-6 dark:border-slate-800 dark:bg-slate-900/80">
                  <div className="flex items-center gap-3">
                    <Image
                      src="/fintrak-logo.png"
                      alt="FinTrak logo"
                      width={44}
                      height={44}
                      className="h-11 w-11 rounded-xl shadow-md"
                    />
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">
                        FinTrak Dashboard Preview
                      </p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Inbox data transformed into expense insights
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 p-5 sm:space-y-5 sm:p-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 p-5 text-white shadow-lg">
                      <p className="text-sm uppercase tracking-wide text-white/80">
                        Total Expenses
                      </p>
                      <p className="mt-3 text-2xl font-bold sm:text-3xl">
                        ₹ 18,450
                      </p>
                      <p className="mt-2 text-sm text-white/80">
                        Auto-detected from transaction emails
                      </p>
                    </div>
                    <div className="rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 p-5 text-white shadow-lg">
                      <p className="text-sm uppercase tracking-wide text-white/80">
                        Total Income
                      </p>
                      <p className="mt-3 text-2xl font-bold sm:text-3xl">
                        ₹ 55,000
                      </p>
                      <p className="mt-2 text-sm text-white/80">
                        Salary and incoming transactions
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 dark:border-slate-800 dark:bg-slate-950/40">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">
                        Category insights
                      </p>
                      <div className="mt-4 space-y-3">
                        {[
                          ["Food", "₹ 4,860", "w-[76%] bg-amber-500"],
                          ["Shopping", "₹ 6,200", "w-[92%] bg-blue-500"],
                          ["Bills", "₹ 2,120", "w-[42%] bg-rose-500"],
                        ].map(([label, value, bar]) => (
                          <div key={label}>
                            <div className="mb-1 flex items-center justify-between text-sm">
                              <span className="text-slate-600 dark:text-slate-300">
                                {label}
                              </span>
                              <span className="font-semibold text-slate-900 dark:text-white">
                                {value}
                              </span>
                            </div>
                            <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800">
                              <div
                                className={`h-2 rounded-full ${bar}`}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 dark:border-slate-800 dark:bg-slate-950/40">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">
                        Why users trust it
                      </p>
                      <div className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-300">
                        <p className="rounded-xl bg-slate-50 p-3 dark:bg-slate-900/60">
                          Gmail access is read-only
                        </p>
                        <p className="rounded-xl bg-slate-50 p-3 dark:bg-slate-900/60">
                          Privacy policy and terms are public
                        </p>
                        <p className="rounded-xl bg-slate-50 p-3 dark:bg-slate-900/60">
                          Support available at support@fintrak.online
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="mt-12 grid gap-4 sm:mt-16 sm:gap-5 md:grid-cols-2 xl:grid-cols-4">
              {FEATURE_CARDS.map(({ icon: Icon, title, description }) => (
                <div
                  key={title}
                  className="glass-card rounded-3xl p-5 shadow-xl sm:p-6"
                >
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300">
                    <Icon size={22} />
                  </div>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                    {title}
                  </h2>
                  <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
                    {description}
                  </p>
                </div>
              ))}
            </section>

            <section className="mt-12 grid gap-6 sm:mt-16 sm:gap-8 lg:grid-cols-[0.95fr,1.05fr]">
              <div className="glass-card rounded-3xl p-6 shadow-xl sm:p-8">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-blue-600 dark:text-blue-300">
                  How it works
                </p>
                <h2 className="mt-3 text-2xl font-bold text-slate-900 sm:text-3xl dark:text-white">
                  A simple flow from Gmail to financial clarity
                </h2>
                <div className="mt-8 space-y-6">
                  {[
                    [
                      "1. Connect Gmail",
                      "The user signs in through Google and grants Gmail read-only access.",
                    ],
                    [
                      "2. FinTrak identifies transaction emails",
                      "The app looks for relevant bank and payment transaction messages only.",
                    ],
                    [
                      "3. Insights appear automatically",
                      "Parsed transactions power charts, bank summaries, categories, and detailed records.",
                    ],
                  ].map(([title, description]) => (
                    <div key={title} className="flex gap-3 sm:gap-4">
                      <div className="mt-1 h-3 w-3 shrink-0 rounded-full bg-blue-500" />
                      <div>
                        <h3 className="font-semibold text-slate-900 dark:text-white">
                          {title}
                        </h3>
                        <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">
                          {description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div
                id="faq"
                className="glass-card rounded-3xl p-6 shadow-xl sm:p-8"
              >
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-blue-600 dark:text-blue-300">
                  FAQs
                </p>
                <h2 className="mt-3 text-2xl font-bold text-slate-900 sm:text-3xl dark:text-white">
                  Questions reviewers and users often ask
                </h2>
                <div className="mt-8 space-y-4">
                  {FAQS.map(({ question, answer }) => (
                    <details
                      key={question}
                      className="group rounded-2xl border border-slate-200 bg-white/70 p-4 transition sm:p-5 dark:border-slate-800 dark:bg-slate-950/30"
                    >
                      <summary className="cursor-pointer list-none font-semibold text-slate-900 dark:text-white">
                        <div className="flex items-center justify-between gap-4">
                          <span>{question}</span>
                          <span className="text-blue-600 transition group-open:rotate-45 dark:text-blue-300">
                            +
                          </span>
                        </div>
                      </summary>
                      <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300">
                        {answer}
                      </p>
                    </details>
                  ))}
                </div>
              </div>
            </section>

            <section
              id="contact"
              className="mt-12 rounded-[1.75rem] bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 p-6 text-white shadow-2xl sm:mt-16 sm:rounded-[2rem] sm:p-10"
            >
              <div className="grid gap-8 lg:grid-cols-[1.1fr,0.9fr] lg:items-center">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-blue-100">
                    Contact and support
                  </p>
                  <h2 className="mt-3 text-2xl font-bold sm:text-3xl">
                    Need help, verification details, or product support?
                  </h2>
                  <p className="mt-4 max-w-2xl text-base leading-8 text-blue-100">
                    Reach the FinTrak team directly for product questions,
                    verification support, or account-related issues.
                  </p>
                </div>

                <div className="rounded-3xl bg-white/12 p-5 backdrop-blur-sm sm:p-6">
                  <div className="flex items-start gap-4">
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
                      <Mail size={22} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-blue-100">Support email</p>
                      <a
                        href={`mailto:${SUPPORT_EMAIL}`}
                        className="mt-1 block break-all text-xl font-semibold text-white underline-offset-4 hover:underline"
                      >
                        {SUPPORT_EMAIL}
                      </a>
                      <p className="mt-3 text-sm leading-7 text-blue-100">
                        Users and reviewers can contact FinTrak here for
                        product, policy, or verification-related queries.
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                    <a
                      href={`mailto:${SUPPORT_EMAIL}`}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 font-semibold text-blue-700 transition hover:bg-blue-50"
                    >
                      <LifeBuoy size={18} />
                      Email Support
                    </a>
                    <button
                      onClick={login}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/25 px-5 py-3 font-semibold text-white transition hover:bg-white/10"
                    >
                      Connect Gmail
                    </button>
                  </div>
                </div>
              </div>
            </section>
          </main>

          <footer className="border-t border-slate-200/70 px-2 py-6 text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <p>
                FinTrak helps users review transaction-related Gmail messages as
                financial insights.
              </p>
              <div className="flex flex-wrap items-center gap-4">
                <Link
                  href="/privacy"
                  className="transition hover:text-blue-600 dark:hover:text-blue-300"
                >
                  Privacy
                </Link>
                <Link
                  href="/terms"
                  className="transition hover:text-blue-600 dark:hover:text-blue-300"
                >
                  Terms
                </Link>
                <a
                  href={`mailto:${SUPPORT_EMAIL}`}
                  className="transition hover:text-blue-600 dark:hover:text-blue-300"
                >
                  {SUPPORT_EMAIL}
                </a>
              </div>
            </div>
          </footer>
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
