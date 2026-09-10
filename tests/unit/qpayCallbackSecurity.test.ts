import { afterEach, expect, it, vi } from 'vitest';
vi.mock('../../lib/qpay', () => ({ checkQPayPayment: vi.fn() }));
vi.mock('../../lib/supabaseAdmin', () => ({ createAdminClient: vi.fn(() => { throw new Error('must not reach database'); }) }));
import { POST } from '../../app/api/qpay/callback/route';
afterEach(() => vi.unstubAllEnvs());
it('fails closed without a callback secret', async () => {
  vi.stubEnv('QPAY_CALLBACK_SECRET', '');
  expect((await POST(new Request('https://example.com/api/qpay/callback', { method: 'POST', body: '{}' }))).status).toBe(503);
});
it('does not reach payment or database for an incorrect secret', async () => {
  vi.stubEnv('QPAY_CALLBACK_SECRET', 'expected');
  const response = await POST(new Request('https://example.com/api/qpay/callback?secret=wrong', { method: 'POST', body: '{}' }));
  expect(response.status).toBe(200);
  const { createAdminClient } = await import('../../lib/supabaseAdmin');
  expect(createAdminClient).not.toHaveBeenCalled();
});
