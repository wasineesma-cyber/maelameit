import { useMemo } from "react";
import { TrendingUp, TrendingDown, Plus } from "lucide-react";
import type { Transaction } from "@shared/types";
import {
  formatMoney,
  formatDate,
  getCurrentMonthLabel,
  isThisMonth,
} from "@/lib/utils";

interface Props {
  transactions: Transaction[];
  onAddClick: () => void;
}

function TransactionRow({
  t,
}: {
  t: Transaction;
}) {
  return (
    <div className="flex items-center gap-3 py-3">
      <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-xl flex-shrink-0">
        {t.categoryEmoji || "💰"}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-800 truncate">{t.category}</p>
        <p className="text-xs text-slate-400 truncate">{t.note || formatDate(t.date)}</p>
      </div>
      <div className="text-right flex-shrink-0">
        <p
          className={`text-sm font-semibold ${
            t.type === "income" ? "text-green-600" : "text-slate-800"
          }`}
        >
          {t.type === "income" ? "+" : "-"}฿{formatMoney(t.amount)}
        </p>
        {t.note && (
          <p className="text-[11px] text-slate-400">{formatDate(t.date)}</p>
        )}
      </div>
    </div>
  );
}

export function Dashboard({ transactions, onAddClick }: Props) {
  const monthly = useMemo(
    () => transactions.filter((t) => isThisMonth(t.date)),
    [transactions]
  );

  const income = useMemo(
    () => monthly.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0),
    [monthly]
  );

  const expense = useMemo(
    () => monthly.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0),
    [monthly]
  );

  const balance = income - expense;
  const recent = transactions.slice(0, 6);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white px-5 pt-12 pb-6 border-b border-slate-100">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-slate-900">แม่ละเมียด</h1>
            <p className="text-xs text-slate-400 mt-0.5">{getCurrentMonthLabel()}</p>
          </div>
          <div className="w-9 h-9 rounded-full bg-rose-100 flex items-center justify-center text-lg">
            🌸
          </div>
        </div>

        {/* Balance */}
        <div className="text-center mb-6">
          <p className="text-xs font-medium text-slate-500 mb-1">ยอดคงเหลือเดือนนี้</p>
          <p
            className={`text-4xl font-bold tracking-tight ${
              balance >= 0 ? "text-slate-900" : "text-rose-600"
            }`}
          >
            {balance < 0 ? "-" : ""}฿{formatMoney(Math.abs(balance))}
          </p>
        </div>

        {/* Income / Expense cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-green-50 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center">
                <TrendingUp size={14} className="text-green-600" />
              </div>
              <span className="text-xs font-medium text-green-700">รายรับ</span>
            </div>
            <p className="text-lg font-bold text-green-700">฿{formatMoney(income)}</p>
          </div>
          <div className="bg-rose-50 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-full bg-rose-100 flex items-center justify-center">
                <TrendingDown size={14} className="text-rose-600" />
              </div>
              <span className="text-xs font-medium text-rose-700">รายจ่าย</span>
            </div>
            <p className="text-lg font-bold text-rose-700">฿{formatMoney(expense)}</p>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="px-5 pt-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-slate-700">รายการล่าสุด</h2>
        </div>

        {recent.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 text-center">
            <p className="text-3xl mb-3">📝</p>
            <p className="text-sm font-medium text-slate-600 mb-1">ยังไม่มีรายการ</p>
            <p className="text-xs text-slate-400 mb-5">กดปุ่ม + เพื่อเพิ่มรายรับรายจ่าย</p>
            <button
              onClick={onAddClick}
              className="flex items-center gap-2 mx-auto bg-rose-600 text-white text-sm font-medium px-5 py-2.5 rounded-full shadow-md shadow-rose-200 active:scale-95 transition-all"
            >
              <Plus size={16} />
              เพิ่มรายการแรก
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-3xl px-4 divide-y divide-slate-50">
            {recent.map((t) => (
              <TransactionRow key={t.id} t={t} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
