"use client";

import { PiggyBank, TrendingDown, TrendingUp } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { fetchCloudUserData } from "../lib/userDataClient";
import { readBudgetTargets, writeBudgetTargets } from "../lib/budgetStorage.mjs";

export default function SummaryCards({ transactions = [] }) {
  const { user } = useAuth();
  const [cloudBudgetTargets, setCloudBudgetTargets] = useState({});

  const debit = transactions
    .filter((t) => t.type === "Debit")
    .reduce((a, b) => a + b.amount, 0);

  const credit = transactions
    .filter((t) => t.type === "Credit")
    .reduce((a, b) => a + b.amount, 0);

  const localBudgetTargets = user?.id ? readBudgetTargets(user.id) : {};

  useEffect(() => {
    if (!user?.id) {
      return;
    }

    let cancelled = false;

    async function loadBudgetTargets() {
      const fallbackBudgets = readBudgetTargets(user.id);

      try {
        const cloudData = await fetchCloudUserData();
        const nextBudgets =
          cloudData?.budgetTargets && typeof cloudData.budgetTargets === "object"
            ? cloudData.budgetTargets
            : fallbackBudgets;

        writeBudgetTargets(user.id, nextBudgets);

        if (!cancelled) {
          setCloudBudgetTargets(nextBudgets);
        }
      } catch (error) {
        console.warn("Failed to load budget targets:", error);
      }
    }

    loadBudgetTargets();

    return () => {
      cancelled = true;
    };
  }, [user]);

  const budgetTargets =
    Object.keys(cloudBudgetTargets).length > 0
      ? cloudBudgetTargets
      : localBudgetTargets;

  const totalBudget = useMemo(
    () =>
      Object.values(budgetTargets).reduce(
        (sum, value) => sum + Number(value || 0),
        0
      ),
    [budgetTargets]
  );
  const budgetRemaining = totalBudget - debit;

  return (
    <div className="grid gap-8 mb-10 md:grid-cols-2 xl:grid-cols-3">
      <Card title="Total Expenses" value={debit} icon={<TrendingDown />} red />
      <Card title="Total Income" value={credit} icon={<TrendingUp />} />
      <Card
        title="Budget Remaining"
        value={budgetRemaining}
        icon={<PiggyBank />}
        amber={budgetRemaining < 0}
        blue={budgetRemaining >= 0}
      />
    </div>
  );
}

function Card({ title, value, icon, red, amber, blue }) {
  return (
    <div
      className={`p-8 rounded-4xl text-white shadow-2xl ${
        red
          ? "bg-linear-to-br from-rose-500 to-pink-600"
          : amber
            ? "bg-linear-to-br from-amber-500 to-orange-500"
            : blue
              ? "bg-linear-to-br from-blue-500 to-cyan-600"
          : "bg-linear-to-br from-emerald-500 to-teal-600"
      }`}
    >
      <div className="flex justify-between">
        <div>
          <p className="text-sm uppercase">{title}</p>
          <p className="text-4xl font-bold mt-2">
            ₹ {Number(value || 0).toLocaleString("en-IN")}
          </p>
        </div>
        <div className="bg-white/20 p-2 sm:p-3 rounded-xl">{icon}</div>
      </div>
    </div>
  );
}
