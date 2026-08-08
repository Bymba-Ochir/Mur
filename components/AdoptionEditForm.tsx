'use client';
import { useState } from 'react';
import { DISTRICTS } from '../lib/districts';
import type { District } from '../lib/districts';
import { useLanguage } from '../lib/i18n';
import Button from './ui/Button';
import { TYPE_VALUES, GENDER_VALUES } from '../lib/useAdoptionForm';
import type { AdoptionGender, PetType } from '../lib/types';

export interface AdoptionEditValues {
  name: string;
  type: PetType;
  age: string;
  gender: AdoptionGender;
  breed: string;
  description: string;
  district: District;
  place: string;
  phone: string;
}

/** Үрчлүүлэх зарыг засах форм — AdoptionDetailClient-аас салгагдсан. */
export default function AdoptionEditForm({
  initial, onSave, onCancel, saving,
}: {
  initial: AdoptionEditValues;
  onSave: (values: AdoptionEditValues) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const { t } = useLanguage();
  const [form, setForm] = useState<AdoptionEditValues>(initial);

  return (
    <div className="card" style={{ padding: 'var(--sp-4)', display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)' }}>
      <label htmlFor="edit-name" style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--primary)' }}>{t('adoption_name_label')}</label>
      <input id="edit-name" className="field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={{ minHeight: 'var(--touch-target)', fontSize: 16 }} />

      <label htmlFor="edit-type" style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--primary)' }}>{t('type_label')}</label>
      <select id="edit-type" className="field" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as PetType })} style={{ minHeight: 'var(--touch-target)', fontSize: 16 }}>
        {TYPE_VALUES.map((v) => <option key={v} value={v}>{t(`type_${v === 'Нохой' ? 'dog' : v === 'Муур' ? 'cat' : 'other'}`)}</option>)}
      </select>

      <label htmlFor="edit-age" style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--primary)' }}>{t('adoption_age_label')}</label>
      <input id="edit-age" className="field" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} style={{ minHeight: 'var(--touch-target)', fontSize: 16 }} />

      <label htmlFor="edit-gender" style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--primary)' }}>{t('adoption_gender_label')}</label>
      <select id="edit-gender" className="field" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value as AdoptionGender })} style={{ minHeight: 'var(--touch-target)', fontSize: 16 }}>
        {GENDER_VALUES.map((v) => <option key={v} value={v}>{v === 'Эрэгтэй' ? t('gender_male') : v === 'Эмэгтэй' ? t('gender_female') : t('gender_unknown')}</option>)}
      </select>

      <label htmlFor="edit-breed" style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--primary)' }}>{t('adoption_breed_label')}</label>
      <input id="edit-breed" className="field" value={form.breed} onChange={(e) => setForm({ ...form, breed: e.target.value })} style={{ minHeight: 'var(--touch-target)', fontSize: 16 }} />

      <label htmlFor="edit-desc" style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--primary)' }}>{t('adoption_description_label')}</label>
      <textarea id="edit-desc" className="field" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} style={{ fontSize: 16 }} />

      <label htmlFor="edit-district" style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--primary)' }}>{t('district_label')}</label>
      <select id="edit-district" className="field" value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value as District })} style={{ minHeight: 'var(--touch-target)', fontSize: 16 }}>
        {DISTRICTS.map((d) => <option key={d}>{d}</option>)}
      </select>

      <label htmlFor="edit-place" style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--primary)' }}>{t('detail_place').replace(':', '')}</label>
      <input id="edit-place" className="field" value={form.place} onChange={(e) => setForm({ ...form, place: e.target.value })} style={{ minHeight: 'var(--touch-target)', fontSize: 16 }} />

      <label htmlFor="edit-phone" style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--primary)' }}>{t('phone_label').replace(' *', '')}</label>
      <input id="edit-phone" className="field" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} style={{ minHeight: 'var(--touch-target)', fontSize: 16 }} />

      <div style={{ display: 'flex', gap: 'var(--sp-2)', marginTop: 'var(--sp-2)' }}>
        <Button onClick={() => onSave(form)} disabled={saving} variant="primary" style={{ flex: 1, minHeight: 'var(--touch-target)' }}>
          {saving ? t('detail_saving') : t('detail_save')}
        </Button>
        <Button onClick={onCancel} variant="ghost" style={{ flex: 1, minHeight: 'var(--touch-target)' }}>
          {t('detail_cancel')}
        </Button>
      </div>
    </div>
  );
}
