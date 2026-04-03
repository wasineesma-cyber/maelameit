export type TransactionType = "income" | "expense";

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: string;
  categoryEmoji: string;
  note: string;
  date: string; // YYYY-MM-DD
  createdAt: string; // ISO
}
