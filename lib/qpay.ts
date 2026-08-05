// lib/qpay.ts
//
// QPay v2 API интеграц (Монголд түгээмэл QR төлбөрийн систем). Зөвхөн серверийн
// код (API route) дотор ашиглагдана, түлхүүрүүд browser-т цацагдахгүй.
//
// АНХААР: QPay merchant эрх авахын тулд бүртгэлтэй бизнес (аж ахуйн нэгж) байх
// шаардлагатай — хувь хүний данс биш. Дэлгэрэнгүй README-д.
import type { QPayInvoice, QPayInvoiceInput } from './types';

const QPAY_BASE_URL = process.env.QPAY_BASE_URL || 'https://merchant.qpay.mn';
const QPAY_USERNAME = process.env.QPAY_USERNAME;
const QPAY_PASSWORD = process.env.QPAY_PASSWORD;
const QPAY_INVOICE_CODE = process.env.QPAY_INVOICE_CODE;

let cachedToken: { access_token: string; expires_at: number } | null = null;

function validateConfig(): void {
  if (!QPAY_USERNAME || !QPAY_PASSWORD || !QPAY_INVOICE_CODE) {
    throw new Error('QPay тохиргоо дутуу байна. Орчны хувьсагчдаа шалгана уу.');
  }
}

export async function getQPayToken(): Promise<string> {
  validateConfig();

  if (cachedToken && Date.now() < cachedToken.expires_at - 60_000) {
    return cachedToken.access_token;
  }

  const url = `${QPAY_BASE_URL}/v2/auth/token`;
  const auth = Buffer.from(`${QPAY_USERNAME}:${QPAY_PASSWORD}`).toString('base64');

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Basic ${auth}` },
  });

  if (!res.ok) throw new Error(`QPay token алдаа: ${res.status} ${res.statusText}`);

  const data = await res.json();
  cachedToken = { access_token: data.access_token, expires_at: Date.now() + data.expires_in * 1000 };
  return data.access_token;
}

export async function createQPayInvoice(input: QPayInvoiceInput): Promise<QPayInvoice> {
  const { sender_invoice_no, invoice_description, amount, callback_url } = input;
  validateConfig();
  const token = await getQPayToken();

  const res = await fetch(`${QPAY_BASE_URL}/v2/invoice`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      invoice_code: QPAY_INVOICE_CODE,
      sender_invoice_no,
      invoice_description,
      invoice_receiver_code: 'terminal',
      amount,
      callback_url,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`QPay нэхэмжлэл үүсгэхэд алдаа гарлаа: ${res.status} ${body}`);
  }
  return res.json();
}

export async function checkQPayPayment(invoice_id: string): Promise<{ count: number }> {
  validateConfig();
  const token = await getQPayToken();

  const res = await fetch(`${QPAY_BASE_URL}/v2/payment/check`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      object_type: 'INVOICE',
      object_id: invoice_id,
      offset: { page_number: 1, page_limit: 100 },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`QPay төлбөр шалгахад алдаа гарлаа: ${res.status} ${body}`);
  }
  return res.json();
}
