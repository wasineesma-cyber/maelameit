import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { formatCurrency } from "@/lib/currency";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { ArrowLeft, BarChart3, Lock, TrendingUp, Wallet, Tag, PieChart as PieIcon } from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { useAuth } from "@/_core/hooks/useAuth";

const PIE_COLORS = [
  "#10b981", "#f97316", "#8b5cf6", "#ef4444", "#3b82f6",
  "#ec4899", "#14b8a6", "#f59e0b", "#84cc16", "#6366f1",
];

const WALLET_COLORS = ["oklch(0.52 0.09 162)", "oklch(0.65 0.12 230)", "oklch(0.70 0.10 55)", "oklch(0.72 0.12 10)"];

export default function Analytics() {
  const { user, isAuthenticated } = useAuth();
  const lineUserId = user?.openId ?? "";
  const [period, setPeriod] = useState<"today" | "week" | "month">("month");

  const { data: analytics } = trpc.analytics.summary.useQuery(
    { lineUserId, period },
    { enabled: isAuthenticated && !!lineUserId }
  );

  const { data: monthly } = trpc.analytics.monthly.useQuery(
    { lineUserId, months: 6 },
    { enabled: isAuthenticated && !!lineUserId }
  );

  const { data: walletBreakdown } = trpc.analytics.walletBreakdown.useQuery(
    { lineUserId, period },
    { enabled: isAuthenticated && !!lineUserId }
  );

  const { data: topTags } = trpc.analytics.topTags.useQuery(
    { lineUserId, period, limit: 8 },
    { enabled: isAuthenticated && !!lineUserId }
  );

  const { data: categories } = trpc.categories.list.useQuery(
    { lineUserId },
    { enabled: isAuthenticated && !!lineUserId }
  );

  const { data: wallets } = trpc.wallets.list.useQuery(
    { lineUserId },
    { enabled: isAuthenticated && !!lineUserId }
  );

  const { data: subscription } = trpc.payment.getSubscription.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const isPro = subscription?.plan === "pro";

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">กรุณาเข้าสู่ระบบก่อน</p>
          <Link href="/dashboard"><Button>ไปที่ Dashboard</Button></Link>
        </div>
      </div>
    );
  }

  const byCategory = analytics?.byCategory ?? [];
  const expenseCategories = byCategory.filter((c) => c.type === "expense");
  const incomeCategories = byCategory.filter((c) => c.type === "income");

  function getCatName(id: number | null | undefined) {
    if (!id || !categories) return "อื่นๆ";
    return categories.find((c) => c.id === id)?.name ?? "อื่นๆ";
  }
  function getCatIcon(id: number | null | undefined) {
    if (!id || !categories) return "📦";
    return categories.find((c) => c.id === id)?.icon ?? "📦";
  }
  function getWalletName(id: number | null | undefined) {
    if (!id || !wallets) return "ไม่ระบุกระเป๋า";
    return wallets.find((w) => w.id === id)?.name ?? "ไม่ระบุกระเป๋า";
  }
  function getWalletIcon(id: number | null | undefined) {
    if (!id || !wallets) return "💰";
    return wallets.find((w) => w.id === id)?.icon ?? "💰";
  }

  // แปลง byCategory เป็น Pie data
  const expensePieData = expenseCategories.map((c) => ({
    name: getCatName(c.categoryId),
    icon: getCatIcon(c.categoryId),
    value: parseFloat(c.total),
  })).filter((d) => d.value > 0);

  const incomePieData = incomeCategories.map((c) => ({
    name: getCatName(c.categoryId),
    icon: getCatIcon(c.categoryId),
    value: parseFloat(c.total),
  })).filter((d) => d.value > 0);

  // Wallet breakdown data
  const walletData: Record<number | string, { name: string; icon: string; income: number; expense: number }> = {};
  for (const row of walletBreakdown ?? []) {
    const wid = row.walletId ?? 0;
    if (!walletData[wid]) {
      walletData[wid] = { name: getWalletName(row.walletId), icon: getWalletIcon(row.walletId), income: 0, expense: 0 };
    }
    if (row.type === "income") walletData[wid].income += parseFloat(row.total ?? "0");
    if (row.type === "expense") walletData[wid].expense += parseFloat(row.total ?? "0");
  }
  const walletChartData = Object.values(walletData);

  const periodLabel = period === "today" ? "วันนี้" : period === "week" ? "สัปดาห์นี้" : "เดือนนี้";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="container flex items-center gap-3 h-14 max-w-2xl mx-auto">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4" /></Button>
          </Link>
          <h1 className="font-bold text-foreground flex-1 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary" />
            วิเคราะห์การเงิน
          </h1>
          {isPro && <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-xs">⭐ Pro</Badge>}
        </div>
      </div>

      <div className="container py-4 space-y-4 max-w-2xl mx-auto">

        {/* Period Filter */}
        <div className="flex gap-2">
          {(["today", "week", "month"] as const).map((p) => (
            <Button
              key={p}
              size="sm"
              variant={period === p ? "default" : "outline"}
              onClick={() => setPeriod(p)}
              className={period === p ? "bg-primary hover:bg-primary/90" : ""}
            >
              {p === "today" ? "วันนี้" : p === "week" ? "สัปดาห์นี้" : "เดือนนี้"}
            </Button>
          ))}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="border border-emerald-100 bg-gradient-to-br from-emerald-50 to-green-50">
            <CardContent className="p-3 text-center">
              <div className="text-xs text-emerald-700 mb-1">รายรับ</div>
              <div className="font-bold text-emerald-700 text-sm">฿{formatCurrency(analytics?.summary?.income ?? 0)}</div>
            </CardContent>
          </Card>
          <Card className="border border-rose-100 bg-gradient-to-br from-rose-50 to-red-50">
            <CardContent className="p-3 text-center">
              <div className="text-xs text-rose-700 mb-1">รายจ่าย</div>
              <div className="font-bold text-rose-700 text-sm">฿{formatCurrency(analytics?.summary?.expense ?? 0)}</div>
            </CardContent>
          </Card>
          <Card className="border border-primary/20 bg-primary/5">
            <CardContent className="p-3 text-center">
              <div className="text-xs text-primary mb-1">คงเหลือ</div>
              <div className="font-bold text-primary text-sm">
                ฿{formatCurrency((analytics?.summary?.income ?? 0) - (analytics?.summary?.expense ?? 0))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pro Gate */}
        {!isPro ? (
          <Card className="border-dashed border-2 border-primary/30 bg-primary/5">
            <CardContent className="p-6 text-center">
              <Lock className="w-8 h-8 text-primary mx-auto mb-2" />
              <h3 className="font-semibold text-foreground mb-1">ฟีเจอร์ Pro Plan</h3>
              <p className="text-sm text-muted-foreground mb-4">
                อัพเกรดเพื่อดูกราฟกลม กราฟบาร์ แยกกระเป๋า และ Top Tags
              </p>
              <Link href="/upgrade">
                <Button size="sm" className="bg-primary hover:bg-primary/90">
                  อัพเกรด Pro ฿59/เดือน
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* ── กราฟกลม รายจ่าย ── */}
            {expensePieData.length > 0 && (
              <Card className="border border-border shadow-sm">
                <CardHeader className="pb-1 pt-4 px-4">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <PieIcon className="w-4 h-4 text-rose-500" />
                    รายจ่ายตามหมวดหมู่ ({periodLabel})
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-2 pb-4">
                  <div className="flex flex-col items-center gap-2">
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie
                          data={expensePieData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={85}
                          innerRadius={40}
                          paddingAngle={2}
                        >
                          {expensePieData.map((_, i) => (
                            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(v: number) => [`฿${formatCurrency(v)}`, ""]}
                          contentStyle={{ borderRadius: "12px", fontSize: "12px" }}
                        />
                        <Legend
                          formatter={(value) => <span style={{ fontSize: "11px" }}>{value}</span>}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    {/* Legend แบบ custom */}
                    <div className="w-full grid grid-cols-2 gap-1.5 px-2">
                      {expensePieData.slice(0, 8).map((d, i) => (
                        <div key={i} className="flex items-center gap-1.5 text-xs">
                          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                          <span className="truncate text-foreground">{d.icon} {d.name}</span>
                          <span className="ml-auto font-medium text-muted-foreground flex-shrink-0">฿{formatCurrency(d.value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* ── กราฟกลม รายรับ ── */}
            {incomePieData.length > 0 && (
              <Card className="border border-border shadow-sm">
                <CardHeader className="pb-1 pt-4 px-4">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <PieIcon className="w-4 h-4 text-emerald-500" />
                    รายรับตามหมวดหมู่ ({periodLabel})
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-2 pb-4">
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={incomePieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        innerRadius={35}
                        paddingAngle={2}
                      >
                        {incomePieData.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(v: number) => [`฿${formatCurrency(v)}`, ""]}
                        contentStyle={{ borderRadius: "12px", fontSize: "12px" }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="grid grid-cols-2 gap-1.5 px-2 mt-1">
                    {incomePieData.slice(0, 6).map((d, i) => (
                      <div key={i} className="flex items-center gap-1.5 text-xs">
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                        <span className="truncate text-foreground">{d.icon} {d.name}</span>
                        <span className="ml-auto font-medium text-muted-foreground flex-shrink-0">฿{formatCurrency(d.value)}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* ── กราฟบาร์ 6 เดือน ── */}
            {monthly && monthly.length > 0 && (
              <Card className="border border-border shadow-sm">
                <CardHeader className="pb-1 pt-4 px-4">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    แนวโน้ม 6 เดือน
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-2 pb-4">
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={monthly} margin={{ left: -20, right: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.01 80)" />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip
                        formatter={(v: number) => [`฿${formatCurrency(v)}`, ""]}
                        contentStyle={{ borderRadius: "12px", fontSize: "12px" }}
                      />
                      <Bar dataKey="income" name="รายรับ" fill="oklch(0.52 0.09 162)" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="expense" name="รายจ่าย" fill="oklch(0.72 0.12 10)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                  {/* Legend */}
                  <div className="flex items-center justify-center gap-4 mt-2">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <div className="w-3 h-3 rounded-sm" style={{ background: "oklch(0.52 0.09 162)" }} />
                      รายรับ
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <div className="w-3 h-3 rounded-sm" style={{ background: "oklch(0.72 0.12 10)" }} />
                      รายจ่าย
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* ── แยกกระเป๋า ── */}
            {walletChartData.length > 0 && (
              <Card className="border border-border shadow-sm">
                <CardHeader className="pb-1 pt-4 px-4">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-primary" />
                    ภาพรวมแยกกระเป๋า ({periodLabel})
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-2 pb-4">
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={walletChartData} margin={{ left: -20, right: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.01 80)" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip
                        formatter={(v: number) => [`฿${formatCurrency(v)}`, ""]}
                        contentStyle={{ borderRadius: "12px", fontSize: "12px" }}
                      />
                      <Bar dataKey="income" name="รายรับ" fill="oklch(0.52 0.09 162)" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="expense" name="รายจ่าย" fill="oklch(0.72 0.12 10)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                  {/* Wallet cards */}
                  <div className="mt-3 space-y-2 px-2">
                    {walletChartData.map((w, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/40">
                        <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center text-lg shadow-sm border border-border flex-shrink-0">
                          {w.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-foreground">{w.name}</div>
                          <div className="flex gap-3 mt-0.5">
                            <span className="text-xs text-emerald-600">+฿{formatCurrency(w.income)}</span>
                            <span className="text-xs text-rose-600">-฿{formatCurrency(w.expense)}</span>
                          </div>
                        </div>
                        <div className={`text-sm font-bold flex-shrink-0 ${w.income - w.expense >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                          ฿{formatCurrency(Math.abs(w.income - w.expense))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* ── Top Tags ── */}
            <Card className="border border-border shadow-sm">
              <CardHeader className="pb-1 pt-4 px-4">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Tag className="w-4 h-4 text-primary" />
                  Tag ที่ใช้บ่อย ({periodLabel})
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                {!topTags || topTags.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    <div className="text-3xl mb-2">🏷️</div>
                    <p className="text-sm">ยังไม่มี Tag</p>
                    <p className="text-xs mt-1">เพิ่ม tag ตอนบันทึกรายการ เช่น #กาแฟ #grab</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {topTags.map((t, i) => {
                      const maxCount = topTags[0]?.count ?? 1;
                      const pct = Math.round((t.count / maxCount) * 100);
                      return (
                        <div key={i} className="flex items-center gap-3">
                          <div className="w-6 text-center text-xs font-bold text-muted-foreground">
                            #{i + 1}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium text-foreground">{t.tag}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">{t.count} ครั้ง</span>
                                <Badge
                                  variant="secondary"
                                  className={`text-xs ${t.type === "expense" ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"}`}
                                >
                                  {t.type === "expense" ? "จ่าย" : "รับ"}
                                </Badge>
                              </div>
                            </div>
                            <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all"
                                style={{
                                  width: `${pct}%`,
                                  background: t.type === "expense" ? "oklch(0.72 0.12 10)" : "oklch(0.52 0.09 162)",
                                }}
                              />
                            </div>
                          </div>
                          <div className={`text-xs font-bold flex-shrink-0 ${t.type === "expense" ? "text-rose-600" : "text-emerald-600"}`}>
                            ฿{formatCurrency(t.total)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
