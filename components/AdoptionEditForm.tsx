'use client';
import { useState } from 'react';
import { DISTRICTS } from '../lib/districts';
import type { District } from '../lib/districts';
import { useLanguage } from '../lib/i18n';
import Button from './ui/Button';
import { TYPE_VALUES, GENDER_VALUES } from '../lib/useAdoptionForm';
import type { AdoptionGender, PetType } from '../lib/types';
import BreedSelect from './BreedSelect';

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
    <div className="card flex flex-col gap-[var(--sp-2)] p-[var(--sp-4)] [&_label]:text-[12.5px] [&_label]:font-semibold [&_label]:text-[var(--primary)] [&_.field]:min-h-[var(--touch-target)] [&_.field]:text-base">
      <label htmlFor="edit-name">{t('adoption_name_label')}</label>
      <input id="edit-name" className="field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />

      <label htmlFor="edit-type">{t('type_label')}</label>
      <select id="edit-type" className="field" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as PetType, breed: '' })}>
        {TYPE_VALUES.map((v) => <option key={v} value={v}>{t(`type_${v === 'Нохой' ? 'dog' : v === 'Муур' ? 'cat' : 'other'}`)}</option>)}
      </select>

      <label htmlFor="edit-age">{t('adoption_age_label')}</label>
      <input id="edit-age" className="field" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} />

      <label htmlFor="edit-gender">{t('adoption_gender_label')}</label>
      <select id="edit-gender" className="field" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value as AdoptionGender })}>
        {GENDER_VALUES.map((v) => <option key={v} value={v}>{v === 'Эрэгтэй' ? t('gender_male') : v === 'Эмэгтэй' ? t('gender_female') : t('gender_unknown')}</option>)}
      </select>

      <label htmlFor="edit-breed">{t('breed_label')}</label>
      <BreedSelect id="edit-breed" className="field" type={form.type} value={form.breed} onChange={(breed) => setForm({ ...form, breed })} />

      <label htmlFor="edit-desc">{t('adoption_description_label')}</label>
      <textarea id="edit-desc" className="field" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />

      <label htmlFor="edit-district">{t('district_label')}</label>
      <select id="edit-district" className="field" value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value as District })}>
        {DISTRICTS.map((d) => <option key={d}>{d}</option>)}
      </select>

      <label htmlFor="edit-place">{t('detail_place').replace(':', '')}</label>
      <input id="edit-place" className="field" value={form.place} onChange={(e) => setForm({ ...form, place: e.target.value })} />

      <label htmlFor="edit-phone">{t('phone_label').replace(' *', '')}</label>
      <input id="edit-phone" className="field" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />

      <div className="mt-[var(--sp-2)] flex gap-[var(--sp-2)] [&_.btn-base]:min-h-[var(--touch-target)] [&_.btn-base]:flex-1">
        <Button onClick={() => onSave(form)} disabled={saving} variant="primary">
          {saving ? t('detail_saving') : t('detail_save')}
        </Button>
        <Button onClick={onCancel} variant="ghost">
          {t('detail_cancel')}
        </Button>
      </div>
    </div>
  );
}
