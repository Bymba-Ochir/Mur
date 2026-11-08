import { NextResponse } from 'next/server';
import { limitIpRequest, limitResourceIpRequest } from '../../../../lib/apiRateLimit';
import { scheduleBackgroundJobs } from '../../../../lib/backgroundJobs';
import { reportError } from '../../../../lib/errorTracking';
import { readIdempotencyKey } from '../../../../lib/idempotency';
import { isInputValidationError } from '../../../../lib/inputValidation';
import { jsonBodyErrorResponse } from '../../../../lib/requestJson';
import { readSightingDetails } from '../../../../lib/sightingInput';
import { readSightingSubmission, uploadSightingPhoto } from '../../../../lib/serverSightingPhoto';
import { GUEST_SIGHTING_PHOTO_BUCKET } from '../../../../lib/sightingPhoto';
import { createAdminClient } from '../../../../lib/supabaseAdmin';
import { getTurnstileConfig, verifyGuestSightingChallenge } from '../../../../lib/turnstile';

export const maxDuration = 60;

// Aggregate-only pilot metric. The UI calls this once after analytics consent.
export async function PATCH(request: Request) {
  if (!getTurnstileConfig()) return new Response(null, { status: 503 });
  const admin = createAdminClient();
  const quota = await limitIpRequest(request, 'guest-sighting-open', admin);
  if (quota) return quota;
  const { error } = await admin.rpc('count_guest_sighting_open');
  if (error) {
    reportError(new Error('Guest sighting open count failed'), { area: 'backend', operation: 'guest-sighting-open' });
    return new Response(null, { status: 503 });
  }
  return new Response(null, { status: 204 });
}

export async function POST(request: Request) {
  const config = getTurnstileConfig();
  if (!config) return NextResponse.json({ error: 'Зочноор мэдээлэх боломжгүй байна.' }, { status: 503 });

  try {
    const admin = createAdminClient();
    const attemptLimit = await limitIpRequest(request, 'guest-sighting', admin);
    if (attemptLimit) return attemptLimit;

    const key = readIdempotencyKey(request)?.toLowerCase();
    if (!key) return NextResponse.json({ error: 'Idempotency-Key шаардлагатай.' }, { status: 400 });
    const { body, photo } = await readSightingSubmission(request, true);
    const { petId, message, place, lat, lng, sightedAt } = readSightingDetails(body);
    const token = body.turnstileToken;
    if (typeof token !== 'string' || !token || token.length > 2048 || !await verifyGuestSightingChallenge(token, config)) {
      return NextResponse.json({ error: 'Аюулгүй байдлын шалгалт амжилтгүй боллоо. Дахин оролдоно уу.' }, { status: 400 });
    }

    const quota = await limitResourceIpRequest(request, 'guest-sighting', petId, admin);
    if (quota) return quota;

    const photoPath = photo ? await uploadSightingPhoto(admin, key, photo, GUEST_SIGHTING_PHOTO_BUCKET) : null;
    const { data, error } = await admin.rpc(photoPath ? 'submit_guest_sighting_with_photo_consent' : 'submit_guest_sighting', {
      target_key: key, target_pet: petId, target_message: message, target_place: place,
      target_lat: lat, target_lng: lng, target_sighted_at: sightedAt,
      ...(photoPath ? { target_photo_path: photoPath, allow_public_photo: body.allowPublicPhoto === true } : {}),
    });
    if (error?.message === 'PET_NOT_ACTIVE') {
      return NextResponse.json({ error: 'Идэвхтэй зар олдсонгүй.' }, { status: 404 });
    }
    if (error) throw error;
    if (data === 'conflict') return NextResponse.json({ error: 'Илгээсэн мэдээлэл зөрж байна.' }, { status: 409 });
    if (data !== 'created' && data !== 'duplicate') throw new Error('Unexpected guest sighting result');
    scheduleBackgroundJobs();
    return NextResponse.json({ ok: true }, { status: data === 'created' ? 201 : 200 });
  } catch (error) {
    const bodyError = jsonBodyErrorResponse(error);
    if (bodyError) return bodyError;
    if (isInputValidationError(error)) return NextResponse.json({ error: error.message }, { status: 400 });
    // Do not report database diagnostics that can echo the private row.
    reportError(new Error('Guest sighting could not be saved'), { area: 'backend', operation: 'guest-sighting-submit' });
    return NextResponse.json({ error: 'Мэдээлэл хадгалахад алдаа гарлаа. Дахин оролдоно уу.' }, { status: 503 });
  }
}
