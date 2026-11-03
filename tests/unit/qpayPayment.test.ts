import { afterEach, beforeEach, expect, it, vi } from 'vitest';

const paid = { payment_status: 'PAID', payment_currency: 'MNT' };
const fetchQPay = vi.fn<typeof fetch>();

beforeEach(() => {
  vi.resetModules();
  vi.stubEnv('QPAY_BASE_URL', 'https://qpay.test');
  vi.stubEnv('QPAY_USERNAME', 'test');
  vi.stubEnv('QPAY_PASSWORD', 'test');
  vi.stubEnv('QPAY_INVOICE_CODE', 'test');
  fetchQPay.mockReset();
  fetchQPay.mockResolvedValueOnce(Response.json({ access_token: 'test', expires_in: 3600 }));
  vi.stubGlobal('fetch', fetchQPay);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

it.each([
  ['confirmed full payment', { count: 1, paid_amount: '5000.00', rows: [paid] }, true],
  ['unpaid', { count: 0 }, false],
  ['partial payment', { count: 1, paid_amount: 1000, rows: [paid] }, false],
  ['failed payment', { count: 1, paid_amount: 5000, rows: [{ ...paid, payment_status: 'FAILED' }] }, false],
  ['wrong currency', { count: 1, paid_amount: 5000, rows: [{ ...paid, payment_currency: 'USD' }] }, false],
] as const)('verifies QPay response for %s', async (_name, result, verified) => {
  const { checkQPayPayment } = await import('../../lib/qpay');
  fetchQPay.mockResolvedValueOnce(Response.json(result));

  await expect(checkQPayPayment('stored-invoice', 5000)).resolves.toBe(verified);
  const [url, options] = fetchQPay.mock.calls[1];
  expect(url).toBe('https://qpay.test/v2/payment/check');
  expect(JSON.parse(options?.body as string)).toMatchObject({ object_type: 'INVOICE', object_id: 'stored-invoice' });
});
