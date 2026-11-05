import { readJsonBody, jsonBodyErrorResponse } from '../../../lib/requestJson';
import { limitIpRequest, limitUserRequest } from '../../../lib/apiRateLimit';
import { reportError } from '../../../lib/errorTracking';
import { NextResponse } from 'next/server';
import { requireRequestUser } from '../../../lib/serverAuth';
import { cleanText } from '../../../lib/inputValidation';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ALLOWED_REASONS = new Set(['Хуурамч мэдээлэл', 'Спам', 'Зохисгүй агуулга', 'Дахин нийтэлсэн', 'Бусад']);

export async function POST(request: Request) {
  try {
    const ipLimit = await limitIpRequest(request, 'reports');
    if (ipLimit) return ipLimit;
    const { user, admin } = await requireRequestUser(request);
    const userLimit = await limitUserRequest('reports', user.id, admin);
    if (userLimit) return userLimit;
    const body = await readJsonBody(request) as { petId?: unknown; reason?: unknown };
    if (typeof body.petId !== 'string' || !UUID.test(body.petId)) return NextResponse.json({ error: 'Зарын дугаар буруу байна.' }, { status: 400 });
    if (typeof body.reason !== 'string' || !ALLOWED_REASONS.has(body.reason)) return NextResponse.json({ error: 'Шалгуулах шалтгааныг сонгоно уу.' }, { status: 400 });
    const { data: pet, error: petError } = await admin.from('pets').select('created_by').eq('id', body.petId).maybeSingle();
    if (petError) throw petError;
    if (!pet) return NextResponse.json({ error: 'Зар олдсонгүй.' }, { status: 404 });
    if (pet.created_by === user.id) return NextResponse.json({ error: 'Өөрийн зарыг шалгуулахаар илгээх боломжгүй.' }, { status: 400 });
    const { error } = await admin.from('reports').insert({ pet_id: body.petId, reporter_id: user.id, reason: cleanText(body.reason, 100, 'Шалтгаан', true), status: 'pending' });
    if (error?.code === '23505') return NextResponse.json({ error: 'Энэ зарыг өмнө нь шалгуулахаар илгээсэн байна.' }, { status: 409 });
    if (error) throw error;
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    const bodyError = jsonBodyErrorResponse(error);
    if (bodyError) return bodyError;
    reportError(error, { area: 'backend', operation: 'create-report' });
    const unauthorized = error instanceof Error && error.message === 'UNAUTHORIZED';
    return NextResponse.json({ error: unauthorized ? 'Зарыг шалгуулахаар илгээхийн тулд нэвтэрнэ үү.' : 'Мэдээллийг илгээж чадсангүй.' }, { status: unauthorized ? 401 : 500 });
  }
}
