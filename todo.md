# Mae Lamiet App - TODO

## Phase 1: Database Schema & Backend
- [x] Database schema: users, transactions, categories, wallets, budgets, subscriptions
- [x] LINE user mapping table
- [x] tRPC routers: transactions, categories, wallets, analytics, subscriptions
- [x] LINE Webhook endpoint (Express route)
- [x] Natural language parser for LINE messages

## Phase 2: LINE Webhook & Parsing
- [x] LINE Messaging API integration
- [x] Parse natural language: "ข้าว 80 grab 120"
- [x] Parse income: "รับ 5000" / "เงินเดือน 20000"
- [x] Parse expense: "ข้าว 80" / "ค่าน้ำ 300"
- [x] LINE reply messages (formatted)
- [ ] Rich Menu setup guide (ทำทีหลัง)

## Phase 3: Frontend
- [x] Landing Page with Free/Pro features
- [x] Dashboard with charts (recharts)
- [x] Transaction list with filters
- [x] Category management
- [x] Wallet management
- [ ] Budget settings page (placeholder)
- [x] Analytics page (daily/weekly/monthly)

## Phase 4: Pro Features
- [x] Export HTML Report (PDF-ready, printable)
- [ ] Stripe subscription (Pro Plan) - ทำทีหลัง
- [x] LINE notifications (over budget, new entry)
- [ ] Recurring bill reminders (cron job - ทำทีหลัง)
- [ ] Image/receipt scan (OCR - ทำทีหลัง)

## Phase 5: Testing & Polish
- [x] Vitest unit tests (12 tests passing)
- [x] Error handling
- [x] Mobile responsive
- [ ] Checkpoint & deploy guide

## แก้ไขเพิ่มเติม
- [ ] LINE Login (LIFF) - กดปุ่มแล้ว Login ผ่าน LINE ได้เลย แทนการกรอก User ID
- [x] Demo Mode - ปุ่ม "ทดลองใช้งาน (ไม่บันทึกข้อมูล)" เพื่อดูหน้าด้านในโดยไม่ต้องล็อกอิน
- [x] LINE Login Button (พร้อมรองรับ LIFF เมื่อตั้งค่า LIFF ID)
- [x] Demo Banner แสดงเมื่ออยู่ใน Demo Mode พร้อมปุ่มออก

## หมวดหมู่ครบ + ราคา Pro + ชวนเพื่อน
- [x] เพิ่ม default categories รายรับ 10 หมวด (เงินเดือน, งานพิเศษ, ฟรีแลนซ์, ยอดขาย, ลงทุน, โอน/รับเงิน, Affiliate, เงินสำรองภาษี, เงินสำรองฉุกเฉิน, อื่นๆ)
- [x] เพิ่ม default categories รายจ่าย 25 หมวด (อาหาร, เครื่องดื่ม, เดลิเวอรี, เดินทาง, ที่พัก, ชอปปิ้ง, ความงาม, สุขภาพ, ค่าโทรศัพท์, ค่าเน็ต, Subscription, บันเทิง, การศึกษา, บริจาค, ยานพาหนะ, สัตว์เลี้ยง, ประกัน, โอนเงิน, ค่าบัตรเครดิต, ต้นทุนสินค้า, ค่าส่ง, ค่าโฆษณา, ค่า Platform, ค่าอินฟลู, อื่นๆ)
- [x] ปุ่มเพิ่มหมวดหมู่ใหม่ (custom category) พร้อม emoji picker
- [x] แสดงหมวดหมู่แบบ grid card (icon + ชื่อ) เหมือนระบบเก่า
- [x] seed default categories ให้ user ใหม่อัตโนมัติ
- [x] ราคา Pro ใหม่: ฿59/เดือน, ฿365/ปี, ฿999 ครั้งเดียว
- [x] หน้า Upgrade แสดง 3 แพ็กเกจ
- [x] ระบบชวนเพื่อน (referral code) รับฟรี 1 เดือน

## โลโก้ใหม่ + ลบ LINE User ID
- [x] สร้างโลโก้ผู้หญิงผมชมพู เสื้อเขียว สไตล์เดิม
- [x] ลบช่องกรอก LINE User ID ออกจาก Dashboard
- [x] อัปโหลดโลโก้ใส่แอป
- [x] ปรับโทนสี Rose-Sage ทั้งแอป (เขียวเซจ + ชมพูฝุ่น)

## ซ่อน LINE Webhook
- [x] ซ่อน LINE Webhook URL ใน Settings ให้แสดงเฉพาะ Owner (OWNER_OPEN_ID)

## Google Login + Dashboard UI ใหม่ + อ่านสลิป + ช่องแชตจดด่วน
- [x] เพิ่ม Manus OAuth Login ในหน้า Login (ปุ่มเข้าสู่ระบบ / สมัครสมาชิก)
- [x] ปรับ Dashboard ให้หัวข้อน้อยๆ ชัดๆ ยอดรวมใหญ่ + รายการล่าสุดด้านล่าง
- [x] เพิ่มฟีเจอร์อ่านสลิปด้วย AI (ถ่ายรูป/อัปโหลด → ดึงยอดและชื่ออัตโนมัติ)
- [x] เพิ่มช่องแชตจดด่วน AI ใน Dashboard (พิมพ์ข้อความหรือถ่ายรูปสลิป → AI แยกรายการให้อัตโนมัติ)
- [x] แสดงผลลัพธ์ AI ให้ยืนยันก่อนบันทึก
- [x] อัปเดต Transactions/Analytics/Settings ให้ใช้ Manus Auth แทน LINE User ID

## Analytics ใหม่ + รูปโปรโมต
- [x] กราฟกลม (Pie) รายจ่ายตามหมวดหมู่
- [x] กราฟบาร์ (Bar) รายรับ-รายจ่าย 6 เดือน
- [x] ภาพรวมแยกกระเป๋า (Wallet breakdown)
- [x] อันดับ Tag/หมวดที่ใช้บ่อยที่สุด (Top 8)
- [x] สร้างรูปโปรโมตกวนๆ สไตล์ไทย 3 แบบ

## Settings Redesign - Grouped Menu
- [ ] ปรับหน้าตั้งค่าเป็น grouped menu list (หมวด > รายการ > ลูกศร >)
- [ ] หมวด "ตั้งค่าการใช้งาน": บัญชี
- [ ] หมวด "รายการ": จัดการหมวดหมู่, จัดการกระเป๋า, ส่งออกข้อมูล
- [ ] หมวด "การแสดงผล": เปลี่ยนธีม, ภาษา
- [ ] หมวด "Pro Plan": อัพเกรด, ชวนเพื่อน
- [ ] หมวด "อื่นๆ": วิธีใช้งาน, ติดต่อเรา, ออกจากระบบ
- [ ] คลิกแต่ละรายการแล้วไปหน้าย่อย (sub-page)

## รูปโปรโมต + Landing Page
- [x] รูปโปรโมต: แม่ละเมียดถือโทรศัพท์ตาถลน สไตล์การ์ตูนไทยกวนๆ
- [x] รูปโปรโมต: ก่อน-หลังจดบัญชีด้วยแม่ละเมียด
- [x] หน้า Landing Page ก่อน Login ใช้รูปโปรโมตเป็น hero (Hero + Before/After section)

## Onboarding Slideshow Landing
- [x] Slide 1: "จดรายจ่ายแล้วยัง?" fullscreen รูปแม่ละเมียด + ปุ่มกดไปหน้าถัดไป
- [x] Slide 2: ก่อน-หลัง ใช้แม่ละเมียด
- [x] Slide 3: แนะนำฟีเจอร์หลัก 3 อย่าง
- [x] Slide 4: หน้า Login เข้าสู่ระบบ
- [x] Dot indicator แสดงว่าอยู่หน้าไหน
- [x] Swipe gesture บนมือถือ
- [x] โลโก้ใหม่สไตล์การ์ตูนไทย (แบบกลม + แบบแนวนอน)
- [x] อัปเดตโลโก้ในทุกหน้าของแอป

## Stripe Payment Integration
- [x] สร้าง products.ts กำหนดแพ็กเกจ Pro ฿59/เดือน, ฿365/ปี, ฿999 ตลอดชีพ
- [x] เพิ่ม stripe_customer_id, stripe_subscription_id, subscription_status ใน users table
- [x] สร้าง createCheckout + getSubscription endpoint ใน routers.ts
- [x] สร้าง webhook handler ที่ /api/stripe/webhook
- [x] ปรับหน้า Upgrade ให้เชื่อม Stripe Checkout จริง (Dark theme)
- [ ] ทดสอบด้วยบัตร 4242 4242 4242 4242

## แก้บัค Login วนลูป
- [x] วิเคราะห์ OAuth flow - สาเหตุ: oauth.ts redirect ไป / แทน /dashboard
- [x] แก้ redirect ใน /api/oauth/callback ให้ไป /dashboard โดยตรง

## ใส่โลโก้ในหน้า Home
- [ ] ใส่โลโก้แม่ละเมียดในหน้า Home (Landing Page) - navbar และ hero section

## Favicon + PWA Icon (Add to Home Screen)
- [x] ดาวน์โหลดโลโก้แม่ละเมียดและสร้าง PNG icons ทุกขนาด (16-512px)
- [x] สร้าง manifest.json สำหรับ PWA + ชื่อ แม่ละเมียด
- [x] อัปเดต index.html ให้เชื่อม favicon, apple-touch-icon, manifest, og:image

## แก้บัค Pro ไม่ปลดล็อกฟีเจอร์
- [x] ตรวจสอบ plan check logic ใน frontend (isPro check)
- [x] แก้ไข Pro gate ให้ฟีเจอร์ทำงานได้จริงเมื่อ plan = 'pro'
- [x] อัปเดต Dashboard, Analytics, Settings ให้ใช้ trpc.payment.getSubscription แทน lineUser?.plan
