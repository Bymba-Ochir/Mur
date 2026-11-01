import { limitIpRequest, limitUserRequest } from '../../../../lib/apiRateLimit';
import { reportError } from '../../../../lib/errorTracking';
import { NextResponse } from 'next/server';
import { requireRequestUser } from '../../../../lib/serverAuth';
import { scheduleBackgroundJobs } from '../../../../lib/backgroundJobs';

export const maxDuration = 60;

export async function DELETE(request: Request) {
  try {
    const ipLimit = await limitIpRequest(request, 'account-delete');
    if (ipLimit) return ipLimit;
    const body = await request.json();
    if (body.confirmation !== 'УСТГАХ') return NextResponse.json({ error: 'Баталгаажуулах үг буруу байна.' }, { status: 400 });
    const { user, admin } = await requireRequestUser(request);
    const userLimit = await limitUserRequest('account-delete', user.id, admin);
    if (userLimit) return userLimit;
    // DB triggers snapshot each listing's <=4 URLs atomically with deletion.
    // Account/auth deletion stays synchronous; only file cleanup is deferred.
    for (const [table, column] of [['pets','created_by'],['adoptions','created_by'],['sitting_listings','user_id']] as const) {
      const { error } = await admin.from(table).delete().eq(column, user.id); if (error) throw error;
    }
    const { error } = await admin.auth.admin.deleteUser(user.id);
    if (error) throw error;
    scheduleBackgroundJobs();
    return NextResponse.json({ success: true });
  } catch (error) {
    const unauthorized = error instanceof Error && error.message === 'UNAUTHORIZED';
    reportError(error, { area: 'backend', operation: 'account-delete' });
    return NextResponse.json({ error: unauthorized ? 'Нэвтрэх шаардлагатай.' : 'Account устгахад алдаа гарлаа.' }, { status: unauthorized ? 401 : 500 });
  }
}
