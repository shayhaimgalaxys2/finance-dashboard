import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const SALT_LENGTH = 32;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;
const ITERATIONS = 100000;

function deriveKey(password: string, salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, "sha512");
}

export function encrypt(text: string, masterPassword: string): string {
  const salt = crypto.randomBytes(SALT_LENGTH);
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = deriveKey(masterPassword, salt);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(text, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  // Format: salt:iv:tag:encrypted (all base64)
  return [
    salt.toString("base64"),
    iv.toString("base64"),
    tag.toString("base64"),
    encrypted.toString("base64"),
  ].join(":");
}

export function decrypt(encryptedData: string, masterPassword: string): string {
  const [saltB64, ivB64, tagB64, dataB64] = encryptedData.split(":");

  const salt = Buffer.from(saltB64, "base64");
  const iv = Buffer.from(ivB64, "base64");
  const tag = Buffer.from(tagB64, "base64");
  const encrypted = Buffer.from(dataB64, "base64");

  const key = deriveKey(masterPassword, salt);

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  return decipher.update(encrypted) + decipher.final("utf8");
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(SALT_LENGTH);
  const hash = crypto.pbkdf2Sync(password, salt, ITERATIONS, 64, "sha512");
  return salt.toString("base64") + ":" + hash.toString("base64");
}

export function verifyPassword(password: string, stored: string): boolean {
  const [saltB64, hashB64] = stored.split(":");
  const salt = Buffer.from(saltB64, "base64");
  const hash = crypto.pbkdf2Sync(password, salt, ITERATIONS, 64, "sha512");
  return hash.toString("base64") === hashB64;
}

export function generateToken(): string {
  return crypto.randomBytes(48).toString("base64url");
}
