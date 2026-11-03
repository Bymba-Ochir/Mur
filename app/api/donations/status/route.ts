import { limitIpRequest } from '../../../../lib/apiRateLimit';
import { reportError } from '../../../../lib/errorTracking';
// app/api/donations/status/route.ts
import { NextResponse } from 'next/server';
import { createAdminClient } from '../../../../lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const ipLimit = await limitIpRequest(request, 'donation-status');
    if (ipLimit) return ipLimit;
    const { searchParams } = new URL(request.url);
    const donationId = searchParams.get('donationId');
    const statusToken = searchParams.get('statusToken');

    if (!donationId || !/^[0-9a-f-]{36}$/i.test(donationId) || !statusToken || !/^[0-9a-f]{64}$/i.test(statusToken)) {
      return NextResponse.json({ error: 'donationId, statusToken шаардлагатай' }, { status: 400 });
    }

    const supabaseAdmin = createAdminClient();

    const { data: donation, error } = await supabaseAdmin
      .from('donations')
      .select('status,amount')
      .eq('id', donationId)
      .eq('status_token', statusToken)
      .maybeSingle();

    if (error) throw error;
    if (!donation) return NextResponse.json({ error: 'Хандив олдсонгүй' }, { status: 404 });

    return NextResponse.json({ status: donation.status, amount: donation.amount }, { headers: { 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' } });
  } catch (err) {
    reportError(err, { area: 'backend', operation: 'donation-status' });
    return NextResponse.json({ error: 'Статус шалгахад алдаа гарлаа' }, { status: 500 });
  }
}
