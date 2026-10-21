// lib/utils.ts
/**
 * Утасны дугаарыг зөвхөн тоон хэсэг авч, 8 оронтой болгох (Монголын 8 оронтой дугаар)
 * Оролд: "99112233", "99 11 22 33", "+976 99 11 22 33", "99-11-22-33" г.м.
 * Гаралт: "99112233" (зөвхөн тоо, 8 орон)
 */
export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  // +976 эсвэл 976 эхлэх бол хасах
  if (digits.startsWith('976')) return digits.slice(3);
  if (digits.startsWith('76')) return digits.slice(2);
  return digits;
}

/**
 * Утасны дугаарыг харагдац форматад хөрвүүлэх: "99112233" → "99 11 22 33"
 */
export function formatPhone(phone: string | null | undefined): string {
  if (!phone) return '';
  const normalized = normalizePhone(phone);
  if (normalized.length !== 8) return normalized;
  return `${normalized.slice(0, 2)} ${normalized.slice(2, 4)} ${normalized.slice(4, 6)} ${normalized.slice(6, 8)}`;
}

/**
 * Утасны дугаарыг нуух (mask): "99112233" → "99******33"
 */
export function maskPhone(phone: string | null | undefined): string {
  if (!phone) return '';
  const normalized = normalizePhone(phone);
  if (normalized.length <= 4) return normalized;
  const first = normalized.slice(0, 2);
  const last = normalized.slice(-2);
  const stars = '*'.repeat(Math.max(0, normalized.length - 4));
  return `${first}${stars}${last}`;
}

/**
 * Strict горимд `catch (err)` нь `unknown` байдаг тул алдааны мессежийг
 * аюулгүйгээр гаргаж авах туслах функц.
 */
export function getErrorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

