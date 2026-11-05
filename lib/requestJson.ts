import { NextResponse } from 'next/server';

export const JSON_BODY_LIMIT = 16 * 1024;
export const WEBHOOK_BODY_LIMIT = 64 * 1024;

export class JsonBodyError extends Error {
  constructor(public readonly status: 400 | 413 | 415) {
    super(status === 413 ? 'Хүсэлтийн хэмжээ хэтэрсэн.' : status === 415 ? 'JSON шаардлагатай.' : 'JSON хүсэлтийн бүтэц буруу байна.');
  }
}

/** Bound actual streamed bytes, including chunked requests and forged Content-Length. */
export async function readJsonBody(request: Request, options: { maxBytes?: number; requireJsonContentType?: boolean } = {}): Promise<Record<string, unknown>> {
  const maxBytes = options.maxBytes ?? JSON_BODY_LIMIT;
  if (!Number.isSafeInteger(maxBytes) || maxBytes < 1 || maxBytes > WEBHOOK_BODY_LIMIT) throw new Error('Invalid JSON body limit');
  if (options.requireJsonContentType && request.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !== 'application/json') throw new JsonBodyError(415);
  const declared = request.headers.get('content-length');
  if (declared && /^\d+$/.test(declared) && Number(declared) > maxBytes) {
    await request.body?.cancel().catch(() => undefined);
    throw new JsonBodyError(413);
  }
  if (!request.body) throw new JsonBodyError(400);
  const reader = request.body.getReader();
  const buffer = new Uint8Array(maxBytes);
  let length = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      if (length + value.byteLength > maxBytes) {
        await reader.cancel().catch(() => undefined);
        throw new JsonBodyError(413);
      }
      buffer.set(value, length);
      length += value.byteLength;
    }
    const body: unknown = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(buffer.subarray(0, length)));
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw new JsonBodyError(400);
    return body as Record<string, unknown>;
  } catch (error) {
    throw error instanceof JsonBodyError ? error : new JsonBodyError(400);
  } finally {
    reader.releaseLock();
  }
}

export function jsonBodyErrorResponse(error: unknown) {
  return error instanceof JsonBodyError ? NextResponse.json({ error: error.message }, { status: error.status }) : null;
}
