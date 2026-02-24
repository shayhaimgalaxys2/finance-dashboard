import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { categoryRules } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { validateSession } from "@/lib/auth";

// GET: List all custom category rules
export async function GET(request: NextRequest) {
  const session = await validateSession(request);
  if (!session.valid) {
    return NextResponse.json({ error: session.error }, { status: 401 });
  }

  try {
    const rules = await db.select().from(categoryRules);

    return NextResponse.json({ rules });
  } catch (error) {
    console.error("Category rules GET error:", error);
    return NextResponse.json(
      { error: "שגיאה בטעינת כללי קטגוריות" },
      { status: 500 }
    );
  }
}

// POST: Create new category rule
export async function POST(request: NextRequest) {
  const session = await validateSession(request);
  if (!session.valid) {
    return NextResponse.json({ error: session.error }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { pattern, category, priority } = body;

    if (!pattern || !category) {
      return NextResponse.json(
        { error: "שדות חובה חסרים: pattern, category" },
        { status: 400 }
      );
    }

    // Validate regex pattern
    try {
      new RegExp(pattern);
    } catch {
      return NextResponse.json(
        { error: "תבנית (pattern) לא תקינה כביטוי רגולרי" },
        { status: 400 }
      );
    }

    const result = await db
      .insert(categoryRules)
      .values({
        pattern,
        category,
        priority: priority ?? 0,
      })
      .returning();

    return NextResponse.json({ rule: result[0] }, { status: 201 });
  } catch (error) {
    console.error("Category rules POST error:", error);
    return NextResponse.json(
      { error: "שגיאה ביצירת כלל קטגוריה" },
      { status: 500 }
    );
  }
}

// DELETE: Delete category rule
export async function DELETE(request: NextRequest) {
  const session = await validateSession(request);
  if (!session.valid) {
    return NextResponse.json({ error: session.error }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { error: "מזהה כלל (id) נדרש" },
        { status: 400 }
      );
    }

    const existing = await db
      .select()
      .from(categoryRules)
      .where(eq(categoryRules.id, id));

    if (existing.length === 0) {
      return NextResponse.json(
        { error: "כלל קטגוריה לא נמצא" },
        { status: 404 }
      );
    }

    await db.delete(categoryRules).where(eq(categoryRules.id, id));

    return NextResponse.json({
      success: true,
      message: "כלל קטגוריה נמחק בהצלחה",
    });
  } catch (error) {
    console.error("Category rules DELETE error:", error);
    return NextResponse.json(
      { error: "שגיאה במחיקת כלל קטגוריה" },
      { status: 500 }
    );
  }
}
