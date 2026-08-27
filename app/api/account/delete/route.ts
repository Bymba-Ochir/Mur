import { NextResponse } from 'next/server';
import { requireRequestUser } from '../../../../lib/serverAuth';

function storagePath(url: string): string | null {
  const marker = '/storage/v1/object/public/pet-photos/';
  const index = url.indexOf(marker);
  return index < 0 ? null : decodeURIComponent(url.slice(index + marker.length).split('?')[0]);
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    if (body.confirmation !== 'УСТГАХ') return NextResponse.json({ error: 'Баталгаажуулах үг буруу байна.' }, { status: 400 });
    const { user, admin } = await requireRequestUser(request);
    const [pets, adoptions, sitting] = await Promise.all([
      admin.from('pets').select('photo_url,photo_urls').eq('created_by', user.id),
      admin.from('adoptions').select('photo_url,photo_urls').eq('created_by', user.id),
      admin.from('sitting_listings').select('photo_url').eq('user_id', user.id),
    ]);
    const urls = [...(pets.data ?? []).flatMap((row) => [row.photo_url, ...(Array.isArray(row.photo_urls) ? row.photo_urls : [])]), ...(adoptions.data ?? []).flatMap((row) => [row.photo_url, ...(Array.isArray(row.photo_urls) ? row.photo_urls : [])]), ...(sitting.data ?? []).map((row) => row.photo_url)].filter((value): value is string => typeof value === 'string');
    const paths = [...new Set(urls.map(storagePath).filter((value): value is string => Boolean(value)))];
    if (paths.length) await admin.storage.from('pet-photos').remove(paths);
    await admin.storage.from('avatars').remove(['avatar.jpg','avatar.png','avatar.webp'].map((name) => `${user.id}/${name}`));
    for (const [table, column] of [['pets','created_by'],['adoptions','created_by'],['sitting_listings','user_id']] as const) {
      const { error } = await admin.from(table).delete().eq(column, user.id); if (error) throw error;
    }
    const { error } = await admin.auth.admin.deleteUser(user.id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    const unauthorized = error instanceof Error && error.message === 'UNAUTHORIZED';
    console.error('Account delete:', error);
    return NextResponse.json({ error: unauthorized ? 'Нэвтрэх шаардлагатай.' : 'Account устгахад алдаа гарлаа.' }, { status: unauthorized ? 401 : 500 });
  }
}
