import { useState } from "react";
import { X, ChevronLeft } from "lucide-react";
import type { Transaction, TransactionType } from "@shared/types";
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES } from "@/lib/categories";
import { cn, getTodayString, formatMoney } from "@/lib/utils";

interface Props {
  onClose: () => void;
  onSave: (data: Omit<Transaction, "id" | "createdAt">) => void;
}

export function AddTransactionModal({ onClose, onSave }: Props) {
  const [type, setType] = useState<TransactionType>("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [categoryEmoji, setCategoryEmoji] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(getTodayString());

  const categories = type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const handleAmountKey = (key: string) => {
    if (key === "DEL") {
      setAmount((v) => v.slice(0, -1));
    } else if (key === ".") {
      if (!amount.includes(".")) setAmount((v) => v + ".");
    } else {
      if (amount.length >= 10) return;
      setAmount((v) => (v === "0" ? key : v + key));
    }
  };

  const handleSave = () => {
    const num = parseFloat(amount);
    if (!num || num <= 0 || !category) return;
    onSave({ type, amount: num, category, categoryEmoji, note, date });
  };

  const canSave = parseFloat(amount) > 0 && category !== "";

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 z-50 fade-in"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="fixed inset-x-0 bottom-0 max-w-md mx-auto bg-white rounded-t-3xl z-50 slide-up shadow-2xl">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-slate-200" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3">
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
            <ChevronLeft size={22} />
          </button>
          <h2 className="font-semibold text-slate-800">เพิ่มรายการ</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
            <X size={20} />
          </button>
        </div>

        {/* Type toggle */}
        <div className="mx-5 mb-4">
          <div className="flex bg-slate-100 rounded-2xl p-1">
            <button
              className={cn(
                "flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all",
                type === "expense"
                  ? "bg-white text-rose-600 shadow-sm"
                  : "text-slate-500"
              )}
              onClick={() => { setType("expense"); setCategory(""); setCategoryEmoji(""); }}
            >
              รายจ่าย
            </button>
            <button
              className={cn(
                "flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all",
                type === "income"
                  ? "bg-white text-green-600 shadow-sm"
                  : "text-slate-500"
              )}
              onClick={() => { setType("income"); setCategory(""); setCategoryEmoji(""); }}
            >
              รายรับ
            </button>
          </div>
        </div>

        {/* Amount display */}
        <div className="px-5 mb-4 text-center">
          <div className="text-4xl font-bold text-slate-900 tracking-tight min-h-12 flex items-center justify-center gap-2">
            <span className="text-2xl text-slate-400 font-normal">฿</span>
            <span>{amount ? formatMoney(parseFloat(amount) || 0) : "0"}</span>
          </div>
          {amount && parseFloat(amount) > 0 && (
            <p className="text-xs text-slate-400 mt-1">
              {parseFloat(amount).toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บาท
            </p>
          )}
        </div>

        {/* Category */}
        <div className="px-5 mb-3">
          <p className="text-xs font-medium text-slate-500 mb-2">หมวดหมู่</p>
          <div className="grid grid-cols-4 gap-2">
            {categories.map((cat) => (
              <button
                key={cat.name}
                onClick={() => { setCategory(cat.name); setCategoryEmoji(cat.emoji); }}
                className={cn(
                  "flex flex-col items-center gap-1 p-2 rounded-2xl border transition-all",
                  category === cat.name
                    ? type === "income"
                      ? "border-green-500 bg-green-50"
                      : "border-rose-500 bg-rose-50"
                    : "border-slate-100 bg-slate-50 hover:border-slate-300"
                )}
              >
                <span className="text-xl">{cat.emoji}</span>
                <span className="text-[10px] font-medium text-slate-600 text-center leading-tight">
                  {cat.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Note + Date */}
        <div className="px-5 mb-3 flex gap-2">
          <input
            type="text"
            placeholder="หมายเหตุ (ถ้ามี)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="flex-1 text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-rose-400 placeholder:text-slate-400"
          />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-rose-400 text-slate-700"
          />
        </div>

        {/* Numpad */}
        <div className="px-5 mb-3">
          <div className="grid grid-cols-3 gap-2">
            {["7", "8", "9", "4", "5", "6", "1", "2", "3", ".", "0", "DEL"].map(
              (key) => (
                <button
                  key={key}
                  onClick={() => handleAmountKey(key)}
                  className={cn(
                    "py-3.5 rounded-2xl text-lg font-semibold transition-all active:scale-95",
                    key === "DEL"
                      ? "bg-slate-100 text-slate-600 text-base"
                      : "bg-slate-50 text-slate-800 hover:bg-slate-100"
                  )}
                >
                  {key === "DEL" ? "⌫" : key}
                </button>
              )
            )}
          </div>
        </div>

        {/* Save button */}
        <div className="px-5 pb-8">
          <button
            onClick={handleSave}
            disabled={!canSave}
            className={cn(
              "w-full py-4 rounded-2xl font-semibold text-white text-base transition-all",
              canSave
                ? type === "income"
                  ? "bg-green-600 active:scale-98 shadow-md shadow-green-200"
                  : "bg-rose-600 active:scale-98 shadow-md shadow-rose-200"
                : "bg-slate-300 cursor-not-allowed"
            )}
          >
            บันทึก
          </button>
        </div>
      </div>
    </>
  );
}
