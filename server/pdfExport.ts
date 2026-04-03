import express from "express";
import { getTransactions, getTransactionSummary, getTransactionsByCategory, getLineUser } from "./db";

const router = express.Router();

router.get("/export/pdf/:lineUserId", async (req, res) => {
  try {
    const { lineUserId } = req.params;
    const { period = "month" } = req.query;

    const lineUser = await getLineUser(lineUserId);
    if (!lineUser) {
      return res.status(404).json({ error: "User not found" });
    }
    if (lineUser.plan !== "pro") {
      return res.status(403).json({ error: "Pro plan required" });
    }

    const now = new Date();
    let start: Date, end: Date;
    if (period === "week") {
      const day = now.getDay();
      start = new Date(now); start.setDate(now.getDate() - day); start.setHours(0, 0, 0, 0);
      end = new Date(now); end.setHours(23, 59, 59, 999);
    } else {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    }

    const [summary, byCategory, txns] = await Promise.all([
      getTransactionSummary(lineUserId, start, end),
      getTransactionsByCategory(lineUserId, start, end),
      getTransactions(lineUserId, { limit: 100 }),
    ]);

    const periodLabel = period === "week" ? "สัปดาห์นี้" : `${start.toLocaleDateString("th-TH", { month: "long", year: "numeric" })}`;
    const income = parseFloat(summary.income?.toString() ?? "0");
    const expense = parseFloat(summary.expense?.toString() ?? "0");
    const balance = income - expense;

    const formatCurrency = (n: number) =>
      new Intl.NumberFormat("th-TH", { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(n);

    const txRows = txns.slice(0, 50).map((t) => `
      <tr>
        <td>${new Date(t.transactionDate).toLocaleDateString("th-TH")}</td>
        <td>${t.description || "-"}</td>
        <td style="color:${t.type === "income" ? "#10b981" : "#ef4444"}">${t.type === "income" ? "รายรับ" : "รายจ่าย"}</td>
        <td style="text-align:right;font-weight:600;color:${t.type === "income" ? "#10b981" : "#ef4444"}">
          ${t.type === "income" ? "+" : "-"}฿${formatCurrency(parseFloat(t.amount))}
        </td>
      </tr>
    `).join("");

    const html = `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8"/>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;600;700&display=swap');
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family:'Sarabun',sans-serif; color:#1f2937; background:#fff; padding:32px; }
    .header { text-align:center; margin-bottom:32px; }
    .header h1 { font-size:28px; font-weight:700; color:#7c3aed; }
    .header p { color:#6b7280; margin-top:4px; }
    .summary { display:grid; grid-template-columns:1fr 1fr 1fr; gap:16px; margin-bottom:32px; }
    .summary-card { border-radius:12px; padding:16px; text-align:center; }
    .income-card { background:#ecfdf5; border:1px solid #a7f3d0; }
    .expense-card { background:#fef2f2; border:1px solid #fecaca; }
    .balance-card { background:#eff6ff; border:1px solid #bfdbfe; }
    .summary-card .label { font-size:13px; margin-bottom:6px; }
    .summary-card .amount { font-size:22px; font-weight:700; }
    .income-card .label { color:#065f46; } .income-card .amount { color:#059669; }
    .expense-card .label { color:#991b1b; } .expense-card .amount { color:#dc2626; }
    .balance-card .label { color:#1e40af; } .balance-card .amount { color:#2563eb; }
    table { width:100%; border-collapse:collapse; margin-top:16px; }
    th { background:#f3f4f6; padding:10px 12px; text-align:left; font-size:13px; color:#374151; }
    td { padding:10px 12px; border-bottom:1px solid #f3f4f6; font-size:13px; }
    tr:hover td { background:#f9fafb; }
    .section-title { font-size:16px; font-weight:600; color:#374151; margin-bottom:8px; }
    .footer { text-align:center; margin-top:32px; color:#9ca3af; font-size:12px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Mae Lamiet</h1>
    <p>รายงานรายรับ-รายจ่าย ${periodLabel}</p>
    <p>${lineUser.displayName || lineUserId}</p>
  </div>
  <div class="summary">
    <div class="summary-card income-card">
      <div class="label">รายรับ</div>
      <div class="amount">฿${formatCurrency(income)}</div>
    </div>
    <div class="summary-card expense-card">
      <div class="label">รายจ่าย</div>
      <div class="amount">฿${formatCurrency(expense)}</div>
    </div>
    <div class="summary-card balance-card">
      <div class="label">คงเหลือ</div>
      <div class="amount" style="color:${balance >= 0 ? "#2563eb" : "#dc2626"}">
        ${balance >= 0 ? "+" : ""}฿${formatCurrency(Math.abs(balance))}
      </div>
    </div>
  </div>
  <div class="section-title">รายการทั้งหมด</div>
  <table>
    <thead>
      <tr>
        <th>วันที่</th>
        <th>รายละเอียด</th>
        <th>ประเภท</th>
        <th style="text-align:right">จำนวน</th>
      </tr>
    </thead>
    <tbody>${txRows}</tbody>
  </table>
  <div class="footer">
    <p>สร้างโดย Mae Lamiet · ${new Date().toLocaleDateString("th-TH", { dateStyle: "long" })}</p>
  </div>
</body>
</html>`;

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Content-Disposition", `inline; filename="mae-lamiet-report-${period}.html"`);
    res.send(html);
  } catch (err) {
    console.error("[PDF Export]", err);
    res.status(500).json({ error: "Export failed" });
  }
});

export default router;
