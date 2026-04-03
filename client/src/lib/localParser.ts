export type LocalParsedItem = {
  type: "income" | "expense";
  amount: number;
  description: string;
  categoryId: number | null;
};

function parseAmount(raw: string): number | null {
  const cleaned = raw.replace(/,/g, "").replace(/บาท/g, "").trim();
  if (!cleaned) return null;
  const num = Number.parseFloat(cleaned);
  if (Number.isNaN(num) || !Number.isFinite(num)) return null;
  return num;
}

export function parseQuickEntryText(text: string): LocalParsedItem[] {
  const trimmed = text.trim();
  if (!trimmed) return [];

  const items: LocalParsedItem[] = [];
  
  // Split by common separators like comma, newline, or "และ" (and)
  const segments = trimmed.split(/,|\n|และ/).map(s => s.trim()).filter(Boolean);

  for (const segment of segments) {
    // 1. Check for Income (e.g., "รายได้ 500", "แม่ให้มา 1000")
    const incomeKeywords = ["รับ", "รายได้", "ได้เงิน", "แม่ให้", "เงินเดือน", "โบนัส", "กำไร"];
    const isIncome = incomeKeywords.some(k => segment.startsWith(k)) || segment.includes("รายรับ");

    // 2. Extract Amount (handles "100", "100.50", "1,000")
    const amountMatch = segment.match(/(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?)/);
    const amount = amountMatch ? parseAmount(amountMatch[0]) : null;

    if (amount !== null && amount > 0) {
      // 3. Extract Description
      // Remove the amount and some common stop words/suffixes
      let description = segment
        .replace(amountMatch![0], "")
        .replace(/บาท/g, "")
        .replace(/รับ|จ่าย|ค่า/g, "")
        .trim();

      if (!description) {
        description = isIncome ? "รายรับ" : "รายจ่าย";
      }

      items.push({
        type: isIncome ? "income" : "expense",
        amount,
        description,
        categoryId: null, // Basic parser doesn't guess category ID yet
      });
    }
  }

  // Fallback: If no segments worked but there are numbers
  if (items.length === 0) {
    const numbers = trimmed.match(/(\d+(?:\.\d+)?)/g);
    if (numbers) {
      for (const numStr of numbers) {
        const amount = parseAmount(numStr);
        if (amount && amount > 0) {
          items.push({
            type: "expense",
            amount,
            description: trimmed.replace(numStr, "").replace(/บาท/g, "").trim() || "รายจ่าย",
            categoryId: null
          });
        }
      }
    }
  }

  return items;
}
