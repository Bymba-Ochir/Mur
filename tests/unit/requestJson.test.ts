import { expect, it, vi } from 'vitest';
import { JSON_BODY_LIMIT, readJsonBody, JsonBodyError } from '../../lib/requestJson';

const encoder = new TextEncoder();
function streamed(chunks: Uint8Array[], headers: Record<string, string> = {}) {
  const cancel = vi.fn();
  let index = 0;
  const body = new ReadableStream({ pull(controller) { if (index < chunks.length) controller.enqueue(chunks[index++]); else controller.close(); }, cancel });
  return { cancel, request: new Request('http://localhost/api/test', { method: 'POST', body, headers, duplex: 'half' } as RequestInit) };
}

it.each([undefined, { 'content-length': '1' }])('caps actual chunked bytes even with absent or forged length', async headers => {
  const { request, cancel } = streamed([encoder.encode('{"x":"'), new Uint8Array(JSON_BODY_LIMIT), encoder.encode('"}')], headers);
  await expect(readJsonBody(request)).rejects.toMatchObject({ status: 413 });
  expect(cancel).toHaveBeenCalledOnce();
});

it('rejects an oversized declared length before reading the stream', async () => {
  const { request, cancel } = streamed([], { 'content-length': String(JSON_BODY_LIMIT + 1) });
  await expect(readJsonBody(request)).rejects.toMatchObject({ status: 413 });
  expect(cancel).toHaveBeenCalledOnce();
});

it('counts UTF-8 bytes and accepts the exact limit across split code points', async () => {
  const input = encoder.encode(JSON.stringify({ value: 'Ө' }));
  const { request } = streamed([input.slice(0, 11), input.slice(11)]);
  expect(await readJsonBody(request, { maxBytes: input.length })).toEqual({ value: 'Ө' });
  const tooSmall = streamed([input]);
  await expect(readJsonBody(tooSmall.request, { maxBytes: input.length - 1 })).rejects.toMatchObject({ status: 413 });
});

it.each(['null', '[]', '1', '"text"', '{', ''])('rejects invalid JSON objects: %s', async body => {
  await expect(readJsonBody(new Request('http://localhost', { method: 'POST', body }))).rejects.toMatchObject({ status: 400 });
});

it('rejects malformed UTF-8 and optionally enforces JSON content type', async () => {
  await expect(readJsonBody(streamed([new Uint8Array([123, 255, 125])]).request)).rejects.toBeInstanceOf(JsonBodyError);
  const { request } = streamed([encoder.encode('{}')], { 'content-type': 'text/plain' });
  await expect(readJsonBody(request, { requireJsonContentType: true })).rejects.toMatchObject({ status: 415 });
});
