import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { accounts, transactions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { encrypt } from "@/lib/crypto";
import { validateSession, getMasterPasswordFromSession } from "@/lib/auth";

type RouteParams = { params: Promise<{ id: string }> };

// GET: Get single account details (without credentials)
export async function GET(request: NextRequest, { params }: RouteParams) {
  const session = await validateSession(request);
  if (!session.valid) {
    return NextResponse.json({ error: session.error }, { status: 401 });
  }

  try {
    const { id } = await params;
    const accountId = parseInt(id, 10);
    if (isNaN(accountId)) {
      return NextResponse.json(
        { error: "מזהה חשבון לא תקין" },
        { status: 400 }
      );
    }

    const result = await db
      .select({
        id: accounts.id,
        name: accounts.name,
        companyId: accounts.companyId,
        owner: accounts.owner,
        accountNumber: accounts.accountNumber,
        lastScrapedAt: accounts.lastScrapedAt,
        isActive: accounts.isActive,
        createdAt: accounts.createdAt,
      })
      .from(accounts)
      .where(eq(accounts.id, accountId));

    if (result.length === 0) {
      return NextResponse.json(
        { error: "חשבון לא נמצא" },
        { status: 404 }
      );
    }

    return NextResponse.json({ account: result[0] });
  } catch (error) {
    console.error("Account GET error:", error);
    return NextResponse.json(
      { error: "שגיאה בטעינת חשבון" },
      { status: 500 }
    );
  }
}

// PUT: Update account
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const session = await validateSession(request);
  if (!session.valid) {
    return NextResponse.json({ error: session.error }, { status: 401 });
  }

  try {
    const { id } = await params;
    const accountId = parseInt(id, 10);
    if (isNaN(accountId)) {
      return NextResponse.json(
        { error: "מזהה חשבון לא תקין" },
        { status: 400 }
      );
    }

    // Check account exists
    const existing = await db
      .select()
      .from(accounts)
      .where(eq(accounts.id, accountId));

    if (existing.length === 0) {
      return NextResponse.json(
        { error: "חשבון לא נמצא" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { name, companyId, owner, credentials, accountNumber, isActive } = body;

    const updateData: Record<string, unknown> = {};

    if (name !== undefined) updateData.name = name;
    if (companyId !== undefined) updateData.companyId = companyId;
    if (owner !== undefined) updateData.owner = owner;
    if (accountNumber !== undefined) updateData.accountNumber = accountNumber;
    if (isActive !== undefined) updateData.isActive = isActive;

    // If credentials are being updated, they need to be encrypted
    if (credentials !== undefined) {
      const masterPassword = getMasterPasswordFromSession(request);
      if (!masterPassword) {
        return NextResponse.json(
          { error: "יש להתחבר מחדש" },
          { status: 400 }
        );
      }
      updateData.encryptedCredentials = encrypt(
        JSON.stringify(credentials),
        masterPassword
      );
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "לא סופקו שדות לעדכון" },
        { status: 400 }
      );
    }

    await db
      .update(accounts)
      .set(updateData)
      .where(eq(accounts.id, accountId));

    // Fetch updated account without credentials
    const updated = await db
      .select({
        id: accounts.id,
        name: accounts.name,
        companyId: accounts.companyId,
        owner: accounts.owner,
        accountNumber: accounts.accountNumber,
        lastScrapedAt: accounts.lastScrapedAt,
        isActive: accounts.isActive,
        createdAt: accounts.createdAt,
      })
      .from(accounts)
      .where(eq(accounts.id, accountId));

    return NextResponse.json({ account: updated[0] });
  } catch (error) {
    console.error("Account PUT error:", error);
    return NextResponse.json(
      { error: "שגיאה בעדכון חשבון" },
      { status: 500 }
    );
  }
}

// DELETE: Delete account (cascade deletes transactions via FK constraint)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const session = await validateSession(request);
  if (!session.valid) {
    return NextResponse.json({ error: session.error }, { status: 401 });
  }

  try {
    const { id } = await params;
    const accountId = parseInt(id, 10);
    if (isNaN(accountId)) {
      return NextResponse.json(
        { error: "מזהה חשבון לא תקין" },
        { status: 400 }
      );
    }

    // Check account exists
    const existing = await db
      .select()
      .from(accounts)
      .where(eq(accounts.id, accountId));

    if (existing.length === 0) {
      return NextResponse.json(
        { error: "חשבון לא נמצא" },
        { status: 404 }
      );
    }

    // Delete will cascade to transactions and scrape logs via FK
    await db.delete(accounts).where(eq(accounts.id, accountId));

    return NextResponse.json({
      success: true,
      message: "חשבון נמחק בהצלחה",
    });
  } catch (error) {
    console.error("Account DELETE error:", error);
    return NextResponse.json(
      { error: "שגיאה במחיקת חשבון" },
      { status: 500 }
    );
  }
}
