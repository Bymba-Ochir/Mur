import { jsonBodyErrorResponse } from '../../../lib/requestJson';
import { limitIpRequest, limitUserRequest } from '../../../lib/apiRateLimit';
import { reportError } from '../../../lib/errorTracking';
import { NextResponse } from 'next/server';
import { requireRequestUser } from '../../../lib/serverAuth';
import { cleanText, InputValidationError, isInputValidationError, optionalCoordinate } from '../../../lib/inputValidation';
import { readIdempotencyKey } from '../../../lib/idempotency';
import { scheduleBackgroundJobs } from '../../../lib/backgroundJobs';
import { readSightingSubmission, uploadSightingPhoto } from '../../../lib/serverSightingPhoto';

export const maxDuration = 60;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

interface ExistingSighting {
  id: string;
  pet_id: string;
  reporter_id: string | null;
  message: string;
  place: string | null;
  lat: number | null;
  lng: number | null;
  sighted_at: string | null;
  photo_path: string | null;
}

function readCoordinate(value: unknown, kind: 'lat' | 'lng') {
  if (value != null && typeof value !== 'number') throw new InputValidationError('Газрын зургийн координат буруу байна.');
  return optionalCoordinate(value, kind);
}

// PostgREST may round the last digits of double precision coordinates.
function matchesCoordinate(stored: number | null | undefined, requested: number | null) {
  if (stored == null || requested == null) return stored == null && requested == null;
  return Math.abs(stored - requested) <= 1e-10;
}

function readSightedAt(value: unknown): string | null {
  if (value == null) return null;
  if (typeof value !== 'string' || !/^[1-9]\d{3}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)) {
    throw new InputValidationError('Харсан огноо, цаг буруу байна.');
  }
  const date = new Date(value);
  if (!Number.isFinite(date.getTime()) || date.toISOString() !== value || date.getTime() > Date.now()) {
    throw new InputValidationError('Харсан огноо, цаг хүчинтэй бөгөөд ирээдүйд биш байх ёстой.');
  }
  return value;
}

export async function POST(request: Request) {
  try {
    const ipLimit = await limitIpRequest(request, 'sightings');
    if (ipLimit) return ipLimit;
    const idempotencyKey = readIdempotencyKey(request)?.toLowerCase();
    if (!idempotencyKey) return NextResponse.json({ error: 'Idempotency-Key шаардлагатай.' }, { status: 400 });

    const { user, admin } = await requireRequestUser(request);

    const { body, photo } = await readSightingSubmission(request);
    if (typeof body.petId !== 'string' || !UUID.test(body.petId)) return NextResponse.json({ error: 'Зарын дугаар буруу байна.' }, { status: 400 });
    const petId = body.petId.toLowerCase();
    const message = cleanText(typeof body.message === 'string' ? body.message : '', 1000, 'Харсан мэдээлэл', true);
    const place = cleanText(typeof body.place === 'string' ? body.place : '', 300, 'Байршил') || null;

    const lat = readCoordinate(body.lat, 'lat');
    const lng = readCoordinate(body.lng, 'lng');
    if ((lat === null) !== (lng === null)) throw new InputValidationError('Газрын зураг дээр байршлаа дахин сонгоно уу.');
    const sightedAt = readSightedAt(body.sightedAt);

    const sameRequest = (row: ExistingSighting) => row.pet_id === petId
      && row.reporter_id === user.id
      && row.message === message
      && row.place === place
      && matchesCoordinate(row.lat, lat)
      && matchesCoordinate(row.lng, lng)
      && (row.sighted_at ? new Date(row.sighted_at).toISOString() : null) === sightedAt
      && (photo ? row.photo_path?.endsWith(`/${photo.digest}.jpg`) === true : row.photo_path == null);

    const readExisting = async (): Promise<ExistingSighting | null> => {
      const { data, error } = await admin
        .from('sightings')
        .select('id,pet_id,reporter_id,message,place,lat,lng,sighted_at,photo_path')
        .eq('id', idempotencyKey)
        .maybeSingle();
      if (error) throw error;
      return data as ExistingSighting | null;
    };
    const complete = async (duplicate: boolean) => {
      if (duplicate) {
        // Repair pre-v103 attempts too; the DB derives the recipient/content.
        const { error } = await admin.rpc('enqueue_sighting_notification', { target_id: idempotencyKey });
        if (error) throw error;
      }
      scheduleBackgroundJobs();
      return NextResponse.json({ ok: true, ...(duplicate ? { duplicate: true } : {}) }, { status: duplicate ? 200 : 201 });
    };

    const existing = await readExisting();
    if (existing) {
      if (!sameRequest(existing)) return NextResponse.json({ error: 'Idempotency-Key өөр хүсэлтэд аль хэдийн ашиглагдсан байна.' }, { status: 409 });
      return await complete(true);
    }

    // Rate limit зөвхөн шинэ logical operation-д үйлчилнэ; retry duplicate бол дээр шууд буцсан.
    const newUserLimit = await limitUserRequest('sighting-new', user.id, admin);
    if (newUserLimit) return newUserLimit;
    const newIpLimit = await limitIpRequest(request, 'sighting-new', admin);
    if (newIpLimit) return newIpLimit;

    const photoPath = photo ? await uploadSightingPhoto(admin, idempotencyKey, photo) : null;
    const { data: claimRows, error: claimError } = await admin.rpc('create_sighting_if_active', {
      target_id: idempotencyKey,
      target_pet: petId,
      target_reporter: user.id,
      target_message: message,
      target_place: place,
      target_lat: lat,
      target_lng: lng,
      target_sighted_at: sightedAt,
      ...(photoPath ? { target_photo_path: photoPath } : {}),
    });
    if (claimError) {
      if (/PET_NOT_ACTIVE/.test(claimError.message ?? '')) {
        return NextResponse.json({ error: 'Идэвхтэй зар олдсонгүй.' }, { status: 404 });
      }
      throw claimError;
    }

    const claim = Array.isArray(claimRows) ? claimRows[0] : claimRows;
    if (!claim?.created) {
      const raced = await readExisting();
      if (raced && sameRequest(raced)) {
        return await complete(true);
      }
      return NextResponse.json({ error: 'Idempotency-Key өөр хүсэлтэд аль хэдийн ашиглагдсан байна.' }, { status: 409 });
    }

    // v103's trigger commits the job in the same transaction as the v99 RPC.
    return await complete(false);
  } catch (error) {
    const bodyError = jsonBodyErrorResponse(error);
    if (bodyError) return bodyError;
    if (isInputValidationError(error)) return NextResponse.json({ error: error.message }, { status: 400 });
    reportError(error, { area: 'backend', operation: 'create-sighting' });
    const unauthorized = error instanceof Error && error.message === 'UNAUTHORIZED';
    return NextResponse.json({ error: unauthorized ? 'Мэдээлэл илгээхийн тулд нэвтэрнэ үү.' : 'Мэдээлэл хадгалахад алдаа гарлаа.' }, { status: unauthorized ? 401 : 500 });
  }
}
