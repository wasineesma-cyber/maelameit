/**
 * Natural Language Parser for LINE messages
 * Supports Thai language expense/income tracking
 * Examples:
 *   "ข้าว 80" → expense 80 (food)
 *   "grab 120" → expense 120 (transport)
 *   "ข้าว 80 grab 120" → 2 expenses
 *   "รับ 5000" → income 5000
 *   "เงินเดือน 20000" → income 20000
 *   "สรุป" → summary
 *   "ลบ 5" → delete transaction #5
 */

export interface ParsedTransaction {
  type: "income" | "expense";
  amount: number;
  description: string;
  categoryHint?: string;
}

export interface ParseResult {
  command?: "summary" | "delete" | "help" | "list" | "wallet" | "budget" | "upgrade";
  deleteId?: number;
  transactions?: ParsedTransaction[];
  raw: string;
}

// Income keywords
const INCOME_KEYWORDS = [
  "รับ", "รายรับ", "เงินเดือน", "โบนัส", "ค่าจ้าง", "รายได้", "ขาย", "โอนเข้า",
  "income", "salary", "bonus", "receive", "received",
];

// Category hints based on keywords
const CATEGORY_HINTS: Record<string, string> = {
  // Food & Drink
  "ข้าว": "อาหาร", "อาหาร": "อาหาร", "กาแฟ": "เครื่องดื่ม", "ชา": "เครื่องดื่ม",
  "น้ำ": "เครื่องดื่ม", "ขนม": "อาหาร", "ก๋วยเตี๋ยว": "อาหาร", "ส้มตำ": "อาหาร",
  "ข้าวมันไก่": "อาหาร", "ข้าวผัด": "อาหาร", "บะหมี่": "อาหาร", "ลาบ": "อาหาร",
  "สเต็ก": "อาหาร", "พิซซ่า": "อาหาร", "ชาบู": "อาหาร", "หมูกระทะ": "อาหาร",
  "mcdonald": "อาหาร", "kfc": "อาหาร", "pizza": "อาหาร", "starbucks": "เครื่องดื่ม",
  "cafe": "เครื่องดื่ม", "coffee": "เครื่องดื่ม",
  // Transport
  "grab": "เดินทาง", "bolt": "เดินทาง", "แกร็บ": "เดินทาง", "แท็กซี่": "เดินทาง",
  "รถ": "เดินทาง", "น้ำมัน": "เดินทาง", "บีทีเอส": "เดินทาง", "mrt": "เดินทาง",
  "bts": "เดินทาง", "taxi": "เดินทาง", "uber": "เดินทาง", "ค่ารถ": "เดินทาง",
  "ค่าน้ำมัน": "เดินทาง", "ที่จอดรถ": "เดินทาง",
  // Shopping
  "ช้อปปิ้ง": "ช้อปปิ้ง", "เสื้อ": "ช้อปปิ้ง", "กางเกง": "ช้อปปิ้ง", "รองเท้า": "ช้อปปิ้ง",
  "กระเป๋า": "ช้อปปิ้ง", "lazada": "ช้อปปิ้ง", "shopee": "ช้อปปิ้ง", "amazon": "ช้อปปิ้ง",
  // Bills
  "ค่าน้ำ": "บิล/ค่าใช้จ่าย", "ค่าไฟ": "บิล/ค่าใช้จ่าย", "ค่าเน็ต": "บิล/ค่าใช้จ่าย",
  "ค่าโทรศัพท์": "บิล/ค่าใช้จ่าย", "ค่าเช่า": "บิล/ค่าใช้จ่าย", "ประกัน": "บิล/ค่าใช้จ่าย",
  "internet": "บิล/ค่าใช้จ่าย", "netflix": "บันเทิง", "spotify": "บันเทิง",
  // Health
  "ยา": "สุขภาพ", "หมอ": "สุขภาพ", "โรงพยาบาล": "สุขภาพ", "คลินิก": "สุขภาพ",
  "วิตามิน": "สุขภาพ", "gym": "สุขภาพ", "ฟิตเนส": "สุขภาพ",
  // Entertainment
  "หนัง": "บันเทิง", "คอนเสิร์ต": "บันเทิง", "เกม": "บันเทิง", "สวนสนุก": "บันเทิง",
  // Income
  "เงินเดือน": "เงินเดือน", "โบนัส": "เงินเดือน", "ค่าจ้าง": "เงินเดือน",
  "ขาย": "รายได้อื่น", "รับ": "รายได้อื่น",
};

// Command keywords
const COMMANDS: Record<string, ParseResult["command"]> = {
  "สรุป": "summary", "summary": "summary", "ดูสรุป": "summary", "รายงาน": "summary",
  "ช่วยเหลือ": "help", "help": "help", "วิธีใช้": "help", "คำสั่ง": "help",
  "รายการ": "list", "ดูรายการ": "list", "list": "list", "ประวัติ": "list",
  "กระเป๋า": "wallet", "wallet": "wallet", "ดูกระเป๋า": "wallet",
  "งบ": "budget", "budget": "budget", "ดูงบ": "budget",
  "อัพเกรด": "upgrade", "upgrade": "upgrade", "pro": "upgrade", "สมัครโปร": "upgrade",
};

function extractCategoryHint(text: string): string | undefined {
  const lower = text.toLowerCase();
  for (const [keyword, category] of Object.entries(CATEGORY_HINTS)) {
    if (lower.includes(keyword.toLowerCase())) return category;
  }
  return undefined;
}

function isIncomeKeyword(text: string): boolean {
  const lower = text.toLowerCase();
  return INCOME_KEYWORDS.some((kw) => lower.startsWith(kw.toLowerCase()));
}

function parseAmount(text: string): number | null {
  // Remove commas, handle Thai numbers
  const cleaned = text.replace(/,/g, "").replace(/บาท/g, "").trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

/**
 * Parse a single token pair like "ข้าว 80"
 */
function parseTokenPair(description: string, amountStr: string, defaultType: "income" | "expense"): ParsedTransaction | null {
  const amount = parseAmount(amountStr);
  if (!amount || amount <= 0) return null;

  const isIncome = isIncomeKeyword(description);
  const type = isIncome ? "income" : defaultType;
  const categoryHint = extractCategoryHint(description);

  return {
    type,
    amount,
    description: description.trim(),
    categoryHint,
  };
}

/**
 * Main parser function
 */
export function parseLineMessage(message: string): ParseResult {
  const trimmed = message.trim();
  const lower = trimmed.toLowerCase();

  // Check for delete command: "ลบ 5" or "delete 5"
  const deleteMatch = trimmed.match(/^(ลบ|delete|del)\s+(\d+)$/i);
  if (deleteMatch) {
    return { command: "delete", deleteId: parseInt(deleteMatch[2]!), raw: trimmed };
  }

  // Check for commands
  for (const [keyword, command] of Object.entries(COMMANDS)) {
    if (lower === keyword.toLowerCase() || lower.startsWith(keyword.toLowerCase() + " ")) {
      return { command, raw: trimmed };
    }
  }

  // Check for income prefix: "รับ 5000" or "income 5000"
  const incomeMatch = trimmed.match(/^(รับ|รายรับ|income|receive)\s+([\d,]+(?:\.\d+)?)\s*(.*)$/i);
  if (incomeMatch) {
    const amount = parseAmount(incomeMatch[2]!);
    if (amount && amount > 0) {
      const desc = incomeMatch[3]?.trim() || incomeMatch[1]!;
      return {
        transactions: [{
          type: "income",
          amount,
          description: desc || "รายรับ",
          categoryHint: extractCategoryHint(desc) || "รายได้อื่น",
        }],
        raw: trimmed,
      };
    }
  }

  // Try to parse multiple items: "ข้าว 80 grab 120 กาแฟ 65"
  // Pattern: alternating text and numbers
  const tokens = trimmed.split(/\s+/);
  const parsedItems: ParsedTransaction[] = [];

  let i = 0;
  while (i < tokens.length) {
    const token = tokens[i]!;
    const amount = parseAmount(token);

    if (amount !== null && amount > 0) {
      // Number without preceding text → use previous context or "อื่นๆ"
      const desc = parsedItems.length > 0 ? "อื่นๆ" : "รายจ่าย";
      parsedItems.push({
        type: "expense",
        amount,
        description: desc,
        categoryHint: "อื่นๆ",
      });
      i++;
    } else {
      // Text token - look ahead for amount
      let descParts = [token];
      let j = i + 1;

      // Collect consecutive text tokens
      while (j < tokens.length && parseAmount(tokens[j]!) === null) {
        descParts.push(tokens[j]!);
        j++;
      }

      if (j < tokens.length) {
        const nextAmount = parseAmount(tokens[j]!);
        if (nextAmount !== null && nextAmount > 0) {
          const desc = descParts.join(" ");
          const isIncome = isIncomeKeyword(desc);
          parsedItems.push({
            type: isIncome ? "income" : "expense",
            amount: nextAmount,
            description: desc,
            categoryHint: extractCategoryHint(desc),
          });
          i = j + 1;
          continue;
        }
      }

      // No amount found after text - skip
      i = j;
    }
  }

  if (parsedItems.length > 0) {
    return { transactions: parsedItems, raw: trimmed };
  }

  // Fallback: couldn't parse
  return { raw: trimmed };
}

/**
 * Format currency in Thai style
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("th-TH", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Get date range for period
 */
export function getDateRange(period: "today" | "week" | "month"): { start: Date; end: Date } {
  const now = new Date();
  const start = new Date(now);
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);

  if (period === "today") {
    start.setHours(0, 0, 0, 0);
  } else if (period === "week") {
    const day = now.getDay();
    start.setDate(now.getDate() - day);
    start.setHours(0, 0, 0, 0);
  } else if (period === "month") {
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    end.setMonth(end.getMonth() + 1, 0);
  }

  return { start, end };
}
