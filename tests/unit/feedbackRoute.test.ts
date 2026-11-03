import { beforeEach, expect, it, vi } from 'vitest';

vi.mock('../../lib/apiRateLimit', () => ({ limitIpRequest: vi.fn() }));
vi.mock('../../lib/errorTracking', () => ({ reportError: vi.fn() }));
vi.mock('../../lib/supabaseAdmin', () => ({ createAdminClient: vi.fn() }));

import { POST } from '../../app/api/feedback/route';
import { limitIpRequest } from '../../lib/apiRateLimit';
import { feedbackPage } from '../../lib/feedback';
import { createAdminClient } from '../../lib/supabaseAdmin';

const id = '4ae02d5a-f9a3-4bf0-b7de-059c86f85a4d';
const input = { category: 'bug', message: 'A reproducible error', page: '/pets' };
const insert = vi.fn();
const maybeSingle = vi.fn();
const from = vi.fn(() => ({ insert, select: () => ({ eq: () => ({ maybeSingle }) }) }));

function request(body: unknown, key = id) {
  return new Request('http://localhost:3000/api/feedback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Idempotency-Key': key },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(limitIpRequest).mockResolvedValue(null);
  vi.mocked(createAdminClient).mockReturnValue({ from } as unknown as ReturnType<typeof createAdminClient>);
  insert.mockResolvedValue({ error: null });
});

it('stores only the validated anonymous submission fields', async () => {
  const response = await POST(request({ ...input, message: '  A reproducible error  ', user_id: 'forged', created_at: '1999-01-01' }));
  expect(response.status).toBe(201);
  expect(from).toHaveBeenCalledWith('site_feedback');
  expect(insert).toHaveBeenCalledExactlyOnceWith({ ...input, id });
});

it('applies the shared limit before any database write', async () => {
  vi.mocked(limitIpRequest).mockResolvedValue(new Response(null, { status: 429 }) as Awaited<ReturnType<typeof limitIpRequest>>);
  expect((await POST(request(input))).status).toBe(429);
  expect(limitIpRequest).toHaveBeenCalledWith(expect.any(Request), 'feedback-create');
  expect(createAdminClient).not.toHaveBeenCalled();
});

it.each([
  { ...input, category: 'admin' },
  { ...input, page: '/pets/private-id' },
  { ...input, page: '/pets?secret=value' },
  { ...input, message: '    ' },
  { ...input, message: 'x'.repeat(2001) },
  { ...input, ignored: 'x'.repeat(16384) },
])('rejects invalid feedback without writing', async (body) => {
  expect((await POST(request(body))).status).toBe(400);
  expect(createAdminClient).not.toHaveBeenCalled();
});

it('rejects a missing idempotency key', async () => {
  expect((await POST(request(input, ''))).status).toBe(400);
  expect(createAdminClient).not.toHaveBeenCalled();
});

it('acknowledges retries only when the saved submission matches', async () => {
  insert.mockResolvedValue({ error: { code: '23505' } });
  maybeSingle.mockResolvedValue({ data: input, error: null });
  expect((await POST(request(input))).status).toBe(200);
  expect((await POST(request({ ...input, category: 'other' }))).status).toBe(409);
});

it('keeps record IDs out of the captured page area', () => {
  expect(feedbackPage('/messages/private-conversation')).toBe('/messages');
  expect(feedbackPage('/')).toBe('/');
});
