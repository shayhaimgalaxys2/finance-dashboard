import { sqliteTable, text, integer, real, uniqueIndex } from "drizzle-orm/sqlite-core";

export const accounts = sqliteTable("accounts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  companyId: text("company_id").notNull(), // beinpiumi, visaCal, max, isracard, amex
  owner: text("owner").notNull(), // mine, wife
  encryptedCredentials: text("encrypted_credentials").notNull(),
  accountNumber: text("account_number"),
  lastScrapedAt: text("last_scraped_at"),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const transactions = sqliteTable("transactions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  accountId: integer("account_id").notNull().references(() => accounts.id, { onDelete: "cascade" }),
  identifier: text("identifier"),
  date: text("date").notNull(),
  processedDate: text("processed_date"),
  originalAmount: real("original_amount").notNull(),
  originalCurrency: text("original_currency").default("ILS"),
  chargedAmount: real("charged_amount").notNull(),
  description: text("description").notNull(),
  memo: text("memo"),
  category: text("category"),
  type: text("type").default("normal"), // normal, installments
  installmentNumber: integer("installment_number"),
  installmentTotal: integer("installment_total"),
  status: text("status").default("completed"), // completed, pending
  scrapedAt: text("scraped_at").notNull().$defaultFn(() => new Date().toISOString()),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
}, (table) => [
  uniqueIndex("txn_unique_idx").on(
    table.accountId,
    table.date,
    table.chargedAmount,
    table.description
  ),
]);

export const categoryRules = sqliteTable("category_rules", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  pattern: text("pattern").notNull(),
  category: text("category").notNull(),
  priority: integer("priority").default(0),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const scrapeLogs = sqliteTable("scrape_logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  accountId: integer("account_id").notNull().references(() => accounts.id, { onDelete: "cascade" }),
  status: text("status").notNull(), // success, error
  errorMessage: text("error_message"),
  transactionsCount: integer("transactions_count").default(0),
  startedAt: text("started_at").notNull(),
  completedAt: text("completed_at"),
});

export const sessions = sqliteTable("sessions", {
  token: text("token").primaryKey(),
  masterPassword: text("master_password").notNull(),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
  expiresAt: text("expires_at").notNull(),
});

export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

export type Account = typeof accounts.$inferSelect;
export type NewAccount = typeof accounts.$inferInsert;
export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;
export type CategoryRule = typeof categoryRules.$inferSelect;
export type ScrapeLog = typeof scrapeLogs.$inferSelect;
