import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Category {
  id: number;
  name: string;
  icon: string | null;
  color: string | null;
  type: string | null;
}

interface Props {
  lineUserId: string;
  categories: Category[];
  onClose: () => void;
  onSuccess: () => void;
}

// ปุ่มจำนวนเงินด่วน
const QUICK_AMOUNTS = [30, 50, 65, 100, 200, 500, 1000];

export default function AddTransactionModal({ lineUserId, categories, onClose, onSuccess }: Props) {
  const [type, setType] = useState<"income" | "expense">("expense");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);

  const createMutation = trpc.transactions.create.useMutation({
    onSuccess: () => {
      toast.success("✅ บันทึกสำเร็จ!");
      onSuccess();
    },
    onError: (err) => toast.error(err.message),
  });

  function handleSubmit() {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return toast.error("กรุณากรอกจำนวนเงิน");
    createMutation.mutate({
      lineUserId,
      type,
      amount: amt,
      description: description || undefined,
      categoryId: selectedCategoryId ?? undefined,
      tags: tags || undefined,
      source: "web",
    });
  }

  function handleQuickAmount(val: number) {
    setAmount(val.toString());
  }

  const filteredCategories = categories.filter(
    (c) => c.type === type || c.type === "both" || !c.type
  );

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-sm max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="px-4 pt-4 pb-2">
          <DialogTitle className="text-center">บันทึกรายการ</DialogTitle>
        </DialogHeader>

        <div className="px-4 pb-4 space-y-4">
          {/* Type Toggle */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => { setType("expense"); setSelectedCategoryId(null); }}
              className={cn(
                "py-2.5 rounded-xl font-semibold text-sm transition-all",
                type === "expense"
                  ? "bg-red-500 text-white shadow-md"
                  : "bg-gray-100 text-gray-600"
              )}
            >
              💸 รายจ่าย
            </button>
            <button
              onClick={() => { setType("income"); setSelectedCategoryId(null); }}
              className={cn(
                "py-2.5 rounded-xl font-semibold text-sm transition-all",
                type === "income"
                  ? "bg-green-500 text-white shadow-md"
                  : "bg-gray-100 text-gray-600"
              )}
            >
              💰 รายรับ
            </button>
          </div>

          {/* Amount Display */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-2">
              <span className="text-2xl font-bold text-gray-500">฿</span>
              <input
                type="number"
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="text-4xl font-bold w-40 text-center border-none outline-none bg-transparent text-foreground"
              />
            </div>
            <div className="h-px bg-gray-200 mx-4 mt-1" />
          </div>

          {/* Quick Amount Buttons */}
          <div className="flex flex-wrap gap-2 justify-center">
            {QUICK_AMOUNTS.map((val) => (
              <button
                key={val}
                onClick={() => handleQuickAmount(val)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-sm font-medium border transition-all",
                  amount === val.toString()
                    ? "bg-primary text-white border-primary"
                    : "bg-white text-gray-700 border-gray-200 hover:border-primary hover:text-primary"
                )}
              >
                {val.toLocaleString()}
              </button>
            ))}
          </div>

          {/* Category Grid */}
          <div>
            <p className="text-sm font-semibold text-gray-500 mb-2">🗂️ หมวดหมู่</p>
            <div className="grid grid-cols-4 gap-2 max-h-52 overflow-y-auto">
              {filteredCategories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCategoryId(c.id === selectedCategoryId ? null : c.id)}
                  className={cn(
                    "flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all text-center",
                    selectedCategoryId === c.id
                      ? "border-primary bg-primary/10 shadow-sm"
                      : "border-gray-100 bg-white hover:border-gray-300"
                  )}
                >
                  <span className="text-2xl">{c.icon || "📦"}</span>
                  <span className="text-[10px] text-gray-600 leading-tight line-clamp-2">{c.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Note */}
          <div>
            <Input
              placeholder="💬 หมายเหตุ เช่น อาหารกลางวัน, ค่าโอน (ไม่บังคับ)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="rounded-xl bg-gray-50 border-gray-200"
            />
          </div>

          {/* Tags */}
          <div>
            <Input
              placeholder="#แท็ก เช่น #ลูกค้า #grabfood"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="rounded-xl bg-gray-50 border-gray-200"
            />
          </div>

          {/* Submit */}
          <Button
            onClick={handleSubmit}
            disabled={createMutation.isPending}
            className={cn(
              "w-full py-3 rounded-xl font-semibold text-base",
              type === "expense"
                ? "bg-red-500 hover:bg-red-600"
                : "bg-green-500 hover:bg-green-600"
            )}
          >
            {createMutation.isPending ? "กำลังบันทึก..." : `✅ บันทึก${type === "expense" ? "รายจ่าย" : "รายรับ"}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
