import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { settings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { validateSession } from "@/lib/auth";

const SENSITIVE_KEYS = ["master_password_hash"];
const ALLOWED_SETTINGS = ["telegram_bot_token", "telegram_chat_id", "daily_report_time"];

export async function GET(request: NextRequest) {
  const session = await validateSession(request);
  if (!session.valid) {
    return NextResponse.json({ error: session.error }, { status: 401 });
  }

  try {
    const allSettings = db.select().from(settings).all();
    const result: Record<string, string> = {};
    for (const s of allSettings) {
      if (!SENSITIVE_KEYS.includes(s.key)) {
        result[s.key] = s.value;
      }
    }
    return NextResponse.json(result);
  } catch (error) {
    console.error("Settings GET error:", error);
    return NextResponse.json({ error: "שגיאה בטעינת הגדרות" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const session = await validateSession(request);
  if (!session.valid) {
    return NextResponse.json({ error: session.error }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { test, ...updates } = body;

    // Save settings
    for (const [key, value] of Object.entries(updates)) {
      if (!ALLOWED_SETTINGS.includes(key)) continue;
      if (typeof value !== "string") continue;

      const existing = db.select().from(settings).where(eq(settings.key, key)).get();
      if (existing) {
        db.update(settings).set({ value }).where(eq(settings.key, key)).run();
      } else {
        db.insert(settings).values({ key, value: value as string }).run();
      }
    }

    // Test telegram if requested
    if (test) {
      try {
        const { sendTelegramMessage, resetBot } = await import("@/lib/telegram/bot");
        resetBot(); // Reset to pick up new token
        const sent = await sendTelegramMessage("🔔 <b>הודעת טסט</b>\n\nהחיבור לטלגרם עובד!");
        return NextResponse.json({ success: true, testSent: sent });
      } catch {
        return NextResponse.json({ success: true, testSent: false });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Settings PUT error:", error);
    return NextResponse.json({ error: "שגיאה בעדכון הגדרות" }, { status: 500 });
  }
}
