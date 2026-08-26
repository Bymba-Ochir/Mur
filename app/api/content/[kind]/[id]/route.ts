import { NextResponse } from 'next/server';
import { createAdminClient } from '../../../../../lib/supabaseAdmin';
import { checkRateLimit, getClientIp } from '../../../../../lib/rateLimit';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const TABLES = {
  pet: { table: 'pets', owner: 'created_by' },
  adoption: { table: 'adoptions', owner: 'created_by' },
  sitting: { table: 'sitting_listings', owner: 'user_id' },
} as const;

function storagePath(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  try {
    const pathname = new URL(value).pathname;
    const marker = '/storage/v1/object/public/pet-photos/';
    const index = pathname.indexOf(marker);
    return index >= 0 ? decodeURIComponent(pathname.slice(index + marker.length)) : null;
  } catch {
    return null;
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ kind: string; id: string }> }) {
  const { kind, id } = await params;
  const config = TABLES[kind as keyof typeof TABLES];
  if (!config || !UUID.test(id)) return NextResponse.json({ error: 'Хүсэлт буруу байна' }, { status: 400 });

  const rate = checkRateLimit(`content-delete:${getClientIp(request)}`, 20, 60 * 60_000);
  if (!rate.allowed) return NextResponse.json({ error: 'Хэт олон хүсэлт илгээлээ' }, { status: 429 });

  const authorization = request.headers.get('authorization');
  if (!authorization?.startsWith('Bearer ')) return NextResponse.json({ error: 'Нэвтэрнэ үү' }, { status: 401 });

  const admin = createAdminClient();
  const { data: authData } = await admin.auth.getUser(authorization.slice(7));
  const user = authData.user;
  if (!user) return NextResponse.json({ error: 'Нэвтрэлт хүчингүй байна' }, { status: 401 });

  const { data: row, error: readError } = await admin.from(config.table).select('*').eq('id', id).maybeSingle();
  if (readError) return NextResponse.json({ error: 'Зарыг шалгаж чадсангүй' }, { status: 500 });
  if (!row) return NextResponse.json({ ok: true });

  const { data: adminRow } = await admin.from('admins').select('user_id').eq('user_id', user.id).maybeSingle();
  if (row[config.owner] !== user.id && !adminRow) {
    return NextResponse.json({ error: 'Энэ зарыг устгах эрхгүй' }, { status: 403 });
  }

  const imageUrls = [row.photo_url, ...(Array.isArray(row.photo_urls) ? row.photo_urls : [])];
  const paths = [...new Set(imageUrls.map(storagePath).filter((path): path is string => Boolean(path)))];
  const { error: deleteError } = await admin.from(config.table).delete().eq('id', id);
  if (deleteError) return NextResponse.json({ error: 'Зарыг устгаж чадсангүй' }, { status: 500 });

  if (paths.length) {
    const { error: storageError } = await admin.storage.from('pet-photos').remove(paths);
    if (storageError) console.error('content-delete: storage cleanup алдаа', storageError.message);
  }
  return NextResponse.json({ ok: true, removedImages: paths.length });
}
