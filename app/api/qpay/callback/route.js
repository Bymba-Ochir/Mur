// app/api/qpay/callback/route.js
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkQPayPayment } from '../../../../lib/qpay';

export async function POST(request) {
  try {
    if (process.env.QPAY_CALLBACK_SECRET) {
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
    if (!invoiceId) return NextResponse.json({ message: 'OK' }, { status: 200 });

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

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
