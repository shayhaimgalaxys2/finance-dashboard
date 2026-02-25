import { db } from "@/lib/db";
import { settings, sessions } from "@/lib/db/schema";
import { hashPassword, verifyPassword, generateToken } from "@/lib/crypto";
import { eq, lt } from "drizzle-orm";
import { NextRequest } from "next/server";

const MASTER_PASSWORD_KEY = "master_password_hash";
const SESSION_COOKIE_NAME = "session_token";

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
  // Clean up expired sessions
  db.delete(sessions)
    .where(lt(sessions.expiresAt, new Date().toISOString()))
    .run();

  const token = generateToken();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + TOKEN_EXPIRY_MS);

  db.insert(sessions)
    .values({
      token,
      masterPassword,
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
    })
    .run();

  return token;
}

export function isValidToken(token: string): boolean {
  const session = db
    .select()
    .from(sessions)
    .where(eq(sessions.token, token))
    .get();

  if (!session) return false;

  if (new Date(session.expiresAt) < new Date()) {
    db.delete(sessions).where(eq(sessions.token, token)).run();
    return false;
  }

  return true;
}

export function getMasterPasswordFromSession(request: NextRequest): string | null {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  const session = db
    .select()
    .from(sessions)
    .where(eq(sessions.token, token))
    .get();

  if (!session) return null;

  if (new Date(session.expiresAt) < new Date()) {
    db.delete(sessions).where(eq(sessions.token, token)).run();
    return null;
  }

  return session.masterPassword;
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
