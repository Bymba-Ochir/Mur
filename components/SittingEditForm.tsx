'use client';
import { useState } from 'react';
import { DISTRICTS } from '../lib/districts';
import type { District } from '../lib/districts';
import { useLanguage } from '../lib/i18n';
import Button from './ui/Button';
import type { SittingPetType } from '../lib/types';

const PET_TYPE_VALUES: SittingPetType[] = ['Нохой', 'Муур', 'Бусад', 'Бүгд'];

export interface SittingEditValues {
  petType: SittingPetType;
  description: string;
  experience: string;
  availability: string;
  price: string;
  district: District;
  place: string;
  phone: string;
}

/** Асрах зарыг засах форм — SittingDetailClient-аас салгагдсан. */
export default function SittingEditForm({
  initial, onSave, onCancel, saving,
}: {
  initial: SittingEditValues;
  onSave: (values: SittingEditValues) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const { t } = useLanguage();
  const [form, setForm] = useState<SittingEditValues>(initial);

  return (
    <div className="card flex flex-col gap-[var(--sp-2)] p-[var(--sp-4)] [&_label]:text-[12.5px] [&_label]:font-semibold [&_label]:text-[var(--primary)] [&_.field]:min-h-[var(--touch-target)] [&_.field]:text-base">
      <label htmlFor="edit-s-type">{t('sitting_pet_type_label')}</label>
      <select id="edit-s-type" className="field" value={form.petType} onChange={(e) => setForm({ ...form, petType: e.target.value as SittingPetType })}>
        {PET_TYPE_VALUES.map((v) => (
          <option key={v} value={v}>
            {v === 'Нохой' ? t('type_dog') : v === 'Муур' ? t('type_cat') : v === 'Бусад' ? t('type_other') : t('sitting_pet_type_all')}
          </option>
        ))}
      </select>

      <label htmlFor="edit-s-desc">{t('sitting_description_label').replace(' *', '')}</label>
      <textarea id="edit-s-desc" className="field" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />

      <label htmlFor="edit-s-exp">{t('sitting_experience_label')}</label>
      <input id="edit-s-exp" className="field" value={form.experience} onChange={(e) => setForm({ ...form, experience: e.target.value })} />

      <label htmlFor="edit-s-avail">{t('sitting_availability_label')}</label>
      <input id="edit-s-avail" className="field" value={form.availability} onChange={(e) => setForm({ ...form, availability: e.target.value })} />

      <label htmlFor="edit-s-price">{t('sitting_price_label')}</label>
      <input id="edit-s-price" className="field" type="number" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />

      <label htmlFor="edit-s-district">{t('district_label')}</label>
      <select id="edit-s-district" className="field" value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value as District })}>
        {DISTRICTS.map((d) => <option key={d}>{d}</option>)}
      </select>

      <label htmlFor="edit-s-place">{t('detail_place').replace(':', '')}</label>
      <input id="edit-s-place" className="field" value={form.place} onChange={(e) => setForm({ ...form, place: e.target.value })} />

      <label htmlFor="edit-s-phone">{t('phone_label').replace(' *', '')}</label>
      <input id="edit-s-phone" className="field" inputMode="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />

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
