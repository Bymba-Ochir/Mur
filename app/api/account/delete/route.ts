import { NextResponse } from 'next/server';
import { createAdminClient } from '../../../../lib/supabaseAdmin';
import { checkRateLimit, getClientIp } from '../../../../lib/rateLimit';

export async function DELETE(request: Request) {
  const limited = checkRateLimit(`account-delete:${getClientIp(request)}`, 3, 60 * 60_000);
  if (!limited.allowed) return NextResponse.json({ error:'Хэт олон хүсэлт. Дараа дахин оролдоно уу.' }, { status:429 });

  const auth = request.headers.get('authorization');
  const token = auth?.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!token) return NextResponse.json({ error:'Нэвтрээгүй байна' }, { status:401 });

  let body: { confirmation?: string } = {};
  try { body = await request.json(); } catch { /* invalid body */ }
  if (body.confirmation !== 'УСТГАХ') {
    return NextResponse.json({ error:'Баталгаажуулах үг буруу байна' }, { status:400 });
  }

  const admin = createAdminClient();
  const { data, error:authError } = await admin.auth.getUser(token);
  if (authError || !data.user) return NextResponse.json({ error:'Session хүчингүй байна' }, { status:401 });

  const { error } = await admin.auth.admin.deleteUser(data.user.id);
  if (error) {
    console.error('Account delete error:', error.message);
    return NextResponse.json({ error:'Бүртгэл устгаж чадсангүй' }, { status:500 });
  }
  return NextResponse.json({ ok:true });
}
