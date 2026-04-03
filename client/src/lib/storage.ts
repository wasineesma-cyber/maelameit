import type { Transaction } from "@shared/types";

const KEY = "maelameit_v1";

export function loadTransactions(): Transaction[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function persistTransaction(t: Transaction): void {
  const all = loadTransactions();
  all.unshift(t);
  localStorage.setItem(KEY, JSON.stringify(all));
}

export function removeTransaction(id: string): void {
  const all = loadTransactions().filter((t) => t.id !== id);
  localStorage.setItem(KEY, JSON.stringify(all));
}
