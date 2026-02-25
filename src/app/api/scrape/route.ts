import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { accounts, transactions, scrapeLogs } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { decrypt } from "@/lib/crypto";
import { categorizeWithCustomRules } from "@/lib/categories";
import { validateSession, getMasterPasswordFromSession } from "@/lib/auth";

interface ScrapeResult {
  accountId: number;
  accountName: string;
  status: "success" | "error";
  transactionsCount: number;
  errorMessage?: string;
}

async function scrapeAccount(
  account: typeof accounts.$inferSelect,
  masterPassword: string
): Promise<ScrapeResult> {
  const startedAt = new Date().toISOString();

  try {
    // Decrypt credentials
    let credentialsJson: string;
    try {
      credentialsJson = decrypt(
        account.encryptedCredentials,
        masterPassword
      );
    } catch {
      throw new Error("שגיאה בפענוח פרטי הגישה - יתכן שסיסמת המאסטר השתנתה. יש למחוק את החשבון ולהוסיף אותו מחדש.");
    }
    const credentials = JSON.parse(credentialsJson);

    // Dynamic import of israeli-bank-scrapers to avoid SSR issues
    const { createScraper, CompanyTypes } = await import(
      "israeli-bank-scrapers"
    );

    const companyMap: Record<string, string> = {
      hapoalim: CompanyTypes.hapoalim,
      leumi: CompanyTypes.leumi,
      discount: CompanyTypes.discount,
      mizrahi: CompanyTypes.mizrahi,
      beinleumi: CompanyTypes.beinleumi,
      visaCal: CompanyTypes.visaCal,
      max: CompanyTypes.max,
      isracard: CompanyTypes.isracard,
      amex: CompanyTypes.amex,
      beyahadBishvilha: CompanyTypes.beyahadBishvilha,
    };

    const companyType = companyMap[account.companyId];
    if (!companyType) {
      throw new Error(`חברה לא נתמכת: ${account.companyId}`);
    }

    // Scrape from 60 days ago
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 60);

    const scraper = createScraper({
      companyId: companyType as never,
      startDate,
      combineInstallments: false,
      showBrowser: false,
    });

    const scrapeResult = await scraper.scrape(credentials);

    if (!scrapeResult.success) {
      throw new Error(
        scrapeResult.errorType || "שגיאה לא ידועה בסקרייפינג"
      );
    }

    let insertedCount = 0;

    if (scrapeResult.accounts) {
      for (const scrapedAccount of scrapeResult.accounts) {
        const txns = scrapedAccount.txns || [];

        for (const txn of txns) {
          const category = await categorizeWithCustomRules(
            txn.description || ""
          );

          try {
            await db
              .insert(transactions)
              .values({
                accountId: account.id,
                identifier: txn.identifier?.toString() || null,
                date: new Date(txn.date).toISOString().split("T")[0],
                processedDate: txn.processedDate
                  ? new Date(txn.processedDate).toISOString().split("T")[0]
                  : null,
                originalAmount: txn.originalAmount,
                originalCurrency: txn.originalCurrency || "ILS",
                chargedAmount: txn.chargedAmount,
                description: txn.description || "",
                memo: txn.memo || null,
                category,
                type: txn.installments ? "installments" : "normal",
                installmentNumber: txn.installments?.number || null,
                installmentTotal: txn.installments?.total || null,
                status: txn.status === "pending" ? "pending" : "completed",
              })
              .onConflictDoNothing();

            insertedCount++;
          } catch (insertError) {
            // Duplicate or constraint error, skip
            console.warn("Transaction insert skipped:", insertError);
          }
        }
      }
    }

    // Update last scraped timestamp
    await db
      .update(accounts)
      .set({ lastScrapedAt: new Date().toISOString() })
      .where(eq(accounts.id, account.id));

    // Log success
    await db.insert(scrapeLogs).values({
      accountId: account.id,
      status: "success",
      transactionsCount: insertedCount,
      startedAt,
      completedAt: new Date().toISOString(),
    });

    return {
      accountId: account.id,
      accountName: account.name,
      status: "success",
      transactionsCount: insertedCount,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "שגיאה לא ידועה";

    // Log error
    await db.insert(scrapeLogs).values({
      accountId: account.id,
      status: "error",
      errorMessage,
      transactionsCount: 0,
      startedAt,
      completedAt: new Date().toISOString(),
    });

    return {
      accountId: account.id,
      accountName: account.name,
      status: "error",
      transactionsCount: 0,
      errorMessage,
    };
  }
}

// POST: Trigger scraping for specific account or all accounts
export async function POST(request: NextRequest) {
  const session = await validateSession(request);
  if (!session.valid) {
    return NextResponse.json({ error: session.error }, { status: 401 });
  }

  try {
    const masterPassword = getMasterPasswordFromSession(request);
    if (!masterPassword) {
      return NextResponse.json(
        { error: "יש להתחבר מחדש" },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { accountId } = body;

    let accountsToScrape;

    if (accountId) {
      accountsToScrape = await db
        .select()
        .from(accounts)
        .where(eq(accounts.id, accountId));

      if (accountsToScrape.length === 0) {
        return NextResponse.json(
          { error: "חשבון לא נמצא" },
          { status: 404 }
        );
      }
    } else {
      // Scrape all active accounts
      accountsToScrape = await db
        .select()
        .from(accounts)
        .where(eq(accounts.isActive, true));
    }

    if (accountsToScrape.length === 0) {
      return NextResponse.json(
        { error: "לא נמצאו חשבונות פעילים לסקרייפינג" },
        { status: 404 }
      );
    }

    // Scrape accounts sequentially to avoid overloading
    const results: ScrapeResult[] = [];
    for (const account of accountsToScrape) {
      const result = await scrapeAccount(account, masterPassword);
      results.push(result);
    }

    const successCount = results.filter((r) => r.status === "success").length;
    const errorCount = results.filter((r) => r.status === "error").length;
    const totalTransactions = results.reduce(
      (sum, r) => sum + r.transactionsCount,
      0
    );

    return NextResponse.json({
      success: true,
      summary: {
        totalAccounts: results.length,
        successCount,
        errorCount,
        totalTransactions,
      },
      results,
    });
  } catch (error) {
    console.error("Scrape POST error:", error);
    return NextResponse.json(
      { error: "שגיאה בהפעלת סקרייפינג" },
      { status: 500 }
    );
  }
}
