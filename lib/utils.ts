// lib/utils.ts
export function maskPhone(phone: string | null | undefined): string {
  if (!phone) return '';
  const digits = phone.replace(/\s/g, '');
  if (digits.length <= 4) return digits;
  const first = digits.slice(0, 2);
  const last = digits.slice(-2);
  const stars = '*'.repeat(digits.length - 4);
  return `${first}${stars}${last}`;
}

/**
 * Strict горимд `catch (err)` нь `unknown` байдаг тул алдааны мессежийг
 * аюулгүйгээр гаргаж авах туслах функц.
 */
export function getErrorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

/** Шагналын дүнг хүний уншихад эвтэй форматлах (жишээ: 50000 → "50,000₮") */
export function formatReward(amount: number | null | undefined): string {
  if (!amount) return '';
  return `${amount.toLocaleString('mn-MN')}₮`;
}
