import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { transactions, accounts } from "@/lib/db/schema";
import { eq, and, gte, lte, sql, desc, count, sum } from "drizzle-orm";
import { validateSession } from "@/lib/auth";

function getPeriodStartDate(period: string): string {
  const now = new Date();
  let start: Date;

  switch (period) {
    case "today":
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case "week": {
      const day = now.getDay();
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day);
      break;
    }
    case "month":
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case "year":
      start = new Date(now.getFullYear(), 0, 1);
      break;
    default:
      start = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  return start.toISOString().split("T")[0];
}

// GET: Return aggregated stats
export async function GET(request: NextRequest) {
  const session = await validateSession(request);
  if (!session.valid) {
    return NextResponse.json({ error: session.error }, { status: 401 });
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const owner = searchParams.get("owner") || "all";
    const period = searchParams.get("period") || "month";

    const periodStart = getPeriodStartDate(period);
    const today = new Date().toISOString().split("T")[0];

    // Build owner filter
    const ownerCondition =
      owner !== "all"
        ? sql`${transactions.accountId} IN (SELECT id FROM accounts WHERE owner = ${owner})`
        : undefined;

    // Period conditions
    const periodConditions = [gte(transactions.date, periodStart)];
    if (ownerCondition) {
      periodConditions.push(ownerCondition);
    }
    const periodWhere = and(...periodConditions);

    // 1. Total spending for period
    const totalResult = await db
      .select({
        total: sum(transactions.chargedAmount),
      })
      .from(transactions)
      .where(periodWhere);

    const totalSpending = totalResult[0].total
      ? parseFloat(totalResult[0].total)
      : 0;

    // 2. Spending by category
    const categoryConditions = [gte(transactions.date, periodStart)];
    if (ownerCondition) categoryConditions.push(ownerCondition);

    const spendingByCategory = await db
      .select({
        category: transactions.category,
        total: sum(transactions.chargedAmount),
        count: count(),
      })
      .from(transactions)
      .where(and(...categoryConditions))
      .groupBy(transactions.category)
      .orderBy(sql`${sum(transactions.chargedAmount)} DESC`);

    // 3. Spending by account
    const accountConditions = [gte(transactions.date, periodStart)];
    if (ownerCondition) accountConditions.push(ownerCondition);

    const spendingByAccount = await db
      .select({
        accountId: transactions.accountId,
        accountName: accounts.name,
        total: sum(transactions.chargedAmount),
      })
      .from(transactions)
      .leftJoin(accounts, eq(transactions.accountId, accounts.id))
      .where(and(...accountConditions))
      .groupBy(transactions.accountId, accounts.name)
      .orderBy(sql`${sum(transactions.chargedAmount)} DESC`);

    // 4. Daily spending for last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split("T")[0];

    const dailyConditions = [gte(transactions.date, thirtyDaysAgoStr)];
    if (ownerCondition) dailyConditions.push(ownerCondition);

    const dailySpending = await db
      .select({
        date: sql<string>`date(${transactions.date})`.as("day"),
        total: sum(transactions.chargedAmount),
      })
      .from(transactions)
      .where(and(...dailyConditions))
      .groupBy(sql`date(${transactions.date})`)
      .orderBy(sql`date(${transactions.date}) ASC`);

    // 5. Pending transactions count
    const pendingConditions = [eq(transactions.status, "pending")];
    if (ownerCondition) pendingConditions.push(ownerCondition);

    const pendingResult = await db
      .select({ count: count() })
      .from(transactions)
      .where(and(...pendingConditions));

    const pendingTransactions = pendingResult[0].count;

    // 6. Recent transactions (last 10)
    const recentConditions = ownerCondition ? [ownerCondition] : [];

    const recentTransactions = await db
      .select({
        id: transactions.id,
        accountId: transactions.accountId,
        accountName: accounts.name,
        date: transactions.date,
        chargedAmount: transactions.chargedAmount,
        description: transactions.description,
        category: transactions.category,
        status: transactions.status,
      })
      .from(transactions)
      .leftJoin(accounts, eq(transactions.accountId, accounts.id))
      .where(recentConditions.length > 0 ? and(...recentConditions) : undefined)
      .orderBy(desc(transactions.date))
      .limit(10);

    return NextResponse.json({
      totalSpending,
      spendingByCategory: spendingByCategory.map((row) => ({
        category: row.category || "ללא קטגוריה",
        total: row.total ? parseFloat(row.total) : 0,
        count: row.count,
      })),
      spendingByAccount: spendingByAccount.map((row) => ({
        accountId: row.accountId,
        accountName: row.accountName || "לא ידוע",
        total: row.total ? parseFloat(row.total) : 0,
      })),
      dailySpending: dailySpending.map((row) => ({
        date: row.date,
        total: row.total ? parseFloat(row.total) : 0,
      })),
      pendingTransactions,
      recentTransactions,
    });
  } catch (error) {
    console.error("Stats GET error:", error);
    return NextResponse.json(
      { error: "שגיאה בטעינת סטטיסטיקות" },
      { status: 500 }
    );
  }
}
