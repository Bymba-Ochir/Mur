import { limitIpRequest, limitUserRequest } from '../../../../lib/apiRateLimit';
import { reportError } from '../../../../lib/errorTracking';
import { NextResponse } from 'next/server';
import { requireRequestUser } from '../../../../lib/serverAuth';
import { accountExportPages, encodeAccountExport } from '../../../../lib/accountExport';

export const maxDuration = 60;

export async function GET(request: Request) {
  try {
    const ipLimit = await limitIpRequest(request, 'account-export');
    if (ipLimit) return ipLimit;
    const { user, admin } = await requireRequestUser(request);
    const userLimit = await limitUserRequest('account-export', user.id, admin);
    if (userLimit) return userLimit;
    const controller = new AbortController();
    const abort = () => controller.abort();
    request.signal.addEventListener('abort', abort, { once: true });
    if (request.signal.aborted) abort();
    try {
      const { data: profile, error } = await admin.from('profiles').select('*').eq('id', user.id).abortSignal(controller.signal).maybeSingle();
      if (error) throw error;
      const iterator = encodeAccountExport(user, profile, accountExportPages(admin, user.id, controller.signal));
      const encoder = new TextEncoder();
      const cleanup = () => request.signal.removeEventListener('abort', abort);
      const stream = new ReadableStream<Uint8Array>({
        async pull(output) {
          try {
            const { done, value } = await iterator.next();
            if (done) { cleanup(); output.close(); }
            else output.enqueue(encoder.encode(value));
          } catch (error) {
            cleanup();
            if (!controller.signal.aborted) reportError(error, { area: 'backend', operation: 'account-export-stream' });
            controller.abort();
            // Never complete a truncated JSON document as a successful export.
            output.error(new Error('Account export interrupted'));
          }
        },
        async cancel() { cleanup(); controller.abort(); await iterator.return(); },
      });
      return new NextResponse(stream, { headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="mur-data-${new Date().toISOString().slice(0, 10)}.json"`,
        'Cache-Control': 'private, no-store',
      } });
    } catch (error) {
      request.signal.removeEventListener('abort', abort);
      controller.abort();
      throw error;
    }
  } catch (error) {
    reportError(error, { area: 'backend', operation: 'account-export' });
    const unauthorized = error instanceof Error && error.message === 'UNAUTHORIZED';
    return NextResponse.json({ error: unauthorized ? 'Нэвтрэх шаардлагатай.' : 'Мэдээлэл бэлтгэхэд алдаа гарлаа.' }, { status: unauthorized ? 401 : 500 });
  }
}
