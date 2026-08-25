'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '../lib/useAuth';
import { useLanguage } from '../lib/i18n';
import { useToast } from './Toast';
import { createAppointment, TIME_SLOTS } from '../lib/appointmentService';
import { fetchMyPets } from '../lib/vaccineService';
import { getErrorMessage } from '../lib/utils';
import type { VetClinic, MyPet, VetService } from '../lib/types';
import Modal from './ui/Modal';
import FieldHint from './ui/FieldHint';

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
    <Modal open onClose={onClose} title={t('appt_title')} closeLabel={t('close')} width="sm" panelClassName="appointment-modal">
        <p className="mb-3 text-[13px] text-[var(--muted)]">
          {t('appt_clinic')} <strong>{clinic.name}</strong>
        </p>

        <label className="mt-2.5 mb-1 block text-[12.5px] font-semibold text-[var(--primary)]" htmlFor="appt-pet">{t('appt_pet_label')}</label>
        <FieldHint mn="Миний амьтад хэсэгт бүртгэсэн амьтнаа сонгоно. Бүртгээгүй бол хоосон үлдээж болно." en="Choose a pet registered under My Pets, or leave blank if none is registered." />
        <select className="min-h-[var(--touch-target)] w-full rounded-[var(--r-sm)] border-[1.5px] border-[var(--line)] bg-[var(--card)] px-[var(--sp-3)] py-[var(--sp-2)] font-[family-name:inherit] text-[length:var(--text-base)] text-[var(--ink)]" id="appt-pet" value={petId} onChange={(e) => setPetId(e.target.value)}>
          <option value="">{t('appt_pet_none')}</option>
          {pets.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>

        <label className="mt-2.5 mb-1 block text-[12.5px] font-semibold text-[var(--primary)]" htmlFor="appt-service">{t('appt_service_label')}</label>
        <FieldHint mn="Энэ эмнэлгээс авах шаардлагатай үйлчилгээг сонгоно." en="Choose the service you need from this clinic." />
        <select className="min-h-[var(--touch-target)] w-full rounded-[var(--r-sm)] border-[1.5px] border-[var(--line)] bg-[var(--card)] px-[var(--sp-3)] py-[var(--sp-2)] font-[family-name:inherit] text-[length:var(--text-base)] text-[var(--ink)]" id="appt-service" value={service} onChange={(e) => setService(e.target.value as VetService)}>
          {clinic.services.map((s) => (
            <option key={s} value={s}>{t(SERVICE_I18N[s] as 'service_exam')}</option>
          ))}
        </select>

        <label className="mt-2.5 mb-1 block text-[12.5px] font-semibold text-[var(--primary)]" htmlFor="appt-date">{t('appt_date_label')}</label>
        <FieldHint mn="Өнөөдрөөс хойших боломжтой өдрийг сонгоно." en="Choose an available date from today onward." />
        <input className="min-h-[var(--touch-target)] w-full rounded-[var(--r-sm)] border-[1.5px] border-[var(--line)] bg-[var(--card)] px-[var(--sp-3)] py-[var(--sp-2)] font-[family-name:inherit] text-[length:var(--text-base)] text-[var(--ink)]" id="appt-date" type="date" min={today} value={date} onChange={(e) => setDate(e.target.value)} required />

        <label className="mt-2.5 mb-1 block text-[12.5px] font-semibold text-[var(--primary)]" htmlFor="appt-time">{t('appt_time_label')}</label>
        <FieldHint mn="Эмнэлэгт очих боломжтой цагаа сонгоно." en="Choose a time when you can arrive at the clinic." />
        <select className="min-h-[var(--touch-target)] w-full rounded-[var(--r-sm)] border-[1.5px] border-[var(--line)] bg-[var(--card)] px-[var(--sp-3)] py-[var(--sp-2)] font-[family-name:inherit] text-[length:var(--text-base)] text-[var(--ink)]" id="appt-time" value={time} onChange={(e) => setTime(e.target.value)} required>
          <option value="">--</option>
          {TIME_SLOTS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>

        <label className="mt-2.5 mb-1 block text-[12.5px] font-semibold text-[var(--primary)]" htmlFor="appt-notes">{t('appt_notes_label')}</label>
        <FieldHint mn="Шинж тэмдэг эсвэл эмчид урьдчилан хэлэх зүйлээ товч бичнэ. Заавал биш." en="Briefly describe symptoms or anything the vet should know. Optional." />
        <textarea className="min-h-[var(--touch-target)] w-full rounded-[var(--r-sm)] border-[1.5px] border-[var(--line)] bg-[var(--card)] px-[var(--sp-3)] py-[var(--sp-2)] font-[family-name:inherit] text-[length:var(--text-base)] text-[var(--ink)]" id="appt-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />

        <button
          className="mt-4 w-full cursor-pointer rounded-[var(--r-md)] border-0 bg-[var(--grad-brand)] p-[13px] font-[family-name:var(--font-body)] text-sm font-bold text-[var(--text-on-accent)] shadow-[var(--shadow-sm)] transition-[transform,box-shadow] hover:not-disabled:-translate-y-px hover:not-disabled:shadow-[var(--shadow-md)] disabled:cursor-not-allowed disabled:opacity-55"
          onClick={handleSubmit}
          disabled={busy || !date || !time}
        >
          {busy ? t('appt_submitting') : t('appt_submit')}
        </button>
    </Modal>
  );
}
