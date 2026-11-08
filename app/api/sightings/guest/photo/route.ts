import { limitIpRequest } from '../../../../../lib/apiRateLimit';
import { reportError } from '../../../../../lib/errorTracking';
import { guestSightingPhotoResponse } from '../../../../../lib/serverGuestSightingPhoto';
import { SIGHTING_UUID } from '../../../../../lib/sightingInput';
import { createAdminClient } from '../../../../../lib/supabaseAdmin';

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const petId = params.get('petId') ?? '';
  const id = params.get('id') ?? '';
  const headers = { 'Cache-Control': 'private, no-store' };
  if (!SIGHTING_UUID.test(petId) || !SIGHTING_UUID.test(id)) return new Response(null, { status: 404, headers });

  try {
    const admin = createAdminClient();
    const quota = await limitIpRequest(request, 'guest-sighting-photo', admin);
    if (quota) return quota;
    const { data, error } = await admin.rpc('read_published_guest_sighting_photo', { target_pet: petId, target_id: id });
    if (error) throw error;
    return await guestSightingPhotoResponse(admin, data);
  } catch {
    reportError(new Error('Published guest photo unavailable'), { area: 'backend', operation: 'guest-sighting-photo' });
    return new Response(null, { status: 503, headers });
  }
}
