// app/api/donations/create/route.ts
import { NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { createQPayInvoice } from '../../../../lib/qpay';
import { checkRateLimit, getClientIp } from '../../../../lib/rateLimit';
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
      return NextResponse.json({ error: 'Серверийн тохиргооны алдаа (SITE_URL)' }, { status: 500 });
    }

    let callbackUrl = `${appUrl}/api/qpay/callback`;
    if (process.env.QPAY_CALLBACK_SECRET) callbackUrl += `?secret=${process.env.QPAY_CALLBACK_SECRET}`;

    const supabaseAdmin = createAdminClient();
    const selectFields = 'id,amount,supporter_name,message,is_anonymous,status_token,invoice_id,qr_image,qr_text,created_at';
    const readDonation = async (): Promise<DonationRow | null> => {
      const { data, error } = await supabaseAdmin
        .from('donations')
        .select(selectFields)
        .eq('id', idempotencyKey)
        .maybeSingle();
      if (error) throw error;
      return data as DonationRow | null;
    };

    let existing = await readDonation();
    if (existing) {
      if (!matchesInput(existing, input)) {
        return NextResponse.json({ error: 'Idempotency-Key өөр хүсэлтэд аль хэдийн ашиглагдсан байна.' }, { status: 409 });
      }
      if (existing.qr_image && existing.invoice_id) {
        return NextResponse.json(donationPayload(existing));
      }

      // Ижил хүсэлт яг одоо өөр request дээр QPay invoice үүсгэж байвал давхар external side-effect бүү хий.
      // 2 минутаас хуучин incomplete мөрийг crash recovery гэж үзэж доор resume хийнэ.
      const ageMs = Date.now() - new Date(existing.created_at).getTime();
      if (Number.isFinite(ageMs) && ageMs < 120_000) {
        return NextResponse.json(
          { error: 'Нэхэмжлэл үүсэж байна. Түр хүлээгээд дахин оролдоно уу.' },
          { status: 409, headers: { 'Retry-After': '2' } },
        );
      }
    } else {
      // Rate limit зөвхөн шинэ logical operation-д үйлчилнэ; ижил key-тэй retry-г дахин тоолохгүй.
      const rl = checkRateLimit(`donate:${getClientIp(request)}`, 5, 60_000);
      if (!rl.allowed) {
        return NextResponse.json(
          { error: 'Хэт олон хүсэлт илгээлээ. Түр хүлээгээд дахин оролдоно уу.' },
          { status: 429, headers: { 'Retry-After': String(rl.retryAfterSec) } },
        );
      }

      const statusToken = randomBytes(32).toString('hex');
      const { error: reserveError } = await supabaseAdmin.from('donations').insert({
        id: idempotencyKey,
        amount: input.amount,
        supporter_name: input.supporterName,
        message: input.message,
        is_anonymous: input.isAnonymous,
        status: 'pending',
        status_token: statusToken,
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
      })
      .eq('id', idempotencyKey)
      .is('invoice_id', null)
      .select(selectFields)
      .maybeSingle();
    if (updateError) throw updateError;

    const finalRow = (updated as DonationRow | null) ?? await readDonation();
    if (!finalRow?.invoice_id || !finalRow.qr_image) throw new Error('Donation invoice хадгалж чадсангүй.');

    return NextResponse.json(donationPayload(finalRow, qpayInvoice.urls));
  } catch (err) {
    console.error('Donation create error:', err);
    return NextResponse.json({ error: 'Хандив үүсгэхэд алдаа гарлаа. Дахин оролдоно уу.' }, { status: 500 });
  }
}
