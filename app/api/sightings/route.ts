import { NextResponse } from 'next/server';
import { createAdminClient } from '../../../lib/supabaseAdmin';
import { checkRateLimit, getClientIp } from '../../../lib/rateLimit';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  const rate = checkRateLimit(`sighting:${getClientIp(request)}`, 8, 60 * 60_000);
  if (!rate.allowed) {
    return NextResponse.json({ error: 'Хэт олон мэдээлэл илгээлээ. Түр хүлээнэ үү.' }, {
      status: 429,
      headers: { 'Retry-After': String(rate.retryAfterSec) },
    });
  }

  const body = await request.json().catch(() => null) as { petId?: unknown; message?: unknown; place?: unknown } | null;
  const petId = typeof body?.petId === 'string' ? body.petId : '';
  const message = typeof body?.message === 'string' ? body.message.trim() : '';
  const place = typeof body?.place === 'string' ? body.place.trim() : '';
  if (!UUID.test(petId) || message.length < 2 || message.length > 500 || place.length > 200) {
    return NextResponse.json({ error: 'Харсан тухай мэдээлэл буруу байна' }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: pet } = await admin.from('pets').select('id').eq('id', petId).maybeSingle();
  if (!pet) return NextResponse.json({ error: 'Зар олдсонгүй' }, { status: 404 });

  const { error } = await admin.from('sightings').insert({ pet_id: petId, message, place: place || null });
  if (error) return NextResponse.json({ error: 'Мэдээллийг хадгалж чадсангүй' }, { status: 500 });
  return NextResponse.json({ ok: true }, { status: 201 });
}
