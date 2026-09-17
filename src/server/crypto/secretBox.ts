import { randomBytes, createCipheriv, createDecipheriv } from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;
const KEY_LENGTH = 32;

export interface SealedSecret {
  sealed: Uint8Array<ArrayBuffer>;
  keyVer: number;
}

let cachedKey: Buffer | null = null;

/**
 * Called exactly once, from server/config/env.ts right after it parses ENCRYPTION_KEY —
 * this module never imports env.ts itself (that would be circular: env.ts needs this
 * module's validation to fail fast on a bad key). Throws on an unusable key.
 */
export function configureSecretBox(encryptionKeyBase64: string, authSecret: string): void {
  if (!encryptionKeyBase64) {
    throw new Error("ENCRYPTION_KEY is required");
  }
  if (encryptionKeyBase64 === authSecret) {
    throw new Error("ENCRYPTION_KEY must not equal AUTH_SECRET");
  }
  const buffer = Buffer.from(encryptionKeyBase64, "base64");
  if (buffer.length !== KEY_LENGTH) {
    throw new Error(
      `ENCRYPTION_KEY must decode to exactly ${KEY_LENGTH} bytes (base64), got ${buffer.length}`,
    );
  }
  cachedKey = buffer;
}

function getKey(): Buffer {
  if (!cachedKey) {
    throw new Error(
      "secretBox used before configureSecretBox() ran — import server/config/env.ts first",
    );
  }
  return cachedKey;
}

/**
 * Seals a UTF-8 string as iv(12) + authTag(16) + ciphertext, packed into one buffer.
 * keyVer is currently always 1 — key rotation would add a lookup table here and bump it.
 */
export function sealSecret(plaintext: string): SealedSecret {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, getKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  const sealed = Buffer.concat([iv, authTag, ciphertext]);
  return { sealed: Uint8Array.from(sealed), keyVer: 1 };
}

/**
 * Prisma 7 returns `Bytes` columns as Uint8Array, not Buffer — wrap explicitly rather than
 * assuming a Buffer-shaped input.
 */
export function unsealSecret(sealed: Uint8Array, keyVer: number): string {
  if (keyVer !== 1) {
    throw new Error(`Unsupported key version ${keyVer} — only keyVer 1 is implemented`);
  }
  const packed = Buffer.from(sealed);
  const iv = packed.subarray(0, IV_LENGTH);
  const authTag = packed.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const ciphertext = packed.subarray(IV_LENGTH + AUTH_TAG_LENGTH);
  const decipher = createDecipheriv(ALGORITHM, getKey(), iv);
  decipher.setAuthTag(authTag);
  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return plaintext.toString("utf8");
}
