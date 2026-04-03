import { useState, useMemo } from "react";
import { Trash2 } from "lucide-react";
import type { Transaction, TransactionType } from "@shared/types";
import { formatMoney, formatDate, groupByDate, cn } from "@/lib/utils";

interface Props {
  transactions: Transaction[];
  onDelete: (id: string) => void;
}

type Filter = "all" | TransactionType;

function TransactionItem({
  t,
  onDelete,
}: {
  t: Transaction;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-center gap-3 py-3 group">
      <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-xl flex-shrink-0">
        {t.categoryEmoji || "💰"}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-800 truncate">{t.category}</p>
        {t.note && (
          <p className="text-xs text-slate-400 truncate">{t.note}</p>
        )}
      </div>
      <p
        className={`text-sm font-semibold flex-shrink-0 ${
          t.type === "income" ? "text-green-600" : "text-slate-800"
        }`}
      >
        {t.type === "income" ? "+" : "-"}฿{formatMoney(t.amount)}
      </p>
      <button
        onClick={onDelete}
        className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-rose-50 text-slate-300 hover:text-rose-400 transition-all ml-1 flex-shrink-0"
        aria-label="ลบรายการ"
      >
        <Trash2 size={15} />
      </button>
    </div>
  );
}

export function Transactions({ transactions, onDelete }: Props) {
  const [filter, setFilter] = useState<Filter>("all");

  const filtered = useMemo(() => {
    if (filter === "all") return transactions;
    return transactions.filter((t) => t.type === filter);
  }, [transactions, filter]);

  const grouped = useMemo(() => groupByDate(filtered), [filtered]);

  const totalIncome = useMemo(
    () =>
      transactions
        .filter((t) => t.type === "income")
        .reduce((s, t) => s + t.amount, 0),
    [transactions]
  );

  const totalExpense = useMemo(
    () =>
      transactions
        .filter((t) => t.type === "expense")
        .reduce((s, t) => s + t.amount, 0),
    [transactions]
  );

  const filterTabs: { key: Filter; label: string }[] = [
    { key: "all", label: "ทั้งหมด" },
    { key: "income", label: "รายรับ" },
    { key: "expense", label: "รายจ่าย" },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white px-5 pt-12 pb-4 border-b border-slate-100">
        <h1 className="text-xl font-bold text-slate-900 mb-4">รายการทั้งหมด</h1>

        {/* Summary row */}
        <div className="flex gap-4 mb-4">
          <div className="flex-1 text-center">
            <p className="text-[11px] text-slate-500 mb-0.5">รายรับรวม</p>
            <p className="text-base font-bold text-green-600">
              ฿{formatMoney(totalIncome)}
            </p>
          </div>
          <div className="w-px bg-slate-100" />
          <div className="flex-1 text-center">
            <p className="text-[11px] text-slate-500 mb-0.5">รายจ่ายรวม</p>
            <p className="text-base font-bold text-rose-600">
              ฿{formatMoney(totalExpense)}
            </p>
          </div>
          <div className="w-px bg-slate-100" />
          <div className="flex-1 text-center">
            <p className="text-[11px] text-slate-500 mb-0.5">คงเหลือ</p>
            <p
              className={`text-base font-bold ${
                totalIncome - totalExpense >= 0
                  ? "text-slate-800"
                  : "text-rose-600"
              }`}
            >
              ฿{formatMoney(Math.abs(totalIncome - totalExpense))}
            </p>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex bg-slate-100 rounded-2xl p-1">
          {filterTabs.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={cn(
                "flex-1 py-2 rounded-xl text-xs font-semibold transition-all",
                filter === key
                  ? "bg-white text-slate-800 shadow-sm"
                  : "text-slate-500"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="px-5 pt-4">
        {grouped.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 text-center">
            <p className="text-3xl mb-3">🔍</p>
            <p className="text-sm text-slate-500">ไม่มีรายการ</p>
          </div>
        ) : (
          <div className="space-y-3">
            {grouped.map(({ date, items }) => (
              <div key={date} className="bg-white rounded-3xl px-4">
                {/* Date header */}
                <div className="pt-3 pb-1 flex items-center justify-between">
                  <p className="text-xs font-semibold text-slate-500">
                    {formatDate(date)}
                  </p>
                  <p className="text-xs text-slate-400">
                    {items.length} รายการ
                  </p>
                </div>
                {/* Items */}
                <div className="divide-y divide-slate-50">
                  {items.map((t) => (
                    <TransactionItem
                      key={t.id}
                      t={t}
                      onDelete={() => onDelete(t.id)}
                    />
                  ))}
                </div>
                {/* Day total */}
                <div className="py-2.5 border-t border-slate-50 flex justify-between">
                  <span className="text-xs text-slate-400">ยอดรวมวันนี้</span>
                  <span className="text-xs font-semibold text-slate-600">
                    {(() => {
                      const net = items.reduce(
                        (s, t) =>
                          s + (t.type === "income" ? t.amount : -t.amount),
                        0
                      );
                      return `${net >= 0 ? "+" : ""}฿${formatMoney(Math.abs(net))}`;
                    })()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
