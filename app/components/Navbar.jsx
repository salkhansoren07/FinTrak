"use client";
import { Menu } from "lucide-react";

import ThemeToggle from "./ThemeToggle";

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

      <ThemeToggle />
    </div>
  );
}
