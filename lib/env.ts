// lib/env.ts — серверийн орчны хувьсагчдын баталгаажуулалт
// Заавал байх env алга бол тодорхой алдаатай fail-fast (нууц үг/түлхүүрийг
// дүгнэж гаргахгүй, зөвхөн нэрийг нь жагсаана). instrumentation.ts-д дуудагдана.

const REQUIRED_VARS = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
] as const;

export function assertRequiredEnv(): void {
  const missing = REQUIRED_VARS.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(
      `Дутуу орчны хувьсагч: ${missing.join(', ')}. ` +
        `.env.local-ийг шалгана уу (жишээ утгууд .env.local.example-д байна).`,
    );
  }
}
