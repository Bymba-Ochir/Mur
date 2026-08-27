import { NextResponse } from 'next/server';
import { requireRequestUser } from '../../../../lib/serverAuth';

export async function GET(request: Request) {
  try {
    const { user, admin } = await requireRequestUser(request);
    const queries = await Promise.all([
      admin.from('profiles').select('*').eq('id', user.id).maybeSingle(),
      admin.from('pets').select('id,status,name,type,breed,color,place,district,resolved,created_at').eq('created_by', user.id),
      admin.from('adoptions').select('id,name,type,age,gender,breed,description,district,place,created_at').eq('created_by', user.id),
      admin.from('sitting_listings').select('id,pet_type,description,district,place,experience,availability,price,created_at').eq('user_id', user.id),
      admin.from('my_pets').select('*').eq('user_id', user.id),
      admin.from('appointments').select('*').eq('user_id', user.id),
    ]);
    const failed = queries.find((result) => result.error);
    if (failed?.error) throw failed.error;
    const payload = { exportedAt: new Date().toISOString(), account: { id: user.id, email: user.email, createdAt: user.created_at }, profile: queries[0].data, pets: queries[1].data, adoptions: queries[2].data, sittingListings: queries[3].data, myPets: queries[4].data, appointments: queries[5].data };
    return new NextResponse(JSON.stringify(payload, null, 2), { headers: { 'Content-Type': 'application/json; charset=utf-8', 'Content-Disposition': `attachment; filename="mur-data-${new Date().toISOString().slice(0, 10)}.json"`, 'Cache-Control': 'no-store' } });
  } catch (error) {
    const unauthorized = error instanceof Error && error.message === 'UNAUTHORIZED';
    return NextResponse.json({ error: unauthorized ? 'Нэвтрэх шаардлагатай.' : 'Мэдээлэл бэлтгэхэд алдаа гарлаа.' }, { status: unauthorized ? 401 : 500 });
  }
}
