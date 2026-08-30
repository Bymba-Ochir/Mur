'use client';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/useAuth';
import { fetchNotifications, markAllNotificationsRead, markNotificationRead, subscribeToNotifications } from '../../lib/workflowService';
import type { AppNotification } from '../../lib/workflowService';
import { getErrorMessage } from '../../lib/utils';
import Button from '../../components/ui/Button';
import Icon from '../../components/ui/icons';

const date = new Intl.DateTimeFormat('mn-MN', { dateStyle: 'medium', timeStyle: 'short' });

export default function NotificationsClient() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true); setError('');
    try { setItems(await fetchNotifications()); }
    catch (reason) { setError(getErrorMessage(reason)); }
    finally { setLoading(false); }
  }, [user]);

  useEffect(() => { void Promise.resolve().then(load); }, [load]);
  useEffect(() => user ? subscribeToNotifications(user.id, () => { void load(); }) : undefined, [user, load]);

  async function openNotification(item: AppNotification) {
    if (!item.readAt) {
      try { await markNotificationRead(item.id); setItems((current) => current.map((row) => row.id === item.id ? { ...row, readAt: new Date().toISOString() } : row)); }
      catch { /* The target page is still useful if marking read fails. */ }
    }
    if (item.href?.startsWith('/')) router.push(item.href);
  }

  async function readAll() {
    try { await markAllNotificationsRead(); const now = new Date().toISOString(); setItems((current) => current.map((item) => ({ ...item, readAt: item.readAt || now }))); }
    catch (reason) { setError(getErrorMessage(reason)); }
  }

  if (authLoading) return <div className="page-shell page-shell--narrow"><div className="state-panel" aria-live="polite"><span className="state-panel__icon"><Icon name="bell" size={28} /></span><h2>Мэдэгдэл ачаалж байна</h2></div></div>;
  if (!user) return <div className="page-shell page-shell--narrow"><div className="state-panel"><span className="state-panel__icon"><Icon name="lock" size={28} /></span><h2>Мэдэгдэл</h2><p>Мэдэгдлээ харахын тулд эхлээд нэвтэрнэ үү.</p></div></div>;

  const unread = items.filter((item) => !item.readAt).length;
  return <div className="page-shell page-shell--narrow notification-page">
    <div className="page-header heading-row"><div><div className="eyebrow">Account</div><h1>Мэдэгдэл</h1><p>{unread ? `${unread} уншаагүй мэдэгдэл байна.` : 'Шинэ мэдэгдэл алга.'}</p></div>{unread > 0 && <Button variant="secondary" onClick={readAll}>Бүгдийг уншсан болгох</Button>}</div>
    {error && <div className="error-state" role="alert"><p>{error}</p><Button variant="secondary" onClick={load}>Дахин оролдох</Button></div>}
    {loading ? <p>Мэдэгдэл ачаалж байна...</p> : items.length === 0 ? <div className="card empty"><Icon name="bell" size={28} /><h2>Мэдэгдэл алга</h2><p>Хүсэлт, захиалга эсвэл шинэ үйл явдал гарахад энд харагдана.</p></div> : <div className="notification-list">{items.map((item) => <button key={item.id} className={`card notification-item${item.readAt ? '' : ' unread'}`} onClick={() => void openNotification(item)}><span className="notification-icon"><Icon name="bell" size={18} /></span><span className="notification-copy"><strong>{item.title}</strong><span>{item.body}</span><small>{date.format(new Date(item.createdAt))}</small></span>{!item.readAt && <span className="unread-dot" aria-label="Уншаагүй" />}</button>)}</div>}
    <style jsx>{`.notification-page{padding-bottom:var(--sp-8)}.heading-row{display:flex;justify-content:space-between;align-items:end;gap:16px}.notification-list{display:grid;gap:10px}.notification-item{width:100%;display:grid;grid-template-columns:auto 1fr auto;gap:12px;align-items:start;padding:16px;text-align:left;color:inherit;cursor:pointer}.notification-item.unread{border-color:color-mix(in srgb,var(--accent) 45%,var(--line));background:color-mix(in srgb,var(--accent) 7%,var(--surface-2))}.notification-icon{display:grid;place-items:center;width:36px;height:36px;border-radius:50%;color:var(--accent);background:var(--surface-3)}.notification-copy{display:grid;gap:5px}.notification-copy span,.notification-copy small{color:var(--muted);line-height:1.45}.unread-dot{width:9px;height:9px;border-radius:50%;background:var(--accent);margin-top:7px}.empty{text-align:center;padding:32px;display:grid;justify-items:center;gap:8px}.error-state{margin-bottom:16px;padding:16px;border:1px solid var(--alert);border-radius:var(--r-md)}@media(max-width:600px){.heading-row{align-items:stretch;flex-direction:column}.notification-item{grid-template-columns:auto 1fr}.unread-dot{position:absolute}.notification-icon{width:32px;height:32px}}`}</style>
  </div>;
}
