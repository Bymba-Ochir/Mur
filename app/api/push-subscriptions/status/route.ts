import { NextResponse } from 'next/server';
import { readJsonBody, jsonBodyErrorResponse } from '../../../../lib/requestJson';
import { limitIpRequest, limitUserRequest } from '../../../../lib/apiRateLimit';
import { createAdminClient } from '../../../../lib/supabaseAdmin';
import { parsePushIdentity } from '../../../../lib/pushSubscriptionIdentity';
import { canUpdatePushSubscription } from '../../../../lib/pushOwnership';
import { DISTRICTS, type District } from '../../../../lib/districts';
import { reportError } from '../../../../lib/errorTracking';

const headers = { 'Cache-Control': 'no-store' };

/** Read only. Browser secrets stay in a bounded JSON body, never a URL or response. */
export async function POST(request: Request) {
  try {
    const ipLimit = await limitIpRequest(request, 'push-browser-status');
    if (ipLimit) return ipLimit;
    const body = await readJsonBody(request, { requireJsonContentType: true });
    const identity = parsePushIdentity(body);
    if (!identity || (body.district !== undefined && !DISTRICTS.includes(body.district as District))) {
      return NextResponse.json({ error: 'Invalid push subscription' }, { status: 400, headers });
    }
    const admin = createAdminClient();
    let userId: string | null = null;
    const authorization = request.headers.get('authorization');
    if (authorization) {
      if (!/^Bearer\s+\S+$/i.test(authorization)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers });
      const { data, error } = await admin.auth.getUser(authorization.replace(/^Bearer\s+/i, ''));
      if (error || !data.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers });
      userId = data.user.id;
      const userLimit = await limitUserRequest('push-browser-status', userId, admin);
      if (userLimit) return userLimit;
    }
    const { data, error } = await admin.from('push_subscriptions').select('district,user_id,keys').eq('endpoint', identity.endpoint).maybeSingle();
    if (error) throw error;
    const owns = Boolean(data && canUpdatePushSubscription(data, userId, identity.keys));
    return NextResponse.json({
      subscribed: Boolean(owns && body.district && data?.district === body.district),
      vaccine: Boolean(owns && userId && data?.user_id === userId),
    }, { headers });
  } catch (error) {
    const bodyError = jsonBodyErrorResponse(error);
    if (bodyError) { bodyError.headers.set('Cache-Control', 'no-store'); return bodyError; }
    reportError(error, { area: 'backend', operation: 'push-browser-status' });
    return NextResponse.json({ error: 'Status unavailable' }, { status: 503, headers });
  }
}
