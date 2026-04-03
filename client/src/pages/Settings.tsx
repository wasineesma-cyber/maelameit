import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import {
  ArrowLeft, ArrowRight, ChevronRight, Copy, Grid3x3, Hash, LogOut,
  Plus, Star, Tag, Trash2, User, Wallet, X, Download, HelpCircle,
  MessageCircle, Bell, Palette
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";

const EMOJI_OPTIONS = [
  "🍜","🧋","🛵","🚌","🏠","🛍️","💄","💊","📱","📊","🎬","🎡","📚","💝","🚗","🐾","🛡️","💸","💳","📦","🚚","📣","🏪","🤝","💰",
  "💼","⭐","💻","🏷️","📈","🎁","🔗","🏦","💡","🎯","🔥","✨","🌟","🎪","🎨","🏋️","🌈","🍎","☕","🎵","📷","🏆","🎓","🌺",
];

// ─── Sub-page types ───────────────────────────────────────────────────────────
type SubPage = "account" | "categories" | "wallets" | "export" | "upgrade" | "referral" | "help" | null;

// ─── Menu Item Component ──────────────────────────────────────────────────────
function MenuItem({
  icon,
  label,
  badge,
  badgeColor = "secondary",
  onClick,
  destructive = false,
}: {
  icon: React.ReactNode;
  label: string;
  badge?: string;
  badgeColor?: string;
  onClick: () => void;
  destructive?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3.5 hover:bg-muted/60 active:bg-muted transition-colors text-left",
        destructive && "hover:bg-rose-50"
      )}
    >
      <div className={cn(
        "w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0",
        destructive ? "bg-rose-100 text-rose-600" : "bg-primary/10 text-primary"
      )}>
        {icon}
      </div>
      <span className={cn(
        "flex-1 text-sm font-medium",
        destructive ? "text-rose-600" : "text-foreground"
      )}>
        {label}
      </span>
      {badge && (
        <Badge
          className={cn(
            "text-xs mr-1",
            badgeColor === "amber" && "bg-amber-100 text-amber-700 border-amber-200",
            badgeColor === "green" && "bg-emerald-100 text-emerald-700 border-emerald-200",
            badgeColor === "blue" && "bg-blue-100 text-blue-700 border-blue-200",
          )}
        >
          {badge}
        </Badge>
      )}
      {!destructive && <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
    </button>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────
function SectionHeader({ title }: { title: string }) {
  return (
    <div className="px-4 pt-5 pb-1.5">
      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{title}</span>
    </div>
  );
}

// ─── Menu Group Card ──────────────────────────────────────────────────────────
function MenuGroup({ children }: { children: React.ReactNode }) {
  return (
    <Card className="border border-border shadow-sm overflow-hidden">
      <CardContent className="p-0 divide-y divide-border">
        {children}
      </CardContent>
    </Card>
  );
}

// ─── Sub-page: Account ───────────────────────────────────────────────────────
function AccountPage({ user, isPro }: any) {
  return (
    <div className="space-y-4">
      <Card className="border border-border shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-3xl overflow-hidden">
              👤
            </div>
            <div className="flex-1">
              <div className="font-semibold text-foreground text-base">{user?.name || "ผู้ใช้งาน"}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{user?.email || ""}</div>
              <div className="mt-1.5">
                {isPro ? (
                  <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-xs">⭐ Pro Plan</Badge>
                ) : (
                  <Badge variant="secondary" className="text-xs">Free Plan</Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <MenuGroup>
        <MenuItem icon={<Star className="w-4 h-4" />} label="อัพเกรด Pro Plan" badge={isPro ? "ใช้งานอยู่" : "฿59/เดือน"} badgeColor={isPro ? "green" : "amber"} onClick={() => { if (!isPro) window.location.href = "/upgrade"; }} />
      </MenuGroup>
    </div>
  );
}

// ─── Sub-page: Categories ────────────────────────────────────────────────────
function CategoriesPage({ lineUserId }: { lineUserId: string }) {
  const [showAddCat, setShowAddCat] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatIcon, setNewCatIcon] = useState("📦");
  const [newCatType, setNewCatType] = useState<"income" | "expense" | "both">("expense");
  const [catTab, setCatTab] = useState<"expense" | "income">("expense");

  const { data: categories, refetch } = trpc.categories.list.useQuery({ lineUserId }, { enabled: !!lineUserId });

  const createCat = trpc.categories.create.useMutation({
    onSuccess: () => { toast.success("เพิ่มหมวดหมู่สำเร็จ"); refetch(); setNewCatName(""); setNewCatIcon("📦"); setShowAddCat(false); },
    onError: (e) => toast.error(e.message),
  });
  const deleteCat = trpc.categories.delete.useMutation({
    onSuccess: () => { toast.success("ลบหมวดหมู่แล้ว"); refetch(); },
    onError: (e) => toast.error(e.message),
  });
  const seedCats = trpc.categories.seed.useMutation({
    onSuccess: () => { toast.success("เพิ่มหมวดหมู่เริ่มต้นแล้ว!"); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const expenseCategories = categories?.filter((c) => c.type === "expense" || c.type === "both") ?? [];
  const incomeCategories = categories?.filter((c) => c.type === "income" || c.type === "both") ?? [];
  const displayedCategories = catTab === "expense" ? expenseCategories : incomeCategories;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-1 bg-muted p-1 rounded-xl flex-1 mr-2">
          <button onClick={() => setCatTab("expense")} className={cn("flex-1 py-1.5 rounded-lg text-sm font-medium transition-all", catTab === "expense" ? "bg-white shadow text-rose-600" : "text-muted-foreground")}>
            💸 รายจ่าย ({expenseCategories.length})
          </button>
          <button onClick={() => setCatTab("income")} className={cn("flex-1 py-1.5 rounded-lg text-sm font-medium transition-all", catTab === "income" ? "bg-white shadow text-emerald-600" : "text-muted-foreground")}>
            💰 รายรับ ({incomeCategories.length})
          </button>
        </div>
        <Button size="sm" onClick={() => setShowAddCat(!showAddCat)} className="gap-1 bg-primary hover:bg-primary/90 flex-shrink-0">
          <Plus className="w-3 h-3" />เพิ่ม
        </Button>
      </div>

      {(!categories || categories.length === 0) && (
        <Button variant="outline" className="w-full border-dashed" onClick={() => lineUserId && seedCats.mutate({ lineUserId })} disabled={seedCats.isPending}>
          ✨ เพิ่มหมวดหมู่เริ่มต้น 35 หมวด
        </Button>
      )}

      {displayedCategories.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-sm">ยังไม่มีหมวดหมู่</div>
      ) : (
        <div className="grid grid-cols-4 gap-2">
          {displayedCategories.map((c) => (
            <div key={c.id} className="relative flex flex-col items-center gap-1 p-2 rounded-xl border border-border bg-white group hover:border-primary/30 transition-colors">
              <span className="text-2xl">{c.icon || "📦"}</span>
              <span className="text-[10px] text-muted-foreground text-center leading-tight line-clamp-2">{c.name}</span>
              <button
                onClick={() => { if (confirm(`ลบ "${c.name}"?`)) deleteCat.mutate({ id: c.id, lineUserId }); }}
                className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-destructive-foreground rounded-full hidden group-hover:flex items-center justify-center"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {showAddCat && (
        <Card className="border border-border shadow-sm">
          <CardContent className="p-3 space-y-3">
            <p className="text-sm font-medium">➕ เพิ่มหมวดหมู่ใหม่</p>
            <div className="flex gap-2">
              <Input placeholder="ชื่อหมวดหมู่" value={newCatName} onChange={(e) => setNewCatName(e.target.value)} className="flex-1 text-sm" />
              <select value={newCatType} onChange={(e) => setNewCatType(e.target.value as any)} className="border border-border rounded-lg px-2 text-sm bg-white">
                <option value="expense">รายจ่าย</option>
                <option value="income">รายรับ</option>
                <option value="both">ทั้งคู่</option>
              </select>
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
              {EMOJI_OPTIONS.map((emoji) => (
                <button key={emoji} onClick={() => setNewCatIcon(emoji)} className={cn("text-xl p-1 rounded-lg transition-all", newCatIcon === emoji ? "bg-primary/20 ring-2 ring-primary" : "hover:bg-muted")}>
                  {emoji}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <Button size="sm" className="flex-1 bg-primary hover:bg-primary/90"
                onClick={() => { if (!newCatName.trim()) return toast.error("กรุณากรอกชื่อ"); createCat.mutate({ lineUserId, name: newCatName, icon: newCatIcon, type: newCatType }); }}
                disabled={createCat.isPending}>
                {createCat.isPending ? "กำลังเพิ่ม..." : "เพิ่มหมวดหมู่"}
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowAddCat(false)}>ยกเลิก</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── Sub-page: Wallets ───────────────────────────────────────────────────────
function WalletsPage({ lineUserId }: { lineUserId: string }) {
  const [newWalletName, setNewWalletName] = useState("");
  const { data: wallets, refetch } = trpc.wallets.list.useQuery({ lineUserId }, { enabled: !!lineUserId });
  const createWallet = trpc.wallets.create.useMutation({
    onSuccess: () => { toast.success("เพิ่มกระเป๋าสำเร็จ"); refetch(); setNewWalletName(""); },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {wallets?.map((w) => (
          <div key={w.id} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-white">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-xl">{w.icon}</div>
            <div className="flex-1">
              <div className="text-sm font-medium text-foreground">{w.name}</div>
              {w.isDefault && <div className="text-xs text-muted-foreground">กระเป๋าหลัก</div>}
            </div>
            {w.isDefault && <Badge variant="secondary" className="text-xs">หลัก</Badge>}
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <Input placeholder="ชื่อกระเป๋า เช่น เงินสด, บัตรเครดิต" value={newWalletName} onChange={(e) => setNewWalletName(e.target.value)} className="flex-1 text-sm" />
        <Button size="sm" className="bg-primary hover:bg-primary/90" onClick={() => { if (!newWalletName.trim()) return toast.error("กรุณากรอกชื่อ"); createWallet.mutate({ lineUserId, name: newWalletName, icon: "👛" }); }}>
          <Plus className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

// ─── Main Settings Component ─────────────────────────────────────────────────
export default function Settings() {
  const { user, isAuthenticated, logout } = useAuth();
  const lineUserId = user?.openId ?? "";
  const [subPage, setSubPage] = useState<SubPage>(null);

  const { data: subscription } = trpc.payment.getSubscription.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const isPro = subscription?.plan === "pro";

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-muted-foreground">กรุณาเข้าสู่ระบบก่อน</p>
          <Button onClick={() => { window.location.href = getLoginUrl(); }}>เข้าสู่ระบบ</Button>
        </div>
      </div>
    );
  }

  const subPageTitles: Record<string, string> = {
    account: "บัญชี",
    categories: "จัดการหมวดหมู่",
    wallets: "จัดการกระเป๋า",
    export: "ส่งออกข้อมูล",
    upgrade: "Pro Plan",
    referral: "ชวนเพื่อน",
    help: "วิธีใช้งาน",
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="container flex items-center gap-3 h-14 max-w-2xl mx-auto">
          {subPage ? (
            <Button variant="ghost" size="sm" onClick={() => setSubPage(null)}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
          ) : (
            <Link href="/dashboard">
              <Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4" /></Button>
            </Link>
          )}
          <h1 className="font-bold text-foreground flex-1">
            {subPage ? subPageTitles[subPage] ?? "ตั้งค่า" : "⚙️ ตั้งค่า"}
          </h1>
        </div>
      </div>

      <div className="container py-2 max-w-md mx-auto">

        {/* ── Sub-pages ── */}
        {subPage === "account" && (
          <div className="py-4 space-y-4">
            <AccountPage user={user} isPro={isPro} />
          </div>
        )}

        {subPage === "categories" && (
          <div className="py-4">
            <CategoriesPage lineUserId={lineUserId} />
          </div>
        )}

        {subPage === "wallets" && (
          <div className="py-4">
            <WalletsPage lineUserId={lineUserId} />
          </div>
        )}

        {subPage === "export" && (
          <div className="py-4 text-center space-y-4">
            <div className="text-5xl">📊</div>
            <p className="text-sm text-muted-foreground">ส่งออกข้อมูลรายรับ-รายจ่ายเป็นไฟล์ CSV</p>
            <Button className="bg-primary hover:bg-primary/90" onClick={() => toast.info("ฟีเจอร์นี้กำลังพัฒนา")}>
              <Download className="w-4 h-4 mr-2" />ดาวน์โหลด CSV
            </Button>
          </div>
        )}

        {subPage === "upgrade" && (
          <div className="py-4 text-center space-y-4">
            <Link href="/upgrade">
              <Button className="bg-primary hover:bg-primary/90 w-full">ดูแพ็กเกจ Pro</Button>
            </Link>
          </div>
        )}

        {subPage === "referral" && (
          <div className="py-4 space-y-4">
            <Card className="border border-border shadow-sm">
              <CardContent className="p-4 text-center space-y-3">
                <div className="text-4xl">🎁</div>
                <h3 className="font-semibold">ชวนเพื่อน รับฟรี 1 เดือน</h3>
                <p className="text-sm text-muted-foreground">ชวนเพื่อนมาใช้งาน ทั้งคุณและเพื่อนได้ Pro ฟรี 1 เดือน</p>
                <div className="bg-muted rounded-xl p-3 font-mono text-lg font-bold tracking-widest text-primary">
                  {lineUserId.slice(-8).toUpperCase()}
                </div>
                <Button variant="outline" className="w-full" onClick={() => { navigator.clipboard.writeText(lineUserId.slice(-8).toUpperCase()); toast.success("คัดลอก referral code แล้ว!"); }}>
                  <Copy className="w-4 h-4 mr-2" />คัดลอก Code
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {subPage === "help" && (
          <div className="py-4 space-y-3">
            <Card className="border border-border shadow-sm">
              <CardContent className="p-4 space-y-3">
                <h3 className="font-semibold text-foreground">วิธีใช้งาน</h3>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="bg-muted rounded-xl p-3 font-mono text-foreground">"ข้าว 80 grab 120"</div>
                  <p>พิมพ์รายการจ่ายหลายอย่างพร้อมกันได้เลย</p>
                  <div className="bg-muted rounded-xl p-3 font-mono text-foreground">"รับ 5000 เงินเดือน"</div>
                  <p>บันทึกรายรับ</p>
                  <div className="bg-muted rounded-xl p-3 font-mono text-foreground">"สรุป"</div>
                  <p>ดูยอดรวมเดือนนี้</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── Main Menu ── */}
        {!subPage && (
          <>
            {/* Profile Card */}
            <div className="py-4 px-1">
              <Card className="border border-border shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-2xl overflow-hidden">
                      👤
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-foreground">{user?.name || "ผู้ใช้งาน"}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{user?.email || ""}</div>
                    </div>
                    {isPro ? (
                      <Badge className="bg-amber-100 text-amber-700 border-amber-200">⭐ Pro</Badge>
                    ) : (
                      <Button size="sm" variant="outline" className="gap-1 text-primary border-primary/30" onClick={() => setSubPage("upgrade")}>
                        <Star className="w-3 h-3" />Pro
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Section: ตั้งค่าการใช้งาน */}
            <SectionHeader title="ตั้งค่าการใช้งาน" />
            <MenuGroup>
              <MenuItem icon={<User className="w-4 h-4" />} label="บัญชี" onClick={() => setSubPage("account")} />
              <MenuItem icon={<Bell className="w-4 h-4" />} label="การแจ้งเตือน" badge="เร็วๆ นี้" badgeColor="blue" onClick={() => toast.info("ฟีเจอร์กำลังพัฒนา")} />
            </MenuGroup>

            {/* Section: รายการ */}
            <SectionHeader title="รายการ" />
            <MenuGroup>
              <MenuItem icon={<Grid3x3 className="w-4 h-4" />} label="จัดการหมวดหมู่" onClick={() => setSubPage("categories")} />
              <MenuItem icon={<Wallet className="w-4 h-4" />} label="จัดการกระเป๋า" onClick={() => setSubPage("wallets")} />
              <MenuItem icon={<Download className="w-4 h-4" />} label="ส่งออกข้อมูล" onClick={() => setSubPage("export")} />
            </MenuGroup>

            {/* Section: Pro Plan */}
            <SectionHeader title="Pro Plan" />
            <MenuGroup>
              {!isPro ? (
                <MenuItem icon={<Star className="w-4 h-4" />} label="อัพเกรด Pro" badge="฿59/เดือน" badgeColor="amber" onClick={() => setSubPage("upgrade")} />
              ) : (
                <MenuItem icon={<Star className="w-4 h-4" />} label="Pro Plan" badge="ใช้งานอยู่" badgeColor="green" onClick={() => setSubPage("upgrade")} />
              )}
              <MenuItem icon={<Tag className="w-4 h-4" />} label="ชวนเพื่อน รับฟรี 1 เดือน" onClick={() => setSubPage("referral")} />
            </MenuGroup>

            {/* Section: วิธีการใช้งาน */}
            <SectionHeader title="วิธีการใช้งาน" />
            <MenuGroup>
              <MenuItem icon={<HelpCircle className="w-4 h-4" />} label="วิธีใช้งาน" onClick={() => setSubPage("help")} />
              <MenuItem icon={<MessageCircle className="w-4 h-4" />} label="ติดต่อเรา" onClick={() => toast.info("ติดต่อผ่านอีเมลหรือช่องทางที่ระบุในเว็บไซต์") } />
            </MenuGroup>

            {/* Logout */}
            <div className="py-4 px-1">
              <MenuGroup>
                <MenuItem icon={<LogOut className="w-4 h-4" />} label="ออกจากระบบ" onClick={logout} destructive />
              </MenuGroup>
            </div>

            <div className="pb-8 text-center text-xs text-muted-foreground">
              แม่ละเมียด v1.0 • maetracker.pro
            </div>
          </>
        )}
      </div>
    </div>
  );
}
