import { COOKIE_NAME } from "@shared/const";
import Stripe from "stripe";
import { ENV } from "./_core/env";
import { PRODUCTS, type ProductId } from "./products";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  createBudget,
  createCategory,
  createRecurringBill,
  createTransaction,
  createWallet,
  deleteCategory,
  deleteRecurringBill,
  deleteTransaction,
  ensureDefaultCategories,
  getBudgets,
  getCategories,
  getDefaultWallet,
  getRecurringBills,
  getTransactionSummary,
  getTransactions,
  getTransactionsByCategory,
  getTransactionsByWallet,
  getTopTags,
  getWallets,
  updateTransaction,
  DEFAULT_EXPENSE_CATEGORIES,
  DEFAULT_INCOME_CATEGORIES,
} from "./db";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";

// ─── Analytics Router ─────────────────────────────────────────────────────────
const analyticsRouter = router({
  summary: publicProcedure
    .input(z.object({
      lineUserId: z.string(),
      period: z.enum(["today", "week", "month", "custom"]).default("month"),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    }))
    .query(async ({ input }) => {
      let start: Date, end: Date;
      const now = new Date();

      if (input.period === "today") {
        start = new Date(now); start.setHours(0, 0, 0, 0);
        end = new Date(now); end.setHours(23, 59, 59, 999);
      } else if (input.period === "week") {
        const day = now.getDay();
        start = new Date(now); start.setDate(now.getDate() - day); start.setHours(0, 0, 0, 0);
        end = new Date(now); end.setHours(23, 59, 59, 999);
      } else if (input.period === "custom" && input.startDate && input.endDate) {
        start = new Date(input.startDate);
        end = new Date(input.endDate);
      } else {
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      }

      const summary = await getTransactionSummary(input.lineUserId, start, end);
      const byCategory = await getTransactionsByCategory(input.lineUserId, start, end);
      return { summary, byCategory, period: input.period, startDate: start, endDate: end };
    }),

  monthly: publicProcedure
    .input(z.object({ lineUserId: z.string(), months: z.number().default(6) }))
    .query(async ({ input }) => {
      const results = [];
      const now = new Date();
      for (let i = input.months - 1; i >= 0; i--) {
        const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
        const summary = await getTransactionSummary(input.lineUserId, start, end);
        results.push({
          month: start.toLocaleDateString("th-TH", { month: "short", year: "2-digit" }),
          ...summary,
        });
      }
      return results;
    }),

  walletBreakdown: publicProcedure
    .input(z.object({
      lineUserId: z.string(),
      period: z.enum(["today", "week", "month"]).default("month"),
    }))
    .query(async ({ input }) => {
      const now = new Date();
      let start: Date, end: Date;
      if (input.period === "today") {
        start = new Date(now); start.setHours(0, 0, 0, 0);
        end = new Date(now); end.setHours(23, 59, 59, 999);
      } else if (input.period === "week") {
        const day = now.getDay();
        start = new Date(now); start.setDate(now.getDate() - day); start.setHours(0, 0, 0, 0);
        end = new Date(now); end.setHours(23, 59, 59, 999);
      } else {
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      }
      return getTransactionsByWallet(input.lineUserId, start, end);
    }),

  topTags: publicProcedure
    .input(z.object({
      lineUserId: z.string(),
      period: z.enum(["today", "week", "month"]).default("month"),
      limit: z.number().default(10),
    }))
    .query(async ({ input }) => {
      const now = new Date();
      let start: Date, end: Date;
      if (input.period === "today") {
        start = new Date(now); start.setHours(0, 0, 0, 0);
        end = new Date(now); end.setHours(23, 59, 59, 999);
      } else if (input.period === "week") {
        const day = now.getDay();
        start = new Date(now); start.setDate(now.getDate() - day); start.setHours(0, 0, 0, 0);
        end = new Date(now); end.setHours(23, 59, 59, 999);
      } else {
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      }
      return getTopTags(input.lineUserId, start, end, input.limit);
    }),
});

// ─── Transactions Router ──────────────────────────────────────────────────────
const transactionsRouter = router({
  list: publicProcedure
    .input(z.object({
      lineUserId: z.string(),
      limit: z.number().default(20),
      offset: z.number().default(0),
      type: z.enum(["income", "expense"]).optional(),
      categoryId: z.number().optional(),
      walletId: z.number().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    }))
    .query(async ({ input }) => {
      return getTransactions(input.lineUserId, {
        limit: input.limit,
        offset: input.offset,
        type: input.type,
        categoryId: input.categoryId,
        walletId: input.walletId,
        startDate: input.startDate ? new Date(input.startDate) : undefined,
        endDate: input.endDate ? new Date(input.endDate) : undefined,
      });
    }),

  create: publicProcedure
    .input(z.object({
      lineUserId: z.string().optional(),
      walletId: z.number().optional(),
      categoryId: z.number().optional(),
      type: z.enum(["income", "expense"]),
      amount: z.number().positive(),
      description: z.string().optional(),
      tags: z.string().optional(),
      note: z.string().optional(),
      source: z.enum(["line", "web", "api"]).default("web"),
      transactionDate: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      return createTransaction({
        ...input,
        amount: input.amount.toString(),
        transactionDate: input.transactionDate ? new Date(input.transactionDate) : undefined,
      });
    }),

  update: publicProcedure
    .input(z.object({
      id: z.number(),
      lineUserId: z.string(),
      categoryId: z.number().optional(),
      type: z.enum(["income", "expense"]).optional(),
      amount: z.number().positive().optional(),
      description: z.string().optional(),
      tags: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, lineUserId, amount, ...rest } = input;
      return updateTransaction(id, lineUserId, {
        ...rest,
        amount: amount ? amount.toString() : undefined,
      });
    }),

  delete: publicProcedure
    .input(z.object({ id: z.number(), lineUserId: z.string() }))
    .mutation(async ({ input }) => {
      return deleteTransaction(input.id, input.lineUserId);
    }),
});

// ─── Categories Router ────────────────────────────────────────────────────────
const categoriesRouter = router({
  list: publicProcedure
    .input(z.object({ lineUserId: z.string() }))
    .query(async ({ input }) => getCategories(input.lineUserId)),

  defaults: publicProcedure
    .query(() => ({
      expense: DEFAULT_EXPENSE_CATEGORIES,
      income: DEFAULT_INCOME_CATEGORIES,
    })),

  seed: publicProcedure
    .input(z.object({ lineUserId: z.string() }))
    .mutation(async ({ input }) => {
      await ensureDefaultCategories(input.lineUserId);
      return { success: true };
    }),

  create: publicProcedure
    .input(z.object({
      lineUserId: z.string(),
      name: z.string(),
      icon: z.string().optional(),
      color: z.string().optional(),
      type: z.enum(["income", "expense", "both"]).optional(),
    }))
    .mutation(async ({ input }) => createCategory(input)),

  delete: publicProcedure
    .input(z.object({ id: z.number(), lineUserId: z.string() }))
    .mutation(async ({ input }) => deleteCategory(input.id, input.lineUserId)),
});

// ─── Wallets Router ───────────────────────────────────────────────────────────
const walletsRouter = router({
  list: publicProcedure
    .input(z.object({ lineUserId: z.string() }))
    .query(async ({ input }) => getWallets(input.lineUserId)),

  create: publicProcedure
    .input(z.object({
      lineUserId: z.string(),
      name: z.string(),
      icon: z.string().optional(),
      color: z.string().optional(),
      isDefault: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => createWallet({ ...input, userId: 0 })),
});

// ─── Budgets Router ───────────────────────────────────────────────────────────
const budgetsRouter = router({
  list: publicProcedure
    .input(z.object({ lineUserId: z.string() }))
    .query(async ({ input }) => getBudgets(input.lineUserId)),

  create: publicProcedure
    .input(z.object({
      lineUserId: z.string(),
      categoryId: z.number().optional(),
      name: z.string(),
      amount: z.number().positive(),
      period: z.enum(["daily", "weekly", "monthly", "yearly"]).optional(),
      alertThreshold: z.number().min(1).max(100).optional(),
    }))
    .mutation(async ({ input }) => createBudget({ ...input, amount: input.amount.toString() })),
});

// ─── Recurring Bills Router ───────────────────────────────────────────────────
const recurringBillsRouter = router({
  list: publicProcedure
    .input(z.object({ lineUserId: z.string() }))
    .query(async ({ input }) => getRecurringBills(input.lineUserId)),

  create: publicProcedure
    .input(z.object({
      lineUserId: z.string(),
      name: z.string(),
      amount: z.number().positive(),
      dueDay: z.number().min(1).max(31),
      categoryId: z.number().optional(),
    }))
    .mutation(async ({ input }) => createRecurringBill({ ...input, amount: input.amount.toString() })),

  delete: publicProcedure
    .input(z.object({ id: z.number(), lineUserId: z.string() }))
    .mutation(async ({ input }) => deleteRecurringBill(input.id, input.lineUserId)),
});

// ─── AI Quick Entry Router ──────────────────────────────────────────────────────
const aiRouter = router({
  // แยกรายการจากข้อความ เช่น "ข้าว 80 grab 120"
  parseMessage: publicProcedure
    .input(z.object({
      lineUserId: z.string(),
      message: z.string(),
    }))
    .mutation(async ({ input }) => {
      const { invokeLLM } = await import("./_core/llm");
      const categories = await getCategories(input.lineUserId);
      const catList = categories.map(c => `${c.id}:${c.name}(${c.type})`).join(", ");

      const result = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `คุณเป็น AI ช่วยแยกรายการรายรับ-รายจ่ายจากข้อความภาษาไทย
หมวดหมู่ที่มี: ${catList}
ตอบเป็น JSON เท่านั้น ห้ามมีข้อความอื่น
รูปแบบ: {"items": [{"type": "income"|"expense", "amount": number, "description": string, "categoryId": number|null}]}`,
          },
          { role: "user", content: input.message },
        ],
        response_format: { type: "json_object" },
      });

      const content = result.choices[0]?.message?.content;
      if (!content || typeof content !== "string") return { items: [] };
      try {
        return JSON.parse(content) as { items: Array<{ type: "income" | "expense"; amount: number; description: string; categoryId: number | null }> };
      } catch {
        return { items: [] };
      }
    }),

  // แยกรายการจากรูปสลิป
  scanSlip: publicProcedure
    .input(z.object({
      lineUserId: z.string(),
      imageUrl: z.string().url(),
    }))
    .mutation(async ({ input }) => {
      const { invokeLLM } = await import("./_core/llm");
      const categories = await getCategories(input.lineUserId);
      const catList = categories.map(c => `${c.id}:${c.name}(${c.type})`).join(", ");

      const result = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `คุณเป็น AI อ่านสลิปโอนเงินและใบเสร็จ แยกรายการรายรับ-รายจ่าย
หมวดหมู่ที่มี: ${catList}
ตอบเป็น JSON เท่านั้น
รูปแบบ: {"items": [{"type": "income"|"expense", "amount": number, "description": string, "categoryId": number|null}]}`,
          },
          {
            role: "user",
            content: [
              { type: "text", text: "อ่านสลิปนี้และแยกรายการรายรับ-รายจ่าย" },
              { type: "image_url", image_url: { url: input.imageUrl, detail: "high" } },
            ],
          },
        ],
        response_format: { type: "json_object" },
      });

      const content = result.choices[0]?.message?.content;
      if (!content || typeof content !== "string") return { items: [] };
      try {
        return JSON.parse(content) as { items: Array<{ type: "income" | "expense"; amount: number; description: string; categoryId: number | null }> };
      } catch {
        return { items: [] };
      }
    }),

  // อัปโหลดรูปสลิปไปยัง S3
  uploadSlipImage: publicProcedure
    .input(z.object({
      lineUserId: z.string(),
      imageBase64: z.string(),
      mimeType: z.string().default("image/jpeg"),
    }))
    .mutation(async ({ input }) => {
      const { storagePut } = await import("./storage");
      const buffer = Buffer.from(input.imageBase64, "base64");
      const ext = input.mimeType.split("/")[1] || "jpg";
      const key = `slips/${input.lineUserId}/${Date.now()}.${ext}`;
      const { url } = await storagePut(key, buffer, input.mimeType);
      return { url };
    }),
});

/// ─── Payment Router ─────────────────────────────────────────────────────────
const paymentRouter = router({
  // สร้าง Stripe Checkout Session
  createCheckout: protectedProcedure
    .input(z.object({
      productId: z.enum(["PRO_MONTHLY", "PRO_YEARLY", "PRO_LIFETIME"]),
      origin: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (!ENV.stripeSecretKey) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Stripe ยังไม่ได้ตั้งค่า" });
      }
      const stripe = new Stripe(ENV.stripeSecretKey);
      const product = PRODUCTS[input.productId as ProductId];
      const user = ctx.user;

      const sessionConfig: Stripe.Checkout.SessionCreateParams = {
        payment_method_types: ["card"],
        line_items: [{
          price_data: {
            currency: product.currency,
            product_data: {
              name: product.name,
              description: product.description,
            },
            ...(product.interval
              ? {
                  recurring: { interval: product.interval },
                  unit_amount: product.price,
                }
              : { unit_amount: product.price }),
          },
          quantity: 1,
        }],
        mode: product.interval ? "subscription" : "payment",
        success_url: `${input.origin}/dashboard?payment=success`,
        cancel_url: `${input.origin}/upgrade?payment=cancel`,
        customer_email: user.email ?? undefined,
        client_reference_id: user.id.toString(),
        allow_promotion_codes: true,
        metadata: {
          user_id: user.id.toString(),
          customer_email: user.email ?? "",
          customer_name: user.name ?? "",
          product_id: input.productId,
        },
      };

      const session = await stripe.checkout.sessions.create(sessionConfig);
      return { url: session.url };
    }),

  // ดูสถานะ subscription ปัจจุบัน
  getSubscription: protectedProcedure.query(async ({ ctx }) => {
    const { getDb } = await import("./db");
    const { users } = await import("../drizzle/schema");
    const { eq } = await import("drizzle-orm");
    const db = await getDb();
    if (!db) return { plan: "free", status: null };
    const [u] = await db.select().from(users).where(eq(users.id, ctx.user.id)).limit(1);
    return {
      plan: u?.plan ?? "free",
      status: u?.subscriptionStatus ?? null,
      subscriptionId: u?.stripeSubscriptionId ?? null,
    };
  }),
});

// ─── App Router ─────────────────────────────────────────────────────────────
export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  analytics: analyticsRouter,
  transactions: transactionsRouter,
  categories: categoriesRouter,
  wallets: walletsRouter,
  budgets: budgetsRouter,
  recurringBills: recurringBillsRouter,
  ai: aiRouter,
  payment: paymentRouter,
});

export type AppRouter = typeof appRouter;
