import * as crypto from "crypto";

// AES-256 encryption configuration
const algorithm = "aes-256-cbc";
const IV_LENGTH = 16;

export function deriveEncryptionKeyFromPassword(
  password: string,
  salt: string
): Buffer {
  return crypto.pbkdf2Sync(password, salt, 100000, 32, "sha256");
}

export function encrypt(text: string, encryptionKey: string): string {
  const encryptionKeyBuffer = Buffer.from(encryptionKey, "hex");
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(algorithm, encryptionKeyBuffer, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return `${iv.toString("hex")}:${encrypted}`;
}

export function decrypt(text: string, encryptionKey: string): string {
  const encryptionKeyBuffer = Buffer.from(encryptionKey, "hex");
  const [ivHex, encryptedText] = text.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const decipher = crypto.createDecipheriv(algorithm, encryptionKeyBuffer, iv);
  let decrypted = decipher.update(encryptedText, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

export const generateRandomString = (length: number) => {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};
