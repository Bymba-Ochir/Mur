import { afterEach, beforeEach, expect, it, vi } from 'vitest';
vi.mock('../../lib/qpay', () => ({ checkQPayPayment: vi.fn() }));
vi.mock('../../lib/supabaseAdmin', () => ({ createAdminClient: vi.fn() }));
vi.mock('../../lib/apiRateLimit', () => ({ limitIpRequest: vi.fn(), limitServiceRequest: vi.fn() }));
vi.mock('../../lib/errorTracking', () => ({ reportError: vi.fn() }));
import { GET, POST } from '../../app/api/qpay/callback/route';
import { limitIpRequest, limitServiceRequest } from '../../lib/apiRateLimit';
import { checkQPayPayment } from '../../lib/qpay';
import { createQPayCallbackUrl } from '../../lib/qpayCallback';
import { createAdminClient } from '../../lib/supabaseAdmin';

const site = 'https://example.com';
const secret = 'expected';
const donationId = '4ae02d5a-f9a3-4bf0-b7de-059c86f85a4d';
const donation = { id: donationId, status: 'pending', amount: 5000, invoice_id: 'stored-invoice' };

function signedUrl() {
  return new URL(createQPayCallbackUrl(site, donationId, secret));
}

function useDonation(row = donation) {
  const lookup = vi.fn(() => ({ maybeSingle: async () => ({ data: row, error: null }) }));
  const statusFilter = vi.fn().mockResolvedValue({ error: null });
  const invoiceFilter = vi.fn(() => ({ eq: statusFilter }));
  const idFilter = vi.fn(() => ({ eq: invoiceFilter }));
  const update = vi.fn(() => ({ eq: idFilter }));
  const admin = { from: () => ({ select: () => ({ eq: lookup }), update }) };
  vi.mocked(createAdminClient).mockReturnValue(admin as unknown as ReturnType<typeof createAdminClient>);
  return { admin, lookup, update, idFilter, invoiceFilter, statusFilter };
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv('QPAY_CALLBACK_SECRET', secret);
});
afterEach(() => vi.unstubAllEnvs());

it('fails closed without a callback secret', async () => {
  vi.stubEnv('QPAY_CALLBACK_SECRET', '');
  expect((await POST(new Request('https://example.com/api/qpay/callback', { method: 'POST', body: '{}' }))).status).toBe(503);
  expect(createAdminClient).not.toHaveBeenCalled();
});

it('does not reach payment or database for an incorrect secret', async () => {
  const response = await POST(new Request('https://example.com/api/qpay/callback?secret=wrong', { method: 'POST', body: '{}' }));
  expect(response.status).toBe(401);
  expect(createAdminClient).not.toHaveBeenCalled();
  expect(checkQPayPayment).not.toHaveBeenCalled();
});

it.each(['donationId', 'sig'])('rejects a modified %s even with a legacy secret', async (param) => {
  const url = signedUrl();
  url.searchParams.set(param, param === 'sig' ? 'a'.repeat(64) : '7dc31e58-2087-41c3-821c-ed4515aa5d47');
  url.searchParams.set('secret', secret);
  expect((await POST(new Request(url, { method: 'POST' }))).status).toBe(401);
  expect(limitIpRequest).not.toHaveBeenCalled();
  expect(createAdminClient).not.toHaveBeenCalled();
});

it.each(['POST', 'GET'])('confirms a signed %s callback using the stored invoice and a guarded write', async (method) => {
  const { lookup, update, idFilter, invoiceFilter, statusFilter } = useDonation();
  vi.mocked(checkQPayPayment).mockResolvedValue(true);
  const url = signedUrl();
  url.searchParams.set('qpay_payment_id', 'untrusted-payment-id');
  expect(url.searchParams.has('secret')).toBe(false);
  const response = method === 'GET'
    ? await GET(new Request(url))
    : await POST(new Request(url, { method, body: JSON.stringify({ invoice_id: 'untrusted-invoice', amount: 1 }) }));
  expect(response.status).toBe(200);
  expect(lookup).toHaveBeenCalledWith('id', donationId);
  expect(checkQPayPayment).toHaveBeenCalledExactlyOnceWith('stored-invoice', 5000);
  expect(update).toHaveBeenCalledExactlyOnceWith({ status: 'paid' });
  expect(idFilter).toHaveBeenCalledWith('id', donationId);
  expect(invoiceFilter).toHaveBeenCalledWith('invoice_id', 'stored-invoice');
  expect(statusFilter).toHaveBeenCalledWith('status', 'pending');
});

it('keeps callbacks already registered for old invoices working', async () => {
  const { lookup, update } = useDonation();
  vi.mocked(checkQPayPayment).mockResolvedValue(true);
  const response = await POST(new Request(`${site}/api/qpay/callback?secret=${secret}`, {
    method: 'POST',
    body: JSON.stringify({ invoice_id: 'stored-invoice' }),
  }));
  expect(response.status).toBe(200);
  expect(lookup).toHaveBeenCalledWith('invoice_id', 'stored-invoice');
  expect(update).toHaveBeenCalledOnce();
});

it('leaves the donation pending when QPay has not confirmed it', async () => {
  const { update } = useDonation();
  vi.mocked(checkQPayPayment).mockResolvedValue(false);
  expect((await POST(new Request(signedUrl(), { method: 'POST' }))).status).toBe(200);
  expect(update).not.toHaveBeenCalled();
});

it('does not recheck or write a paid donation when a callback is retried', async () => {
  const { update } = useDonation({ ...donation, status: 'paid' });
  expect((await POST(new Request(signedUrl(), { method: 'POST' }))).status).toBe(200);
  expect(checkQPayPayment).not.toHaveBeenCalled();
  expect(update).not.toHaveBeenCalled();
});

it('honors the invoice budget before checking QPay', async () => {
  const { admin, update } = useDonation();
  vi.mocked(limitServiceRequest).mockImplementation(async (name) => name === 'qpay-invoice'
    ? Response.json({}, { status: 429 }) as Awaited<ReturnType<typeof limitServiceRequest>>
    : null);
  expect((await POST(new Request(signedUrl(), { method: 'POST' }))).status).toBe(429);
  expect(limitServiceRequest).toHaveBeenCalledWith('qpay-invoice', 'stored-invoice', admin);
  expect(checkQPayPayment).not.toHaveBeenCalled();
  expect(update).not.toHaveBeenCalled();
});
