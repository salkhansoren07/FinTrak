"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import {
  ArrowRight,
  BarChart3,
  Building2,
  CheckCircle2,
  LifeBuoy,
  Lock,
  Mail,
  MailCheck,
  Menu,
  ShieldCheck,
  Sparkles,
  X,
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
import DashboardScreenshots from "./components/DashboardScreenshots";

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

const TESTIMONIALS = [
  {
    name: "Aarav Mehta",
    role: "Software engineer, Bengaluru",
    quote:
      "FinTrak helped me realize I was spending way too much on food delivery. Now I save ₹3,000 a month!",
  },
  {
    name: "Priya Kumari",
    role: "College student, Patna",
    quote:
      "Finally a simple app in Hindi that my parents can also use. The clean design makes it easy for everyone.",
  },
  {
    name: "Rohan Verma",
    role: "Small business owner, Lucknow",
    quote:
      "I used to write everything in a notebook. FinTrak gives me charts, spending categories, and monthly visibility in one place.",
  },
];

const AUTH_ERROR_MESSAGES = {
  google_oauth_not_configured:
    "Google sign-in is not configured on the server yet. Add the Google OAuth client ID and client secret in production, then try again.",
  oauth_start_failed:
    "FinTrak could not start Google sign-in. Check the production Google OAuth configuration and try again.",
  oauth_state_invalid:
    "The Google sign-in session expired before it finished. Please try connecting Gmail again.",
  oauth_callback_failed:
    "FinTrak could not finish Google sign-in. Please try again.",
  refresh_token_missing:
    "Google did not return a reusable Gmail connection. Remove FinTrak from your Google account permissions, then connect Gmail again.",
  profile_read_failed:
    "FinTrak could not read your saved Gmail connection. Please try again.",
  profile_write_failed:
    "FinTrak could not save your Gmail connection. Make sure the FinTrak users table has the Gmail token fields, then try again.",
  supabase_not_configured:
    "Server-side Gmail sync is not configured yet. Add the required Supabase and Google server credentials.",
  login_required:
    "Create or sign in to your FinTrak account before connecting Gmail.",
};

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const searchParams = useSearchParams();
  const { authenticated, connectGmail, loading: authLoading } = useAuth();
  const { filteredTransactions, loading, syncError, syncWarning } =
    useTransactions();
  const authErrorMessage =
    AUTH_ERROR_MESSAGES[searchParams.get("authError")] || "";
  const dashboardStats = useMemo(() => {
    const debitTransactions = filteredTransactions.filter(
      (transaction) => transaction.type === "Debit"
    );
    const totalSpent = debitTransactions.reduce(
      (sum, transaction) => sum + transaction.amount,
      0
    );
    const activeBanks = new Set(
      filteredTransactions.map((transaction) => transaction.bank)
    ).size;
    const activeCategories = new Set(
      debitTransactions.map((transaction) => transaction.category)
    ).size;

    return {
      totalSpent,
      activeBanks,
      activeCategories,
      transactionCount: filteredTransactions.length,
    };
  }, [filteredTransactions]);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC] px-6 text-center text-slate-600 dark:bg-[#020617] dark:text-slate-300">
        FinTrak is warming up...
      </div>
    );
  }

  // NOT LOGGED IN
  if (!authenticated) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.16),_transparent_38%),linear-gradient(180deg,_#f8fbff_0%,_#edf4ff_48%,_#f8fafc_100%)] text-slate-900 dark:bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.18),_transparent_32%),linear-gradient(180deg,_#020617_0%,_#081225_48%,_#020617_100%)] dark:text-slate-50">
        <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-3 py-3 sm:px-6 sm:py-4 lg:px-8">
          <header className="glass-card sticky top-2 z-20 rounded-xl px-3 py-3 sm:top-3 sm:rounded-2xl sm:px-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center justify-between gap-3">
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

                <button
                  type="button"
                  onClick={() => setMobileMenuOpen((open) => !open)}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 text-slate-700 transition hover:bg-slate-50 sm:hidden dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                  aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
                  aria-expanded={mobileMenuOpen}
                  aria-controls="mobile-site-nav"
                >
                  {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                </button>
              </div>

              <nav
                id="mobile-site-nav"
                className={`${
                  mobileMenuOpen ? "grid" : "hidden"
                } grid-cols-2 gap-2 border-t border-slate-200/70 pt-3 sm:flex sm:flex-wrap sm:items-center sm:justify-end sm:gap-3 sm:border-t-0 sm:pt-0`}
              >
                <a
                  href="#features"
                  onClick={() => setMobileMenuOpen(false)}
                  className="inline-flex items-center justify-center rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                >
                  Features
                </a>
                <a
                  href="#how-it-works"
                  onClick={() => setMobileMenuOpen(false)}
                  className="inline-flex items-center justify-center rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                >
                  How it works
                </a>
                <Link
                  href="/privacy"
                  onClick={() => setMobileMenuOpen(false)}
                  className="inline-flex items-center justify-center rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                >
                  Privacy
                </Link>
                <Link
                  href="/terms"
                  onClick={() => setMobileMenuOpen(false)}
                  className="inline-flex items-center justify-center rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                >
                  Terms
                </Link>
                <a
                  href={`mailto:${SUPPORT_EMAIL}`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="col-span-2 inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 sm:col-span-1 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                >
                  <LifeBuoy size={16} />
                  Support
                </a>
                <Link
                  href="/get-started"
                  onClick={() => setMobileMenuOpen(false)}
                  className="col-span-2 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:bg-blue-700 sm:col-span-1"
                >
                  Get Started
                  <ArrowRight size={16} />
                </Link>
              </nav>
            </div>
          </header>

          <main className="flex flex-col items-center justify-center text-center py-7 sm:py-10 lg:py-14">
            <section className="grid items-center gap-6 sm:gap-8 lg:grid-cols-[1.15fr,0.85fr]">
              <div>
                {authErrorMessage ? (
                  <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 shadow-sm dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-200">
                    {authErrorMessage}
                  </div>
                ) : null}

                <div className="mx-auto mb-4 inline-flex gap-2 rounded-full border border-blue-200/70 bg-white/80 px-4 py-2 text-xs font-medium text-blue-700 shadow-sm sm:text-sm dark:border-blue-900/60 dark:bg-slate-900/70 dark:text-blue-300">
                  <Sparkles size={16} />
                  Personal finance, simplified
                </div>

                <h1 className="mx-auto max-w-3xl text-[2rem] font-black leading-[1.05] tracking-tight text-slate-900 sm:text-5xl lg:text-6xl dark:text-white">
                  Track every rupee,
                  stress less{" "}
                  <span className="text-blue-600 dark:text-blue-400">
                    FinTrak
                  </span>
                </h1>

                <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:mt-6 sm:text-lg sm:leading-8 dark:text-slate-300">
                  FinTrak helps you stay on top of your daily expenses, set budgets, and understand where your money goes — all in one clean place.
                </p>

                <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                  <Link
                    href="/get-started"
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 py-4 text-base font-semibold text-white shadow-xl transition hover:bg-blue-700"
                  >
                    Start for free
                    <ArrowRight size={18} />
                  </Link>
                  <a
                    href="#features"
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white/70 px-6 py-4 text-base font-semibold text-slate-700 transition hover:bg-white dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200 dark:hover:bg-slate-900"
                  >
                    <BarChart3 size={18} />
                    Explore features
                  </a>
                </div>

                <div className="mt-6 flex flex-col gap-3 text-sm text-slate-500 dark:text-slate-400 sm:flex-row sm:flex-wrap sm:items-center">
                  <span className="inline-flex items-center gap-2">
                    <ShieldCheck size={16} className="text-emerald-500" />
                    Gmail read-only access only
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-500" />
                    FinTrak login plus one-time Gmail connect
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <Building2 size={16} className="text-emerald-500" />
                    Public homepage, privacy, and support contact
                  </span>
                </div>
              </div>

                <DashboardScreenshots />
            </section>

          </main>

            <h2 className="mt-16 text-2xl font-bold text-slate-900 sm:text-3xl dark:text-white">
              Everything you need to manage money
            </h2>
            <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300">
              Simple, powerful tools built for everyday Indians.
            </p>


              <section
                id="features"
                className="mt-12 grid gap-4 scroll-mt-28 sm:mt-16 sm:gap-5 md:grid-cols-2 xl:grid-cols-4"
              >
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
          

                   {/*<section
                id="auth"
                className="mt-12 grid gap-6 rounded-[2rem] border border-slate-200/80 bg-[linear-gradient(180deg,_rgba(255,255,255,0.94)_0%,_rgba(239,246,255,0.92)_100%)] p-6 shadow-[0_24px_70px_-36px_rgba(59,130,246,0.35)] dark:border-slate-800/80 dark:bg-[linear-gradient(180deg,_rgba(15,23,42,0.9)_0%,_rgba(8,18,37,0.9)_100%)] sm:mt-16 sm:p-8 lg:grid-cols-[0.9fr,1.1fr]"
              >
                <div className="text-left">
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-blue-600 dark:text-blue-300">
                    Get started
                  </p>
                  <h2 className="mt-3 text-2xl font-bold text-slate-900 sm:text-3xl dark:text-white">
                    Create your account after seeing how the dashboard works
                  </h2>
                  <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300">
                    The hero section now showcases the product first, but account access still stays right here on the homepage. Sign up, set your passcode, and connect Gmail when you are ready.
                  </p>
                </div>

                <PublicAuthCard />
              </section>*/}

              <section
                id="how-it-works"
                className="mt-12 grid gap-6 scroll-mt-28 sm:mt-16 sm:gap-8 lg:grid-cols-[0.8fr,1.2fr]"
              >
                <div className="glass-card rounded-3xl p-6 text-left shadow-xl sm:p-8">
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-blue-600 dark:text-blue-300">
                    How it works
                  </p>
                  <h2 className="mt-3 text-2xl font-bold text-slate-900 sm:text-3xl dark:text-white">
                    Up and running in 3 steps
                  </h2>
                  <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300">
                    FinTrak is designed to feel lightweight from day one. Create your account, bring in your spending data, and start reviewing patterns without manual spreadsheet work.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  {[
                    [
                      "1",
                      "Create your account",
                      "Sign up free with just your name and email. No credit card needed.",
                    ],
                    [
                      "2",
                      "Connect your data",
                      "Securely connect Gmail and let FinTrak detect transaction emails and organize them automatically.",
                    ],
                    [
                      "3",
                      "Review your insights",
                      "See budgets, category trends, and clear summaries that show how your money moves.",
                    ],
                  ].map(([number, title, description]) => (
                    <div
                      key={title}
                      className="glass-card rounded-3xl p-6 text-left shadow-xl sm:p-7"
                    >
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-500 text-sm font-semibold text-slate-100">
                        {number}
                      </div>
                      <h3 className="mt-5 font-semibold text-slate-900 dark:text-white">
                        {title}
                      </h3>
                      <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
                        {description}
                      </p>
                    </div>
                  ))}
                </div>
              </section>

              <section className="mt-12 sm:mt-16">
                <div className="mb-8">
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-blue-600 dark:text-blue-300">
                    Testimonials
                  </p>
                  <h2 className="mt-3 text-2xl font-bold text-slate-900 sm:text-3xl dark:text-white">
                    People love FinTrak
                  </h2>
                  <p className="mx-auto mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300">
                    From students to working professionals — everyone keeps track.
                  </p>
                </div>

                <div className="grid gap-5 md:grid-cols-3">
                  {TESTIMONIALS.map(({ name, role, quote }) => (
                    <div
                      key={name}
                      className="glass-card rounded-[2rem] p-6 text-left shadow-xl"
                    >
                      <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-100 text-lg font-bold text-blue-600 dark:bg-blue-900/30 dark:text-blue-300">
                        {name.charAt(0)}
                      </div>
                      <p className="mt-5 text-sm leading-7 text-slate-600 dark:text-slate-300">
                        &ldquo;{quote}&rdquo;
                      </p>
                      <div className="mt-6">
                        <p className="font-semibold text-slate-900 dark:text-white">
                          {name}
                        </p>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                          {role}
                        </p>
                      </div>
                    </div>
                  ))}
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
                      <Link
                        href="/get-started"
                        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/25 px-5 py-3 font-semibold text-white transition hover:bg-white/10"
                      >
                        Get Started
                      </Link>
                    </div>
                  </div>
                </div>
              </section>

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
            onClick={() => connectGmail({ forceConsent: true })}
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

          <section id="transactions" className="scroll-mt-6">
            <TransactionTable transactions={filteredTransactions} />
          </section>
        </>
      ) : (
        <div className="text-center py-24">
          No transactions found.
        </div>
      )}
    </Layout>
  );
}

function DashboardMiniCard({ label, value, icon: Icon }) {
  return (
    <div className="rounded-[26px] border border-white/70 bg-white/80 p-4 shadow-[0_14px_40px_-30px_rgba(15,23,42,0.45)] backdrop-blur dark:border-slate-800/80 dark:bg-slate-950/60">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
            {label}
          </p>
          <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
            {value}
          </p>
        </div>
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
          <Icon size={18} />
        </span>
      </div>
    </div>
  );
}
