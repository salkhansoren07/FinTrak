"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

function formatCurrency(value) {
  return `Rs ${Number(value || 0).toLocaleString("en-IN")}`;
}

export default function CategoryChart({ transactions = [] }) {
  const dataMap = {};

  transactions.forEach(t => {
    if (t.type !== "Debit") return;
    dataMap[t.category] = (dataMap[t.category] || 0) + t.amount;
  });

  const data = Object.entries(dataMap)
    .map(([name, value]) => ({
      name,
      value,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  return (
    <div className="bg-white dark:bg-gray-900 p-4 md:p-6 rounded-2xl md:rounded-3xl shadow-xl">
      <h3 className="font-semibold text-slate-400 mb-4">
        Spending by Category
      </h3>

      {data.length === 0 ? (
        <div className="flex h-[240px] items-center justify-center rounded-2xl border border-dashed border-slate-200 text-sm text-slate-400 dark:border-slate-700">
          No category spending yet
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 4, right: 12, left: 12, bottom: 4 }}
            barSize={12}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              horizontal={false}
              stroke="rgba(148,163,184,0.18)"
            />
            <XAxis
              type="number"
              tickFormatter={(value) => formatCurrency(value)}
              tick={{ fill: "#94A3B8", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              dataKey="name"
              type="category"
              width={88}
              tick={{ fill: "#94A3B8", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              cursor={{ fill: "rgba(59,130,246,0.08)" }}
              formatter={(value) => [formatCurrency(value), "Spent"]}
              contentStyle={{
                borderRadius: "16px",
                border: "1px solid rgba(148,163,184,0.2)",
                backgroundColor: "rgba(15,23,42,0.95)",
                color: "#E2E8F0",
              }}
              labelStyle={{ color: "#F8FAFC" }}
            />
            <Bar
              dataKey="value"
              fill="#3B82F6"
              radius={[999, 999, 999, 999]}
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
