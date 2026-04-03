import { useState } from "react";
import { Router, Route, Switch } from "wouter";
import { Layout } from "@/components/Layout";
import { AddTransactionModal } from "@/components/AddTransactionModal";
import { Dashboard } from "@/pages/Dashboard";
import { Transactions } from "@/pages/Transactions";
import { useTransactions } from "@/hooks/useTransactions";

export function App() {
  const [showAdd, setShowAdd] = useState(false);
  const { transactions, addTransaction, deleteTransaction } = useTransactions();

  return (
    <Router>
      <Layout onAddClick={() => setShowAdd(true)}>
        <Switch>
          <Route path="/" component={() => (
            <Dashboard
              transactions={transactions}
              onAddClick={() => setShowAdd(true)}
            />
          )} />
          <Route path="/transactions" component={() => (
            <Transactions
              transactions={transactions}
              onDelete={deleteTransaction}
            />
          )} />
          <Route>
            <Dashboard
              transactions={transactions}
              onAddClick={() => setShowAdd(true)}
            />
          </Route>
        </Switch>
      </Layout>

      {showAdd && (
        <AddTransactionModal
          onClose={() => setShowAdd(false)}
          onSave={(data) => {
            addTransaction(data);
            setShowAdd(false);
          }}
        />
      )}
    </Router>
  );
}
