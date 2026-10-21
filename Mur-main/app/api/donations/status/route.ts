import { checkRateLimit, getClientIp } from '../../../../lib/rateLimit';
// app/api/donations/status/route.ts
import { NextResponse } from 'next/server';
import { checkQPayPayment } from '../../../../lib/qpay';
import { createAdminClient } from '../../../../lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const limit = checkRateLimit('donation-status:' + getClientIp(request), 60, 60_000);
    if (!limit.allowed) return NextResponse.json({ error: 'Түр хүлээнэ үү.' }, { status: 429, headers: { 'Retry-After': String(limit.retryAfterSec), 'Cache-Control': 'no-store' } });
    const { searchParams } = new URL(request.url);
    const donationId = searchParams.get('donationId');
    const statusToken = searchParams.get('statusToken');

    if (!donationId || !/^[0-9a-f-]{36}$/i.test(donationId) || !statusToken || !/^[0-9a-f]{64}$/i.test(statusToken)) {
      return NextResponse.json({ error: 'donationId, statusToken шаардлагатай' }, { status: 400 });
    }

    const supabaseAdmin = createAdminClient();

    const { data: donation, error } = await supabaseAdmin
      .from('donations')
      .select('id,status,amount,invoice_id')
      .eq('id', donationId)
      .eq('status_token', statusToken)
      .maybeSingle();

    if (error) throw error;
    if (!donation) return NextResponse.json({ error: 'Хандив олдсонгүй' }, { status: 404 });

    if (donation.status === 'pending' && donation.invoice_id) {
      try {
        const checkResult = await checkQPayPayment(donation.invoice_id);
        if (checkResult.count >= 1) {
          const { error: updateError } = await supabaseAdmin.from('donations').update({ status: 'paid' }).eq('id', donationId).eq('status', 'pending');
          if (updateError) throw updateError;
          donation.status = 'paid';
        }
      } catch {
        // Шалгахад алдаа гарвал pending хэвээр үлдээнэ, polling үргэлжилнэ
      }
    }

    return NextResponse.json({ status: donation.status, amount: donation.amount }, { headers: { 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' } });
  } catch (err) {
    console.error('Donation status error:', err);
    return NextResponse.json({ error: 'Статус шалгахад алдаа гарлаа' }, { status: 500 });
  }
}
