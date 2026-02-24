import { db } from "@/lib/db";
import { settings } from "@/lib/db/schema";
import { hashPassword, verifyPassword, generateToken } from "@/lib/crypto";
import { eq } from "drizzle-orm";
import { NextRequest } from "next/server";

const MASTER_PASSWORD_KEY = "master_password_hash";
const SESSION_COOKIE_NAME = "session_token";

// In-memory token store with master password for credential decryption
const activeTokens = new Map<string, { createdAt: number; masterPassword: string }>();

const TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export async function getMasterPasswordHash(): Promise<string | null> {
  const result = db
    .select()
    .from(settings)
    .where(eq(settings.key, MASTER_PASSWORD_KEY))
    .get();
  return result?.value || null;
}

export async function setMasterPassword(password: string): Promise<void> {
  const hash = hashPassword(password);
  const existing = await getMasterPasswordHash();
  if (existing) {
    db.update(settings)
      .set({ value: hash })
      .where(eq(settings.key, MASTER_PASSWORD_KEY))
      .run();
  } else {
    db.insert(settings)
      .values({ key: MASTER_PASSWORD_KEY, value: hash })
      .run();
  }
}

export async function isSetup(): Promise<boolean> {
  const hash = await getMasterPasswordHash();
  return hash !== null;
}

export function createSession(masterPassword: string): string {
  // Clean up expired tokens
  const now = Date.now();
  for (const [token, data] of activeTokens.entries()) {
    if (now - data.createdAt > TOKEN_EXPIRY_MS) {
      activeTokens.delete(token);
    }
  }

  const token = generateToken();
  activeTokens.set(token, { createdAt: now, masterPassword });
  return token;
}

export function isValidToken(token: string): boolean {
  const data = activeTokens.get(token);
  if (!data) return false;
  if (Date.now() - data.createdAt > TOKEN_EXPIRY_MS) {
    activeTokens.delete(token);
    return false;
  }
  return true;
}

export function getMasterPasswordFromSession(request: NextRequest): string | null {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  const data = activeTokens.get(token);
  if (!data) return null;
  if (Date.now() - data.createdAt > TOKEN_EXPIRY_MS) {
    activeTokens.delete(token);
    return null;
  }
  return data.masterPassword;
}

export async function validateSession(
  request: NextRequest
): Promise<{ valid: boolean; error?: string }> {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return { valid: false, error: "לא נמצא טוקן הזדהות" };
  if (!isValidToken(token)) return { valid: false, error: "טוקן לא תקין או פג תוקף" };
  return { valid: true };
}

export async function verifyMasterPassword(password: string): Promise<boolean> {
  const hash = await getMasterPasswordHash();
  if (!hash) return false;
  return verifyPassword(password, hash);
}
