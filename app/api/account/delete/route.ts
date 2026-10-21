import { NextResponse } from 'next/server';
import { requireRequestUser } from '../../../../lib/serverAuth';
import { fetchServerPhotoUrlsForOwners } from '../../../../lib/serverPhotoRepository';
import { ownedPetPhotoStoragePath } from '../../../../lib/storageObjectPath';

export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    if (body.confirmation !== 'УСТГАХ') return NextResponse.json({ error: 'Баталгаажуулах үг буруу байна.' }, { status: 400 });
    const { user, admin } = await requireRequestUser(request);
    const [pets, adoptions, sitting] = await Promise.all([
      admin.from('pets').select('id').eq('created_by', user.id),
      admin.from('adoptions').select('id').eq('created_by', user.id),
      admin.from('sitting_listings').select('photo_url').eq('user_id', user.id),
    ]);
    if (pets.error || adoptions.error || sitting.error) throw new Error('CONTENT_LOOKUP_FAILED');

    const [petUrls, adoptionUrls] = await Promise.all([
      fetchServerPhotoUrlsForOwners(admin, 'pet', (pets.data ?? []).map((row) => row.id)),
      fetchServerPhotoUrlsForOwners(admin, 'adoption', (adoptions.data ?? []).map((row) => row.id)),
    ]);
    const urls = [
      ...petUrls,
      ...adoptionUrls,
      ...(sitting.data ?? []).map((row) => row.photo_url),
    ].filter((value): value is string => typeof value === 'string');
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
