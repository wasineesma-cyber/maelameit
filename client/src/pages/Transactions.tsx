import { useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import { formatCurrency } from "@/lib/currency";
import {
  deleteLocalTransaction,
  getLocalTransactions,
  type LocalTransaction,
} from "@/lib/localLedger";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import AddTransactionModal from "@/components/AddTransactionModal";
import { useAuth } from "@/_core/hooks/useAuth";

function createId() {
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function getOrCreateGuestId(): string {
  if (typeof window === "undefined") return "";
  const key = "mae_lamiet_guest_id";
  const existing = window.localStorage.getItem(key);
  if (existing) return existing;
  const next = `guest_${createId()}`;
  window.localStorage.setItem(key, next);
  return next;
}

export default function Transactions() {
  const { user, isAuthenticated } = useAuth();
  const lineUserId = isAuthenticated && user?.openId ? user.openId : getOrCreateGuestId();
  const isGuest = !isAuthenticated;
  const [showAdd, setShowAdd] = useState(false);
  const [filter, setFilter] = useState<"all" | "income" | "expense">("all");

  const [localTxns, setLocalTxns] = useState<LocalTransaction[]>(() => getLocalTransactions(lineUserId));

  const displayedLocalTxns = useMemo(() => {
    const filtered = filter === "all" ? localTxns : localTxns.filter((t) => t.type === filter);
    return filtered;
  }, [filter, localTxns]);

  const { data: transactions, refetch } = trpc.transactions.list.useQuery(
    { lineUserId, limit: 50, type: filter === "all" ? undefined : filter },
    { enabled: isAuthenticated && !!lineUserId }
  );

  const { data: categories } = trpc.categories.list.useQuery(
    { lineUserId },
    { enabled: isAuthenticated && !!lineUserId }
  );

  const deleteMutation = trpc.transactions.delete.useMutation({
    onSuccess: () => { toast.success("ลบสำเร็จ"); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  function getCategoryName(id: number | null | undefined) {
    if (!id || !categories) return "อื่นๆ";
    return categories.find((c) => c.id === id)?.name ?? "อื่นๆ";
  }

  function getCategoryIcon(id: number | null | undefined) {
    if (!id || !categories) return "📦";
    return categories.find((c) => c.id === id)?.icon ?? "📦";
  }

  if (isGuest) {
    return (
      <div className="min-h-screen bg-background">
        <div className="bg-white border-b sticky top-0 z-10">
          <div className="container flex items-center gap-3 h-14 max-w-2xl mx-auto">
            <Link href="/chat">
              <Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4" /></Button>
            </Link>
            <h1 className="font-bold text-foreground flex-1">รายการทั้งหมด</h1>
            <Link href="/chat">
              <Button size="sm" className="bg-neutral-900 hover:bg-neutral-800">
                <Plus className="w-4 h-4 mr-1" />บันทึก
              </Button>
            </Link>
          </div>
        </div>

        <div className="container py-4 space-y-4 max-w-2xl mx-auto">
          <div className="flex gap-2">
            {(["all", "income", "expense"] as const).map((f) => (
              <Button
                key={f}
                size="sm"
                variant={filter === f ? "default" : "outline"}
                onClick={() => setFilter(f)}
                className={filter === f ? "bg-neutral-900 hover:bg-neutral-800" : ""}
              >
                {f === "all" ? "ทั้งหมด" : f === "income" ? "💰 รายรับ" : "💸 รายจ่าย"}
              </Button>
            ))}
          </div>

          <Card className="border border-border shadow-sm">
            <CardContent className="p-0">
              {displayedLocalTxns.length > 0 ? (
                <div className="divide-y divide-border">
                  {displayedLocalTxns.map((t) => (
                    <div key={t.id} className="flex items-center gap-3 p-4 hover:bg-secondary/30 transition-colors">
                      <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-lg flex-shrink-0">
                        📦
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate text-foreground">{t.description || "ไม่ระบุ"}</div>
                        <div className="text-xs text-muted-foreground">
                          ไม่ระบุหมวด · {new Date(t.transactionDate).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "2-digit" })}
                        </div>
                      </div>
                      <div className="font-semibold text-sm flex-shrink-0 text-foreground">
                        {t.type === "income" ? "+" : "-"}฿{formatCurrency(t.amount)}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground hover:text-foreground p-1 h-8 w-8"
                        onClick={() => {
                          const next = deleteLocalTransaction(lineUserId, t.id);
                          setLocalTxns(next);
                          toast.success("ลบสำเร็จ");
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-muted-foreground">
                  <div className="text-3xl mb-3">📋</div>
                  <p className="mb-3 text-sm">ยังไม่มีรายการ</p>
                  <Link href="/chat">
                    <Button size="sm" className="bg-neutral-900 hover:bg-neutral-800">+ บันทึกรายการแรก</Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="container flex items-center gap-3 h-14 max-w-2xl mx-auto">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4" /></Button>
          </Link>
          <h1 className="font-bold text-foreground flex-1">รายการทั้งหมด</h1>
          <Button size="sm" onClick={() => setShowAdd(true)} className="bg-primary hover:bg-primary/90">
            <Plus className="w-4 h-4 mr-1" />บันทึก
          </Button>
        </div>
      </div>

      <div className="container py-4 space-y-4 max-w-2xl mx-auto">
        {/* Filter */}
        <div className="flex gap-2">
          {(["all", "income", "expense"] as const).map((f) => (
            <Button
              key={f}
              size="sm"
              variant={filter === f ? "default" : "outline"}
              onClick={() => setFilter(f)}
              className={filter === f ? "bg-primary hover:bg-primary/90" : ""}
            >
              {f === "all" ? "ทั้งหมด" : f === "income" ? "💰 รายรับ" : "💸 รายจ่าย"}
            </Button>
          ))}
        </div>

        {/* List */}
        <Card className="border border-border shadow-sm">
          <CardContent className="p-0">
            {transactions && transactions.length > 0 ? (
              <div className="divide-y divide-border">
                {transactions.map((t) => (
                  <div key={t.id} className="flex items-center gap-3 p-4 hover:bg-secondary/30 transition-colors">
                    <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-lg flex-shrink-0">
                      {getCategoryIcon(t.categoryId)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate text-foreground">{t.description || "ไม่ระบุ"}</div>
                      <div className="text-xs text-muted-foreground">
                        {getCategoryName(t.categoryId)} · {new Date(t.transactionDate).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "2-digit" })}
                      </div>
                    </div>
                    <div className={`font-bold text-sm flex-shrink-0 ${t.type === "income" ? "text-emerald-600" : "text-rose-600"}`}>
                      {t.type === "income" ? "+" : "-"}฿{formatCurrency(parseFloat(t.amount))}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground hover:text-red-500 p-1 h-8 w-8"
                      onClick={() => deleteMutation.mutate({ id: t.id, lineUserId })}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-muted-foreground">
                <div className="text-3xl mb-3">📋</div>
                <p className="mb-3 text-sm">ยังไม่มีรายการ</p>
                <Button size="sm" onClick={() => setShowAdd(true)} className="bg-primary hover:bg-primary/90">+ บันทึกรายการแรก</Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {showAdd && (
        <AddTransactionModal
          lineUserId={lineUserId}
          categories={categories ?? []}
          onClose={() => setShowAdd(false)}
          onSuccess={() => { refetch(); setShowAdd(false); }}
        />
      )}
    </div>
  );
}
