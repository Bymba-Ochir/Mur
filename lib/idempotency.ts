const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export interface IdempotencyAttempt {
  key: string;
  fingerprint: string;
}

export function createIdempotencyKey(): string {
  const cryptoApi = globalThis.crypto;
  if (!cryptoApi?.randomUUID) throw new Error('Idempotency key үүсгэх боломжгүй байна.');
  return cryptoApi.randomUUID();
}

export function isIdempotencyKey(value: string | null | undefined): value is string {
  return Boolean(value && UUID_V4.test(value));
}

export function readIdempotencyKey(request: Request): string | null {
  const key = request.headers.get('Idempotency-Key')?.trim();
  return isIdempotencyKey(key) ? key : null;
}

export function idempotencyHeaders(key: string): Record<string, string> {
  return { 'Idempotency-Key': key };
}

export function fingerprintSubmission(values: unknown, files: readonly File[] = []): string {
  return JSON.stringify({
    values,
    files: files.map((file) => ({
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified,
    })),
  });
}

export function resolveIdempotencyAttempt(
  current: IdempotencyAttempt | null,
  fingerprint: string,
): IdempotencyAttempt {
  if (current?.fingerprint === fingerprint) return current;
  return { key: createIdempotencyKey(), fingerprint };
}

export function idempotentFileName(key: string, index: number, originalName: string): string {
  const safeName = originalName.replace(/[^a-zA-Z0-9._-]+/g, '_').slice(-120) || 'upload.bin';
  return `${key}_${index}_${safeName}`;
}
