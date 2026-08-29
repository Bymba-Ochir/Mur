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
      admin.from('adoption_applications').select('*').or(`applicant_id.eq.${user.id},owner_id.eq.${user.id}`),
      admin.from('sitting_bookings').select('*').or(`customer_id.eq.${user.id},sitter_id.eq.${user.id}`),
      admin.from('sitting_reviews').select('*').or(`reviewer_id.eq.${user.id},sitter_id.eq.${user.id}`),
      admin.from('notifications').select('*').eq('user_id', user.id),
      admin.from('sightings').select('id,pet_id,message,place,created_at').eq('reporter_id', user.id),
      admin.from('reports').select('id,pet_id,reason,status,created_at').eq('reporter_id', user.id),
      admin.from('push_subscriptions').select('id,district,endpoint,created_at').eq('user_id', user.id),
    ]);
    const failed = queries.find((result) => result.error);
    if (failed?.error) throw failed.error;
    const { data: conversations, error: conversationError } = await admin.from('conversations').select('*').or(`initiator_id.eq.${user.id},owner_id.eq.${user.id}`);
    if (conversationError) throw conversationError;
    const conversationIds = (conversations ?? []).map((row) => row.id);
    const messageResult = conversationIds.length ? await admin.from('messages').select('*').in('conversation_id', conversationIds) : { data: [], error: null };
    if (messageResult.error) throw messageResult.error;
    const payload = { exportedAt: new Date().toISOString(), account: { id: user.id, email: user.email, createdAt: user.created_at }, profile: queries[0].data, pets: queries[1].data, adoptions: queries[2].data, sittingListings: queries[3].data, myPets: queries[4].data, appointments: queries[5].data, adoptionApplications: queries[6].data, sittingBookings: queries[7].data, sittingReviews: queries[8].data, notifications: queries[9].data, sightings: queries[10].data, reports: queries[11].data, pushSubscriptions: queries[12].data, conversations, messages: messageResult.data };
    return new NextResponse(JSON.stringify(payload, null, 2), { headers: { 'Content-Type': 'application/json; charset=utf-8', 'Content-Disposition': `attachment; filename="mur-data-${new Date().toISOString().slice(0, 10)}.json"`, 'Cache-Control': 'no-store' } });
  } catch (error) {
    const unauthorized = error instanceof Error && error.message === 'UNAUTHORIZED';
    return NextResponse.json({ error: unauthorized ? 'Нэвтрэх шаардлагатай.' : 'Мэдээлэл бэлтгэхэд алдаа гарлаа.' }, { status: unauthorized ? 401 : 500 });
  }
}
