import { db } from "@/lib/db";
import { transactions, accounts } from "@/lib/db/schema";
import { and, gte, lt, sql } from "drizzle-orm";
import { sendTelegramMessage } from "./bot";

const CATEGORY_EMOJIS: Record<string, string> = {
  "מזון וסופר": "\ud83d\uded2",
  "מסעדות וקפה": "\u2615",
  "דלק ורכב": "\u26fd",
  "בריאות": "\ud83d\udc9a",
  "ביגוד והנעלה": "\ud83d\udc55",
  "חינוך": "\ud83c\udf93",
  "בילויים ופנאי": "\ud83c\udfab",
  "תקשורת": "\ud83d\udcf6",
  "חשבונות בית": "\ud83c\udfe0",
  "קניות כלליות": "\ud83d\udecd\ufe0f",
  "העברות": "\ud83d\udd04",
  "אחר": "\ud83d\udce6",
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("he-IL", {
    style: "currency",
    currency: "ILS",
    maximumFractionDigits: 0,
  }).format(Math.abs(amount));
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("he-IL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export async function generateDailyReport(): Promise<string> {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];

  const yesterdayTxns = db
    .select({
      description: transactions.description,
      chargedAmount: transactions.chargedAmount,
      category: transactions.category,
      accountId: transactions.accountId,
    })
    .from(transactions)
    .where(and(gte(transactions.date, yesterdayStr), lt(transactions.date, todayStr)))
    .all();

  if (yesterdayTxns.length === 0) {
    return `\ud83d\udcca <b>\u05e1\u05d9\u05db\u05d5\u05dd \u05d9\u05d5\u05de\u05d9 - ${formatDate(yesterday)}</b>\n\n\u2728 \u05d0\u05d9\u05df \u05e2\u05e1\u05e7\u05d0\u05d5\u05ea \u05de\u05d0\u05ea\u05de\u05d5\u05dc \u2013 \u05d9\u05d5\u05dd \u05d7\u05e1\u05db\u05d5\u05e0\u05d9!`;
  }

  const totalSpent = yesterdayTxns.reduce((sum, t) => sum + Math.abs(t.chargedAmount), 0);

  // Group by category
  const byCategory: Record<string, { total: number; count: number }> = {};
  for (const txn of yesterdayTxns) {
    const cat = txn.category || "אחר";
    if (!byCategory[cat]) byCategory[cat] = { total: 0, count: 0 };
    byCategory[cat].total += Math.abs(txn.chargedAmount);
    byCategory[cat].count++;
  }

  // Group by owner
  const allAccounts = db.select().from(accounts).all();
  const accountOwnerMap = Object.fromEntries(allAccounts.map((a) => [a.id, a.owner]));
  const accountNameMap = Object.fromEntries(allAccounts.map((a) => [a.id, a.name]));

  const byOwner: Record<string, number> = { mine: 0, wife: 0 };
  const byAccount: Record<number, number> = {};
  for (const txn of yesterdayTxns) {
    const owner = accountOwnerMap[txn.accountId] || "mine";
    byOwner[owner] = (byOwner[owner] || 0) + Math.abs(txn.chargedAmount);
    byAccount[txn.accountId] = (byAccount[txn.accountId] || 0) + Math.abs(txn.chargedAmount);
  }

  // Month total
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split("T")[0];
  const monthTotalResult = db
    .select({ total: sql<number>`SUM(ABS(charged_amount))` })
    .from(transactions)
    .where(gte(transactions.date, monthStart))
    .get();
  const monthTotal = monthTotalResult?.total || 0;

  // Build message
  let msg = `\ud83d\udcca <b>\u05e1\u05d9\u05db\u05d5\u05dd \u05d9\u05d5\u05de\u05d9 - ${formatDate(yesterday)}</b>\n\n`;
  msg += `\ud83d\udcb0 <b>\u05e1\u05d4"\u05db \u05d4\u05d5\u05e6\u05d0\u05d5\u05ea \u05d0\u05ea\u05de\u05d5\u05dc:</b> ${formatCurrency(totalSpent)}\n\n`;

  msg += `\ud83d\udccb <b>\u05e4\u05d9\u05e8\u05d5\u05d8:</b>\n`;
  const sortedCats = Object.entries(byCategory).sort((a, b) => b[1].total - a[1].total);
  for (const [cat, data] of sortedCats) {
    const emoji = CATEGORY_EMOJIS[cat] || "\ud83d\udce6";
    msg += `${emoji} ${cat}: ${formatCurrency(data.total)} (${data.count} \u05e2\u05e1\u05e7\u05d0\u05d5\u05ea)\n`;
  }

  msg += `\n\ud83d\udc64 <b>\u05e9\u05dc\u05d9:</b> ${formatCurrency(byOwner.mine || 0)}\n`;
  msg += `\ud83d\udc69 <b>\u05d0\u05e9\u05ea\u05d9:</b> ${formatCurrency(byOwner.wife || 0)}\n`;

  msg += `\n\ud83d\udcb3 <b>\u05dc\u05e4\u05d9 \u05db\u05e8\u05d8\u05d9\u05e1:</b>\n`;
  for (const [accId, total] of Object.entries(byAccount)) {
    const name = accountNameMap[Number(accId)] || "לא ידוע";
    msg += `\u2022 ${name}: ${formatCurrency(total)}\n`;
  }

  msg += `\n\ud83d\udcc8 <b>\u05e1\u05d4"\u05db \u05d4\u05d7\u05d5\u05d3\u05e9:</b> ${formatCurrency(monthTotal)}`;

  return msg;
}

export async function sendDailyReport(): Promise<boolean> {
  const report = await generateDailyReport();
  return sendTelegramMessage(report);
}
