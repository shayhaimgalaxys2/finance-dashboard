import { Bot } from "grammy";
import { db } from "@/lib/db";
import { settings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

let botInstance: Bot | null = null;

export function getTelegramConfig(): { token: string; chatId: string } | null {
  const tokenRow = db.select().from(settings).where(eq(settings.key, "telegram_bot_token")).get();
  const chatIdRow = db.select().from(settings).where(eq(settings.key, "telegram_chat_id")).get();

  if (!tokenRow || !chatIdRow) return null;
  return { token: tokenRow.value, chatId: chatIdRow.value };
}

export async function sendTelegramMessage(text: string): Promise<boolean> {
  const config = getTelegramConfig();
  if (!config) return false;

  try {
    if (!botInstance || botInstance.token !== config.token) {
      botInstance = new Bot(config.token);
    }
    await botInstance.api.sendMessage(config.chatId, text, { parse_mode: "HTML" });
    return true;
  } catch (err) {
    console.error("Failed to send Telegram message:", err);
    return false;
  }
}

export function resetBot(): void {
  botInstance = null;
}
