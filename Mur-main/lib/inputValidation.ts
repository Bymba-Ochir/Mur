/** UI-ээс ирсэн утгыг DB-д бичихийн өмнө нэг мөрөөр шалгах туслахууд. */

export class InputValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InputValidationError';
  }
}

export function isInputValidationError(error: unknown): error is InputValidationError {
  return error instanceof InputValidationError;
}

export function cleanText(value: string | null | undefined, maxLength: number, label: string, required = false): string {
  const cleaned = (value ?? '').trim().replace(/\s+/g, ' ');
  if (required && !cleaned) throw new InputValidationError(`${label} оруулна уу.`);
  if (cleaned.length > maxLength) throw new InputValidationError(`${label} ${maxLength} тэмдэгтээс урт байж болохгүй.`);
  return cleaned;
}

export function requireMongolianPhone(value: string): string {
  const raw = value.replace(/\D/g, '');
  const digits = raw.length === 11 && raw.startsWith('976') ? raw.slice(3) : raw;
  if (!/^\d{8}$/.test(digits)) throw new InputValidationError('Утасны дугаар яг 8 оронтой байх ёстой.');
  return digits;
}

export function optionalInteger(
  value: string | number | null | undefined,
  { min = 0, max = Number.MAX_SAFE_INTEGER, label = 'Утга' }: { min?: number; max?: number; label?: string } = {},
): number | null {
  if (value === '' || value == null) return null;
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < min || parsed > max) {
    throw new InputValidationError(`${label} ${min.toLocaleString()}–${max.toLocaleString()} хоорондох бүхэл тоо байх ёстой.`);
  }
  return parsed;
}

export function optionalDecimal(
  value: string | number | null | undefined,
  { min = 0, max, label = 'Утга', decimals = 2 }: { min?: number; max: number; label?: string; decimals?: number },
): number | null {
  if (value === '' || value == null) return null;
  const parsed = typeof value === 'number' ? value : Number(value);
  const scale = 10 ** decimals;
  if (!Number.isFinite(parsed) || parsed < min || parsed > max || Math.abs(Math.round(parsed * scale) - parsed * scale) > Number.EPSILON * Math.max(1, Math.abs(parsed * scale)) * 4) {
    throw new InputValidationError(`${label} ${min}–${max} хооронд, дээд тал нь ${decimals} орны нарийвчлалтай тоо байх ёстой.`);
  }
  return parsed;
}

export function optionalIsoDate(value: string | null | undefined, label = 'Огноо'): string | null {
  if (!value) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new InputValidationError(`${label} буруу форматтай байна.`);
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    throw new InputValidationError(`${label} хүчинтэй огноо биш байна.`);
  }
  return value;
}

export function assertDateOrder(start: string | null, end: string | null): void {
  if (start && end && end < start) throw new InputValidationError('Дуусах огноо эхлэх огнооноос өмнө байж болохгүй.');
}

export function optionalCoordinate(value: number | null | undefined, kind: 'lat' | 'lng'): number | null {
  if (value == null) return null;
  const limit = kind === 'lat' ? 90 : 180;
  if (!Number.isFinite(value) || value < -limit || value > limit) throw new InputValidationError('Газрын зургийн координат буруу байна.');
  return value;
}
