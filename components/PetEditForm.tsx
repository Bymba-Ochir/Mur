'use client';
import { useState } from 'react';
import { DISTRICTS } from '../lib/districts';
import type { District } from '../lib/districts';
import { useLanguage } from '../lib/i18n';

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

  return (
    <div className="card" style={{ padding: 'var(--sp-4)', display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)' }}>
      <label htmlFor="edit-name" style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--primary)' }}>{t('name_label')}</label>
      <input id="edit-name" className="field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />

      <label htmlFor="edit-color" style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--primary)' }}>{t('color_label').replace(' *', '')}</label>
      <input id="edit-color" className="field" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} />

      <label htmlFor="edit-district" style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--primary)' }}>{t('district_label')}</label>
      <select id="edit-district" className="field" value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value as District })}>
        {DISTRICTS.map((d) => <option key={d}>{d}</option>)}
      </select>

      <label htmlFor="edit-place" style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--primary)' }}>{t('detail_place').replace(':', '')}</label>
      <input id="edit-place" className="field" value={form.place} onChange={(e) => setForm({ ...form, place: e.target.value })} />

      <label htmlFor="edit-phone" style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--primary)' }}>{t('phone_label').replace(' *', '')}</label>
      <input id="edit-phone" className="field" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />

      <div style={{ display: 'flex', gap: 'var(--sp-2)', marginTop: 'var(--sp-2)' }}>
        <button onClick={() => onSave(form)} disabled={saving} className="btn btn-primary" style={{ flex: 1 }}>
          {saving ? t('detail_saving') : t('detail_save')}
        </button>
        <button onClick={onCancel} className="btn btn-ghost" style={{ flex: 1 }}>
          {t('detail_cancel')}
        </button>
      </div>
    </div>
  );
}
