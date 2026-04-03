import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import type { Transaction } from "@shared/types";
import { formatMoney } from "@/lib/utils";

interface Props {
  transactions: Transaction[];
}

const COLORS = [
  "#f43f5e", "#fb923c", "#facc15", "#4ade80", "#34d399",
  "#22d3ee", "#818cf8", "#c084fc", "#f472b6", "#a78bfa",
  "#60a5fa", "#2dd4bf", "#84cc16",
];

function getLast6Months(): { key: string; label: string }[] {
  const result = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = new Intl.DateTimeFormat("th-TH", { month: "short" }).format(d);
    result.push({ key, label });
  }
  return result;
}

const ThaiTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-3 text-xs">
        <p className="font-semibold text-slate-700 mb-1">{label}</p>
        {payload.map((p: any) => (
          <p key={p.name} style={{ color: p.fill || p.color }}>
            {p.name}: ฿{formatMoney(p.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const PieTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const d = payload[0];
    return (
      <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-3 text-xs">
        <p className="font-semibold text-slate-700">{d.name}</p>
        <p style={{ color: d.payload.fill }}>฿{formatMoney(d.value)}</p>
        <p className="text-slate-400">{d.payload.percent}%</p>
      </div>
    );
  }
  return null;
};

export function Analytics({ transactions }: Props) {
  const months = getLast6Months();

  // Bar chart: income vs expense per month
  const barData = useMemo(() => {
    return months.map(({ key, label }) => {
      const monthTx = transactions.filter((t) => t.date.startsWith(key));
      const income = monthTx
        .filter((t) => t.type === "income")
        .reduce((s, t) => s + t.amount, 0);
      const expense = monthTx
        .filter((t) => t.type === "expense")
        .reduce((s, t) => s + t.amount, 0);
      return { label, income, expense };
    });
  }, [transactions, months]);

  // Pie chart: expense by category (this month)
  const thisMonthKey = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;
  const pieData = useMemo(() => {
    const expenseThisMonth = transactions.filter(
      (t) => t.type === "expense" && t.date.startsWith(thisMonthKey)
    );
    const map: Record<string, { amount: number; emoji: string }> = {};
    for (const t of expenseThisMonth) {
      if (!map[t.category]) map[t.category] = { amount: 0, emoji: t.categoryEmoji };
      map[t.category].amount += t.amount;
    }
    const total = Object.values(map).reduce((s, v) => s + v.amount, 0);
    return Object.entries(map)
      .map(([name, { amount, emoji }]) => ({
        name: `${emoji} ${name}`,
        value: amount,
        percent: total > 0 ? Math.round((amount / total) * 100) : 0,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [transactions, thisMonthKey]);

  // Summary stats
  const totalIncome = useMemo(
    () => transactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0),
    [transactions]
  );
  const totalExpense = useMemo(
    () => transactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0),
    [transactions]
  );
  const savingRate =
    totalIncome > 0
      ? Math.max(0, Math.round(((totalIncome - totalExpense) / totalIncome) * 100))
      : 0;

  return (
    <div className="min-h-screen bg-slate-50 pb-8">
      {/* Header */}
      <div className="bg-white px-5 pt-12 pb-5 border-b border-slate-100">
        <h1 className="text-xl font-bold text-slate-900">วิเคราะห์</h1>
        <p className="text-xs text-slate-400 mt-0.5">ภาพรวมรายรับรายจ่าย</p>
      </div>

      <div className="px-5 pt-5 space-y-4">
        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-white rounded-2xl p-4 text-center">
            <p className="text-[10px] text-slate-500 mb-1">รายรับรวม</p>
            <p className="text-sm font-bold text-green-600">฿{formatMoney(totalIncome)}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 text-center">
            <p className="text-[10px] text-slate-500 mb-1">รายจ่ายรวม</p>
            <p className="text-sm font-bold text-rose-600">฿{formatMoney(totalExpense)}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 text-center">
            <p className="text-[10px] text-slate-500 mb-1">อัตราออม</p>
            <p className="text-sm font-bold text-slate-700">{savingRate}%</p>
          </div>
        </div>

        {/* Bar chart */}
        <div className="bg-white rounded-3xl p-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">
            รายรับ vs รายจ่าย (6 เดือน)
          </h2>
          {transactions.length === 0 ? (
            <div className="h-44 flex items-center justify-center text-slate-400 text-sm">
              ยังไม่มีข้อมูล
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={barData} barGap={4} barSize={10}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis hide />
                <Tooltip content={<ThaiTooltip />} cursor={{ fill: "#f8fafc" }} />
                <Bar dataKey="income" name="รายรับ" fill="#4ade80" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" name="รายจ่าย" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
          <div className="flex justify-center gap-5 mt-2">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
              <span className="text-[11px] text-slate-500">รายรับ</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span className="text-[11px] text-slate-500">รายจ่าย</span>
            </div>
          </div>
        </div>

        {/* Pie chart */}
        <div className="bg-white rounded-3xl p-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-1">
            รายจ่ายตามหมวดหมู่เดือนนี้
          </h2>
          {pieData.length === 0 ? (
            <div className="h-44 flex items-center justify-center text-slate-400 text-sm">
              ยังไม่มีรายจ่ายเดือนนี้
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {pieData.map((_, index) => (
                      <Cell
                        key={index}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              {/* Legend */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-2">
                {pieData.map((d, i) => (
                  <div key={d.name} className="flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ background: COLORS[i % COLORS.length] }}
                    />
                    <span className="text-[11px] text-slate-600 truncate flex-1">{d.name}</span>
                    <span className="text-[11px] text-slate-400">{d.percent}%</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Top spending categories */}
        {pieData.length > 0 && (
          <div className="bg-white rounded-3xl p-5">
            <h2 className="text-sm font-semibold text-slate-700 mb-3">
              อันดับหมวดรายจ่ายเดือนนี้
            </h2>
            <div className="space-y-3">
              {pieData.map((d, i) => {
                const maxVal = pieData[0].value;
                const pct = (d.value / maxVal) * 100;
                return (
                  <div key={d.name}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-700 font-medium">{d.name}</span>
                      <span className="text-slate-500">฿{formatMoney(d.value)}</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${pct}%`,
                          background: COLORS[i % COLORS.length],
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
