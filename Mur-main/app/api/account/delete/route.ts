import { NextResponse } from 'next/server';
import { requireRequestUser } from '../../../../lib/serverAuth';

import { ownedPetPhotoStoragePath } from '../../../../lib/storageObjectPath';

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
    if (pets.error || adoptions.error || sitting.error) throw new Error('CONTENT_LOOKUP_FAILED');
    const urls = [...(pets.data ?? []).flatMap((row) => [row.photo_url, ...(Array.isArray(row.photo_urls) ? row.photo_urls : [])]), ...(adoptions.data ?? []).flatMap((row) => [row.photo_url, ...(Array.isArray(row.photo_urls) ? row.photo_urls : [])]), ...(sitting.data ?? []).map((row) => row.photo_url)].filter((value): value is string => typeof value === 'string');
    const paths = [...new Set(urls.map(url => ownedPetPhotoStoragePath(url, user.id, process.env.NEXT_PUBLIC_SUPABASE_URL)).filter((value): value is string => Boolean(value)))];
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
