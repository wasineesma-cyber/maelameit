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

  const incomeMatch = trimmed.match(/^(รับ|รายรับ|income|receive)\s+([\d,]+(?:\.\d+)?)\s*(.*)$/i);
  if (incomeMatch) {
    const amount = parseAmount(incomeMatch[2] ?? "");
    if (!amount || amount <= 0) return [];
    const desc = (incomeMatch[3] ?? "").trim() || "รายรับ";
    return [{ type: "income", amount, description: desc, categoryId: null }];
  }

  const tokens = trimmed.split(/\s+/).filter(Boolean);
  const items: LocalParsedItem[] = [];

  let i = 0;
  while (i < tokens.length) {
    const token = tokens[i] ?? "";
    const amountAsFirst = parseAmount(token);

    if (amountAsFirst !== null && amountAsFirst > 0) {
      items.push({
        type: "expense",
        amount: amountAsFirst,
        description: "รายจ่าย",
        categoryId: null,
      });
      i++;
      continue;
    }

    let descParts = [token];
    let j = i + 1;
    while (j < tokens.length && parseAmount(tokens[j] ?? "") === null) {
      descParts.push(tokens[j] ?? "");
      j++;
    }

    if (j < tokens.length) {
      const amount = parseAmount(tokens[j] ?? "");
      if (amount !== null && amount > 0) {
        items.push({
          type: "expense",
          amount,
          description: descParts.join(" ").trim() || "รายจ่าย",
          categoryId: null,
        });
        i = j + 1;
        continue;
      }
    }

    i = j;
  }

  return items;
}
