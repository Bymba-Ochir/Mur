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
    <div className="mt-[var(--sp-5)]">
      <h3 className="mb-[var(--sp-3)] text-sm font-semibold text-[var(--primary)]">
        {t('appts_title')}
      </h3>

      {appointments.length === 0 ? (
        <p className="text-[13px] text-[var(--muted)]">{t('appts_none')}</p>
      ) : (
        <div className="flex flex-col gap-[var(--sp-2)]">
          {appointments.map((a) => {
            const clinic = clinicMap.get(a.clinicId);
            return (
              <div key={a.id} className="rounded-[var(--r-md)] border border-[var(--line)] bg-[var(--card)] p-[var(--sp-3)]">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[13px] font-semibold">{clinic?.name || a.clinicId}</p>
                    <p className="text-xs text-[var(--muted)]">{a.service} · {a.date} · {a.time}</p>
                    <p className="text-[11px] text-[var(--muted)]">{appointmentStatusLabel(a.status)}</p>
                  </div>
                  {(a.status === 'pending' || a.status === 'confirmed') && (
                    <button
                      className="cursor-pointer rounded-[var(--r-sm)] border border-[var(--alert)] bg-transparent px-2.5 py-1 text-[11px] font-semibold text-[var(--alert)] transition-colors hover:bg-[var(--alert)] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
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
    </div>
  );
}
