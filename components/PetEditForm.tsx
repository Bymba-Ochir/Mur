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
  const phoneValid = normalizePhone(form.phone).length === 8;

  return (
    <div className="card flex flex-col gap-[var(--sp-2)] p-[var(--sp-4)] [&_label]:text-[12.5px] [&_label]:font-semibold [&_label]:text-[var(--primary)] [&_.field]:min-h-[var(--touch-target)] [&_.field]:text-base">
      <label htmlFor="edit-name">{t('name_label')}</label>
      <input id="edit-name" className="field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />

      <label htmlFor="edit-color">{t('color_label').replace(' *', '')}</label>
      <input id="edit-color" className="field" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} />

      <label htmlFor="edit-district">{t('district_label')}</label>
      <select id="edit-district" className="field" value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value as District })}>
        {DISTRICTS.map((d) => <option key={d}>{d}</option>)}
      </select>

      <label htmlFor="edit-place">{t('detail_place').replace(':', '')}</label>
      <input id="edit-place" className="field" value={form.place} onChange={(e) => setForm({ ...form, place: e.target.value })} />

      <label htmlFor="edit-phone">{t('phone_label').replace(' *', '')}</label>
      <input id="edit-phone" className="field" inputMode="tel" value={formatPhone(form.phone)} onChange={(e) => setForm({ ...form, phone: normalizePhone(e.target.value) })} aria-invalid={!phoneValid} />
      {!phoneValid && <p className="text-xs text-[var(--alert)]" role="alert">8 оронтой утасны дугаар оруулна уу.</p>}

      <div className="mt-[var(--sp-2)] flex gap-[var(--sp-2)] [&_.btn-base]:min-h-[var(--touch-target)] [&_.btn-base]:flex-1">
        <Button onClick={() => onSave({ ...form, phone: normalizePhone(form.phone) })} disabled={saving || !phoneValid} variant="primary">
          {saving ? t('detail_saving') : t('detail_save')}
        </Button>
        <Button onClick={onCancel} variant="ghost">
          {t('detail_cancel')}
        </Button>
      </div>
    </div>
  );
}
