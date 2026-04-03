import { Router } from "express";
import crypto from "crypto";
import {
  createTransaction,
  deleteTransaction,
  ensureDefaultCategories,
  ensureDefaultWallet,
  getBudgets,
  getCategories,
  getDefaultWallet,
  getLineUser,
  getRecurringBills,
  getTransactionSummary,
  getTransactions,
  upsertLineUser,
} from "./db";
import {
  ParsedTransaction,
  formatCurrency,
  getDateRange,
  parseLineMessage,
} from "./lineParser";

const router = Router();

// LINE API helpers
async function sendLineMessage(lineUserId: string, messages: object[]) {
  const channelToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!channelToken) {
    console.warn("[LINE] No access token configured");
    return;
  }
  try {
    const res = await fetch("https://api.line.me/v2/bot/message/push", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${channelToken}`,
      },
      body: JSON.stringify({ to: lineUserId, messages }),
    });
    if (!res.ok) {
      const err = await res.text();
      console.error("[LINE] Push message error:", err);
    }
  } catch (e) {
    console.error("[LINE] Push message exception:", e);
  }
}

async function replyLineMessage(replyToken: string, messages: object[]) {
  const channelToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!channelToken) return;
  try {
    await fetch("https://api.line.me/v2/bot/message/reply", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${channelToken}`,
      },
      body: JSON.stringify({ replyToken, messages }),
    });
  } catch (e) {
    console.error("[LINE] Reply error:", e);
  }
}

function verifySignature(body: string, signature: string): boolean {
  const secret = process.env.LINE_CHANNEL_SECRET;
  if (!secret) return true; // Skip in dev
  const hash = crypto.createHmac("sha256", secret).update(body).digest("base64");
  return hash === signature;
}

// Build summary flex message
async function buildSummaryMessage(lineUserId: string, period: "today" | "week" | "month") {
  const { start, end } = getDateRange(period);
  const summary = await getTransactionSummary(lineUserId, start, end);
  const periodLabel = period === "today" ? "วันนี้" : period === "week" ? "สัปดาห์นี้" : "เดือนนี้";

  const color = summary.balance >= 0 ? "#10b981" : "#ef4444";
  const balanceText = summary.balance >= 0 ? `+฿${formatCurrency(summary.balance)}` : `-฿${formatCurrency(Math.abs(summary.balance))}`;

  return {
    type: "flex",
    altText: `สรุป${periodLabel}: รับ ฿${formatCurrency(summary.income)} จ่าย ฿${formatCurrency(summary.expense)}`,
    contents: {
      type: "bubble",
      styles: { header: { backgroundColor: "#6366f1" } },
      header: {
        type: "box",
        layout: "vertical",
        contents: [
          { type: "text", text: "📊 Mae Lamiet", color: "#ffffff", size: "sm", weight: "bold" },
          { type: "text", text: `สรุป${periodLabel}`, color: "#ffffff", size: "xl", weight: "bold" },
        ],
      },
      body: {
        type: "box",
        layout: "vertical",
        spacing: "md",
        contents: [
          {
            type: "box", layout: "horizontal",
            contents: [
              { type: "text", text: "💚 รายรับ", flex: 1, size: "md" },
              { type: "text", text: `฿${formatCurrency(summary.income)}`, color: "#10b981", size: "md", weight: "bold", align: "end" },
            ],
          },
          {
            type: "box", layout: "horizontal",
            contents: [
              { type: "text", text: "❤️ รายจ่าย", flex: 1, size: "md" },
              { type: "text", text: `฿${formatCurrency(summary.expense)}`, color: "#ef4444", size: "md", weight: "bold", align: "end" },
            ],
          },
          { type: "separator" },
          {
            type: "box", layout: "horizontal",
            contents: [
              { type: "text", text: "💰 คงเหลือ", flex: 1, size: "md", weight: "bold" },
              { type: "text", text: balanceText, color, size: "md", weight: "bold", align: "end" },
            ],
          },
        ],
      },
      footer: {
        type: "box", layout: "vertical",
        contents: [
          {
            type: "button", style: "primary", color: "#6366f1",
            action: { type: "uri", label: "เปิดแอปแม่ละเมียด", uri: process.env.APP_URL || "https://maelamiet.app" },
          },
        ],
      },
    },
  };
}

// Build confirmation message for new transaction
function buildTransactionConfirmMessage(items: ParsedTransaction[], total: number) {
  const lines = items.map((t) => {
    const icon = t.type === "income" ? "💚" : "❤️";
    return `${icon} ${t.description}: ฿${formatCurrency(t.amount)}`;
  });

  return {
    type: "flex",
    altText: `บันทึก ${items.length} รายการ รวม ฿${formatCurrency(total)}`,
    contents: {
      type: "bubble",
      body: {
        type: "box",
        layout: "vertical",
        spacing: "sm",
        contents: [
          { type: "text", text: "✅ บันทึกแล้ว!", weight: "bold", size: "lg", color: "#10b981" },
          ...lines.map((line) => ({ type: "text" as const, text: line, size: "sm", wrap: true })),
          { type: "separator" },
          { type: "text", text: `รวม: ฿${formatCurrency(total)}`, weight: "bold", size: "md" },
        ],
      },
    },
  };
}

// Build help message
function buildHelpMessage(isPro: boolean) {
  const proFeatures = isPro
    ? "\n📊 สรุป / สรุปสัปดาห์ / สรุปเดือน\n📋 รายการ - ดูประวัติ\n💼 กระเป๋า - ดูกระเป๋าเงิน"
    : "\n⭐ อัพเกรด / upgrade - สมัคร Pro Plan";

  return {
    type: "text",
    text: `🤖 Mae Lamiet - วิธีใช้\n\n📝 บันทึกรายจ่าย:\nข้าว 80\ngrab 120\nข้าว 80 กาแฟ 65\n\n💰 บันทึกรายรับ:\nรับ 5000\nเงินเดือน 20000\n\n📊 คำสั่งอื่น:\nสรุป - สรุปวันนี้\n🗑️ ลบ [เลข] - ลบรายการ${proFeatures}`,
  };
}

// Build recent transactions message
async function buildRecentTransactionsMessage(lineUserId: string) {
  const txns = await getTransactions(lineUserId, { limit: 5 });
  if (txns.length === 0) {
    return { type: "text", text: "ยังไม่มีรายการ เริ่มบันทึกได้เลย!\nตัวอย่าง: ข้าว 80" };
  }

  const lines = txns.map((t, i) => {
    const icon = t.type === "income" ? "💚" : "❤️";
    const date = new Date(t.transactionDate).toLocaleDateString("th-TH", { month: "short", day: "numeric" });
    return `${i + 1}. ${icon} ${t.description || "ไม่ระบุ"}: ฿${formatCurrency(parseFloat(t.amount))} (${date})`;
  });

  return {
    type: "text",
    text: `📋 5 รายการล่าสุด:\n\n${lines.join("\n")}\n\nพิมพ์ "ลบ [เลข]" เพื่อลบรายการ`,
  };
}

// Process incoming LINE message
async function processMessage(lineUserId: string, displayName: string, text: string, replyToken: string) {
  // Upsert LINE user
  const lineUser = await upsertLineUser(lineUserId, displayName);
  const isPro = lineUser.plan === "pro";

  // Ensure defaults
  await ensureDefaultCategories(lineUserId);
  const wallet = await ensureDefaultWallet(lineUserId);

  const parsed = parseLineMessage(text);

  // Handle commands
  if (parsed.command) {
    switch (parsed.command) {
      case "help":
        await replyLineMessage(replyToken, [buildHelpMessage(isPro)]);
        return;

      case "summary": {
        const msg = await buildSummaryMessage(lineUserId, "today");
        await replyLineMessage(replyToken, [msg]);
        return;
      }

      case "list": {
        const msg = await buildRecentTransactionsMessage(lineUserId);
        await replyLineMessage(replyToken, [msg]);
        return;
      }

      case "wallet": {
        const walletList = await getTransactionSummary(lineUserId, getDateRange("month").start, getDateRange("month").end);
        await replyLineMessage(replyToken, [{
          type: "text",
          text: `👛 ${wallet?.name || "กระเป๋าหลัก"}\n\n💰 เดือนนี้:\nรายรับ: ฿${formatCurrency(walletList.income)}\nรายจ่าย: ฿${formatCurrency(walletList.expense)}\nคงเหลือ: ฿${formatCurrency(walletList.balance)}`,
        }]);
        return;
      }

      case "upgrade": {
        await replyLineMessage(replyToken, [{
          type: "flex",
          altText: "สมัคร Mae Lamiet Pro",
          contents: {
            type: "bubble",
            styles: { header: { backgroundColor: "#f59e0b" } },
            header: {
              type: "box", layout: "vertical",
              contents: [
                { type: "text", text: "⭐ Mae Lamiet Pro", color: "#ffffff", weight: "bold", size: "xl" },
              ],
            },
            body: {
              type: "box", layout: "vertical", spacing: "sm",
              contents: [
                { type: "text", text: "ฟีเจอร์ Pro Plan:", weight: "bold" },
                { type: "text", text: "📊 วิเคราะห์เชิงลึก", size: "sm" },
                { type: "text", text: "📄 Export PDF", size: "sm" },
                { type: "text", text: "🔔 แจ้งเตือนเกินงบ", size: "sm" },
                { type: "text", text: "📷 สแกนใบเสร็จ (เร็วๆ นี้)", size: "sm" },
                { type: "text", text: "💼 หลายกระเป๋า", size: "sm" },
              ],
            },
            footer: {
              type: "box", layout: "vertical",
              contents: [{
                type: "button", style: "primary", color: "#f59e0b",
                action: { type: "uri", label: "สมัคร Pro - ฿99/เดือน", uri: `${process.env.APP_URL || "https://maelamiet.app"}/upgrade` },
              }],
            },
          },
        }]);
        return;
      }

      case "delete": {
        if (parsed.deleteId) {
          const txns = await getTransactions(lineUserId, { limit: 10 });
          const target = txns[parsed.deleteId - 1];
          if (target) {
            await deleteTransaction(target.id, lineUserId);
            await replyLineMessage(replyToken, [{
              type: "text",
              text: `🗑️ ลบรายการแล้ว:\n${target.description || "ไม่ระบุ"}: ฿${formatCurrency(parseFloat(target.amount))}`,
            }]);
          } else {
            await replyLineMessage(replyToken, [{ type: "text", text: "ไม่พบรายการที่ต้องการลบ\nพิมพ์ 'รายการ' เพื่อดูรายการล่าสุด" }]);
          }
        }
        return;
      }
    }
  }

  // Handle transactions
  if (parsed.transactions && parsed.transactions.length > 0) {
    const categories = await getCategories(lineUserId);
    const savedItems: ParsedTransaction[] = [];

    for (const item of parsed.transactions) {
      // Find category by hint
      let categoryId: number | undefined;
      if (item.categoryHint) {
        const cat = categories.find((c) => c.name === item.categoryHint);
        categoryId = cat?.id;
      }

      await createTransaction({
        lineUserId,
        walletId: wallet?.id,
        categoryId,
        type: item.type,
        amount: item.amount.toString(),
        description: item.description,
        source: "line",
      });
      savedItems.push(item);
    }

    const total = savedItems.reduce((sum, t) => sum + t.amount, 0);
    const confirmMsg = buildTransactionConfirmMessage(savedItems, total);

    // Check budget alerts (Pro only)
    const messages: object[] = [confirmMsg];
    if (isPro) {
      const budgetList = await getBudgets(lineUserId);
      // Simple budget check - could be enhanced
      for (const budget of budgetList) {
        const { start, end } = getDateRange("month");
        const summary = await getTransactionSummary(lineUserId, start, end);
        const budgetAmount = parseFloat(budget.amount);
        const threshold = budget.alertThreshold ?? 80;
        if (summary.expense >= budgetAmount * (threshold / 100)) {
          messages.push({
            type: "text",
            text: `⚠️ แจ้งเตือน: ${budget.name}\nใช้ไปแล้ว ฿${formatCurrency(summary.expense)} จากงบ ฿${formatCurrency(budgetAmount)} (${Math.round((summary.expense / budgetAmount) * 100)}%)`,
          });
        }
      }
    }

    await replyLineMessage(replyToken, messages);
    return;
  }

  // Fallback
  await replyLineMessage(replyToken, [{
    type: "text",
    text: `ไม่เข้าใจคำสั่ง 🤔\nพิมพ์ "ช่วยเหลือ" เพื่อดูวิธีใช้\n\nตัวอย่าง:\nข้าว 80\ngrab 120\nรับ 5000`,
  }]);
}

// Webhook endpoint
router.post("/webhook/line", async (req, res) => {
  const signature = req.headers["x-line-signature"] as string;
  const rawBody = JSON.stringify(req.body);

  if (!verifySignature(rawBody, signature)) {
    return res.status(401).json({ error: "Invalid signature" });
  }

  res.status(200).json({ status: "ok" });

  const events = req.body?.events || [];
  for (const event of events) {
    try {
      if (event.type === "message" && event.message?.type === "text") {
        const lineUserId = event.source?.userId;
        const displayName = event.source?.displayName || "ผู้ใช้";
        const text = event.message.text;
        const replyToken = event.replyToken;
        if (lineUserId && text) {
          await processMessage(lineUserId, displayName, text, replyToken);
        }
      } else if (event.type === "follow") {
        const lineUserId = event.source?.userId;
        if (lineUserId) {
          await upsertLineUser(lineUserId);
          await ensureDefaultCategories(lineUserId);
          await ensureDefaultWallet(lineUserId);
          await replyLineMessage(event.replyToken, [{
            type: "text",
            text: "🎉 ยินดีต้อนรับสู่ Mae Lamiet!\n\nแอปบันทึกรายรับรายจ่ายผ่าน LINE\n\nเริ่มต้นง่ายๆ:\nพิมพ์ 'ข้าว 80' เพื่อบันทึกรายจ่าย\nพิมพ์ 'รับ 5000' เพื่อบันทึกรายรับ\nพิมพ์ 'ช่วยเหลือ' เพื่อดูคำสั่งทั้งหมด",
          }]);
        }
      }
    } catch (err) {
      console.error("[LINE Webhook] Error processing event:", err);
    }
  }
});

// Push notification helper (for Pro users)
export async function sendLineNotification(lineUserId: string, title: string, body: string) {
  await sendLineMessage(lineUserId, [{
    type: "text",
    text: `🔔 ${title}\n\n${body}`,
  }]);
}

export default router;
