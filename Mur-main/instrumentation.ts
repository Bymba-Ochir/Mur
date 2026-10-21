// instrumentation.ts
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Заавал env-ийн шалгалт — алга бол сервер/бүтээн байгуулалт тодорхой алдаагаар зогсоно
    const { assertRequiredEnv } = await import('./lib/env');
    assertRequiredEnv();
    await import('./sentry.server.config');
  }
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config');
  }
}
