"use client";
import { LifeBuoy, Menu } from "lucide-react";

import ThemeToggle from "./ThemeToggle";

const SUPPORT_EMAIL = "support@fintrak.online";

export default function Navbar({ onOpenMenu }) {
  return (
    <div className="flex justify-between items-center bg-white dark:bg-gray-900 p-3 md:p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onOpenMenu}
          className="md:hidden p-2 rounded-lg border border-slate-200 dark:border-slate-700"
          aria-label="Open menu"
        >
          <Menu size={18} />
        </button>
        <h2 className="font-semibold text-base sm:text-lg">
        Financial Dashboard
        </h2>
      </div>

      <div className="flex items-center gap-2">
        <a
          href={`mailto:${SUPPORT_EMAIL}`}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
        >
          <LifeBuoy size={16} />
          <span className="hidden sm:inline">Support</span>
        </a>
        <ThemeToggle />
      </div>
    </div>
  );
}
