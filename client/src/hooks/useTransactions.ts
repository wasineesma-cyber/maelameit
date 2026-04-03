import { useState, useCallback } from "react";
import type { Transaction } from "@shared/types";
import {
  loadTransactions,
  persistTransaction,
  removeTransaction,
  clearAllTransactions,
} from "@/lib/storage";
import { nanoid } from "@/lib/utils";

export function useTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>(
    loadTransactions
  );

  const addTransaction = useCallback(
    (data: Omit<Transaction, "id" | "createdAt">) => {
      const t: Transaction = {
        ...data,
        id: nanoid(),
        createdAt: new Date().toISOString(),
      };
      persistTransaction(t);
      setTransactions(loadTransactions());
    },
    []
  );

  const deleteTransaction = useCallback((id: string) => {
    removeTransaction(id);
    setTransactions(loadTransactions());
  }, []);

  const clearAll = useCallback(() => {
    clearAllTransactions();
    setTransactions([]);
  }, []);

  return { transactions, addTransaction, deleteTransaction, clearAll };
}
