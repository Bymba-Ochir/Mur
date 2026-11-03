import { limitIpRequest, limitServiceRequest } from '../../../../lib/apiRateLimit';
import { reportError } from '../../../../lib/errorTracking';
import { NextResponse } from 'next/server';
import { checkQPayPayment } from '../../../../lib/qpay';
import { verifyLegacyQPayCallbackSecret, verifyQPayCallbackSignature } from '../../../../lib/qpayCallback';
import { createAdminClient } from '../../../../lib/supabaseAdmin';
import { isIdempotencyKey } from '../../../../lib/idempotency';

const noStore = { 'Cache-Control': 'no-store' };

async function handleCallback(request: Request) {
  const isGet = request.method === 'GET';
  if (!isGet && request.method !== 'POST') return new Response(null, { status: 405 });

  const acknowledge = () => isGet
    ? new Response('SUCCESS', { headers: noStore })
    : NextResponse.json({ message: 'OK' }, { headers: noStore });

  try {
    const secret = process.env.QPAY_CALLBACK_SECRET;
    if (!secret?.trim()) {
      reportError(new Error('QPAY_CALLBACK_SECRET is not configured'), { area: 'backend', operation: 'qpay-callback' });
      return NextResponse.json({ error: 'Callback unavailable' }, { status: 503 });
    }

    const { searchParams } = new URL(request.url);
    const donationId = searchParams.get('donationId');
    const signature = searchParams.get('sig');
    const signedUrl = donationId !== null || signature !== null;
    const legacySecret = request.headers.get('authorization')?.match(/^Bearer (.+)$/i)?.[1] ?? searchParams.get('secret');
    const authorized = signedUrl
      ? isIdempotencyKey(donationId) && verifyQPayCallbackSignature(donationId, signature, secret)
      : !isGet && !!legacySecret && verifyLegacyQPayCallbackSecret(legacySecret, secret);
    if (!authorized) {
      return NextResponse.json({ error: 'Invalid callback authentication' }, { status: 401, headers: noStore });
    }
    if (isGet && !searchParams.get('qpay_payment_id')) return acknowledge();

    const ipLimit = await limitIpRequest(request, 'qpay-callback');
    if (ipLimit) return ipLimit;
    const serviceLimit = await limitServiceRequest('qpay-callback');
    if (serviceLimit) return serviceLimit;

    // Existing invoices already have the legacy callback URL registered with QPay.
    let lookupId = donationId;
    if (!signedUrl) {
      const body = await request.json().catch(() => null);
      const invoiceId: unknown = body?.invoice_id;
      if (typeof invoiceId !== 'string' || !invoiceId || invoiceId.length > 200) return acknowledge();
      lookupId = invoiceId;
    }

    const admin = createAdminClient();
    const { data: donation, error: lookupError } = await admin.from('donations')
      .select('id,invoice_id,status,amount')
      .eq(signedUrl ? 'id' : 'invoice_id', lookupId)
      .maybeSingle();
    if (lookupError) throw lookupError;

    if (!donation || donation.status !== 'pending') return acknowledge();
    if (!donation.invoice_id) {
      return NextResponse.json({ error: 'Invoice is not ready' }, { status: 503, headers: noStore });
    }

    const invoiceLimit = await limitServiceRequest('qpay-invoice', donation.invoice_id, admin);
    if (invoiceLimit) return invoiceLimit;

    if (await checkQPayPayment(donation.invoice_id, donation.amount)) {
      const { error: updateError } = await admin.from('donations')
        .update({ status: 'paid' })
        .eq('id', donation.id)
        .eq('invoice_id', donation.invoice_id)
        .eq('status', 'pending');
      if (updateError) throw updateError;
    }

    return acknowledge();
  } catch (err) {
    reportError(err, { area: 'backend', operation: 'qpay-callback' });
    return NextResponse.json({ error: 'Callback unavailable' }, { status: 503, headers: noStore });
  }
}

export const GET = handleCallback;
export const POST = handleCallback;
