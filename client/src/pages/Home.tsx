import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import {
  BarChart3,
  Bell,
  CheckCircle2,
  ChevronRight,
  FileText,
  MessageCircle,
  Smartphone,
  Star,
  TrendingUp,
  Users,
  Wallet,
  Zap,
} from "lucide-react";

const LOGO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663425811189/oKpYsJiu26CapzFcKkAmom/logo-v2-square-MaCyTTeZrgjEEhYjASR82X.webp";
const PROMO_HERO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663425811189/oKpYsJiu26CapzFcKkAmom/promo-hero1-WJ2so5hfMAsW8S6Zi4VDqv.webp";
const PROMO_BEFOREAFTER_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663425811189/oKpYsJiu26CapzFcKkAmom/promo-beforeafter-ZQnPDnqXM5fz64NYiViEFU.webp";

const features = [
  {
    icon: <MessageCircle className="w-6 h-6" />,
    title: "บันทึกผ่าน LINE",
    desc: "พิมพ์ 'ข้าว 80 grab 120' แล้วระบบบันทึกให้อัตโนมัติ",
    color: "bg-emerald-100 text-emerald-700",
  },
  {
    icon: <BarChart3 className="w-6 h-6" />,
    title: "วิเคราะห์รายจ่าย",
    desc: "กราฟและสรุปรายวัน สัปดาห์ เดือน ดูได้ทันที",
    color: "bg-primary/10 text-primary",
  },
  {
    icon: <Bell className="w-6 h-6" />,
    title: "แจ้งเตือนอัจฉริยะ",
    desc: "แจ้งเตือนเมื่อเกินงบ ถึงเป้าหมายออม หรือบิลครบกำหนด",
    color: "bg-amber-100 text-amber-700",
  },
  {
    icon: <FileText className="w-6 h-6" />,
    title: "Export PDF",
    desc: "ดาวน์โหลดรายงานสรุปเป็น PDF พร้อมกราฟ",
    color: "bg-rose-100 text-rose-700",
  },
  {
    icon: <Wallet className="w-6 h-6" />,
    title: "หลายกระเป๋า",
    desc: "แยกกระเป๋าเงินสด บัตรเครดิต หรือกระเป๋าพิเศษได้",
    color: "bg-violet-100 text-violet-700",
  },
  {
    icon: <Smartphone className="w-6 h-6" />,
    title: "สแกนใบเสร็จ",
    desc: "ถ่ายรูปใบเสร็จ ระบบอ่านและบันทึกให้อัตโนมัติ (เร็วๆ นี้)",
    color: "bg-orange-100 text-orange-700",
  },
];

const plans = [
  {
    name: "Free",
    price: "ฟรี",
    period: "ตลอดชีพ",
    color: "border-border",
    badge: null,
    features: [
      "บันทึกรายรับรายจ่ายผ่าน LINE",
      "หมวดหมู่พื้นฐาน 10 หมวด",
      "สรุปรายวัน/เดือน",
      "1 กระเป๋าเงิน",
      "ดูประวัติ 30 วัน",
    ],
    cta: "เริ่มใช้ฟรี",
    ctaVariant: "outline" as const,
  },
  {
    name: "Pro",
    price: "฿59",
    period: "ต่อเดือน",
    note: "หรือ ฿365/ปี · ฿999 ครั้งเดียว",
    color: "border-primary ring-2 ring-primary",
    badge: "แนะนำ",
    features: [
      "ทุกอย่างใน Free Plan",
      "วิเคราะห์เชิงลึก + กราฟ",
      "Export PDF รายงาน",
      "แจ้งเตือนเกินงบ",
      "หลายกระเป๋าเงินไม่จำกัด",
      "ตั้งงบประมาณรายหมวด",
      "แจ้งเตือนบิลรายเดือน",
      "สแกนใบเสร็จ (เร็วๆ นี้)",
      "ประวัติไม่จำกัด",
    ],
    cta: "สมัคร Pro",
    ctaVariant: "default" as const,
  },
];

const examples = [
  { input: "ข้าว 80", output: "บันทึก: รายจ่าย ฿80 (อาหาร)" },
  { input: "grab 120", output: "บันทึก: รายจ่าย ฿120 (เดินทาง)" },
  { input: "ข้าว 80 กาแฟ 65 grab 120", output: "บันทึก 3 รายการ รวม ฿265" },
  { input: "รับ 5000", output: "บันทึก: รายรับ ฿5,000" },
  { input: "สรุป", output: "สรุปวันนี้: รับ ฿5,000 จ่าย ฿265 คงเหลือ ฿4,735" },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-border shadow-sm">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-2.5">
            <img src={LOGO_URL} alt="Mae Lamiet" className="w-9 h-9 rounded-xl object-cover shadow-sm" />
            <span className="font-bold text-lg text-foreground">Mae Lamiet</span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">Dashboard</Button>
            </Link>
            <Link href="/upgrade">
              <Button size="sm" className="gap-1.5 bg-primary hover:bg-primary/90 shadow-sm">
                <Star className="w-3.5 h-3.5" />
                Pro Plan
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-12 md:py-20" style={{background: "linear-gradient(135deg, oklch(0.99 0 0) 0%, oklch(0.97 0 0) 55%, oklch(0.95 0 0) 100%)"}}>
        {/* Decorative blobs */}
        <div className="absolute top-10 left-10 w-64 h-64 rounded-full opacity-20 blur-3xl" style={{background: "oklch(0.20 0 0)"}} />
        <div className="absolute bottom-10 right-10 w-48 h-48 rounded-full opacity-10 blur-3xl" style={{background: "oklch(0.35 0 0)"}} />

        <div className="container relative">
          <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
            {/* Left: Text */}
            <div className="flex-1 text-center md:text-left">
              <div className="flex justify-center md:justify-start mb-5">
                <img src={LOGO_URL} alt="Mae Lamiet" className="w-20 h-20 rounded-3xl object-cover shadow-xl ring-4 ring-white" />
              </div>
              <Badge className="mb-4 bg-primary/10 text-primary border-primary/20 hover:bg-primary/10 text-sm px-4 py-1">
                🎉 บันทึกรายรับรายจ่าย ง่ายที่สุด
              </Badge>
              <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4 leading-tight">
                แม่ละเมียด
                <span className="text-primary block mt-1">จดบัญชีให้คุณ</span>
              </h1>
              <p className="text-base md:text-lg text-muted-foreground mb-7 leading-relaxed">
                แค่พิมพ์ <strong className="text-foreground">"ข้าว 80 grab 120"</strong> ระบบบันทึกให้อัตโนมัติ ไม่ต้องเปิดแอป ไม่ต้องจำ
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
                <Link href="/dashboard">
                  <Button size="lg" className="gap-2 w-full sm:w-auto bg-primary hover:bg-primary/90 shadow-md px-8">
                    <Zap className="w-5 h-5" />
                    เริ่มใช้งานฟรี
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </Link>
                <Link href="/upgrade">
                  <Button size="lg" variant="outline" className="gap-2 w-full sm:w-auto border-primary/40 text-primary hover:bg-primary/5 px-8">
                    <Star className="w-5 h-5" />
                    ดู Pro Plan
                  </Button>
                </Link>
              </div>
              <div className="mt-6 flex items-center justify-center md:justify-start gap-5 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-primary" />
                  <span>ใช้งานฟรี</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>ไม่ต้องโหลดแอปเพิ่ม</span>
                </div>
              </div>
            </div>
            {/* Right: Promo Image */}
            <div className="flex-shrink-0 w-72 md:w-80">
              <img
                src={PROMO_HERO_URL}
                alt="แม่ละเมียด จดรายจ่ายแล้วยัง?"
                className="w-full drop-shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Demo Section */}
      <section className="py-16 bg-white">
        <div className="container">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-3 text-foreground">
            พิมพ์ง่ายๆ ระบบเข้าใจเอง
          </h2>
          <p className="text-muted-foreground text-center mb-10">
            ไม่ต้องเรียนรู้คำสั่งพิเศษ แค่พิมพ์แบบธรรมชาติ
          </p>
          <div className="max-w-2xl mx-auto space-y-2.5">
            {examples.map((ex, i) => (
              <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-secondary/50 border border-border hover:border-primary/30 transition-colors">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-xs text-muted-foreground font-medium">คุณพิมพ์:</span>
                    <code className="bg-white border border-border rounded-lg px-2.5 py-0.5 text-sm font-mono text-foreground shadow-sm">
                      {ex.input}
                    </code>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground font-medium">ระบบตอบ:</span>
                    <span className="text-sm text-primary font-semibold">{ex.output}</span>
                  </div>
                </div>
                <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16" style={{background: "oklch(0.97 0.01 80)"}}>
        <div className="container">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-3 text-foreground">ฟีเจอร์ครบครัน</h2>
          <p className="text-muted-foreground text-center mb-10">ทุกอย่างที่คุณต้องการในการจัดการเงิน</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <Card key={i} className="border border-border shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 bg-white">
                <CardContent className="p-6">
                  <div className={`w-12 h-12 rounded-2xl ${f.color} flex items-center justify-center mb-4 shadow-sm`}>
                    {f.icon}
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-16 bg-white">
        <div className="container">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-3 text-foreground">ราคาที่คุ้มค่า</h2>
          <p className="text-muted-foreground text-center mb-10">เริ่มต้นฟรี อัพเกรดเมื่อพร้อม</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {plans.map((plan, i) => (
              <Card key={i} className={`border-2 ${plan.color} relative overflow-hidden`}>
                {plan.badge && (
                  <div className="absolute -top-0 left-0 right-0 h-1 bg-primary rounded-t-xl" />
                )}
                {plan.badge && (
                  <div className="absolute top-4 right-4">
                    <Badge className="bg-primary text-primary-foreground text-xs">{plan.badge}</Badge>
                  </div>
                )}
                <CardContent className="p-6">
                  <div className="mb-5">
                    <h3 className="text-xl font-bold text-foreground">{plan.name}</h3>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-3xl font-bold text-foreground">{plan.price}</span>
                      <span className="text-muted-foreground text-sm">/{plan.period}</span>
                    </div>
                    {(plan as any).note && (
                      <p className="text-xs text-muted-foreground mt-1">{(plan as any).note}</p>
                    )}
                  </div>
                  <ul className="space-y-2.5 mb-6">
                    {plan.features.map((f, j) => (
                      <li key={j} className="flex items-center gap-2.5 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                        <span className="text-foreground">{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Link href={plan.name === "Pro" ? "/upgrade" : "/dashboard"}>
                    <Button variant={plan.ctaVariant} className="w-full rounded-xl">
                      {plan.cta}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Before/After Section */}
      <section className="py-16 bg-white">
        <div className="container">
          <div className="flex flex-col md:flex-row items-center gap-8 md:gap-16">
            {/* Left: Image */}
            <div className="flex-shrink-0 w-72 md:w-80 mx-auto md:mx-0">
              <img
                src={PROMO_BEFOREAFTER_URL}
                alt="ก่อน vs หลัง ใช้แม่ละเมียด"
                className="w-full drop-shadow-2xl rounded-2xl"
              />
            </div>
            {/* Right: Text */}
            <div className="flex-1 text-center md:text-left">
              <Badge className="mb-4 bg-rose-100 text-rose-700 border-rose-200 hover:bg-rose-100 text-sm px-4 py-1">
                😭 ก่อน vs 😊 หลัง
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 leading-tight">
                ชีวิตเปลี่ยน<br />
                <span className="text-primary">แค่จดบัญชีทุกวัน</span>
              </h2>
              <div className="space-y-3 text-left">
                {[
                  { before: "ไม่รู้เงินหายไปไหน", after: "รู้ทุกบาทที่จ่ายไป" },
                  { before: "เดือนชนเดือนตลอด", after: "มีเงินเหลือออม" },
                  { before: "ลืมบันทึกรายจ่าย", after: "พิมพ์ใน LINE แล้วจบ" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/40">
                    <div className="flex-1">
                      <span className="text-sm text-rose-500 line-through">{item.before}</span>
                      <span className="text-muted-foreground mx-2">→</span>
                      <span className="text-sm font-semibold text-emerald-600">{item.after}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6">
                <Link href="/dashboard">
                  <Button size="lg" className="gap-2 bg-primary hover:bg-primary/90 shadow-md px-8">
                    <Zap className="w-5 h-5" />
                    เริ่มเปลี่ยนชีวิตเลย!
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How to Setup */}
      <section className="py-16" style={{background: "linear-gradient(135deg, oklch(0.98 0 0) 0%, oklch(0.95 0 0) 100%)"}}>
        <div className="container text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-3 text-foreground">เริ่มใช้งานใน 3 ขั้นตอน</h2>
          <p className="text-muted-foreground mb-10">ง่ายมาก ใช้เวลาไม่ถึง 2 นาที</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            {[
              { step: "1", title: "เพิ่มเพื่อน LINE", desc: "เพิ่ม @MaeLamiet เป็นเพื่อนใน LINE", emoji: "💚" },
              { step: "2", title: "เชื่อมบัญชี", desc: "เปิดหน้า Dashboard แล้วเข้าสู่ระบบด้วย LINE", emoji: "🔗" },
              { step: "3", title: "เริ่มบันทึก", desc: "พิมพ์ 'ข้าว 80' ใน LINE ได้เลย!", emoji: "✨" },
            ].map((s, i) => (
              <div key={i} className="bg-white/70 backdrop-blur rounded-2xl p-6 shadow-sm border border-white">
                <div className="text-3xl mb-3">{s.emoji}</div>
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm flex items-center justify-center mx-auto mb-3">
                  {s.step}
                </div>
                <h3 className="font-semibold mb-1 text-foreground">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-10">
            <Link href="/dashboard">
              <Button size="lg" className="gap-2 bg-primary hover:bg-primary/90 shadow-md px-10">
                <TrendingUp className="w-5 h-5" />
                เริ่มใช้งานเลย
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-foreground text-background py-10">
        <div className="container text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <img src={LOGO_URL} alt="Mae Lamiet" className="w-8 h-8 rounded-xl object-cover opacity-90" />
            <span className="font-bold text-lg">Mae Lamiet</span>
          </div>
          <p className="text-sm opacity-50">© 2025 Mae Lamiet · แอปบันทึกรายรับรายจ่ายผ่าน LINE</p>
        </div>
      </footer>
    </div>
  );
}
