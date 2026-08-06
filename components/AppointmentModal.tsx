'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '../lib/useAuth';
import { useLanguage } from '../lib/i18n';
import { useToast } from './Toast';
import { createAppointment, TIME_SLOTS } from '../lib/appointmentService';
import { fetchMyPets } from '../lib/vaccineService';
import { getErrorMessage } from '../lib/utils';
import type { VetClinic, MyPet, VetService } from '../lib/types';

const SERVICE_I18N: Record<string, string> = {
  'Үзлэг': 'service_exam',
  'Вакцин': 'service_vaccination',
  'Мэс засал': 'service_surgery',
  'Шүд арчилгаа': 'service_dental',
};

export default function AppointmentModal({
  clinic, onClose, onCreated,
}: {
  clinic: VetClinic;
  onClose: () => void;
  onCreated: () => void;
}) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const showToast = useToast();

  const [pets, setPets] = useState<MyPet[]>([]);
  const [petId, setPetId] = useState('');
  const [service, setService] = useState<VetService>(clinic.services[0]);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);

  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    if (user) {
      fetchMyPets().then(setPets).catch(() => {});
    }
  }, [user]);

  async function handleSubmit() {
    if (!date || !time) {
      showToast(t('appt_required'), 'error');
      return;
    }
    setBusy(true);
    try {
      await createAppointment({
        clinicId: clinic.id,
        petId: petId || null,
        service,
        date,
        time,
        notes: notes.trim() || undefined,
      });
      showToast(t('appt_success'), 'success');
      onCreated();
      onClose();
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="appt-title">
        <button className="close" onClick={onClose} aria-label="✕">✕</button>
        <h2 id="appt-title" style={{ fontSize: 18, marginBottom: 12 }}>{t('appt_title')}</h2>
        <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 12 }}>
          {t('appt_clinic')} <strong>{clinic.name}</strong>
        </p>

        <label htmlFor="appt-pet">{t('appt_pet_label')}</label>
        <select id="appt-pet" value={petId} onChange={(e) => setPetId(e.target.value)}>
          <option value="">{t('appt_pet_none')}</option>
          {pets.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>

        <label htmlFor="appt-service">{t('appt_service_label')}</label>
        <select id="appt-service" value={service} onChange={(e) => setService(e.target.value as VetService)}>
          {clinic.services.map((s) => (
            <option key={s} value={s}>{t(SERVICE_I18N[s] as 'service_exam')}</option>
          ))}
        </select>

        <label htmlFor="appt-date">{t('appt_date_label')}</label>
        <input id="appt-date" type="date" min={today} value={date} onChange={(e) => setDate(e.target.value)} required />

        <label htmlFor="appt-time">{t('appt_time_label')}</label>
        <select id="appt-time" value={time} onChange={(e) => setTime(e.target.value)} required>
          <option value="">--</option>
          {TIME_SLOTS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>

        <label htmlFor="appt-notes">{t('appt_notes_label')}</label>
        <textarea id="appt-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />

        <button
          className="submit-btn"
          onClick={handleSubmit}
          disabled={busy || !date || !time}
        >
          {busy ? t('appt_submitting') : t('appt_submit')}
        </button>
      </div>

      <style jsx>{`
        .overlay {
          position: fixed; inset: 0; background: var(--overlay);
          display: flex; align-items: center; justify-content: center;
          z-index: 300; padding: 16px;
          animation: fadeIn 0.2s ease;
        }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .modal {
          background: var(--card); border-radius: var(--r-lg); padding: 24px;
          max-width: 360px; width: 100%; color: var(--ink); position: relative;
          max-height: 90vh; overflow-y: auto;
          animation: slideDown 0.35s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .close { position: absolute; top: 14px; right: 14px; background: none; border: none; font-size: 16px; cursor: pointer; color: var(--muted); }
        label { font-size: 12.5px; font-weight: 600; color: var(--primary); display: block; margin-top: 10px; margin-bottom: 4px; }
        select, input, textarea {
          width: 100%; padding: 9px 11px; border: 1.5px solid var(--line);
          border-radius: var(--r-sm); font-size: 13.5px; background: var(--card);
          color: var(--ink); font-family: inherit; min-height: var(--touch-target);
        }
        .submit-btn {
          width: 100%; margin-top: 16px; padding: 13px;
          border-radius: var(--r-md); border: none;
          background: var(--grad-brand); color: #fff;
          font-weight: 700; cursor: pointer; font-size: 14px;
          font-family: var(--font-body);
          transition: transform 0.15s ease, box-shadow 0.2s ease;
          box-shadow: var(--shadow-sm);
        }
        .submit-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: var(--shadow-md); }
        .submit-btn:disabled { opacity: 0.55; cursor: not-allowed; }
      `}</style>
    </div>
  );
}
