'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '../lib/useAuth';
import { useLanguage } from '../lib/i18n';
import { useToast } from './Toast';
import { fetchMyAppointments, cancelAppointment } from '../lib/appointmentService';
import { getErrorMessage } from '../lib/utils';
import { VET_CLINICS } from '../lib/vetClinics';
import type { Appointment } from '../lib/types';
import Button from './ui/Button';
import Icon from './ui/icons';

const clinicMap = new Map(VET_CLINICS.map((clinic) => [clinic.id, clinic]));

export default function AppointmentsSection({ refreshKey, onChange }: { refreshKey: number; onChange: () => void; }) {
  const { user } = useAuth(); const { t } = useLanguage(); const showToast = useToast();
  const [appointments, setAppointments] = useState<Appointment[]>([]); const [loading, setLoading] = useState(true); const [error, setError] = useState(''); const [cancellingId, setCancellingId] = useState('');
  useEffect(() => { if (!user) return; let cancelled = false; fetchMyAppointments().then((data) => { if (!cancelled) { setAppointments(data); setError(''); } }).catch((reason) => { if (!cancelled) setError(getErrorMessage(reason)); }).finally(() => { if (!cancelled) setLoading(false); }); return () => { cancelled = true; }; }, [user, refreshKey]);
  async function handleCancel(id: string) { if (!confirm(t('appts_cancel_confirm'))) return; setCancellingId(id); try { await cancelAppointment(id); showToast(t('appts_cancel'), 'success'); onChange(); } catch (reason) { showToast(getErrorMessage(reason) || t('form_generic_error'), 'error'); } finally { setCancellingId(''); } }
  const statusLabel = (status: Appointment['status']) => t(status === 'pending' ? 'appts_status_pending' : status === 'confirmed' ? 'appts_status_confirmed' : status === 'completed' ? 'appts_status_completed' : 'appts_status_cancelled');
  if (!user) return null;
  return (
    <section className="appointments" aria-labelledby="appointments-title">
      <div className="section-heading"><span><Icon name="calendar" size={19} /></span><h2 id="appointments-title">{t('appts_title')}</h2></div>
      {loading ? <div className="appointment-skeleton" aria-busy="true"><span /><span /></div>
        : error ? <div className="inline-error" role="alert"><Icon name="alert" size={20} /><div><p>{error}</p><Button variant="secondary" onClick={onChange}>{t('err_retry')}</Button></div></div>
        : appointments.length === 0 ? <p className="empty-text">{t('appts_none')}</p>
        : <div className="appointment-list">{appointments.map((appointment) => { const clinic = clinicMap.get(appointment.clinicId); return <article key={appointment.id}><div className="appointment-info"><h3>{clinic?.name || appointment.clinicId}</h3><p><Icon name="cross" size={14} />{appointment.service}</p><p><Icon name="calendar" size={14} /><time dateTime={`${appointment.date}T${appointment.time}`}>{appointment.date} · {appointment.time}</time></p></div><div className="appointment-status"><span className={`status ${appointment.status}`}>{statusLabel(appointment.status)}</span>{(appointment.status === 'pending' || appointment.status === 'confirmed') && <Button variant="ghost" onClick={() => void handleCancel(appointment.id)} disabled={cancellingId === appointment.id}>{t('appts_cancel')}</Button>}</div></article>; })}</div>}
      <style jsx>{`
        .appointments{margin-top:var(--sp-7);padding-top:var(--sp-6);border-top:1px solid var(--line)}.section-heading{display:flex;align-items:center;gap:var(--sp-2);margin-bottom:var(--sp-4)}.section-heading>span{display:flex;padding:var(--sp-2);color:var(--primary);background:var(--eyebrow-bg);border-radius:var(--r-sm)}h2{margin:0;font-family:var(--font-heading);font-size:var(--text-xl)}.appointment-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:var(--sp-3)}.appointment-list article{display:flex;justify-content:space-between;gap:var(--sp-3);padding:var(--sp-4);background:var(--card);border:1px solid var(--line);border-radius:var(--r-lg);box-shadow:var(--shadow-sm)}.appointment-info{min-width:0}h3{margin:0 0 var(--sp-2);color:var(--ink);font-size:var(--text-base)}.appointment-info p{display:flex;align-items:center;gap:var(--sp-2);margin:var(--sp-1) 0;color:var(--muted);font-size:var(--text-sm)}.appointment-status{display:flex;align-items:flex-end;flex-direction:column;gap:var(--sp-2)}.status{padding:5px 9px;color:var(--primary);background:var(--eyebrow-bg);border-radius:var(--r-pill);font-size:var(--text-xs);font-weight:800;white-space:nowrap}.status.cancelled{color:var(--muted);background:var(--surface-3)}.status.completed{color:var(--success);background:var(--success-bg)}.empty-text{padding:var(--sp-5);color:var(--muted);background:var(--surface-2);border-radius:var(--r-lg);text-align:center}.inline-error{display:flex;align-items:flex-start;gap:var(--sp-3);padding:var(--sp-4);color:var(--alert);background:var(--alert-bg);border-radius:var(--r-md)}.inline-error div{display:flex;align-items:flex-start;flex:1;flex-direction:column;gap:var(--sp-2)}.inline-error p{margin:0}.appointment-skeleton{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:var(--sp-3)}.appointment-skeleton span{height:8rem;background:var(--surface-2);border-radius:var(--r-lg)}
        @media(max-width:760px){.appointment-list,.appointment-skeleton{grid-template-columns:1fr}}@media(max-width:480px){.appointment-list article{align-items:stretch;flex-direction:column;border-radius:var(--r-md)}.appointment-status{align-items:stretch}.appointment-status :global(.btn-base){width:100%;justify-content:center}}
      `}</style>
    </section>
  );
}
