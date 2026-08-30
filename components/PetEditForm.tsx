'use client';
import { useState } from 'react';
import { DISTRICTS } from '../lib/districts';
import type { District } from '../lib/districts';
import { useLanguage } from '../lib/i18n';
import Button from './ui/Button';
import { formatPhone, normalizePhone } from '../lib/utils';

export interface PetEditValues {
  name: string;
  color: string;
  place: string;
  district: District;
  phone: string;
}

/** Пет бичлэгийг засах форм — PetDetailClient-аас салгагдсан. */
export default function PetEditForm({
  initial, onSave, onCancel, saving,
}: {
  initial: PetEditValues;
  onSave: (values: PetEditValues) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const { t } = useLanguage();
  const [form, setForm] = useState<PetEditValues>(initial);
  const [phoneError, setPhoneError] = useState('');

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!/^\d{8}$/.test(form.phone)) {
      setPhoneError(t('detail_phone_invalid'));
      return;
    }
    setPhoneError('');
    onSave(form);
  }

  return (
    <form className="edit-form" onSubmit={handleSubmit} noValidate>
      <h2>{t('detail_edit_heading')}</h2>
      <label htmlFor="edit-name">{t('name_label')}</label>
      <input id="edit-name" className="field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} maxLength={100} />

      <label htmlFor="edit-color">{t('color_label').replace(' *', '')}</label>
      <input id="edit-color" className="field" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} maxLength={100} required />

      <label htmlFor="edit-district">{t('district_label')}</label>
      <select id="edit-district" className="field" value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value as District })}>
        {DISTRICTS.map((d) => <option key={d}>{d}</option>)}
      </select>

      <label htmlFor="edit-place">{t('detail_place').replace(':', '')}</label>
      <input id="edit-place" className="field" value={form.place} onChange={(e) => setForm({ ...form, place: e.target.value })} maxLength={300} required />

      <label htmlFor="edit-phone">{t('phone_label').replace(' *', '')}</label>
      <input id="edit-phone" className="field" inputMode="numeric" autoComplete="tel" maxLength={11} value={formatPhone(form.phone)} aria-invalid={Boolean(phoneError)} aria-describedby={phoneError ? 'edit-phone-error' : undefined} onChange={(e) => { setForm({ ...form, phone: normalizePhone(e.target.value) }); setPhoneError(''); }} />
      {phoneError && <p id="edit-phone-error" className="field-error" role="alert">{phoneError}</p>}

      <div className="edit-actions">
        <Button type="submit" disabled={saving} aria-busy={saving} variant="primary">
          {saving ? t('detail_saving') : t('detail_save')}
        </Button>
        <Button type="button" onClick={onCancel} variant="ghost">
          {t('detail_cancel')}
        </Button>
      </div>
      <style jsx>{`
        .edit-form { display:grid; gap:var(--sp-2); padding:var(--sp-4); background:var(--surface-2); border:1px solid var(--border-subtle); border-radius:var(--r-lg); box-shadow:var(--shadow-sm); }
        .edit-form h2 { margin-bottom:var(--sp-2); font-size:var(--text-lg); }
        .edit-form label { color:var(--text-secondary); font-size:var(--text-xs); font-weight:650; }
        .edit-form .field { min-height:var(--touch-target); font-size:16px; }
        .field-error { color:var(--alert); font-size:var(--text-xs); }
        .edit-actions { display:grid; grid-template-columns:1fr 1fr; gap:var(--sp-2); margin-top:var(--sp-2); }
        .edit-actions :global(.btn-base) { width:100%; }
        @media(max-width:560px){.edit-form{padding:var(--sp-3);border-radius:var(--r-md)}.edit-actions{grid-template-columns:1fr}}
      `}</style>
    </form>
  );
}
