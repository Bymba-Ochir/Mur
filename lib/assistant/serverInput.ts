import type { PetAssistantContext } from './types';

export type AssistantLocale = 'mn' | 'en';

export interface AssistantRequestInput {
  message: string;
  locale: AssistantLocale;
  petContext: PetAssistantContext;
}

export type AssistantRequestParseResult =
  | { ok: true; value: AssistantRequestInput }
  | { ok: false; error: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function sanitizePetContext(value: unknown): PetAssistantContext {
  if (!isRecord(value)) return {};

  const type: PetAssistantContext['type'] = value.type === 'Нохой' || value.type === 'Муур' ? value.type : '';

  let age = '';
  if (typeof value.age === 'string' || typeof value.age === 'number') {
    const parsedAge = Number(String(value.age).trim());
    if (Number.isFinite(parsedAge) && parsedAge >= 0 && parsedAge <= 40) {
      age = String(Math.round(parsedAge * 10) / 10);
    }
  }

  return { type, age };
}

/**
 * Browser-оос ирсэн assistant payload-ийг authoritative гэж үзэхгүй.
 * Зөвхөн allowlist хийсэн талбаруудыг validated/sanitized хэлбэрээр буцаана.
 */
export function parseAssistantRequest(body: unknown): AssistantRequestParseResult {
  if (!isRecord(body)) return { ok: false, error: 'Хүсэлтийн бүтэц буруу байна.' };

  if (typeof body.message !== 'string') return { ok: false, error: 'Мессеж шаардлагатай.' };
  const message = body.message.trim();
  if (!message) return { ok: false, error: 'Мессеж шаардлагатай.' };
  if (message.length > 1000) return { ok: false, error: 'Мессеж хэт урт байна (1000 тэмдэгтээс бага).' };

  return {
    ok: true,
    value: {
      message,
      locale: body.lang === 'en' ? 'en' : 'mn',
      petContext: sanitizePetContext(body.petContext),
    },
  };
}
