'use client';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../lib/useAuth';
import { useLanguage } from '../lib/i18n';
import { useToast } from './Toast';
import { createAppointment, TIME_SLOTS } from '../lib/appointmentService';
import { fetchMyPets } from '../lib/vaccineService';
import { getErrorMessage } from '../lib/utils';
import type { VetClinic, MyPet, VetService } from '../lib/types';
import Modal from './ui/Modal';
import FieldHint from './ui/FieldHint';
import Button from './ui/Button';
import Icon from './ui/icons';
import type { TranslationKey } from '../lib/i18n';

const SERVICE_I18N: Record<VetService, TranslationKey> = {
  'Үзлэг': 'service_exam', 'Вакцин': 'service_vaccination', 'Мэс засал': 'service_surgery', 'Шүд арчилгаа': 'service_dental',
  'Рентген': 'service_xray', 'ЭХО': 'service_ultrasound', 'Цусны шинжилгээ': 'service_blood_test',
  'Микрочип': 'service_microchip', 'Туулгалт': 'service_deworming', 'Арчилгаа': 'service_grooming',
};

export default function AppointmentModal({ clinic, onClose, onCreated }: { clinic: VetClinic; onClose: () => void; onCreated: () => void; }) {
  const { user } = useAuth(); const { t, lang } = useLanguage(); const showToast = useToast();
  const [pets, setPets] = useState<MyPet[]>([]); const [petId, setPetId] = useState(''); const [service, setService] = useState<VetService>(clinic.services[0]); const [date, setDate] = useState(''); const [time, setTime] = useState(''); const [notes, setNotes] = useState(''); const [busy, setBusy] = useState(false); const [petsError, setPetsError] = useState('');
  const submitting = useRef(false);
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ulaanbaatar', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  useEffect(() => { if (!user) return; let cancelled = false; fetchMyPets().then((data) => { if (!cancelled) { setPets(data); setPetsError(''); } }).catch((error) => { if (!cancelled) setPetsError(getErrorMessage(error)); }); return () => { cancelled = true; }; }, [user]);
  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) { event.preventDefault(); if (submitting.current) return; if (!date || !time) { showToast(t('appt_required'), 'error'); return; } submitting.current = true; setBusy(true); try { await createAppointment({ clinicId: clinic.id, petId: petId || null, service, date, time, notes: notes.trim() || undefined }); showToast(t('appt_success'), 'success'); onCreated(); onClose(); } catch (error) { showToast(getErrorMessage(error) || t('form_generic_error'), 'error'); } finally { submitting.current = false; setBusy(false); } }

  return (
    <Modal open onClose={() => { if (!submitting.current) onClose(); }} title={t('appt_title')} closeLabel={t('close')} width="sm" panelClassName="appointment-modal">
      <form className="appointment-form" onSubmit={handleSubmit}>
        <p role="note">{lang === 'mn' ? 'Энэ нь хүсэлтийн бүртгэл бөгөөд баталгаажсан цаг биш. МӨР эмнэлгийн сул цагийг шууд шалгахгүй. Эмнэлэг рүү залгаж өдөр, цагаа баталгаажуулна уу.' : 'This saves a request, not a confirmed appointment. MӨР does not check clinic availability. Call the clinic to confirm the date and time.'} <a href={`tel:${clinic.phone}`}>{clinic.phone}</a></p>
        <div className="clinic-summary"><span><Icon name="cross" size={20} /></span><div><small>{t('appt_clinic')}</small><strong>{clinic.name}</strong></div></div>
        <label htmlFor="appt-pet"><span>{t('appt_pet_label')}</span><FieldHint mn="Миний амьтад хэсэгт бүртгэсэн амьтнаа сонгоно. Бүртгээгүй бол хоосон үлдээж болно." en="Choose a pet registered under My Pets, or leave blank if none is registered." /><select id="appt-pet" value={petId} onChange={(event) => setPetId(event.target.value)} aria-describedby={petsError ? 'appt-pets-error' : undefined}><option value="">{t('appt_pet_none')}</option>{pets.map((pet) => <option key={pet.id} value={pet.id}>{pet.name}</option>)}</select>{petsError && <small className="field-error" id="appt-pets-error" role="alert">{petsError}</small>}</label>
        <label htmlFor="appt-service"><span>{t('appt_service_label')}</span><FieldHint mn="Энэ эмнэлгээс авах шаардлагатай үйлчилгээг сонгоно." en="Choose the service you need from this clinic." /><select id="appt-service" value={service} onChange={(event) => setService(event.target.value as VetService)}>{clinic.services.map((value) => <option key={value} value={value}>{t(SERVICE_I18N[value])}</option>)}</select></label>
        <div className="date-grid"><label htmlFor="appt-date"><span>{t('appt_date_label')}</span><FieldHint mn="Өнөөдрөөс хойших боломжтой өдрийг сонгоно." en="Choose an available date from today onward." /><input id="appt-date" type="date" min={today} value={date} onChange={(event) => setDate(event.target.value)} required /></label><label htmlFor="appt-time"><span>{t('appt_time_label')}</span><FieldHint mn="Эмнэлэгт очих боломжтой цагаа сонгоно." en="Choose a time when you can arrive at the clinic." /><select id="appt-time" value={time} onChange={(event) => setTime(event.target.value)} required><option value="">--</option>{TIME_SLOTS.map((value) => <option key={value}>{value}</option>)}</select></label></div>
        <label htmlFor="appt-notes"><span>{t('appt_notes_label')}</span><FieldHint mn="Шинж тэмдэг эсвэл эмчид урьдчилан хэлэх зүйлээ товч бичнэ. Заавал биш." en="Briefly describe symptoms or anything the vet should know. Optional." /><textarea id="appt-notes" value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} maxLength={1000} /></label>
        <div className="form-actions"><Button type="button" variant="ghost" onClick={onClose} disabled={busy}>{t('detail_cancel')}</Button><Button type="submit" variant="primary" disabled={busy || !date || !time} aria-busy={busy}>{busy ? t('appt_submitting') : t('appt_submit')}</Button></div>
        <style jsx>{`
          .appointment-form{display:flex;flex-direction:column;gap:var(--sp-4)}.clinic-summary{display:flex;align-items:center;gap:var(--sp-3);padding:var(--sp-3);background:color-mix(in srgb,var(--clinic) 10%,var(--card));border-radius:var(--r-md)}.clinic-summary>span{display:flex;padding:var(--sp-2);color:var(--clinic);background:var(--card);border-radius:var(--r-sm)}.clinic-summary div{display:flex;flex-direction:column;gap:2px}.clinic-summary small{color:var(--muted)}.clinic-summary strong{color:var(--ink)}label{display:flex;flex-direction:column;gap:var(--sp-2);color:var(--primary);font-size:var(--text-xs);font-weight:700}select,input,textarea{width:100%;min-height:var(--touch-target);padding:var(--sp-2) var(--sp-3);color:var(--ink);background:var(--surface-2);border:1px solid var(--line);border-radius:var(--r-sm);font:inherit;font-size:var(--text-base)}textarea{resize:vertical}.date-grid{display:grid;grid-template-columns:1fr 1fr;gap:var(--sp-3)}select:focus-visible,input:focus-visible,textarea:focus-visible{outline:2px solid var(--border-focus);outline-offset:1px}.field-error{color:var(--alert);font-size:var(--text-xs)}.form-actions{display:flex;justify-content:flex-end;gap:var(--sp-2);padding-top:var(--sp-2)}@media(max-width:520px){.date-grid{grid-template-columns:1fr}.form-actions{align-items:stretch;flex-direction:column-reverse}.form-actions :global(.btn-base){width:100%}}
        `}</style>
      </form>
    </Modal>
  );
}
