import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { toast } from "sonner";
import { Check, Crown, Zap, Star, ArrowLeft, Sparkles } from "lucide-react";

const LOGO_SQUARE = "https://d2xsxph8kpxj0f.cloudfront.net/310519663425811189/oKpYsJiu26CapzFcKkAmom/logo-v2-square-MaCyTTeZrgjEEhYjASR82X.webp";

const PLANS = [
  {
    id: "PRO_MONTHLY" as const,
    name: "รายเดือน",
    price: "฿59",
    period: "/เดือน",
    note: "ประมาณ 2 บาทต่อวัน",
    badge: null,
    highlight: false,
    features: [
      "AI จดรายการอัตโนมัติ ไม่จำกัด",
      "สแกนสลิปด้วย AI",
      "วิเคราะห์แนวโน้มรายจ่าย",
      "หลายกระเป๋า ไม่จำกัด",
      "Export PDF รายงานรายเดือน",
    ],
  },
  {
    id: "PRO_YEARLY" as const,
    name: "รายปี",
    price: "฿365",
    period: "/ปี",
    note: "ประหยัดกว่า 48%",
    badge: "ประหยัด 48%",
    highlight: true,
    features: [
      "ทุกอย่างใน Pro รายเดือน",
      "ประหยัด ฿343 ต่อปี",
      "ฟีเจอร์ใหม่ก่อนใคร",
    ],
  },
  {
    id: "PRO_LIFETIME" as const,
    name: "ตลอดชีพ",
    price: "฿999",
    period: "",
    note: "จ่ายครั้งเดียว ใช้ได้ตลอดชีพ",
    badge: "จ่ายครั้งเดียว",
    highlight: false,
    features: [
      "ทุกอย่างใน Pro",
      "จ่ายครั้งเดียวตลอดชีพ",
      "อัปเดตฟีเจอร์ฟรีตลอด",
    ],
  },
];

const PRO_FEATURES = [
  { icon: "🤖", text: "AI จดรายการอัตโนมัติ ไม่จำกัด" },
  { icon: "📷", text: "สแกนสลิปด้วย AI" },
  { icon: "📊", text: "วิเคราะห์แนวโน้มรายจ่าย" },
  { icon: "👛", text: "หลายกระเป๋า ไม่จำกัด" },
  { icon: "📄", text: "Export PDF รายงานรายเดือน" },
  { icon: "⚡", text: "Priority Support" },
];

export default function Upgrade() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const { data: subscription } = trpc.payment.getSubscription.useQuery(undefined, {
    enabled: !!user,
  });

  const createCheckout = trpc.payment.createCheckout.useMutation({
    onSuccess: ({ url }) => {
      if (url) {
        toast.success("กำลังพาไปหน้าชำระเงิน...");
        window.open(url, "_blank");
      }
      setLoadingPlan(null);
    },
    onError: (err) => {
      toast.error(`เกิดข้อผิดพลาด: ${err.message}`);
      setLoadingPlan(null);
    },
  });

  const handleUpgrade = (productId: "PRO_MONTHLY" | "PRO_YEARLY" | "PRO_LIFETIME") => {
    if (!user) {
      window.location.href = getLoginUrl();
      return;
    }
    setLoadingPlan(productId);
    createCheckout.mutate({
      productId,
      origin: window.location.origin,
    });
  };

  const isPro = subscription?.plan === "pro";

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg, #0b0b0b 0%, #121212 50%, #1a1a1a 100%)" }}>
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center gap-3 px-4 py-3 border-b border-white/10" style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(12px)" }}>
        <button onClick={() => setLocation("/dashboard")} className="text-white/70 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <img src={LOGO_SQUARE} alt="แม่ละเมียด" className="w-8 h-8 rounded-full" />
        <span className="text-white font-bold">อัปเกรด Pro</span>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {isPro ? (
          /* Already Pro */
          <div className="text-center py-12 space-y-4">
            <div className="text-6xl">⭐</div>
            <h2 className="text-2xl font-bold text-white">คุณเป็นสมาชิก Pro แล้ว!</h2>
            <p className="text-white/60">ขอบคุณที่สนับสนุนแม่ละเมียดนะคะ</p>
            <button
              onClick={() => setLocation("/analytics")}
              className="px-6 py-3 rounded-xl font-bold text-sm"
              style={{ background: "linear-gradient(135deg, #ffffff, #d9d9d9)", color: "#111111" }}
            >
              ไปดูการวิเคราะห์
            </button>
          </div>
        ) : (
          <>
            {/* Hero */}
            <div className="text-center space-y-2">
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #111111, #2a2a2a)" }}>
                  <Crown className="w-8 h-8 text-white" />
                </div>
              </div>
              <h1 className="text-2xl font-bold text-white">แม่ละเมียด Pro</h1>
              <p className="text-white/60 text-sm">ปลดล็อกทุกฟีเจอร์ AI จดบัญชีอัตโนมัติ</p>
            </div>

            {/* Pro features highlight */}
            <div className="rounded-2xl p-4 space-y-3" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" }}>
              <div className="flex items-center gap-2 text-white font-semibold text-sm">
                <Sparkles className="w-4 h-4" />
                ฟีเจอร์ Pro
              </div>
              <div className="grid grid-cols-2 gap-2">
                {PRO_FEATURES.map((f) => (
                  <div key={f.text} className="flex items-center gap-2 text-white/80 text-xs">
                    <span>{f.icon}</span>
                    <span>{f.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Pricing cards */}
            <div className="space-y-3">
              {PLANS.map((plan) => (
                <div
                  key={plan.id}
                  className="rounded-2xl p-4 relative overflow-hidden"
                  style={{
                    background: plan.highlight
                      ? "linear-gradient(135deg, rgba(255,255,255,0.12), rgba(255,255,255,0.06))"
                      : "rgba(255,255,255,0.06)",
                    border: plan.highlight ? "2px solid rgba(255,255,255,0.35)" : "1px solid rgba(255,255,255,0.1)",
                  }}
                >
                  {plan.badge && (
                    <div
                      className="absolute top-3 right-3 text-xs font-bold px-2 py-0.5 rounded-full"
                      style={{
                        background: plan.highlight ? "#ffffff" : "rgba(255,255,255,0.15)",
                        color: plan.highlight ? "#111111" : "white",
                      }}
                    >
                      {plan.badge}
                    </div>
                  )}

                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        {plan.highlight && <Star className="w-4 h-4 text-white fill-white" />}
                        <span className="text-white font-bold">{plan.name}</span>
                      </div>
                      <div className="flex items-baseline gap-1 mt-1">
                        <span className="text-2xl font-bold" style={{ color: plan.highlight ? "#ffffff" : "white" }}>
                          {plan.price}
                        </span>
                        <span className="text-white/50 text-sm">{plan.period}</span>
                      </div>
                      <p className="text-white/40 text-xs mt-0.5">{plan.note}</p>
                    </div>
                  </div>

                  <ul className="space-y-1.5 mb-4">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-white/70 text-xs">
                        <Check className="w-3.5 h-3.5 text-white/70 flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => handleUpgrade(plan.id)}
                    disabled={loadingPlan !== null}
                    className="w-full py-3 rounded-xl font-bold text-sm transition-all active:scale-95 disabled:opacity-50"
                    style={{
                      background: plan.highlight
                        ? "linear-gradient(135deg, #ffffff, #d9d9d9)"
                        : "rgba(255,255,255,0.12)",
                      color: plan.highlight ? "#111111" : "white",
                    }}
                  >
                    {loadingPlan === plan.id ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        กำลังโหลด...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <Zap className="w-4 h-4" />
                        เลือกแพ็กเกจนี้
                      </span>
                    )}
                  </button>
                </div>
              ))}
            </div>

            {/* FAQ */}
            <div className="rounded-2xl p-4 space-y-3" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <p className="text-white/60 text-xs font-semibold">คำถามที่พบบ่อย</p>
              {[
                { q: "ยกเลิกได้ไหม?", a: "ยกเลิกได้ทุกเมื่อ ไม่มีค่าปรับ" },
                { q: "ข้อมูลเก่าหายไหมถ้ายกเลิก?", a: "ข้อมูลยังอยู่ครบ แต่ฟีเจอร์ Pro จะถูกจำกัด" },
                { q: "ชำระเงินอย่างไร?", a: "ผ่าน Stripe ปลอดภัย รองรับบัตรเครดิต/เดบิต" },
              ].map(({ q, a }) => (
                <div key={q}>
                  <p className="text-white/70 text-xs font-medium">{q}</p>
                  <p className="text-white/40 text-xs">{a}</p>
                </div>
              ))}
            </div>

            {/* Security note */}
            <div className="text-center text-white/30 text-xs pb-4">
              🔒 ชำระเงินปลอดภัยผ่าน Stripe
            </div>
          </>
        )}
      </div>
    </div>
  );
}
