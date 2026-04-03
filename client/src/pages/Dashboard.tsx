import { useEffect, useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import { formatCurrency } from "@/lib/currency";
import { getLocalTransactions, type LocalTransaction } from "@/lib/localLedger";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  BarChart3,
  List,
  Plus,
  Settings,
  Star,
  TrendingUp,
  Wallet,
  LogIn,
  LogOut,
  Zap,
  MessageCircle,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { toast } from "sonner";
import AddTransactionModal from "@/components/AddTransactionModal";
import QuickEntryChat from "@/components/QuickEntryChat";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";

const LOGO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663425811189/oKpYsJiu26CapzFcKkAmom/logo-v2-square-MaCyTTeZrgjEEhYjASR82X.webp";
const DEMO_USER_ID = "DEMO_MODE";

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

export default function Dashboard() {
  const { user, isAuthenticated, loading: authLoading, logout } = useAuth();
  const [showAdd, setShowAdd] = useState(false);
  const [showQuickEntry, setShowQuickEntry] = useState(false);
  const [isDemo, setIsDemo] = useState(false);

  const guestId = useMemo(() => (isAuthenticated ? "" : getOrCreateGuestId()), [isAuthenticated]);
  const [localTxns, setLocalTxns] = useState<LocalTransaction[]>(() => getLocalTransactions(guestId));

  useEffect(() => {
    if (isAuthenticated) return;
    const update = () => setLocalTxns(getLocalTransactions(guestId));
    update();
    window.addEventListener("focus", update);
    document.addEventListener("visibilitychange", update);
    return () => {
      window.removeEventListener("focus", update);
      document.removeEventListener("visibilitychange", update);
    };
  }, [guestId, isAuthenticated]);

  // lineUserId: ถ้า login ด้วย Manus ใช้ user.openId, ถ้า demo ใช้ DEMO_USER_ID
  const lineUserId = isDemo ? DEMO_USER_ID : (user?.openId ?? "");
  const isLoggedIn = isAuthenticated && !isDemo;

  const { data: summary, refetch: refetchSummary } = trpc.analytics.summary.useQuery(
    { lineUserId, period: "month" },
    { enabled: (isLoggedIn || isDemo) && !!lineUserId }
  );

  const { data: monthly } = trpc.analytics.monthly.useQuery(
    { lineUserId, months: 6 },
    { enabled: (isLoggedIn || isDemo) && !!lineUserId }
  );

  const { data: transactions, refetch: refetchTxns } = trpc.transactions.list.useQuery(
    { lineUserId, limit: 5 },
    { enabled: (isLoggedIn || isDemo) && !!lineUserId }
  );

  const { data: categories } = trpc.categories.list.useQuery(
    { lineUserId },
    { enabled: (isLoggedIn || isDemo) && !!lineUserId }
  );

  // Seed default categories เมื่อ login ครั้งแรก
  const seedCategories = trpc.categories.seed.useMutation();
  useEffect(() => {
    if (isLoggedIn && lineUserId && categories !== undefined && categories.length === 0) {
      seedCategories.mutate({ lineUserId });
    }
  }, [isLoggedIn, lineUserId, categories]);

  const { data: subscription } = trpc.payment.getSubscription.useQuery(undefined, {
    enabled: isLoggedIn,
  });
  const isPro = isDemo ? true : subscription?.plan === "pro";
  const income = isDemo ? 25000 : (summary?.summary?.income ?? 0);
  const expense = isDemo ? 8450 : (summary?.summary?.expense ?? 0);
  const balance = income - expense;

  const demoMonthly = [
    { month: "ต.ค.", income: 22000, expense: 7200 },
    { month: "พ.ย.", income: 23500, expense: 8100 },
    { month: "ม.ค.", income: 21000, expense: 6900 },
    { month: "ก.พ.", income: 24000, expense: 9200 },
    { month: "มี.ค.", income: 22500, expense: 7800 },
    { month: "เม.ย.", income: 25000, expense: 8450 },
  ];

  const demoTransactions = [
    { id: 1, type: "expense", amount: "120", description: "Grab ไปทำงาน", categoryId: null, icon: "🚗" },
    { id: 2, type: "expense", amount: "85", description: "ข้าวกลางวัน", categoryId: null, icon: "🍜" },
    { id: 3, type: "income", amount: "25000", description: "เงินเดือน", categoryId: null, icon: "💰" },
    { id: 4, type: "expense", amount: "320", description: "Starbucks กาแฟเช้า", categoryId: null, icon: "☕" },
    { id: 5, type: "expense", amount: "1200", description: "ค่าไฟเดือนนี้", categoryId: null, icon: "⚡" },
  ];

  function getCategoryIcon(categoryId: number | null | undefined): string {
    if (!categoryId || !categories) return "📦";
    const cat = categories.find((c) => c.id === categoryId);
    return cat?.icon ?? "📦";
  }

  // ---- Login Screen ----
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-3">
          <img src={LOGO_URL} alt="Mae Lamiet" className="w-16 h-16 rounded-2xl object-cover mx-auto shadow-lg" />
          <div className="text-muted-foreground text-sm animate-pulse">กำลังโหลด...</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated && !isDemo) {
    const now = new Date();
    const monthName = now.toLocaleDateString("th-TH", { month: "long", year: "numeric" });
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const monthTxns = localTxns.filter((t) => {
      const d = new Date(t.transactionDate);
      return d >= startOfMonth && d <= endOfMonth;
    });
    const income = monthTxns.filter((t) => t.type === "income").reduce((sum, t) => sum + (t.amount || 0), 0);
    const expense = monthTxns.filter((t) => t.type === "expense").reduce((sum, t) => sum + (t.amount || 0), 0);
    const balance = income - expense;

    return (
      <div className="min-h-screen bg-background">
        <div className="bg-white border-b sticky top-0 z-10">
          <div className="container flex items-center justify-between h-14 max-w-2xl mx-auto">
            <div className="flex items-center gap-2.5">
              <img src={LOGO_URL} alt="Mae Lamiet" className="w-8 h-8 rounded-xl object-cover" />
              <span className="font-semibold text-foreground">แม่ละเมียด</span>
              <Badge variant="secondary" className="text-xs">Local</Badge>
            </div>
            <Button
              size="sm"
              variant="ghost"
              className="text-xs text-muted-foreground gap-1.5"
              onClick={() => {
                window.location.href = getLoginUrl();
              }}
            >
              <LogIn className="w-3.5 h-3.5" />
              เข้าสู่ระบบ
            </Button>
          </div>
        </div>

        <div className="container py-5 space-y-4 max-w-2xl mx-auto">
          <Card className="border border-border shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-muted-foreground text-xs font-medium mb-0.5">สรุปเดือน</p>
                  <p className="text-foreground font-semibold text-sm">{monthName}</p>
                </div>
                <Link href="/chat">
                  <Button size="sm" className="bg-neutral-900 hover:bg-neutral-800 shadow-sm">
                    <MessageCircle className="w-4 h-4 mr-1.5" />
                    จดในแชต
                  </Button>
                </Link>
              </div>

              <div className="text-center mb-4">
                <p className="text-muted-foreground text-xs mb-1">คงเหลือ</p>
                <div className="text-3xl font-bold text-foreground">
                  {balance >= 0 ? "+" : "-"}฿{formatCurrency(Math.abs(balance))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-secondary/40 rounded-2xl p-3.5 text-center">
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <ArrowUpCircle className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground text-xs">รายรับ</span>
                  </div>
                  <div className="text-lg font-bold text-foreground">฿{formatCurrency(income)}</div>
                </div>
                <div className="bg-secondary/40 rounded-2xl p-3.5 text-center">
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <ArrowDownCircle className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground text-xs">รายจ่าย</span>
                  </div>
                  <div className="text-lg font-bold text-foreground">฿{formatCurrency(expense)}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-3">
            <Link href="/transactions">
              <Button variant="outline" className="h-12 rounded-2xl border-border justify-center gap-2">
                <List className="w-4 h-4" />
                ดูรายการ
              </Button>
            </Link>
            <Button
              variant="outline"
              className="h-12 rounded-2xl border-border justify-center gap-2"
              onClick={() => setIsDemo(true)}
            >
              👀 ดูตัวอย่าง
            </Button>
          </div>

          <Card className="border border-border shadow-sm">
            <CardContent className="p-0">
              <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                <div className="text-sm font-semibold text-foreground">รายการล่าสุด</div>
                <Link href="/transactions">
                  <Button variant="ghost" size="sm" className="text-xs text-muted-foreground">
                    ดูทั้งหมด →
                  </Button>
                </Link>
              </div>

              {localTxns.length > 0 ? (
                <div className="divide-y divide-border">
                  {localTxns.slice(0, 5).map((t) => (
                    <div key={t.id} className="flex items-center gap-3 px-4 py-3">
                      <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center text-lg">📦</div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-foreground truncate">{t.description || "ไม่ระบุ"}</div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(t.transactionDate).toLocaleDateString("th-TH", { day: "numeric", month: "short" })}
                        </div>
                      </div>
                      <div className="text-sm font-semibold text-foreground flex-shrink-0">
                        {t.type === "income" ? "+" : "-"}฿{formatCurrency(t.amount)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-10 text-center text-muted-foreground">
                  <div className="text-3xl mb-2">📝</div>
                  <div className="text-sm">เริ่มจดรายรับรายจ่ายได้เลย</div>
                  <div className="text-xs mt-1">ข้อมูลจะถูกเก็บในเครื่องของคุณ</div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ---- Main Dashboard ----
  const chartData = isDemo ? demoMonthly : (monthly ?? []);
  const txList = isDemo ? demoTransactions : (transactions ?? []);
  const now = new Date();
  const monthName = now.toLocaleDateString("th-TH", { month: "long", year: "numeric" });

  return (
    <div className="min-h-screen bg-background">
      {/* Demo Mode Banner */}
      {isDemo && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center justify-between">
          <span className="text-amber-800 text-sm font-medium">
            👀 โหมดทดลอง — ข้อมูลเป็นตัวอย่าง ไม่มีการบันทึกข้อมูลจริง
          </span>
          <Button size="sm" variant="outline" className="text-xs h-7 border-amber-300 text-amber-700 hover:bg-amber-100" onClick={() => setIsDemo(false)}>
            ออก
          </Button>
        </div>
      )}

      {/* Top Nav */}
      <div className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="container flex items-center justify-between h-14 max-w-2xl mx-auto">
          <div className="flex items-center gap-2.5">
            <img src={LOGO_URL} alt="Mae Lamiet" className="w-8 h-8 rounded-xl object-cover" />
            <span className="font-bold text-foreground">แม่ละเมียด</span>
            {isPro && <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-xs">⭐ Pro</Badge>}
          </div>
          <div className="flex items-center gap-2">
            {isAuthenticated && !isDemo && (
              <Button
                size="sm"
                variant="ghost"
                className="text-xs text-muted-foreground gap-1.5"
                onClick={logout}
              >
                <LogOut className="w-3.5 h-3.5" />
                ออก
              </Button>
            )}
            <Button size="sm" onClick={() => setShowAdd(true)} className="gap-1.5 bg-primary hover:bg-primary/90 shadow-sm">
              <Plus className="w-4 h-4" />
              บันทึก
            </Button>
          </div>
        </div>
      </div>

      <div className="container py-5 space-y-4 max-w-2xl mx-auto">

        {/* ── Hero Summary Card ── */}
        <Card className="border-0 overflow-hidden shadow-md" style={{background: "linear-gradient(135deg, oklch(0.18 0 0) 0%, oklch(0.28 0 0) 100%)"}}>
          <CardContent className="p-5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-white/70 text-xs font-medium mb-0.5">สรุปเดือน</p>
                <p className="text-white font-semibold text-sm">{monthName}</p>
              </div>
              <div className="bg-white/20 rounded-xl px-3 py-1.5">
                <span className="text-white text-xs font-medium">เดือนนี้</span>
              </div>
            </div>

            {/* Balance - ใหญ่ชัดเจน */}
            <div className="text-center mb-5">
              <p className="text-white/70 text-xs mb-1">คงเหลือ</p>
              <div className={`text-4xl font-bold ${balance >= 0 ? "text-white" : "text-red-200"}`}>
                {balance >= 0 ? "+" : ""}฿{formatCurrency(Math.abs(balance))}
              </div>
            </div>

            {/* Income / Expense row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/15 rounded-2xl p-3.5 text-center">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <ArrowUpCircle className="w-3.5 h-3.5 text-emerald-300" />
                  <span className="text-white/70 text-xs">รายรับ</span>
                </div>
                <div className="text-xl font-bold text-emerald-300">฿{formatCurrency(income)}</div>
              </div>
              <div className="bg-white/15 rounded-2xl p-3.5 text-center">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <ArrowDownCircle className="w-3.5 h-3.5 text-rose-300" />
                  <span className="text-white/70 text-xs">รายจ่าย</span>
                </div>
                <div className="text-xl font-bold text-rose-300">฿{formatCurrency(expense)}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Quick Entry Chat (AI จดด่วน) ── */}
        {(isLoggedIn || isDemo) && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold text-foreground">จดด่วน AI</span>
                {isPro && <Badge className="text-xs bg-amber-100 text-amber-700 border-amber-200">Pro</Badge>}
              </div>
              {!isPro && !isDemo && (
                <Link href="/upgrade">
                  <Button variant="ghost" size="sm" className="text-xs text-primary h-6">อัพเกรด</Button>
                </Link>
              )}
            </div>
            {isPro || isDemo ? (
              <QuickEntryChat
                lineUserId={lineUserId}
                categories={categories ?? []}
                onSuccess={() => { refetchSummary(); refetchTxns(); }}
              />
            ) : (
              <Card className="border border-dashed border-primary/30 bg-primary/5">
                <CardContent className="p-4 text-center">
                  <p className="text-sm text-muted-foreground mb-2">ฟีเจอร์ Pro — พิมพ์ "ข้าว 80 grab 120" AI บันทึกให้เลย</p>
                  <Link href="/upgrade">
                    <Button size="sm" className="bg-primary hover:bg-primary/90 gap-1.5">
                      <Star className="w-3.5 h-3.5" />
                      อัพเกรดเป็น Pro
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* ── Chart ── */}
        {chartData.length > 0 && (
          <Card className="border border-border shadow-sm">
            <CardContent className="pt-4 px-2 pb-3">
              <div className="flex items-center gap-2 px-2 mb-3">
                <TrendingUp className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold text-foreground">รายรับ-รายจ่าย 6 เดือน</span>
              </div>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={chartData} margin={{ top: 0, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.01 80)" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip
                    formatter={(v: number) => [`฿${v.toLocaleString()}`, ""]}
                    contentStyle={{ borderRadius: "12px", border: "1px solid oklch(0.90 0.01 80)", fontSize: "12px" }}
                  />
                  <Bar dataKey="income" name="รายรับ" fill="oklch(0.52 0.09 162)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expense" name="รายจ่าย" fill="oklch(0.72 0.12 10)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* ── Recent Transactions ── */}
        <Card className="border border-border shadow-sm">
          <CardContent className="pt-4 px-4 pb-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <List className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold text-foreground">รายการล่าสุด</span>
              </div>
              <Link href="/transactions">
                <Button variant="ghost" size="sm" className="text-xs text-primary hover:text-primary/80 h-7">ดูทั้งหมด</Button>
              </Link>
            </div>
            <div className="space-y-2">
              {txList.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <div className="text-3xl mb-2">📝</div>
                  <p className="text-sm">ยังไม่มีรายการ</p>
                  <p className="text-xs mt-1">กดปุ่ม "บันทึก" หรือใช้ช่องจดด่วนด้านบน</p>
                </div>
              ) : (
                txList.map((tx: any) => (
                  <div key={tx.id} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/40 hover:bg-secondary/70 transition-colors">
                    <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center text-lg shadow-sm border border-border flex-shrink-0">
                      {isDemo ? tx.icon : getCategoryIcon(tx.categoryId)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-foreground truncate">{tx.description || "ไม่ระบุ"}</div>
                      {!isDemo && tx.transactionDate && (
                        <div className="text-xs text-muted-foreground">
                          {new Date(tx.transactionDate).toLocaleDateString("th-TH", { day: "numeric", month: "short" })}
                        </div>
                      )}
                    </div>
                    <div className={`text-sm font-bold flex-shrink-0 ${tx.type === "income" ? "text-emerald-600" : "text-rose-600"}`}>
                      {tx.type === "income" ? "+" : "-"}฿{Number(tx.amount).toLocaleString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* ── Quick Actions ── */}
        <div className="grid grid-cols-5 gap-2">
          {[
            { icon: <MessageCircle className="w-5 h-5" />, label: "แชท", href: "/chat", color: "text-primary" },
            { icon: <BarChart3 className="w-5 h-5" />, label: "วิเคราะห์", href: "/analytics", color: "text-primary" },
            { icon: <List className="w-5 h-5" />, label: "รายการ", href: "/transactions", color: "text-foreground" },
            { icon: <Star className="w-5 h-5" />, label: "Pro", href: "/upgrade", color: "text-amber-600" },
            { icon: <Settings className="w-5 h-5" />, label: "ตั้งค่า", href: "/settings", color: "text-muted-foreground" },
          ].map((item, i) => (
            <Link key={i} href={item.href}>
              <div className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-white border border-border hover:border-primary/30 hover:bg-primary/5 transition-all cursor-pointer shadow-sm">
                <div className={item.color}>{item.icon}</div>
                <span className="text-xs text-muted-foreground font-medium">{item.label}</span>
              </div>
            </Link>
          ))}
        </div>

        {/* ── Upgrade Banner (Free users) ── */}
        {!isPro && !isDemo && isLoggedIn && (
          <Card className="border-0 overflow-hidden shadow-md" style={{background: "linear-gradient(135deg, oklch(0.18 0 0) 0%, oklch(0.28 0 0) 100%)"}}>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <div className="text-white font-semibold text-sm">อัพเกรดเป็น Pro ⭐</div>
                <div className="text-white/70 text-xs mt-0.5">วิเคราะห์เชิงลึก + จดด่วน AI เริ่มต้น ฿59/เดือน</div>
              </div>
              <Link href="/upgrade">
                <Button size="sm" className="bg-white text-primary hover:bg-white/90 font-semibold shadow-sm text-xs">
                  ดูแพ็กเกจ
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Add Transaction Modal */}
      {showAdd && (
        <AddTransactionModal
          lineUserId={lineUserId}
          categories={categories ?? []}
          onClose={() => setShowAdd(false)}
          onSuccess={() => {
            refetchSummary();
            refetchTxns();
            setShowAdd(false);
          }}
        />
      )}
    </div>
  );
}
