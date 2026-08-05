// lib/rateLimit.ts
// Энгийн in-memory rate limiter. Vercel serverless-д instance бүрд хамаардаг тул
// бүрэн хатуу хязгаарлалт БИШ, харин spam-ыг мэдэгдэхүйц бууруулдаг MVP түвшний
// хамгаалалт. Чанга хязгаарлалт хэрэгтэй бол Upstash/Redis эсвэл DB-суурилсан
// тоолуур руу шилжинэ.

type Entry = { count: number; resetAt: number };

const buckets = new Map<string, Entry>();

const MAX_ENTRIES = 10_000;

export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): { allowed: boolean; retryAfterSec: number } {
  const now = Date.now();

  // Хугацаа дууссан entry-уудыг үе үе цэвэрлэж, Map-ыг хязгаарт байлгана
  if (buckets.size >= MAX_ENTRIES) {
    for (const [k, v] of buckets) {
      if (now >= v.resetAt) buckets.delete(k);
    }
  }

  const entry = buckets.get(key);
  if (!entry || now >= entry.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSec: 0 };
  }

  entry.count += 1;
  if (entry.count > limit) {
    return { allowed: false, retryAfterSec: Math.ceil((entry.resetAt - now) / 1000) };
  }
  return { allowed: true, retryAfterSec: 0 };
}

export function getClientIp(request: Request): string {
  // Vercel/прокси-гийн x-forwarded-for (эхнийх нь клиентийн IP)
  const fwd = request.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  return request.headers.get('x-real-ip') || 'unknown';
}
