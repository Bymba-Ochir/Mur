// app/api/donations/create/route.ts
import { NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { createQPayInvoice } from '../../../../lib/qpay';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { amount, supporterName, message, isAnonymous } = body;

    if (!amount || typeof amount !== 'number' || amount < 1000 || amount > 5_000_000) {
      return NextResponse.json({ error: 'Дүн 1,000₮ - 5,000,000₮ хооронд байх ёстой' }, { status: 400 });
    }
    if (supporterName && (typeof supporterName !== 'string' || supporterName.length > 100)) {
      return NextResponse.json({ error: 'Нэр хэт урт байна' }, { status: 400 });
    }
    if (message && (typeof message !== 'string' || message.length > 500)) {
      return NextResponse.json({ error: 'Мессеж хэт урт байна' }, { status: 400 });
    }

    const appUrl = process.env.NEXT_PUBLIC_SITE_URL;
    if (!appUrl) {
      return NextResponse.json({ error: 'Серверийн тохиргооны алдаа (SITE_URL)' }, { status: 500 });
    }

    let callbackUrl = `${appUrl}/api/qpay/callback`;
    if (process.env.QPAY_CALLBACK_SECRET) {
      callbackUrl += `?secret=${process.env.QPAY_CALLBACK_SECRET}`;
    }

    const senderInvoiceNo = `MUR-DON-${Date.now()}`;
    const invoiceDesc = `МӨР дэмжлэг — ${amount}₮`;

    const qpayInvoice = await createQPayInvoice({
      sender_invoice_no: senderInvoiceNo,
      invoice_description: invoiceDesc,
      amount,
      callback_url: callbackUrl,
    });

    const statusToken = randomBytes(32).toString('hex');

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: donation, error } = await supabaseAdmin
      .from('donations')
      .insert({
        amount,
        supporter_name: isAnonymous ? null : (supporterName || null),
        message: message ? message.slice(0, 500) : null,
        is_anonymous: !!isAnonymous,
        status: 'pending',
        invoice_id: qpayInvoice.invoice_id,
        qr_image: qpayInvoice.qr_image,
        qr_text: qpayInvoice.qr_text,
        status_token: statusToken,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      donationId: donation.id,
      statusToken,
      qrImage: qpayInvoice.qr_image,
      qrText: qpayInvoice.qr_text,
      deepLinks: qpayInvoice.urls,
    });
  } catch (err) {
    console.error('Donation create error:', err);
    return NextResponse.json({ error: (err instanceof Error ? err.message : String(err)) || 'Хандив үүсгэхэд алдаа гарлаа' }, { status: 500 });
  }
}
