import { useState } from "react";
import {
  ChevronRight,
  User,
  Tag,
  Download,
  Info,
  LogOut,
  Trash2,
  X,
  Check,
} from "lucide-react";
import type { Transaction } from "@shared/types";

interface Props {
  transactions: Transaction[];
  onClearAll: () => void;
}

interface MenuItem {
  icon: React.ReactNode;
  label: string;
  desc?: string;
  action: () => void;
  danger?: boolean;
}

interface MenuGroup {
  title: string;
  items: MenuItem[];
}

function MenuRow({ item }: { item: MenuItem }) {
  return (
    <button
      onClick={item.action}
      className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-slate-50 active:bg-slate-100 transition-colors"
    >
      <div
        className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
          item.danger ? "bg-rose-50 text-rose-500" : "bg-slate-100 text-slate-600"
        }`}
      >
        {item.icon}
      </div>
      <div className="flex-1 text-left min-w-0">
        <p
          className={`text-sm font-medium ${item.danger ? "text-rose-600" : "text-slate-800"}`}
        >
          {item.label}
        </p>
        {item.desc && (
          <p className="text-xs text-slate-400 truncate">{item.desc}</p>
        )}
      </div>
      <ChevronRight size={16} className="text-slate-300 flex-shrink-0" />
    </button>
  );
}

// Simple confirm dialog
function ConfirmDialog({
  message,
  onConfirm,
  onCancel,
}: {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-50" onClick={onCancel} />
      <div className="fixed inset-x-6 top-1/2 -translate-y-1/2 z-50 bg-white rounded-3xl p-6 shadow-2xl max-w-sm mx-auto">
        <h3 className="font-semibold text-slate-800 text-center mb-2">ยืนยัน</h3>
        <p className="text-sm text-slate-500 text-center mb-6">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-2xl border border-slate-200 text-sm font-medium text-slate-600"
          >
            ยกเลิก
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 rounded-2xl bg-rose-600 text-white text-sm font-medium"
          >
            ยืนยัน
          </button>
        </div>
      </div>
    </>
  );
}

// About sheet
function AboutSheet({ onClose }: { onClose: () => void }) {
  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-50" onClick={onClose} />
      <div className="fixed inset-x-0 bottom-0 max-w-md mx-auto bg-white rounded-t-3xl z-50 p-6 pb-10 shadow-2xl slide-up">
        <div className="flex justify-center mb-4">
          <div className="w-10 h-1 rounded-full bg-slate-200" />
        </div>
        <div className="text-center">
          <div className="text-5xl mb-3">🌸</div>
          <h2 className="text-xl font-bold text-slate-900 mb-1">แม่ละเมียด</h2>
          <p className="text-xs text-slate-400 mb-4">v1.0.0</p>
          <p className="text-sm text-slate-600 leading-relaxed">
            แอปจดรายรับรายจ่าย ง่ายๆ เร็วๆ ไม่ปวดหัว
            <br />
            ข้อมูลเก็บในเครื่องคุณเท่านั้น 🔒
          </p>
        </div>
        <button
          onClick={onClose}
          className="mt-6 w-full py-3 rounded-2xl bg-slate-100 text-slate-700 text-sm font-medium"
        >
          ปิด
        </button>
      </div>
    </>
  );
}

export function Settings({ transactions, onClearAll }: Props) {
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [exportDone, setExportDone] = useState(false);

  const handleExport = () => {
    const json = JSON.stringify(transactions, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `maelameit-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setExportDone(true);
    setTimeout(() => setExportDone(false), 2000);
  };

  const handleClear = () => {
    onClearAll();
    setShowConfirmClear(false);
  };

  const totalTx = transactions.length;
  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + t.amount, 0);

  const groups: MenuGroup[] = [
    {
      title: "รายการ",
      items: [
        {
          icon: <Download size={16} />,
          label: "ส่งออกข้อมูล",
          desc: "บันทึกเป็นไฟล์ JSON",
          action: handleExport,
        },
        {
          icon: <Trash2 size={16} />,
          label: "ล้างข้อมูลทั้งหมด",
          desc: "ลบรายการทุกรายการออก",
          action: () => setShowConfirmClear(true),
          danger: true,
        },
      ],
    },
    {
      title: "อื่นๆ",
      items: [
        {
          icon: <Info size={16} />,
          label: "เกี่ยวกับแอป",
          desc: "แม่ละเมียด v1.0.0",
          action: () => setShowAbout(true),
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 pb-8">
      {/* Header */}
      <div className="bg-white px-5 pt-12 pb-5 border-b border-slate-100">
        <h1 className="text-xl font-bold text-slate-900">ตั้งค่า</h1>
        <p className="text-xs text-slate-400 mt-0.5">จัดการข้อมูลและแอป</p>
      </div>

      {/* Stats card */}
      <div className="mx-5 mt-5">
        <div className="bg-white rounded-3xl p-5">
          <p className="text-xs font-medium text-slate-500 mb-3">สรุปข้อมูลของคุณ</p>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-lg font-bold text-slate-800">{totalTx}</p>
              <p className="text-[11px] text-slate-400">รายการ</p>
            </div>
            <div>
              <p className="text-lg font-bold text-green-600">
                ฿{totalIncome >= 1000
                  ? `${(totalIncome / 1000).toFixed(1)}K`
                  : totalIncome.toFixed(0)}
              </p>
              <p className="text-[11px] text-slate-400">รายรับรวม</p>
            </div>
            <div>
              <p className="text-lg font-bold text-rose-600">
                ฿{totalExpense >= 1000
                  ? `${(totalExpense / 1000).toFixed(1)}K`
                  : totalExpense.toFixed(0)}
              </p>
              <p className="text-[11px] text-slate-400">รายจ่ายรวม</p>
            </div>
          </div>
        </div>
      </div>

      {/* Menu groups */}
      <div className="px-5 mt-4 space-y-4">
        {groups.map((group) => (
          <div key={group.title}>
            <p className="text-xs font-semibold text-slate-500 px-1 mb-2">
              {group.title}
            </p>
            <div className="bg-white rounded-3xl overflow-hidden divide-y divide-slate-50">
              {group.items.map((item) => (
                <MenuRow key={item.label} item={item} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Export success toast */}
      {exportDone && (
        <div className="fixed bottom-28 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs font-medium px-4 py-2.5 rounded-full flex items-center gap-2 shadow-lg z-50 fade-in">
          <Check size={14} className="text-green-400" />
          ส่งออกสำเร็จ
        </div>
      )}

      {/* Dialogs */}
      {showConfirmClear && (
        <ConfirmDialog
          message="รายการทั้งหมดจะถูกลบออก ไม่สามารถกู้คืนได้"
          onConfirm={handleClear}
          onCancel={() => setShowConfirmClear(false)}
        />
      )}
      {showAbout && <AboutSheet onClose={() => setShowAbout(false)} />}
    </div>
  );
}
