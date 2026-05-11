/**
 * IOR Gestão Pro — Criptografia de dados sensíveis
 * AES-256-GCM com IV aleatório por operação
 * LGPD: CPF, telefone, e-mail ficam sempre criptografados no banco
 *
 * SETUP: adicione ao .env
 *   ENCRYPTION_KEY=<hex de 64 chars — gere com: openssl rand -hex 32>
 */
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "crypto";

const ALG = "aes-256-gcm";
const IV_LEN = 16;
const TAG_LEN = 16;
const ENCODING = "hex" as const;

function getKey(): Buffer {
  const raw = process.env.ENCRYPTION_KEY;
  if (!raw) throw new Error("ENCRYPTION_KEY não definida no .env — dados sensíveis não podem ser criptografados");
  if (raw.length !== 64) throw new Error("ENCRYPTION_KEY deve ter 64 caracteres hex (32 bytes)");
  return Buffer.from(raw, "hex");
}

/**
 * Criptografa uma string. Retorna: iv:tag:ciphertext (todos em hex)
 * Seguro para armazenar em campos TEXT do banco.
 */
export function encrypt(plaintext: string): string {
  if (!plaintext) return plaintext;
  const key = getKey();
  const iv = randomBytes(IV_LEN);
  const cipher = createCipheriv(ALG, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv.toString(ENCODING), tag.toString(ENCODING), encrypted.toString(ENCODING)].join(":");
}

/**
 * Descriptografa uma string criptografada com encrypt().
 * Retorna a string original ou "" em caso de dados não criptografados (legado).
 */
export function decrypt(ciphertext: string): string {
  if (!ciphertext) return ciphertext;
  // Dados legado (não criptografados) passam direto — migração gradual
  if (!ciphertext.includes(":")) return ciphertext;
  const [ivHex, tagHex, encHex] = ciphertext.split(":");
  if (!ivHex || !tagHex || !encHex) return "";
  const key = getKey();
  const decipher = createDecipheriv(ALG, key, Buffer.from(ivHex, ENCODING));
  decipher.setAuthTag(Buffer.from(tagHex, ENCODING));
  return decipher.update(Buffer.from(encHex, ENCODING)) + decipher.final("utf8");
}

/** Criptografa um objeto, retornando apenas os campos especificados criptografados */
export function encryptFields<T extends Record<string, unknown>>(obj: T, fields: (keyof T)[]): T {
  const result = { ...obj };
  for (const field of fields) {
    if (typeof result[field] === "string") {
      (result as Record<string, unknown>)[field as string] = encrypt(result[field] as string);
    }
  }
  return result;
}

/** Descriptografa um objeto nos campos especificados */
export function decryptFields<T extends Record<string, unknown>>(obj: T, fields: (keyof T)[]): T {
  const result = { ...obj };
  for (const field of fields) {
    if (typeof result[field] === "string") {
      (result as Record<string, unknown>)[field as string] = decrypt(result[field] as string);
    }
  }
  return result;
}

/** Campos sensíveis por tabela (LGPD) */
export const SENSITIVE_FIELDS = {
  students: ["cpf", "phone", "email"] as const,
  leads:    ["phone", "email"] as const,
} as const;
