import {
  LayoutDashboard,
  BookUser,
  CreditCard,
  LogOut,
  Calendar,
  ListRestart
} from "lucide-react";

import { useAuth } from "../context/AuthContext";
import { useTransactions } from "../context/TransactionContext";
import Link from "next/link";
import Image from "next/image";

function formatMonthLocal(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function formatDateLocal(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function Sidebar({ onClose }) {
  const { logout } = useAuth();
  const { dateFilter, setDateFilter } = useTransactions();

  const now = new Date();

  // ---------- QUICK PRESETS ----------

  const setThisMonth = () => {
    setDateFilter({
      type: "month",
      month: formatMonthLocal(now),
    });
  };

  const setLastMonth = () => {
    const d = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    setDateFilter({
      type: "month",
      month: formatMonthLocal(d),
    });
  };

  const setLast3Months = () => {
    const start = new Date(now.getFullYear(), now.getMonth() - 2, 1);
    setDateFilter({
      type: "custom",
      start: formatDateLocal(start),
      end: formatDateLocal(now),
    });
  };

  const setThisYear = () => {
    const start = new Date(now.getFullYear(), 0, 1);
    setDateFilter({
      type: "custom",
      start: formatDateLocal(start),
      end: formatDateLocal(now),
    });
  };

  const setAllTime = () => {
    setDateFilter({ type: "all" });
  };

  return (
    <div className="w-64 md:w-64 h-full md:h-screen flex-1 overflow-y-auto pr-1 bg-white dark:bg-gray-900 shadow-xl p-5 md:p-6 flex flex-col">

      {/* TOP SECTION */}
      <div>

        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Image
              src="/fintrak-logo.png"
              alt="FinTrak logo"
              width={44}
              height={44}
              className="h-11 w-11 rounded-xl object-cover shadow-md"
              priority
            />
            <div>
              <h1 className="text-xl font-bold text-blue-600 leading-none">
                FinTrak
              </h1>
              <p className="mt-1 text-xs text-slate-400">
                Smart expense tracking
              </p>
            </div>
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="md:hidden text-sm px-2 py-1 rounded border border-slate-200 dark:border-slate-700"
            >
              Close
            </button>
          )}
        </div>

        {/* MAIN NAV */}
        <nav className="space-y-4">
          <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300 hover:text-blue-500 cursor-pointer p-2 rounded-lg transition-all">
            <LayoutDashboard size={18} />
            Dashboard
          </div>
  
          <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300 hover:text-blue-500 cursor-pointer p-2 rounded-lg transition-all">
            <CreditCard size={18} />
            Transactions
          </div>

          <Link href="/individual">
            <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300 hover:text-blue-500 cursor-pointer p-2 rounded-lg transition-all">
              <BookUser size={18} />
              Individual
            </div>
          </Link>


        </nav>

        {/* DATE FILTER SECTION */}
        <div className="mt-7">

          <div className="flex items-center gap-2 mb-3 text-slate-300 text-[15px] uppercase">
            <Calendar size={15} />
            Date Filter
          </div>

          {/* FILTER TYPE */}
          <div className="px-2">
          <select
            value={dateFilter.type}
            onChange={(e) =>
              setDateFilter({ ...dateFilter, type: e.target.value })
            }
            className="w-full mt-2 mb-3 border rounded-lg px-2 py-2 text-slate-400 bg-white dark:bg-gray-900"
          >
            <option value="month">Month</option>
            <option value="custom">Custom Range</option>
            <option value="all">All Time</option>
          </select>
          </div>

          {/* MONTH PICKER */}
          <div className="px-2">
          {dateFilter.type === "month" && (
            <input
              type="month"
              value={dateFilter.month || ""}
              onChange={(e) =>
                setDateFilter({ ...dateFilter, month: e.target.value })
              }
              className="w-full mb-3 border rounded-lg px-2 py-1 text-slate-400 bg-white dark:bg-gray-900"
            />
          )}
          </div>  

          {/* CUSTOM RANGE */}
          {dateFilter.type === "custom" && (
            <div className="space-y-2 mb-3">
              <input
                type="date"
                value={dateFilter.start || ""}
                onChange={(e) =>
                  setDateFilter({ ...dateFilter, start: e.target.value })
                }
                className="w-full border rounded-lg px-2 py-2 text-slate-400 bg-white dark:bg-gray-900"
              />

              <input
                type="date"
                value={dateFilter.end || ""}
                onChange={(e) =>
                  setDateFilter({ ...dateFilter, end: e.target.value })
                }
                className="w-full border rounded-lg px-2 py-2 text-slate-400 bg-white dark:bg-gray-900"
              />
            </div>
          )}

          {/* QUICK PRESETS */}
          <div className="flex items-center gap-2 mb-3 text-slate-300 mt-2 text-[15px] uppercase">
            <ListRestart size={15} />
            Quick Presets
          </div>
  
          <div className="space-y-2 px-2 text-sm">

            <button
              onClick={setThisMonth}
              className="w-full text-left p-2 cursor-pointer rounded-lg text-slate-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
            >
              This Month
            </button>

            <button
              onClick={setLastMonth}
              className="w-full text-left cursor-pointer p-2 text-slate-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20"
            >
              Last Month
            </button>

            <button
              onClick={setLast3Months}
              className="w-full text-left p-2 cursor-pointer text-slate-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20"
            >
              Last 3 Months
            </button>

            <button
              onClick={setThisYear}
              className="w-full text-left p-2 cursor-pointer text-slate-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20"
            >
              This Year
            </button>

            <button
              onClick={setAllTime}
              className="w-full text-left p-2 cursor-pointer text-slate-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20"
            >
              All Time
            </button>

          </div>
        </div>

      </div>

      {/* LOGOUT */}
      <div className="pt-6 border-t border-gray-100 dark:border-gray-800">
        <button
          onClick={logout}
          className="flex items-center gap-3 w-full text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 p-2 rounded-xl transition-all font-medium"
        >
          <LogOut size={18} />
          Sign Out
        </button>
      </div>
    </div>
  );
}
