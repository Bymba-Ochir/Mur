'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '../lib/useAuth';
import { useLanguage } from '../lib/i18n';
import { useToast } from './Toast';
import { fetchMyAppointments, cancelAppointment, appointmentStatusLabel } from '../lib/appointmentService';
import { getErrorMessage } from '../lib/utils';
import { VET_CLINICS } from '../lib/vetClinics';
import type { Appointment } from '../lib/types';

const clinicMap = new Map(VET_CLINICS.map((c) => [c.id, c]));

export default function AppointmentsSection({
  refreshKey, onChange,
}: {
  refreshKey: number;
  onChange: () => void;
}) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const showToast = useToast();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    async function load() {
      try {
        const data = await fetchMyAppointments();
        if (!cancelled) setAppointments(data);
      } catch (err) {
        console.error(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [user, refreshKey]);

  async function handleCancel(id: string) {
    if (!confirm(t('appts_cancel_confirm'))) return;
    try {
      await cancelAppointment(id);
      showToast(t('appts_cancel'), 'success');
      onChange();
      // Дахин ачаалах
      const data = await fetchMyAppointments();
      setAppointments(data);
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    }
  }

  if (!user || loading) return null;

  return (
    <div style={{ marginTop: 'var(--sp-5)' }}>
      <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--primary)', marginBottom: 'var(--sp-3)' }}>
        {t('appts_title')}
      </h3>

      {appointments.length === 0 ? (
        <p style={{ fontSize: 13, color: 'var(--muted)' }}>{t('appts_none')}</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)' }}>
          {appointments.map((a) => {
            const clinic = clinicMap.get(a.clinicId);
            return (
              <div key={a.id} style={{
                padding: 'var(--sp-3)',
                background: 'var(--card)',
                border: '1px solid var(--line)',
                borderRadius: 'var(--r-md)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600 }}>{clinic?.name || a.clinicId}</p>
                    <p style={{ fontSize: 12, color: 'var(--muted)' }}>{a.service} · {a.date} · {a.time}</p>
                    <p style={{ fontSize: 11, color: 'var(--muted)' }}>{appointmentStatusLabel(a.status)}</p>
                  </div>
                  {(a.status === 'pending' || a.status === 'confirmed') && (
                    <button
                      className="cancel-btn"
                      onClick={() => handleCancel(a.id)}
                    >
                      {t('appts_cancel')}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <style jsx>{`
        .cancel-btn {
          background: none; border: 1px solid var(--alert); color: var(--alert);
          padding: 4px 10px; border-radius: var(--r-sm); font-size: 11px;
          cursor: pointer; font-family: var(--font-body); font-weight: 600;
          transition: all 0.15s ease;
        }
        .cancel-btn:hover { background: var(--alert); color: var(--text-on-accent); }
      `}</style>
    </div>
  );
}
