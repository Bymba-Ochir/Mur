import { readJsonBody, jsonBodyErrorResponse, WEBHOOK_BODY_LIMIT } from '../../../lib/requestJson';
import { NextResponse } from 'next/server';
import { limitServiceRequest } from '../../../lib/apiRateLimit';
import { reportError } from '../../../lib/errorTracking';
import { createAdminClient } from '../../../lib/supabaseAdmin';
import { scheduleBackgroundJobs } from '../../../lib/backgroundJobs';

export const maxDuration = 60;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Supabase pets INSERT webhook: persist the job, then acknowledge immediately. */
export async function POST(request: Request) {
  const secret = request.headers.get('x-webhook-secret');
  if (!process.env.NOTIFY_WEBHOOK_SECRET?.trim()) {
    reportError(new Error('NOTIFY_WEBHOOK_SECRET is not configured'), { area: 'backend', operation: 'nearby-notification-auth' });
    return NextResponse.json({ error: 'Webhook тохиргоо дутуу байна.' }, { status: 503 });
  }
  if (secret !== process.env.NOTIFY_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Зөвшөөрөлгүй' }, { status: 401 });
  }
  const serviceLimit = await limitServiceRequest('notify');
  if (serviceLimit) return serviceLimit;
  try {
    const body = await readJsonBody(request, { maxBytes: WEBHOOK_BODY_LIMIT });
    const record = body.record;
    const petId = record && typeof record === 'object' && !Array.isArray(record) ? (record as Record<string, unknown>).id : null;
    if (typeof petId !== 'string' || !UUID.test(petId)) {
      return NextResponse.json({ error: 'Зарын дугаар буруу байна.' }, { status: 400 });
    }
    const { data, error } = await createAdminClient().rpc('enqueue_nearby_notification', { target_pet: petId });
    if (error) throw error;
    if (data) scheduleBackgroundJobs();
    return NextResponse.json({ accepted: Boolean(data) }, { status: 202, headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    const bodyError = jsonBodyErrorResponse(error);
    if (bodyError) return bodyError;
    reportError(error, { area: 'backend', operation: 'nearby-notification-enqueue' });
    return NextResponse.json({ error: 'Мэдэгдлийн ажил хадгалж чадсангүй.' }, { status: 503 });
  }
}
