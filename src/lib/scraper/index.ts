import { CompanyTypes, createScraper } from "israeli-bank-scrapers";
import { db } from "@/lib/db";
import { accounts, transactions, scrapeLogs } from "@/lib/db/schema";
import { decrypt } from "@/lib/crypto";
import { categorizeTransaction } from "@/lib/categories";
import { eq } from "drizzle-orm";

const COMPANY_MAP: Record<string, string> = {
  beinleumi: CompanyTypes.beinleumi,
  visaCal: CompanyTypes.visaCal,
  max: CompanyTypes.max,
  isracard: CompanyTypes.isracard,
  amex: CompanyTypes.amex,
  hapoalim: CompanyTypes.hapoalim,
  leumi: CompanyTypes.leumi,
  discount: CompanyTypes.discount,
  mizrahi: CompanyTypes.mizrahi,
  otsarHahayal: CompanyTypes.otsarHahayal,
};

export interface ScrapeResult {
  accountId: number;
  accountName: string;
  success: boolean;
  error?: string;
  transactionsCount: number;
}

export async function scrapeAccount(
  accountId: number,
  masterPassword: string
): Promise<ScrapeResult> {
  const account = db.select().from(accounts).where(eq(accounts.id, accountId)).get();
  if (!account) {
    return { accountId, accountName: "unknown", success: false, error: "חשבון לא נמצא", transactionsCount: 0 };
  }

  const startedAt = new Date().toISOString();
  let credentials: Record<string, string>;
  try {
    const decrypted = decrypt(account.encryptedCredentials, masterPassword);
    credentials = JSON.parse(decrypted);
  } catch {
    return { accountId, accountName: account.name, success: false, error: "שגיאה בפענוח פרטי הגישה", transactionsCount: 0 };
  }

  const companyId = COMPANY_MAP[account.companyId];
  if (!companyId) {
    return { accountId, accountName: account.name, success: false, error: `חברה לא מוכרת: ${account.companyId}`, transactionsCount: 0 };
  }

  try {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 2);

    const scraper = createScraper({
      companyId: companyId as CompanyTypes,
      startDate,
      combineInstallments: false,
      showBrowser: false,
      timeout: 120000,
      defaultTimeout: 120000,
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await scraper.scrape(credentials as any);

    if (!result.success) {
      const errorMsg = result.errorMessage || result.errorType || "שגיאה לא ידועה";
      console.error(`[Scraper] Failed for ${account.name}: type=${result.errorType}, msg=${result.errorMessage}`);
      db.insert(scrapeLogs).values({
        accountId,
        status: "error",
        errorMessage: errorMsg,
        startedAt,
        completedAt: new Date().toISOString(),
      }).run();

      return { accountId, accountName: account.name, success: false, error: errorMsg, transactionsCount: 0 };
    }

    let totalInserted = 0;
    for (const acc of result.accounts || []) {
      if (acc.accountNumber && !account.accountNumber) {
        db.update(accounts)
          .set({ accountNumber: acc.accountNumber })
          .where(eq(accounts.id, accountId))
          .run();
      }

      for (const txn of acc.txns || []) {
        const category = categorizeTransaction(txn.description);
        try {
          db.insert(transactions).values({
            accountId,
            identifier: txn.identifier?.toString() || null,
            date: new Date(txn.date).toISOString().split("T")[0],
            processedDate: txn.processedDate
              ? new Date(txn.processedDate).toISOString().split("T")[0]
              : null,
            originalAmount: txn.originalAmount,
            originalCurrency: txn.originalCurrency || "ILS",
            chargedAmount: txn.chargedAmount,
            description: txn.description,
            memo: txn.memo || null,
            category,
            type: txn.type || "normal",
            installmentNumber: txn.installments?.number || null,
            installmentTotal: txn.installments?.total || null,
            status: txn.status || "completed",
          }).run();
          totalInserted++;
        } catch {
          // Duplicate - skip
        }
      }
    }

    db.update(accounts)
      .set({ lastScrapedAt: new Date().toISOString() })
      .where(eq(accounts.id, accountId))
      .run();

    db.insert(scrapeLogs).values({
      accountId,
      status: "success",
      transactionsCount: totalInserted,
      startedAt,
      completedAt: new Date().toISOString(),
    }).run();

    return { accountId, accountName: account.name, success: true, transactionsCount: totalInserted };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "שגיאה לא ידועה";
    console.error(`[Scraper] Exception for ${account.name}:`, err);
    db.insert(scrapeLogs).values({
      accountId,
      status: "error",
      errorMessage: errorMsg,
      startedAt,
      completedAt: new Date().toISOString(),
    }).run();

    return { accountId, accountName: account.name, success: false, error: errorMsg, transactionsCount: 0 };
  }
}

export async function scrapeAllAccounts(masterPassword: string): Promise<ScrapeResult[]> {
  const allAccounts = db.select().from(accounts).where(eq(accounts.isActive, true)).all();
  const results: ScrapeResult[] = [];

  for (const account of allAccounts) {
    const result = await scrapeAccount(account.id, masterPassword);
    results.push(result);
  }

  return results;
}
