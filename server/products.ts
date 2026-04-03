// Mae Lamiet - Product & Pricing definitions
// All prices in THB (Thai Baht)

export const PRODUCTS = {
  PRO_MONTHLY: {
    id: "pro_monthly",
    name: "แม่ละเมียด Pro รายเดือน",
    description: "ปลดล็อกทุกฟีเจอร์ AI จดบัญชีอัตโนมัติ อ่านสลิป ไม่จำกัด",
    price: 5900, // 59 THB in satang
    currency: "thb",
    interval: "month" as const,
    features: [
      "AI จดรายการอัตโนมัติ ไม่จำกัด",
      "สแกนสลิปด้วย AI",
      "วิเคราะห์แนวโน้มรายจ่าย",
      "หลายกระเป๋า ไม่จำกัด",
      "Export PDF รายงานรายเดือน",
      "Priority Support",
    ],
  },
  PRO_YEARLY: {
    id: "pro_yearly",
    name: "แม่ละเมียด Pro รายปี",
    description: "ประหยัดกว่า 48% เมื่อเทียบกับรายเดือน",
    price: 36500, // 365 THB in satang
    currency: "thb",
    interval: "year" as const,
    features: [
      "ทุกอย่างใน Pro รายเดือน",
      "ประหยัด ฿343 ต่อปี",
      "ฟีเจอร์ใหม่ก่อนใคร",
    ],
  },
  PRO_LIFETIME: {
    id: "pro_lifetime",
    name: "แม่ละเมียด Pro ตลอดชีพ",
    description: "จ่ายครั้งเดียว ใช้ได้ตลอดชีพ",
    price: 99900, // 999 THB in satang
    currency: "thb",
    interval: null,
    features: [
      "ทุกอย่างใน Pro",
      "จ่ายครั้งเดียวตลอดชีพ",
      "อัปเดตฟีเจอร์ฟรีตลอด",
    ],
  },
} as const;

export type ProductId = keyof typeof PRODUCTS;
