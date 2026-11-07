'use client';
import { useState } from 'react';
import { DISTRICTS } from '../lib/districts';
import type { District } from '../lib/districts';
import { useLanguage } from '../lib/i18n';
import Button from './ui/Button';
import PhonePrivacyField from './PhonePrivacyField';
import SittingCareFields from './SittingCareFields';
import { dateTimeInputFromIso, parseDateTimeInput } from '../lib/dateTime';
import Icon from './ui/icons';
import type { SittingPetType } from '../lib/types';
import { normalizePhone } from '../lib/utils';

const PET_TYPE_VALUES: SittingPetType[] = ['Нохой', 'Муур', 'Бусад', 'Бүгд'];
export interface SittingEditValues { petType: SittingPetType; description: string; experience: string; isBeginner: boolean; availability: string; availableFrom: string | null; price: string; district: District; place: string; phone: string; phoneHidden?: boolean; }
type Errors = Partial<Record<'description' | 'price' | 'place' | 'phone' | 'availableTime', string>>;

export default function SittingEditForm({ initial, onSave, onCancel, saving }: { initial: SittingEditValues; onSave: (values: SittingEditValues) => void; onCancel: () => void; saving: boolean; }) {
  const { t, lang } = useLanguage();
  const [form, setForm] = useState(() => ({ ...initial, availableTime: dateTimeInputFromIso(initial.availableFrom) }));
  const [errors, setErrors] = useState<Errors>({});
  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); const next: Errors = {};
    if (!form.description.trim()) next.description = t('sitting_description_required');
    if (form.price && (Number(form.price) < 0 || Number(form.price) > 100000000)) next.price = t('sitting_price_invalid');
    if (!form.place.trim()) next.place = t('sitting_place_required');
    if (!form.phoneHidden && normalizePhone(form.phone).length !== 8) next.phone = t('sitting_phone_invalid');
    const { availableTime, ...values } = form;
    const selectedAvailability = parseDateTimeInput(availableTime);
    if (selectedAvailability && !Number.isFinite(selectedAvailability.getTime())) next.availableTime = t('date_time_incomplete');
    setErrors(next);
    if (!Object.keys(next).length) onSave({
      ...values,
      availableFrom: selectedAvailability?.toISOString() ?? null,
      description: form.description.trim(),
      place: form.place.trim(),
      phone: normalizePhone(form.phone),
    });
  }
  const typeLabel = (value: SittingPetType) => value === 'Нохой' ? t('type_dog') : value === 'Муур' ? t('type_cat') : value === 'Бусад' ? t('type_other') : t('sitting_pet_type_all');
  return (
    <form className="edit-form" onSubmit={submit} noValidate aria-label={t('detail_edit_btn')}>
      <div className="edit-heading"><Icon name="pencil" size={19} aria-hidden="true" /><h2>{t('detail_edit_btn')}</h2></div>
      <div className="field-grid">
        <label htmlFor="edit-s-type"><span>{t('sitting_pet_type_label')}</span><select id="edit-s-type" value={form.petType} onChange={(e) => setForm({ ...form, petType: e.target.value as SittingPetType })}>{PET_TYPE_VALUES.map((value) => <option key={value} value={value}>{typeLabel(value)}</option>)}</select></label>
        <label htmlFor="edit-s-price"><span>{t('sitting_price_label')}</span><small id="edit-price-hint">{lang === 'mn' ? 'Нэг өдрийн үнэ. Хоосон бол тохиролцоно, 0 бол үнэгүй.' : 'Daily price. Leave blank to negotiate, or enter 0 for free.'}</small><input id="edit-s-price" type="number" min="0" max="100000000" step="1" value={form.price} onChange={(e) => { setForm({ ...form, price: e.target.value }); setErrors({ ...errors, price: undefined }); }} aria-invalid={Boolean(errors.price)} aria-describedby={errors.price ? 'edit-price-hint edit-s-price-error' : 'edit-price-hint'} />{errors.price && <small id="edit-s-price-error" role="alert">{errors.price}</small>}</label>
      </div>
      <label htmlFor="edit-s-desc"><span>{t('sitting_description_label')}</span><textarea id="edit-s-desc" value={form.description} onChange={(e) => { setForm({ ...form, description: e.target.value }); setErrors({ ...errors, description: undefined }); }} rows={5} maxLength={2000} required aria-invalid={Boolean(errors.description)} aria-describedby={errors.description ? 'edit-s-desc-error' : undefined} />{errors.description && <small id="edit-s-desc-error" role="alert">{errors.description}</small>}</label>
      <SittingCareFields id="edit-s" value={form} timeError={errors.availableTime} onChange={value => {
        setForm(current => ({ ...current, ...value }));
        setErrors(current => ({ ...current, availableTime: undefined }));
      }} />
      <div className="field-grid"><label htmlFor="edit-s-district"><span>{t('district_label')}</span><select id="edit-s-district" value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value as District })}>{DISTRICTS.map((district) => <option key={district}>{district}</option>)}</select></label><label htmlFor="edit-s-place"><span>{t('detail_place').replace(':', '')}</span><input id="edit-s-place" value={form.place} onChange={(e) => { setForm({ ...form, place: e.target.value }); setErrors({ ...errors, place: undefined }); }} maxLength={300} required aria-invalid={Boolean(errors.place)} aria-describedby={errors.place ? 'edit-s-place-error' : undefined} />{errors.place && <small id="edit-s-place-error" role="alert">{errors.place}</small>}</label></div>
      <PhonePrivacyField id="edit-s-phone" phone={form.phone} hidden={Boolean(form.phoneHidden)} onPhoneChange={phone => setForm(current => ({ ...current, phone }))} onHiddenChange={phoneHidden => setForm(current => ({ ...current, phoneHidden }))} error={errors.phone} />
      <div className="edit-actions"><Button type="submit" disabled={saving} variant="primary">{saving ? t('detail_saving') : t('detail_save')}</Button><Button type="button" onClick={onCancel} variant="ghost">{t('detail_cancel')}</Button></div>
      <style jsx>{`
        .edit-form{display:flex;flex-direction:column;gap:var(--sp-4);max-width:48rem;padding:var(--sp-6);background:var(--card);border:1px solid var(--line);border-radius:var(--r-xl);box-shadow:var(--shadow-sm)}.edit-heading{display:flex;align-items:center;gap:var(--sp-2);color:var(--primary)}.edit-heading h2{margin:0;color:var(--ink);font-family:var(--font-heading);font-size:var(--text-xl)}.field-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:var(--sp-4)}label{display:flex;flex-direction:column;gap:var(--sp-2);color:var(--primary);font-size:var(--text-xs);font-weight:700}input,select,textarea{width:100%;min-height:var(--touch-target);padding:var(--sp-2) var(--sp-3);color:var(--ink);background:var(--surface-2);border:1px solid var(--line);border-radius:var(--r-sm);font:inherit;font-size:var(--text-base)}textarea{min-height:8rem;resize:vertical}input:focus-visible,select:focus-visible,textarea:focus-visible{outline:2px solid var(--border-focus);outline-offset:1px;border-color:var(--primary-light)}[aria-invalid=true]{border-color:var(--alert)}small{color:var(--alert);font-size:var(--text-xs);font-weight:650}.edit-actions{display:flex;gap:var(--sp-2);margin-top:var(--sp-2)}.edit-actions :global(.btn-base){flex:1}@media(max-width:640px){.edit-form{padding:var(--sp-4);border-radius:var(--r-md)}.field-grid{grid-template-columns:1fr}.edit-actions{flex-direction:column}.edit-actions :global(.btn-base){width:100%}}
      `}</style>
    </form>
  );
}
