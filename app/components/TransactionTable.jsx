"use client";
import { saveCloudUserData } from "../lib/userDataClient";

const CATEGORIES = ["Food", "Shopping", "Transfer", "Bills", "Other"];

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

export default function TransactionTable({ transactions = [] }) {
  const updateCategory = async (id, category) => {
    const existing = readCategoryOverrides();

    existing[id] = category;

    localStorage.setItem(
      "categoryOverrides",
      JSON.stringify(existing)
    );

    try {
      await saveCloudUserData(existing);
    } catch (error) {
      console.warn("Cloud sync write failed:", error);
    }

    window.location.reload();
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl md:rounded-4xl shadow-xl overflow-hidden mt-8">
      <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
        {transactions.map((t) => (
          <div key={t.id} className="p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-semibold text-slate-700 dark:text-slate-200 truncate">
                  {t.bank}
                </p>
                <p className="text-xs text-slate-400">{t.dateLabel}</p>
              </div>
              <p
                className={`font-bold text-sm ${
                  t.type === "Debit" ? "text-rose-500" : "text-emerald-500"
                }`}
              >
                {t.type === "Debit" ? "-" : "+"} ₹{t.amount}
              </p>
            </div>

            <div className="flex items-center justify-between gap-3">
              <select
                value={t.category}
                onChange={(e) => updateCategory(t.id, e.target.value)}
                className="bg-transparent border rounded-lg px-2 py-1 text-sm text-slate-600 dark:text-slate-300 max-w-[50%]"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              <p className="font-mono text-xs text-slate-400 truncate text-right">
                {t.vpa}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-gray-50 dark:bg-gray-800/50 text-slate-400">
            <tr>
              <th className="p-6 text-xs uppercase">Bank</th>
              <th className="p-6 text-xs uppercase">Date</th>
              <th className="p-6 text-xs uppercase">Category</th>
              <th className="p-6 text-xs uppercase">VPA</th>
              <th className="p-6 text-xs uppercase text-right">Amount</th>
            </tr>
          </thead>

          <tbody>
            {transactions.map((t) => (
              <tr key={t.id} className="border-t">
                <td className="p-6 text-slate-300">{t.bank}</td>
                <td className="p-6 text-slate-400">{t.dateLabel}</td>
                <td className="p-6">
                  <select
                    value={t.category}
                    onChange={(e) => updateCategory(t.id, e.target.value)}
                    className="bg-transparent border rounded-lg px-2 py-1 text-slate-300"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </td>

                <td className="p-6 font-mono truncate max-w-xs text-slate-300">
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
    </div>
  );
}
