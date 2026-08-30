'use client';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../lib/useAuth';
import { fetchMyAdoptionApplications, fetchMySittingBookings } from '../../lib/workflowService';
import type { AdoptionApplication, SittingBooking, WorkflowStatus } from '../../lib/workflowService';
import { getErrorMessage } from '../../lib/utils';
import Button from '../../components/ui/Button';
import Icon from '../../components/ui/icons';

const statusLabel: Record<WorkflowStatus, string> = { pending: 'Хүлээгдэж байна', accepted: 'Зөвшөөрсөн', rejected: 'Татгалзсан', completed: 'Дууссан', cancelled: 'Цуцалсан' };

export default function ActivityClient() {
  const { user, loading: authLoading } = useAuth();
  const [applications, setApplications] = useState<AdoptionApplication[]>([]);
  const [bookings, setBookings] = useState<SittingBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true); setError('');
    try { const [apps, stays] = await Promise.all([fetchMyAdoptionApplications(), fetchMySittingBookings()]); setApplications(apps); setBookings(stays); }
    catch (reason) { setError(getErrorMessage(reason)); }
    finally { setLoading(false); }
  }, [user]);
  useEffect(() => { void Promise.resolve().then(load); }, [load]);

  if (authLoading) return <div className="page-shell page-shell--narrow"><div className="state-panel" aria-live="polite"><span className="state-panel__icon"><Icon name="calendar" size={28} /></span><h2>Мэдээлэл ачаалж байна</h2></div></div>;
  if (!user) return <div className="page-shell page-shell--narrow"><div className="state-panel"><span className="state-panel__icon"><Icon name="lock" size={28} /></span><h2>Миний хүсэлтүүд</h2><p>Эхлээд нэвтэрнэ үү.</p></div></div>;
  return <div className="page-shell page-shell--detail activity-page"><div className="page-header"><div className="eyebrow">Account</div><h1>Миний хүсэлтүүд</h1><p>Таны илгээсэн болон хүлээн авсан хүсэлт, захиалгын төлөв.</p></div>
    {error && <div className="error-state" role="alert"><p>{error}</p><Button variant="secondary" onClick={load}>Дахин оролдох</Button></div>}
    {loading ? <p>Мэдээлэл ачаалж байна...</p> : <div className="activity-grid"><section className="card activity-card"><h2><Icon name="heart" size={20} /> Үрчлүүлэх хүсэлт</h2>{applications.length === 0 ? <p className="empty-copy">Одоогоор хүсэлт алга.</p> : applications.map((item) => <Link href={`/adoptions/${item.adoptionId}`} className="activity-row" key={item.id}><span><strong>{item.applicantId === user.id ? 'Миний илгээсэн хүсэлт' : 'Миний зарын хүсэлт'}</strong><small>{item.message}</small></span><em data-status={item.status}>{statusLabel[item.status]}</em></Link>)}</section>
      <section className="card activity-card"><h2><Icon name="calendar" size={20} /> Асрах захиалга</h2>{bookings.length === 0 ? <p className="empty-copy">Одоогоор захиалга алга.</p> : bookings.map((item) => <Link href={`/sitting/${item.listingId}`} className="activity-row" key={item.id}><span><strong>{item.customerId === user.id ? 'Миний захиалга' : 'Миний үйлчилгээний захиалга'}</strong><small>{item.startDate} – {item.endDate}{item.totalPrice != null ? ` · ${item.totalPrice.toLocaleString()}₮` : ''}</small></span><em data-status={item.status}>{statusLabel[item.status]}</em></Link>)}</section></div>}
    <style jsx>{`.activity-page{padding-bottom:var(--sp-8)}.activity-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px}.activity-card{padding:20px;align-self:start}.activity-card h2{display:flex;align-items:center;gap:8px;font-size:18px;margin-bottom:14px}.activity-row{display:flex;justify-content:space-between;gap:12px;padding:14px 0;border-top:1px solid var(--line);color:inherit;text-decoration:none}.activity-row span{display:grid;gap:5px;min-width:0}.activity-row small{color:var(--muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.activity-row em{font-size:12px;font-style:normal;font-weight:700;color:var(--accent);white-space:nowrap}.activity-row em[data-status=rejected],.activity-row em[data-status=cancelled]{color:var(--alert)}.activity-row em[data-status=completed]{color:var(--success)}.empty-copy{color:var(--muted)}.error-state{margin-bottom:16px;padding:16px;border:1px solid var(--alert);border-radius:var(--r-md)}@media(max-width:760px){.activity-grid{grid-template-columns:1fr}.activity-row{flex-direction:column}.activity-row small{white-space:normal}}`}</style>
  </div>;
}
