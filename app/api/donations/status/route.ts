// app/api/donations/status/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkQPayPayment } from '../../../../lib/qpay';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const donationId = searchParams.get('donationId');
    const statusToken = searchParams.get('statusToken');

    if (!donationId || !statusToken) {
      return NextResponse.json({ error: 'donationId, statusToken шаардлагатай' }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: donation, error } = await supabaseAdmin
      .from('donations')
      .select('*')
      .eq('id', donationId)
      .eq('status_token', statusToken)
      .maybeSingle();

    if (error) throw error;
    if (!donation) return NextResponse.json({ error: 'Хандив олдсонгүй' }, { status: 404 });

    if (donation.status === 'pending' && donation.invoice_id) {
      try {
        const checkResult = await checkQPayPayment(donation.invoice_id);
        if (checkResult.count >= 1) {
          await supabaseAdmin.from('donations').update({ status: 'paid' }).eq('id', donationId);
          donation.status = 'paid';
        }
      } catch {
        // Шалгахад алдаа гарвал pending хэвээр үлдээнэ, polling үргэлжилнэ
      }
    }

    return NextResponse.json({ status: donation.status, amount: donation.amount });
  } catch (err) {
    console.error('Donation status error:', err);
    return NextResponse.json({ error: 'Статус шалгахад алдаа гарлаа' }, { status: 500 });
  }
}
