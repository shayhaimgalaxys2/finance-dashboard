import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { transactions, accounts } from "@/lib/db/schema";
import { eq, and, gte, lte, like, desc, sql, count } from "drizzle-orm";
import { validateSession } from "@/lib/auth";

// GET: List transactions with filtering, search, and pagination
export async function GET(request: NextRequest) {
  const session = await validateSession(request);
  if (!session.valid) {
    return NextResponse.json({ error: session.error }, { status: 401 });
  }

  try {
    const searchParams = request.nextUrl.searchParams;

    const accountId = searchParams.get("accountId");
    const owner = searchParams.get("owner");
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const sort = searchParams.get("sort") || "date_desc";

    // Build conditions array
    const conditions = [];

    if (accountId) {
      conditions.push(eq(transactions.accountId, parseInt(accountId, 10)));
    }

    if (owner) {
      // Need to join with accounts to filter by owner
      conditions.push(
        sql`${transactions.accountId} IN (SELECT id FROM accounts WHERE owner = ${owner})`
      );
    }

    if (category) {
      conditions.push(eq(transactions.category, category));
    }

    if (search) {
      conditions.push(like(transactions.description, `%${search}%`));
    }

    if (startDate) {
      conditions.push(gte(transactions.date, startDate));
    }

    if (endDate) {
      conditions.push(lte(transactions.date, endDate));
    }

    const whereClause =
      conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count
    const countResult = await db
      .select({ total: count() })
      .from(transactions)
      .where(whereClause);

    const total = countResult[0].total;
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;

    // Determine sort order
    let orderBy;
    switch (sort) {
      case "date_asc":
        orderBy = sql`${transactions.date} ASC`;
        break;
      case "amount_desc":
        orderBy = sql`${transactions.chargedAmount} DESC`;
        break;
      case "amount_asc":
        orderBy = sql`${transactions.chargedAmount} ASC`;
        break;
      case "date_desc":
      default:
        orderBy = desc(transactions.date);
        break;
    }

    // Get transactions with account name
    const result = await db
      .select({
        id: transactions.id,
        accountId: transactions.accountId,
        accountName: accounts.name,
        accountOwner: accounts.owner,
        identifier: transactions.identifier,
        date: transactions.date,
        processedDate: transactions.processedDate,
        originalAmount: transactions.originalAmount,
        originalCurrency: transactions.originalCurrency,
        chargedAmount: transactions.chargedAmount,
        description: transactions.description,
        memo: transactions.memo,
        category: transactions.category,
        type: transactions.type,
        installmentNumber: transactions.installmentNumber,
        installmentTotal: transactions.installmentTotal,
        status: transactions.status,
        scrapedAt: transactions.scrapedAt,
        createdAt: transactions.createdAt,
      })
      .from(transactions)
      .leftJoin(accounts, eq(transactions.accountId, accounts.id))
      .where(whereClause)
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      transactions: result,
      total,
      page,
      totalPages,
    });
  } catch (error) {
    console.error("Transactions GET error:", error);
    return NextResponse.json(
      { error: "שגיאה בטעינת עסקאות" },
      { status: 500 }
    );
  }
}
