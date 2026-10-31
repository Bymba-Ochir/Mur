import { reportError } from '../../../../lib/errorTracking';
// app/api/qpay/callback/route.ts
import { NextResponse } from 'next/server';
import { checkQPayPayment } from '../../../../lib/qpay';
import { createAdminClient } from '../../../../lib/supabaseAdmin';

export async function POST(request: Request) {
  try {
    if (!process.env.QPAY_CALLBACK_SECRET?.trim()) {
      reportError(new Error('QPAY_CALLBACK_SECRET is not configured'), { area: 'backend', operation: 'qpay-callback' });
      return NextResponse.json({ error: 'Callback unavailable' }, { status: 503 });
    }
    {
      const url = new URL(request.url);
      const secretParam = url.searchParams.get('secret');
      const authHeader = request.headers.get('authorization');
      const provided = authHeader?.replace('Bearer ', '') || secretParam;
      if (provided !== process.env.QPAY_CALLBACK_SECRET) {
        return NextResponse.json({ message: 'OK' }, { status: 200 });
      }
    }

    const body = await request.json();
    const invoiceId = body.invoice_id;
    if (typeof invoiceId !== 'string' || !invoiceId || invoiceId.length > 200) return NextResponse.json({ message: 'OK' }, { status: 200 });

    const supabaseAdmin = createAdminClient();

    const { data: donation, error: lookupError } = await supabaseAdmin
      .from('donations')
      .select('*')
      .eq('invoice_id', invoiceId)
      .maybeSingle();
    if (lookupError) throw lookupError;

    if (!donation || donation.status !== 'pending') {
      return NextResponse.json({ message: 'OK' }, { status: 200 });
    }

    const checkResult = await checkQPayPayment(invoiceId);
    if (checkResult.count >= 1) {
      const { error: updateError } = await supabaseAdmin.from('donations').update({ status: 'paid' }).eq('id', donation.id);
      if (updateError) throw updateError;
    }

    return NextResponse.json({ message: 'OK' }, { status: 200 });
  } catch (err) {
    reportError(err, { area: 'backend', operation: 'qpay-callback' });
    return NextResponse.json({ message: 'OK' }, { status: 200 });
  }
}
