import { NextResponse } from 'next/server';
import { requireRequestUser } from '../../../../../lib/serverAuth';
import { limitIpRequest, limitUserRequest } from '../../../../../lib/apiRateLimit';
import { schedulePetImageJob } from '../../../../../lib/petImageJobs';
import { reportError } from '../../../../../lib/errorTracking';

export const maxDuration = 60;

/** The request only wakes a durable job; the database chooses its image and owner. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const limited = await limitIpRequest(request, 'pet-image-wake');
  if (limited) return limited;
  try {
    const { user, admin } = await requireRequestUser(request);
    const { id } = await params;
    if (!/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i.test(id)) {
      return NextResponse.json({ error: 'Зарын дугаар буруу байна.' }, { status: 400 });
    }
    const userLimit = await limitUserRequest('pet-image-wake', user.id, admin);
    if (userLimit) return userLimit;
    const pet = await admin.from('pets').select('id').eq('id', id).eq('created_by', user.id).maybeSingle();
    if (pet.error) throw pet.error;
    if (!pet.data) return NextResponse.json({ error: 'Зар олдсонгүй.' }, { status: 404 });
    schedulePetImageJob();
    return NextResponse.json({ accepted: true }, { status: 202, headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Нэвтрэх шаардлагатай.' }, { status: 401 });
    }
    reportError(error, { area: 'backend', operation: 'pet-image-wake' });
    return NextResponse.json({ error: 'Зураг боловсруулах ажил түр боломжгүй байна.' }, { status: 503 });
  }
}
