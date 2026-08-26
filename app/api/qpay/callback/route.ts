// app/api/qpay/callback/route.ts
import { NextResponse } from 'next/server';
import { checkQPayPayment } from '../../../../lib/qpay';
import { createAdminClient } from '../../../../lib/supabaseAdmin';

export async function POST(request: Request) {
  try {
    const callbackSecret = process.env.QPAY_CALLBACK_SECRET;
    if (!callbackSecret) {
      console.error('qpay/callback: QPAY_CALLBACK_SECRET тохируулагдаагүй');
      return NextResponse.json({ error: 'Callback тохиргоо дутуу байна' }, { status: 503 });
    }
    const url = new URL(request.url);
    const secretParam = url.searchParams.get('secret');
    const authHeader = request.headers.get('authorization');
    const provided = authHeader?.replace(/^Bearer\s+/i, '') || secretParam;
    if (provided !== callbackSecret) {
      return NextResponse.json({ error: 'Зөвшөөрөлгүй' }, { status: 401 });
    }

    const body = await request.json();
    const invoiceId = typeof body.invoice_id === 'string' ? body.invoice_id : '';
    if (!invoiceId || invoiceId.length > 200) {
      return NextResponse.json({ error: 'invoice_id буруу байна' }, { status: 400 });
    }

    const supabaseAdmin = createAdminClient();

    const { data: donation } = await supabaseAdmin
      .from('donations')
      .select('*')
      .eq('invoice_id', invoiceId)
      .maybeSingle();

    if (!donation || donation.status !== 'pending') {
      return NextResponse.json({ message: 'OK' }, { status: 200 });
    }

    const checkResult = await checkQPayPayment(invoiceId);
    if (checkResult.count >= 1) {
      await supabaseAdmin.from('donations').update({ status: 'paid' }).eq('id', donation.id);
    }

    return NextResponse.json({ message: 'OK' }, { status: 200 });
  } catch (err) {
    console.error('QPay callback error:', err);
    return NextResponse.json({ message: 'OK' }, { status: 200 });
  }
}
