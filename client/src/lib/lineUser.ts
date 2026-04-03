// Helper to get/set LINE user ID from localStorage
const LINE_USER_KEY = "mae_lamiet_line_user_id";

export function getLineUserId(): string | null {
  return localStorage.getItem(LINE_USER_KEY);
}

export function setLineUserId(id: string): void {
  localStorage.setItem(LINE_USER_KEY, id);
}

export function clearLineUserId(): void {
  localStorage.removeItem(LINE_USER_KEY);
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("th-TH", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function getMonthRange(offset = 0): { start: Date; end: Date } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  const end = new Date(now.getFullYear(), now.getMonth() + offset + 1, 0, 23, 59, 59);
  return { start, end };
}
