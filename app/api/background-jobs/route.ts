import { NextResponse } from 'next/server';
import { limitServiceRequest } from '../../../lib/apiRateLimit';
import { scheduleBackgroundJobs } from '../../../lib/backgroundJobs';
import { reportError } from '../../../lib/errorTracking';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret?.trim()) {
    reportError(new Error('CRON_SECRET is not configured'), { area: 'backend', operation: 'background-worker-auth' });
    return NextResponse.json({ error: 'Worker тохиргоо дутуу байна.' }, { status: 503 });
  }
  if (request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Зөвшөөрөлгүй' }, { status: 401 });
  }
  const limited = await limitServiceRequest('background-jobs');
  if (limited) return limited;
  scheduleBackgroundJobs(true);
  return NextResponse.json({ accepted: true }, { status: 202, headers: { 'Cache-Control': 'no-store' } });
}
