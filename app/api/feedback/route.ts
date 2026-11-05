import { readJsonBody, jsonBodyErrorResponse } from '../../../lib/requestJson';
import { NextResponse } from 'next/server';
import { limitIpRequest } from '../../../lib/apiRateLimit';
import { reportError } from '../../../lib/errorTracking';
import { FEEDBACK_MAX_LENGTH, FEEDBACK_MIN_LENGTH, FEEDBACK_PAGE_PATTERN, isFeedbackCategory } from '../../../lib/feedback';
import { readIdempotencyKey } from '../../../lib/idempotency';
import { createAdminClient } from '../../../lib/supabaseAdmin';

export async function POST(request: Request) {
  try {
    const limit = await limitIpRequest(request, 'feedback-create');
    if (limit) return limit;
    const id = readIdempotencyKey(request);
    if (!id) return NextResponse.json({ error: 'Invalid idempotency key' }, { status: 400 });

    const body = await readJsonBody(request, { requireJsonContentType: true });
    const message = typeof body?.message === 'string' ? body.message.trim() : '';
    if (!isFeedbackCategory(body?.category) || typeof body?.page !== 'string'
      || !FEEDBACK_PAGE_PATTERN.test(body.page)
      || message.length < FEEDBACK_MIN_LENGTH || message.length > FEEDBACK_MAX_LENGTH || message.includes('\0')) {
      return NextResponse.json({ error: 'Invalid feedback' }, { status: 400 });
    }

    const { category, page } = body;
    const admin = createAdminClient();
    const { error } = await admin.from('site_feedback').insert({ id, category, message, page });
    if (!error) return NextResponse.json({ ok: true }, { status: 201 });
    if (error.code !== '23505') throw new Error('Site feedback insert failed');

    const { data, error: lookupError } = await admin.from('site_feedback')
      .select('category,message,page').eq('id', id).maybeSingle();
    if (lookupError) throw new Error('Site feedback retry lookup failed');
    if (data?.category === category && data.message === message && data.page === page) {
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ error: 'Idempotency key already used' }, { status: 409 });
  } catch (error) {
    const bodyError = jsonBodyErrorResponse(error);
    if (bodyError) return bodyError;
    reportError(error, { area: 'backend', operation: 'create-feedback' });
    return NextResponse.json({ error: 'Feedback unavailable' }, { status: 503 });
  }
}
