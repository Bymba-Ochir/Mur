import { NextResponse } from 'next/server';
import { requireRequestUser } from '../../../lib/serverAuth';
import { checkRateLimit, getClientIp } from '../../../lib/rateLimit';
import { cleanText } from '../../../lib/inputValidation';
import { readIdempotencyKey } from '../../../lib/idempotency';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

interface ExistingSighting {
  id: string;
  pet_id: string;
  reporter_id: string | null;
  message: string;
  place: string | null;
}

interface SightingPet {
  id: string;
  created_by: string | null;
}

export async function POST(request: Request) {
  try {
    const idempotencyKey = readIdempotencyKey(request);
    if (!idempotencyKey) return NextResponse.json({ error: 'Idempotency-Key шаардлагатай.' }, { status: 400 });

    const { user, admin } = await requireRequestUser(request);

    const body = await request.json() as { petId?: unknown; message?: unknown; place?: unknown };
    if (typeof body.petId !== 'string' || !UUID.test(body.petId)) return NextResponse.json({ error: 'Зарын дугаар буруу байна.' }, { status: 400 });
    const message = cleanText(typeof body.message === 'string' ? body.message : '', 1000, 'Харсан мэдээлэл', true);
    const place = cleanText(typeof body.place === 'string' ? body.place : '', 300, 'Байршил') || null;

    const readExisting = async (): Promise<ExistingSighting | null> => {
      const { data, error } = await admin
        .from('sightings')
        .select('id,pet_id,reporter_id,message,place')
        .eq('id', idempotencyKey)
        .maybeSingle();
      if (error) throw error;
      return data as ExistingSighting | null;
    };
    const notifyOwnerOnce = async (pet: SightingPet) => {
      if (!pet.created_by || pet.created_by === user.id) return;
      const { error } = await admin.from('notifications').insert({
        id: idempotencyKey,
        user_id: pet.created_by,
        type: 'sighting',
        title: 'Таны амьтныг харсан мэдээлэл ирлээ',
        body: place ? `${place} орчим харсан мэдээлэл нэмэгдлээ.` : 'Шинэ харсан мэдээлэл нэмэгдлээ.',
        href: `/pets/${pet.id}`,
      });
      if (error && error.code !== '23505') throw error;
    };

    const existing = await readExisting();
    if (existing) {
      const sameRequest = existing.pet_id === body.petId
        && existing.reporter_id === user.id
        && existing.message === message
        && existing.place === place;
      if (!sameRequest) return NextResponse.json({ error: 'Idempotency-Key өөр хүсэлтэд аль хэдийн ашиглагдсан байна.' }, { status: 409 });
      const { data: pet } = await admin.from('pets').select('id,created_by').eq('id', existing.pet_id).maybeSingle();
      if (pet) await notifyOwnerOnce(pet as SightingPet);
      return NextResponse.json({ ok: true, duplicate: true }, { status: 200 });
    }

    // Rate limit зөвхөн шинэ logical operation-д үйлчилнэ; retry duplicate бол дээр шууд буцсан.
    const limit = checkRateLimit(`sighting:${user.id}:${getClientIp(request)}`, 10, 60 * 60_000);
    if (!limit.allowed) return NextResponse.json({ error: 'Хэт олон мэдээлэл илгээлээ. Түр хүлээнэ үү.' }, { status: 429, headers: { 'Retry-After': String(limit.retryAfterSec) } });

    const { data: claimRows, error: claimError } = await admin.rpc('create_sighting_if_active', {
      target_id: idempotencyKey,
      target_pet: body.petId,
      target_reporter: user.id,
      target_message: message,
      target_place: place,
    });
    if (claimError) {
      if (/PET_NOT_ACTIVE/.test(claimError.message ?? '')) {
        return NextResponse.json({ error: 'Идэвхтэй зар олдсонгүй.' }, { status: 404 });
      }
      throw claimError;
    }

    const claim = Array.isArray(claimRows) ? claimRows[0] : claimRows;
    const pet: SightingPet = { id: body.petId, created_by: claim?.owner_id ?? null };

    if (!claim?.created) {
      const raced = await readExisting();
      if (raced && raced.pet_id === body.petId && raced.reporter_id === user.id && raced.message === message && raced.place === place) {
        await notifyOwnerOnce(pet);
        return NextResponse.json({ ok: true, duplicate: true }, { status: 200 });
      }
      return NextResponse.json({ error: 'Idempotency-Key өөр хүсэлтэд аль хэдийн ашиглагдсан байна.' }, { status: 409 });
    }

    await notifyOwnerOnce(pet);
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    const unauthorized = error instanceof Error && error.message === 'UNAUTHORIZED';
    return NextResponse.json({ error: unauthorized ? 'Мэдээлэл илгээхийн тулд нэвтэрнэ үү.' : 'Мэдээлэл хадгалахад алдаа гарлаа.' }, { status: unauthorized ? 401 : 500 });
  }
}
