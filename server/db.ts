import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  Budget,
  Category,
  InsertUser,
  LineUser,
  RecurringBill,
  Transaction,
  Wallet,
  budgets,
  categories,
  lineUsers,
  recurringBills,
  transactions,
  users,
  wallets,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Users ────────────────────────────────────────────────────────────────────

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;
  textFields.forEach((field) => {
    const value = user[field];
    if (value === undefined) return;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  });
  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

// ─── LINE Users ───────────────────────────────────────────────────────────────

export async function upsertLineUser(lineUserId: string, displayName?: string, pictureUrl?: string): Promise<LineUser> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db
    .insert(lineUsers)
    .values({ lineUserId, displayName, pictureUrl })
    .onDuplicateKeyUpdate({ set: { displayName, pictureUrl, updatedAt: new Date() } });
  const result = await db.select().from(lineUsers).where(eq(lineUsers.lineUserId, lineUserId)).limit(1);
  return result[0]!;
}

export async function getLineUser(lineUserId: string): Promise<LineUser | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(lineUsers).where(eq(lineUsers.lineUserId, lineUserId)).limit(1);
  return result[0];
}

export async function updateLineUserPlan(lineUserId: string, plan: "free" | "pro", subscriptionData?: {
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  subscriptionStatus?: "active" | "canceled" | "past_due" | "trialing";
  subscriptionEndsAt?: Date;
}) {
  const db = await getDb();
  if (!db) return;
  await db.update(lineUsers).set({ plan, ...subscriptionData, updatedAt: new Date() }).where(eq(lineUsers.lineUserId, lineUserId));
}

// ─── Wallets ──────────────────────────────────────────────────────────────────

export async function getWallets(lineUserId: string): Promise<Wallet[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(wallets).where(eq(wallets.lineUserId, lineUserId));
}

export async function getDefaultWallet(lineUserId: string): Promise<Wallet | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(wallets)
    .where(and(eq(wallets.lineUserId, lineUserId), eq(wallets.isDefault, true))).limit(1);
  if (result[0]) return result[0];
  const all = await db.select().from(wallets).where(eq(wallets.lineUserId, lineUserId)).limit(1);
  return all[0];
}

export async function createWallet(data: { lineUserId: string; userId?: number; name: string; icon?: string; color?: string; isDefault?: boolean }): Promise<Wallet> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const [result] = await db.insert(wallets).values({ ...data, userId: data.userId ?? 0 });
  const created = await db.select().from(wallets).where(eq(wallets.id, (result as any).insertId)).limit(1);
  return created[0]!;
}

// ─── Categories ───────────────────────────────────────────────────────────────

export async function getCategories(lineUserId: string): Promise<Category[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(categories).where(eq(categories.lineUserId, lineUserId));
}

export async function getCategoryByName(lineUserId: string, name: string): Promise<Category | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(categories)
    .where(and(eq(categories.lineUserId, lineUserId), eq(categories.name, name))).limit(1);
  return result[0];
}

export async function createCategory(data: { lineUserId: string; userId?: number; name: string; icon?: string; color?: string; type?: "income" | "expense" | "both" }): Promise<Category> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const [result] = await db.insert(categories).values(data);
  const created = await db.select().from(categories).where(eq(categories.id, (result as any).insertId)).limit(1);
  return created[0]!;
}

export async function deleteCategory(id: number, lineUserId: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  await db.delete(categories).where(and(eq(categories.id, id), eq(categories.lineUserId, lineUserId)));
  return true;
}

// Default categories ครบ 35 หมวด เหมือนระบบเก่า
export const DEFAULT_EXPENSE_CATEGORIES = [
  { name: "อาหาร", icon: "🍜", color: "#f97316" },
  { name: "เครื่องดื่ม", icon: "🧋", color: "#8b5cf6" },
  { name: "เดลิเวอรี", icon: "🛵", color: "#f59e0b" },
  { name: "เดินทาง", icon: "🚌", color: "#3b82f6" },
  { name: "ที่พัก", icon: "🏠", color: "#10b981" },
  { name: "ชอปปิ้ง", icon: "🛍️", color: "#ec4899" },
  { name: "ความงาม", icon: "💄", color: "#f43f5e" },
  { name: "สุขภาพ", icon: "💊", color: "#22c55e" },
  { name: "ค่าโทรศัพท์", icon: "📱", color: "#6366f1" },
  { name: "ค่าเน็ต", icon: "📊", color: "#0ea5e9" },
  { name: "Subscription", icon: "🎬", color: "#a855f7" },
  { name: "บันเทิง", icon: "🎡", color: "#f97316" },
  { name: "การศึกษา", icon: "📚", color: "#84cc16" },
  { name: "บริจาค", icon: "💝", color: "#ec4899" },
  { name: "ยานพาหนะ", icon: "🚗", color: "#ef4444" },
  { name: "สัตว์เลี้ยง", icon: "🐾", color: "#78716c" },
  { name: "ประกัน", icon: "🛡️", color: "#64748b" },
  { name: "โอนเงิน", icon: "💸", color: "#f59e0b" },
  { name: "ค่าบัตรเครดิต", icon: "💳", color: "#6366f1" },
  { name: "ต้นทุนสินค้า", icon: "📦", color: "#92400e" },
  { name: "ค่าส่ง", icon: "🚚", color: "#dc2626" },
  { name: "ค่าโฆษณา", icon: "📣", color: "#d97706" },
  { name: "ค่า Platform", icon: "🏪", color: "#059669" },
  { name: "ค่าอินฟลู", icon: "🤝", color: "#eab308" },
  { name: "อื่นๆ", icon: "📦", color: "#9ca3af" },
];

export const DEFAULT_INCOME_CATEGORIES = [
  { name: "เงินเดือน", icon: "💼", color: "#10b981" },
  { name: "งานพิเศษ", icon: "⭐", color: "#f59e0b" },
  { name: "ฟรีแลนซ์", icon: "💻", color: "#6366f1" },
  { name: "ยอดขาย", icon: "🏷️", color: "#ec4899" },
  { name: "ลงทุน", icon: "📈", color: "#22c55e" },
  { name: "โอน/รับเงิน", icon: "🎁", color: "#f97316" },
  { name: "Affiliate", icon: "🔗", color: "#8b5cf6" },
  { name: "เงินสำรองภาษี", icon: "🏦", color: "#0ea5e9" },
  { name: "เงินสำรองฉุกเฉิน", icon: "🛡️", color: "#ef4444" },
  { name: "อื่นๆ", icon: "💰", color: "#9ca3af" },
];

export async function ensureDefaultCategories(lineUserId: string) {
  const existing = await getCategories(lineUserId);
  if (existing.length > 0) return;
  const db = await getDb();
  if (!db) return;

  const expenseDefaults = DEFAULT_EXPENSE_CATEGORIES.map(c => ({
    lineUserId,
    name: c.name,
    icon: c.icon,
    color: c.color,
    type: "expense" as const,
    isDefault: true,
  }));

  const incomeDefaults = DEFAULT_INCOME_CATEGORIES.map(c => ({
    lineUserId,
    name: c.name,
    icon: c.icon,
    color: c.color,
    type: "income" as const,
    isDefault: true,
  }));

  await db.insert(categories).values([...incomeDefaults, ...expenseDefaults]);
}

export async function ensureDefaultWallet(lineUserId: string) {
  const existing = await getWallets(lineUserId);
  if (existing.length > 0) return existing[0];
  return createWallet({ lineUserId, name: "กระเป๋าหลัก", icon: "👛", color: "#6366f1", isDefault: true });
}

// ─── Transactions ─────────────────────────────────────────────────────────────

export async function createTransaction(data: {
  lineUserId?: string;
  userId?: number;
  walletId?: number;
  categoryId?: number;
  type: "income" | "expense";
  amount: string;
  description?: string;
  tags?: string;
  source?: "line" | "web" | "api";
  transactionDate?: Date;
}): Promise<Transaction> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const [result] = await db.insert(transactions).values({ ...data, source: data.source ?? "web" });
  const created = await db.select().from(transactions).where(eq(transactions.id, (result as any).insertId)).limit(1);
  return created[0]!;
}

export async function updateTransaction(id: number, lineUserId: string, data: {
  categoryId?: number;
  type?: "income" | "expense";
  amount?: string;
  description?: string;
  tags?: string;
}): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  await db.update(transactions).set({ ...data, updatedAt: new Date() })
    .where(and(eq(transactions.id, id), eq(transactions.lineUserId, lineUserId)));
  return true;
}

export async function getTransactions(lineUserId: string, options?: {
  limit?: number;
  offset?: number;
  type?: "income" | "expense";
  startDate?: Date;
  endDate?: Date;
  categoryId?: number;
  walletId?: number;
}): Promise<Transaction[]> {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(transactions.lineUserId, lineUserId)];
  if (options?.type) conditions.push(eq(transactions.type, options.type));
  if (options?.startDate) conditions.push(gte(transactions.transactionDate, options.startDate));
  if (options?.endDate) conditions.push(lte(transactions.transactionDate, options.endDate));
  if (options?.categoryId) conditions.push(eq(transactions.categoryId, options.categoryId));
  if (options?.walletId) conditions.push(eq(transactions.walletId, options.walletId));

  return db.select().from(transactions)
    .where(and(...conditions))
    .orderBy(desc(transactions.transactionDate))
    .limit(options?.limit ?? 50)
    .offset(options?.offset ?? 0);
}

export async function getTransactionSummary(lineUserId: string, startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) return { income: 0, expense: 0, balance: 0 };
  const result = await db.select({
    type: transactions.type,
    total: sql<string>`SUM(${transactions.amount})`,
  }).from(transactions)
    .where(and(
      eq(transactions.lineUserId, lineUserId),
      gte(transactions.transactionDate, startDate),
      lte(transactions.transactionDate, endDate),
    ))
    .groupBy(transactions.type);

  let income = 0, expense = 0;
  for (const row of result) {
    if (row.type === "income") income = parseFloat(row.total ?? "0");
    if (row.type === "expense") expense = parseFloat(row.total ?? "0");
  }
  return { income, expense, balance: income - expense };
}

export async function getTransactionsByCategory(lineUserId: string, startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    categoryId: transactions.categoryId,
    type: transactions.type,
    total: sql<string>`SUM(${transactions.amount})`,
    count: sql<number>`COUNT(*)`,
  }).from(transactions)
    .where(and(
      eq(transactions.lineUserId, lineUserId),
      gte(transactions.transactionDate, startDate),
      lte(transactions.transactionDate, endDate),
    ))
    .groupBy(transactions.categoryId, transactions.type);
}

export async function deleteTransaction(id: number, lineUserId: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  await db.delete(transactions).where(and(eq(transactions.id, id), eq(transactions.lineUserId, lineUserId)));
  return true;
}

export async function getTransactionsByWallet(lineUserId: string, startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    walletId: transactions.walletId,
    type: transactions.type,
    total: sql<string>`SUM(${transactions.amount})`,
    count: sql<number>`COUNT(*)`,
  }).from(transactions)
    .where(and(
      eq(transactions.lineUserId, lineUserId),
      gte(transactions.transactionDate, startDate),
      lte(transactions.transactionDate, endDate),
    ))
    .groupBy(transactions.walletId, transactions.type);
}

export async function getTopTags(lineUserId: string, startDate: Date, endDate: Date, limit = 10) {
  const db = await getDb();
  if (!db) return [];
  // ดึง transactions ที่มี tags
  const rows = await db.select({
    tags: transactions.tags,
    type: transactions.type,
    amount: transactions.amount,
  }).from(transactions)
    .where(and(
      eq(transactions.lineUserId, lineUserId),
      gte(transactions.transactionDate, startDate),
      lte(transactions.transactionDate, endDate),
    ));

  // นับ tags แต่ละอัน
  const tagMap: Record<string, { count: number; total: number; type: string }> = {};
  for (const row of rows) {
    if (!row.tags) continue;
    const tagList = row.tags.split(',').map(t => t.trim()).filter(Boolean);
    for (const tag of tagList) {
      if (!tagMap[tag]) tagMap[tag] = { count: 0, total: 0, type: row.type };
      tagMap[tag].count++;
      tagMap[tag].total += parseFloat(row.amount ?? '0');
    }
  }

  return Object.entries(tagMap)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, limit)
    .map(([tag, data]) => ({ tag, ...data }));
}

// ─── Budgets ──────────────────────────────────────────────────────────────────

export async function getBudgets(lineUserId: string): Promise<Budget[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(budgets).where(and(eq(budgets.lineUserId, lineUserId), eq(budgets.isActive, true)));
}

export async function createBudget(data: {
  lineUserId: string;
  categoryId?: number;
  name: string;
  amount: string;
  period?: "daily" | "weekly" | "monthly" | "yearly";
  alertThreshold?: number;
}): Promise<Budget> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const [result] = await db.insert(budgets).values(data);
  const created = await db.select().from(budgets).where(eq(budgets.id, (result as any).insertId)).limit(1);
  return created[0]!;
}

// ─── Recurring Bills ──────────────────────────────────────────────────────────

export async function getRecurringBills(lineUserId: string): Promise<RecurringBill[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(recurringBills).where(and(eq(recurringBills.lineUserId, lineUserId), eq(recurringBills.isActive, true)));
}

export async function createRecurringBill(data: {
  lineUserId: string;
  name: string;
  amount: string;
  dueDay: number;
  categoryId?: number;
}): Promise<RecurringBill> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const [result] = await db.insert(recurringBills).values(data);
  const created = await db.select().from(recurringBills).where(eq(recurringBills.id, (result as any).insertId)).limit(1);
  return created[0]!;
}

export async function deleteRecurringBill(id: number, lineUserId: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  await db.update(recurringBills).set({ isActive: false }).where(and(eq(recurringBills.id, id), eq(recurringBills.lineUserId, lineUserId)));
  return true;
}
