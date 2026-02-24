import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { accounts } from "@/lib/db/schema";
import { encrypt } from "@/lib/crypto";
import { validateSession, getMasterPasswordFromSession } from "@/lib/auth";

// GET: List all accounts (without credentials)
export async function GET(request: NextRequest) {
  const session = await validateSession(request);
  if (!session.valid) {
    return NextResponse.json({ error: session.error }, { status: 401 });
  }

  try {
    const allAccounts = await db.select({
      id: accounts.id,
      name: accounts.name,
      companyId: accounts.companyId,
      owner: accounts.owner,
      accountNumber: accounts.accountNumber,
      lastScrapedAt: accounts.lastScrapedAt,
      isActive: accounts.isActive,
      createdAt: accounts.createdAt,
    }).from(accounts);

    return NextResponse.json({ accounts: allAccounts });
  } catch (error) {
    console.error("Accounts GET error:", error);
    return NextResponse.json(
      { error: "שגיאה בטעינת חשבונות" },
      { status: 500 }
    );
  }
}

// POST: Create new account (encrypt credentials)
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

    const body = await request.json();
    const { name, companyId, owner, credentials, accountNumber } = body;

    if (!name || !companyId || !owner || !credentials) {
      return NextResponse.json(
        { error: "שדות חובה חסרים: name, companyId, owner, credentials" },
        { status: 400 }
      );
    }

    const validOwners = ["mine", "wife"];
    if (!validOwners.includes(owner)) {
      return NextResponse.json(
        { error: "בעל חשבון לא תקין. ערכים מותרים: mine, wife" },
        { status: 400 }
      );
    }

    const validCompanies = ["hapoalim", "leumi", "discount", "mizrahi", "beinleumi", "otsarHahayal", "visaCal", "max", "isracard", "amex"];
    if (!validCompanies.includes(companyId)) {
      return NextResponse.json(
        { error: `חברה לא מוכרת: ${companyId}` },
        { status: 400 }
      );
    }

    const encryptedCredentials = encrypt(
      JSON.stringify(credentials),
      masterPassword
    );

    const result = await db.insert(accounts).values({
      name,
      companyId,
      owner,
      encryptedCredentials,
      accountNumber: accountNumber || null,
    }).returning();

    // Return without credentials
    const { encryptedCredentials: _, ...accountWithoutCreds } = result[0];

    return NextResponse.json(
      { account: accountWithoutCreds },
      { status: 201 }
    );
  } catch (error) {
    console.error("Accounts POST error:", error);
    return NextResponse.json(
      { error: "שגיאה ביצירת חשבון" },
      { status: 500 }
    );
  }
}
