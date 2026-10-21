import { NextResponse } from 'next/server';
import { requireRequestUser } from '../../../lib/serverAuth';
import { checkRateLimit, getClientIp } from '../../../lib/rateLimit';
import { cleanText } from '../../../lib/inputValidation';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ALLOWED_REASONS = new Set(['Хуурамч мэдээлэл', 'Спам', 'Зохисгүй агуулга', 'Дахин нийтэлсэн', 'Бусад']);

export async function POST(request: Request) {
  try {
    const { user, admin } = await requireRequestUser(request);
    const limit = checkRateLimit(`report:${user.id}:${getClientIp(request)}`, 8, 60 * 60_000);
    if (!limit.allowed) return NextResponse.json({ error: 'Хэт олон report илгээлээ. Түр хүлээнэ үү.' }, { status: 429, headers: { 'Retry-After': String(limit.retryAfterSec) } });
    const body = await request.json() as { petId?: unknown; reason?: unknown };
    if (typeof body.petId !== 'string' || !UUID.test(body.petId)) return NextResponse.json({ error: 'Зарын дугаар буруу байна.' }, { status: 400 });
    if (typeof body.reason !== 'string' || !ALLOWED_REASONS.has(body.reason)) return NextResponse.json({ error: 'Report-ийн шалтгаан буруу байна.' }, { status: 400 });
    const { data: pet, error: petError } = await admin.from('pets').select('created_by').eq('id', body.petId).maybeSingle();
    if (petError) throw petError;
    if (!pet) return NextResponse.json({ error: 'Зар олдсонгүй.' }, { status: 404 });
    if (pet.created_by === user.id) return NextResponse.json({ error: 'Өөрийн зарыг report хийх боломжгүй.' }, { status: 400 });
    const { error } = await admin.from('reports').insert({ pet_id: body.petId, reporter_id: user.id, reason: cleanText(body.reason, 100, 'Шалтгаан', true), status: 'pending' });
    if (error?.code === '23505') return NextResponse.json({ error: 'Энэ зарыг өмнө нь шалгуулахаар илгээсэн байна.' }, { status: 409 });
    if (error) throw error;
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    const unauthorized = error instanceof Error && error.message === 'UNAUTHORIZED';
    return NextResponse.json({ error: unauthorized ? 'Report илгээхийн тулд нэвтэрнэ үү.' : 'Report хадгалахад алдаа гарлаа.' }, { status: unauthorized ? 401 : 500 });
  }
}
