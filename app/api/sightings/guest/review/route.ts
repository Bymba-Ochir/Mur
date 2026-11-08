import { NextResponse } from 'next/server';
import { limitIpRequest, limitUserRequest } from '../../../../../lib/apiRateLimit';
import { reportError } from '../../../../../lib/errorTracking';
import { requireRequestUser } from '../../../../../lib/serverAuth';
import { jsonBodyErrorResponse, readJsonBody } from '../../../../../lib/requestJson';
import { SIGHTING_UUID } from '../../../../../lib/sightingInput';
import { COMPACT_PAGE_SIZE, finalizePage } from '../../../../../lib/pagination';

const CURSOR_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?(?:Z|[+-]\d{2}:\d{2})$/;

function reply(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: { 'Cache-Control': 'private, no-store' } });
}

async function review(request: Request) {
  try {
    const ipLimit = await limitIpRequest(request, 'guest-sighting-review');
    if (ipLimit) return ipLimit;
    const { user, admin } = await requireRequestUser(request);
    const userLimit = await limitUserRequest('guest-sighting-review', user.id, admin);
    if (userLimit) return userLimit;

    if (request.method === 'GET') {
      const params = new URL(request.url).searchParams;
      const petId = params.get('petId') ?? '';
      const beforeId = params.get('beforeId');
      const beforeCreated = params.get('beforeCreated');
      if (!SIGHTING_UUID.test(petId) || ((beforeId || beforeCreated) &&
        (!beforeId || !SIGHTING_UUID.test(beforeId) || !beforeCreated || !CURSOR_TIME.test(beforeCreated) ||
          !Number.isFinite(Date.parse(beforeCreated))))) {
        return reply({ error: 'Зар эсвэл хуудасны дугаар буруу байна.' }, 400);
      }
      const { data, error } = await admin.rpc('list_guest_sightings', {
        target_pet: petId, target_owner: user.id, before_created: beforeCreated || null, before_id: beforeId || null,
      });
      if (error) throw error;
      return reply(finalizePage(data, 0, COMPACT_PAGE_SIZE));
    }

    const { petId, id, action } = await readJsonBody(request, { requireJsonContentType: true });
    if (typeof petId !== 'string' || !SIGHTING_UUID.test(petId) || typeof id !== 'string' || !SIGHTING_UUID.test(id)
      || typeof action !== 'string' || !['view', 'useful', 'publish', 'hide'].includes(action)) {
      return reply({ error: 'Хүсэлт буруу байна.' }, 400);
    }
    const { data, error } = await admin.rpc('review_guest_sighting', {
      target_pet: petId, target_owner: user.id, target_id: id, action,
    });
    if (error?.message === 'PET_NOT_ACTIVE') return reply({ error: 'Зар идэвхгүй болсон байна.' }, 409);
    if (error) throw error;
    if (!data) return reply({ error: 'Мэдээлэл олдсонгүй.' }, 404);
    return reply(data);
  } catch (error) {
    const bodyError = jsonBodyErrorResponse(error);
    if (bodyError) return bodyError;
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return reply({ error: 'Нэвтрэх шаардлагатай.' }, 401);
    reportError(new Error('Guest sighting review failed'), { area: 'backend', operation: 'guest-sighting-review' });
    return reply({ error: 'Мэдээллийг боловсруулахад алдаа гарлаа.' }, 500);
  }
}

export { review as GET, review as POST };
