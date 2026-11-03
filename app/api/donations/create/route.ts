import { limitIpRequest } from '../../../../lib/apiRateLimit';
import { reportError } from '../../../../lib/errorTracking';
// app/api/donations/create/route.ts
import { NextResponse } from 'next/server';
import { randomBytes, randomUUID } from 'crypto';
import { createQPayInvoice } from '../../../../lib/qpay';
import { createQPayCallbackUrl } from '../../../../lib/qpayCallback';
import { createAdminClient } from '../../../../lib/supabaseAdmin';
import { readIdempotencyKey } from '../../../../lib/idempotency';

interface DonationInput {
  amount: number;
  supporterName: string | null;
  message: string | null;
  isAnonymous: boolean;
}

interface DonationRow {
  id: string;
  amount: number;
  supporter_name: string | null;
  message: string | null;
  is_anonymous: boolean;
  status_token: string;
  invoice_id: string | null;
  qr_image: string | null;
  qr_text: string | null;
  created_at: string;
  invoice_claim_token: string | null;
  invoice_claimed_at: string | null;
}

function matchesInput(row: DonationRow, input: DonationInput): boolean {
  return row.amount === input.amount
    && row.supporter_name === input.supporterName
    && row.message === input.message
    && row.is_anonymous === input.isAnonymous;
}

function donationPayload(row: DonationRow, deepLinks?: unknown[]) {
  return {
    donationId: row.id,
    statusToken: row.status_token,
    qrImage: row.qr_image,
    qrText: row.qr_text,
    ...(deepLinks ? { deepLinks } : {}),
  };
}

export async function POST(request: Request) {
  try {
    const ipLimit = await limitIpRequest(request, 'donation-create');
    if (ipLimit) return ipLimit;
    const idempotencyKey = readIdempotencyKey(request);
    if (!idempotencyKey) {
      return NextResponse.json({ error: 'Idempotency-Key шаардлагатай.' }, { status: 400 });
    }

    const body = await request.json();
    const { amount, supporterName, message, isAnonymous } = body;

    if (!Number.isSafeInteger(amount) || amount < 1000 || amount > 5_000_000) {
      return NextResponse.json({ error: 'Дүн 1,000₮ - 5,000,000₮ хооронд байх ёстой' }, { status: 400 });
    }
    if (supporterName && (typeof supporterName !== 'string' || supporterName.length > 100)) {
      return NextResponse.json({ error: 'Нэр хэт урт байна' }, { status: 400 });
    }
    if (message && (typeof message !== 'string' || message.length > 500)) {
      return NextResponse.json({ error: 'Мессеж хэт урт байна' }, { status: 400 });
    }

    const input: DonationInput = {
      amount,
      supporterName: isAnonymous ? null : (supporterName || null),
      message: message ? message.slice(0, 500) : null,
      isAnonymous: Boolean(isAnonymous),
    };

    const appUrl = process.env.NEXT_PUBLIC_SITE_URL;
    if (!appUrl) {
      reportError(new Error('NEXT_PUBLIC_SITE_URL is not configured'), { area: 'backend', operation: 'donation-create' });
      return NextResponse.json({ error: 'Серверийн тохиргооны алдаа (SITE_URL)' }, { status: 500 });
    }

    const supabaseAdmin = createAdminClient();
    const selectFields = 'id,amount,supporter_name,message,is_anonymous,status_token,invoice_id,qr_image,qr_text,created_at,invoice_claim_token,invoice_claimed_at';
    const readDonation = async (): Promise<DonationRow | null> => {
      const { data, error } = await supabaseAdmin
        .from('donations')
        .select(selectFields)
        .eq('id', idempotencyKey)
        .maybeSingle();
      if (error) throw error;
      return data as DonationRow | null;
    };

    const invoiceClaimToken = randomUUID();
    let existing = await readDonation();
    if (existing) {
      if (!matchesInput(existing, input)) {
        return NextResponse.json({ error: 'Idempotency-Key өөр хүсэлтэд аль хэдийн ашиглагдсан байна.' }, { status: 409 });
      }
      if (existing.qr_image && existing.invoice_id) {
        return NextResponse.json(donationPayload(existing));
      }
    }

    const callbackSecret = process.env.QPAY_CALLBACK_SECRET;
    if (!callbackSecret?.trim()) {
      reportError(new Error('QPAY_CALLBACK_SECRET is not configured'), { area: 'backend', operation: 'donation-create' });
      return NextResponse.json({ error: 'QPay түр боломжгүй байна.' }, { status: 503 });
    }
    const callbackUrl = createQPayCallbackUrl(appUrl, idempotencyKey, callbackSecret);

    if (existing) {
      const { data: claimed, error: claimError } = await supabaseAdmin.rpc('claim_donation_invoice', {
        target_id: idempotencyKey,
        target_claim: invoiceClaimToken,
      });
      if (claimError) throw claimError;
      if (!claimed) {
        return NextResponse.json(
          { error: 'Нэхэмжлэл үүсэж байна эсвэл өмнөх оролдлого сэргээх шаардлагатай байна.' },
          { status: 409, headers: { 'Retry-After': '2' } },
        );
      }
      existing = await readDonation();
    } else {
      // Rate limit зөвхөн шинэ logical operation-д үйлчилнэ; ижил key-тэй retry-г дахин тоолохгүй.
      const newLimit = await limitIpRequest(request, 'donation-new', supabaseAdmin);
      if (newLimit) return newLimit;

      const statusToken = randomBytes(32).toString('hex');
      const { error: reserveError } = await supabaseAdmin.from('donations').insert({
        id: idempotencyKey,
        amount: input.amount,
        supporter_name: input.supporterName,
        message: input.message,
        is_anonymous: input.isAnonymous,
        status: 'pending',
        status_token: statusToken,
        invoice_claim_token: invoiceClaimToken,
        invoice_claimed_at: new Date().toISOString(),
      });

      if (reserveError) {
        if (reserveError.code !== '23505') throw reserveError;
        existing = await readDonation();
        if (!existing || !matchesInput(existing, input)) {
          return NextResponse.json({ error: 'Idempotency-Key өөр хүсэлтэд аль хэдийн ашиглагдсан байна.' }, { status: 409 });
        }
        if (existing.qr_image && existing.invoice_id) return NextResponse.json(donationPayload(existing));
        return NextResponse.json(
          { error: 'Нэхэмжлэл үүсэж байна. Түр хүлээгээд дахин оролдоно уу.' },
          { status: 409, headers: { 'Retry-After': '2' } },
        );
      }
      existing = await readDonation();
    }

    if (!existing) throw new Error('Donation reservation үүссэнгүй.');

    const senderInvoiceNo = `MUR-DON-${idempotencyKey.replaceAll('-', '')}`;
    const qpayInvoice = await createQPayInvoice({
      sender_invoice_no: senderInvoiceNo,
      invoice_description: `МӨР дэмжлэг — ${amount}₮`,
      amount,
      callback_url: callbackUrl,
    });

    const { data: updated, error: updateError } = await supabaseAdmin
      .from('donations')
      .update({
        invoice_id: qpayInvoice.invoice_id,
        qr_image: qpayInvoice.qr_image,
        qr_text: qpayInvoice.qr_text,
        invoice_claim_token: null,
        invoice_claimed_at: null,
      })
      .eq('id', idempotencyKey)
      .eq('invoice_claim_token', invoiceClaimToken)
      .is('invoice_id', null)
      .select(selectFields)
      .maybeSingle();
    if (updateError) throw updateError;

    const finalRow = (updated as DonationRow | null) ?? await readDonation();
    if (!finalRow?.invoice_id || !finalRow.qr_image) throw new Error('Donation invoice хадгалж чадсангүй.');

    return NextResponse.json(donationPayload(finalRow, qpayInvoice.urls));
  } catch (err) {
    reportError(err, { area: 'backend', operation: 'donation-create' });
    return NextResponse.json({ error: 'Хандив үүсгэхэд алдаа гарлаа. Дахин оролдоно уу.' }, { status: 500 });
  }
}
