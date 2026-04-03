export type LocalTransactionType = "income" | "expense";

export type LocalTransaction = {
  id: string;
  type: LocalTransactionType;
  amount: number;
  description: string;
  categoryId: number | null;
  transactionDate: string;
  source: "local";
};

function storageKey(ownerId: string) {
  return `mae_lamiet_local_txns:${ownerId}`;
}

export function getLocalTransactions(ownerId: string): LocalTransaction[] {
  if (typeof window === "undefined") return [];
  if (!ownerId) return [];

  const raw = window.localStorage.getItem(storageKey(ownerId));
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed as LocalTransaction[];
  } catch {
    return [];
  }
}

export function setLocalTransactions(ownerId: string, txns: LocalTransaction[]) {
  if (typeof window === "undefined") return;
  if (!ownerId) return;
  window.localStorage.setItem(storageKey(ownerId), JSON.stringify(txns));
}

export function addLocalTransactions(ownerId: string, items: Omit<LocalTransaction, "id">[]): LocalTransaction[] {
  const prev = getLocalTransactions(ownerId);
  const next: LocalTransaction[] = [
    ...items.map((t) => ({
      ...t,
      id: `${Date.now()}_${Math.random().toString(16).slice(2)}`,
    })),
    ...prev,
  ];
  setLocalTransactions(ownerId, next);
  return next;
}

export function deleteLocalTransaction(ownerId: string, id: string): LocalTransaction[] {
  const prev = getLocalTransactions(ownerId);
  const next = prev.filter((t) => t.id !== id);
  setLocalTransactions(ownerId, next);
  return next;
}
