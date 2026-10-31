import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('../../lib/errorTracking', () => ({ reportError: vi.fn() }));
vi.mock('../../lib/supabaseAdmin', () => ({ createAdminClient: vi.fn() }));
vi.mock('../../lib/qpay', () => ({ checkQPayPayment: vi.fn() }));
import { reportError } from '../../lib/errorTracking';
import { createAdminClient } from '../../lib/supabaseAdmin';
import { GET as subscriptionStatus } from '../../app/api/push-subscriptions/route';
import { POST as qpayCallback } from '../../app/api/qpay/callback/route';

beforeEach(() => { vi.resetAllMocks(); });
afterEach(() => { vi.unstubAllEnvs(); });

describe('handled backend failures', () => {
  it('keeps unauthorized requests out of error tracking', async () => {
    const response = await subscriptionStatus(new Request('https://mur.test/api/push-subscriptions'));
    expect(response.status).toBe(401);
    expect(reportError).not.toHaveBeenCalled();
    expect(createAdminClient).not.toHaveBeenCalled();
  });

  it('reports a caught API failure and preserves its 503 response', async () => {
    const failure = new Error('database offline');
    vi.mocked(createAdminClient).mockImplementation(() => { throw failure; });
    const response = await subscriptionStatus(new Request('https://mur.test/api/push-subscriptions?endpoint=https://fcm.googleapis.com/device', { headers: { authorization: 'Bearer private' } }));
    expect(response.status).toBe(503);
    expect(reportError).toHaveBeenCalledExactlyOnceWith(failure, { area: 'backend', operation: 'push-subscription-status' });
    expect(JSON.stringify(vi.mocked(reportError).mock.calls)).not.toContain('private');
  });

  it('reports callback database errors without changing the QPay acknowledgement', async () => {
    vi.stubEnv('QPAY_CALLBACK_SECRET', 'private');
    const failure = { code: 'PGRST001', message: 'database offline' };
    const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: failure });
    vi.mocked(createAdminClient).mockReturnValue({ from: () => ({ select: () => ({ eq: () => ({ maybeSingle }) }) }) } as unknown as ReturnType<typeof createAdminClient>);
    const response = await qpayCallback(new Request('https://mur.test/api/qpay/callback?secret=private', { method: 'POST', body: JSON.stringify({ invoice_id: 'invoice' }) }));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ message: 'OK' });
    expect(reportError).toHaveBeenCalledExactlyOnceWith(failure, { area: 'backend', operation: 'qpay-callback' });
  });
});
