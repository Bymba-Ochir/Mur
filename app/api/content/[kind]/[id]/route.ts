import { NextResponse } from 'next/server';
import { requireRequestUser } from '../../../../../lib/serverAuth';
import { ownedPetPhotoStoragePath } from '../../../../../lib/storageObjectPath';
import { fetchServerListingPhotoUrls } from '../../../../../lib/serverPhotoRepository';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
type ContentKind = 'pets' | 'adoptions' | 'sitting';

export async function DELETE(request: Request, context: { params: Promise<{ kind: string; id: string }> }) {
  try {
    const { kind: rawKind, id } = await context.params;
    if (!['pets', 'adoptions', 'sitting'].includes(rawKind) || !UUID.test(id)) return NextResponse.json({ error: 'Устгах хүсэлт буруу байна.' }, { status: 400 });
    const kind = rawKind as ContentKind;
    const { user, admin } = await requireRequestUser(request);
    const { data: adminRow } = await admin.from('admins').select('user_id').eq('user_id', user.id).maybeSingle();
    let row: Record<string, unknown> | null = null;
    let table = '';
    let ownerColumn = '';
    let urls: string[] = [];
    if (kind === 'pets') {
      table = 'pets'; ownerColumn = 'created_by';
      const result = await admin.from(table).select('created_by').eq('id', id).maybeSingle();
      if (result.error) throw result.error; row = result.data;
    } else if (kind === 'adoptions') {
      table = 'adoptions'; ownerColumn = 'created_by';
      const result = await admin.from(table).select('created_by').eq('id', id).maybeSingle();
      if (result.error) throw result.error; row = result.data;
    } else {
      table = 'sitting_listings'; ownerColumn = 'user_id';
      const result = await admin.from(table).select('user_id,photo_url').eq('id', id).maybeSingle();
      if (result.error) throw result.error; row = result.data;
      urls = typeof row?.photo_url === 'string' ? [row.photo_url] : [];
    }
    if (!row) return NextResponse.json({ error: 'Устгах мэдээлэл олдсонгүй.' }, { status: 404 });
    if (row[ownerColumn] !== user.id && !adminRow) return NextResponse.json({ error: 'Энэ мэдээллийг устгах эрхгүй байна.' }, { status: 403 });
    if (kind === 'pets') urls = await fetchServerListingPhotoUrls(admin, 'pet', id);
    if (kind === 'adoptions') urls = await fetchServerListingPhotoUrls(admin, 'adoption', id);
    const paths = [...new Set(urls.map(url => ownedPetPhotoStoragePath(url, row![ownerColumn], process.env.NEXT_PUBLIC_SUPABASE_URL)).filter((path): path is string => Boolean(path)))];
    const { error: deleteError } = await admin.from(table).delete().eq('id', id);
    if (deleteError) throw deleteError;
    let storageCleaned = true;
    if (paths.length) { const { error } = await admin.storage.from('pet-photos').remove(paths); storageCleaned = !error; }
    return NextResponse.json({ ok: true, storageCleaned });
  } catch (error) {
    const unauthorized = error instanceof Error && error.message === 'UNAUTHORIZED';
    return NextResponse.json({ error: unauthorized ? 'Эхлээд нэвтэрнэ үү.' : 'Устгахад алдаа гарлаа.' }, { status: unauthorized ? 401 : 500 });
  }
}
