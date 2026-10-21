import { NextResponse } from 'next/server';
import { requireRequestUser } from '../../../lib/serverAuth';
import { checkRateLimit, getClientIp } from '../../../lib/rateLimit';
import { cleanText } from '../../../lib/inputValidation';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  try {
    const { user, admin } = await requireRequestUser(request);
    const limit = checkRateLimit(`sighting:${user.id}:${getClientIp(request)}`, 10, 60 * 60_000);
    if (!limit.allowed) return NextResponse.json({ error: 'Хэт олон мэдээлэл илгээлээ. Түр хүлээнэ үү.' }, { status: 429, headers: { 'Retry-After': String(limit.retryAfterSec) } });
    const body = await request.json() as { petId?: unknown; message?: unknown; place?: unknown };
    if (typeof body.petId !== 'string' || !UUID.test(body.petId)) return NextResponse.json({ error: 'Зарын дугаар буруу байна.' }, { status: 400 });
    const message = cleanText(typeof body.message === 'string' ? body.message : '', 1000, 'Харсан мэдээлэл', true);
    const place = cleanText(typeof body.place === 'string' ? body.place : '', 300, 'Байршил');
    const { data: pet, error: petError } = await admin.from('pets').select('id,created_by,resolved').eq('id', body.petId).maybeSingle();
    if (petError) throw petError;
    if (!pet || pet.resolved) return NextResponse.json({ error: 'Идэвхтэй зар олдсонгүй.' }, { status: 404 });
    const { error } = await admin.from('sightings').insert({ pet_id: pet.id, reporter_id: user.id, message, place: place || null });
    if (error) throw error;
    if (pet.created_by && pet.created_by !== user.id) {
      await admin.from('notifications').insert({ user_id: pet.created_by, type: 'sighting', title: 'Таны амьтныг харсан мэдээлэл ирлээ', body: place ? `${place} орчим харсан мэдээлэл нэмэгдлээ.` : 'Шинэ харсан мэдээлэл нэмэгдлээ.', href: `/pets/${pet.id}` });
    }
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    const unauthorized = error instanceof Error && error.message === 'UNAUTHORIZED';
    return NextResponse.json({ error: unauthorized ? 'Мэдээлэл илгээхийн тулд нэвтэрнэ үү.' : 'Мэдээлэл хадгалахад алдаа гарлаа.' }, { status: unauthorized ? 401 : 500 });
  }
}
