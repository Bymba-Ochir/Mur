'use client';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { DISTRICTS } from '../lib/districts';
import type { District } from '../lib/districts';
import { useLanguage } from '../lib/i18n';
import Button from './ui/Button';
import Icon from './ui/icons';
import { TYPE_VALUES, GENDER_VALUES } from '../lib/useAdoptionForm';
import type { AdoptionGender, PetType } from '../lib/types';
import BreedSelect from './BreedSelect';
import { validatePetAge } from '../lib/petAge';
import { formatPhone, normalizePhone } from '../lib/utils';

export interface AdoptionEditValues { name:string;type:PetType;age:string;gender:AdoptionGender;breed:string;description:string;district:District;place:string;phone:string; }

export default function AdoptionEditForm({ initial, onSave, onCancel, saving }: { initial:AdoptionEditValues;onSave:(values:AdoptionEditValues)=>void;onCancel:()=>void;saving:boolean; }) {
  const { t } = useLanguage();
  const [form, setForm] = useState<AdoptionEditValues>(initial);
  const [errors, setErrors] = useState<{description?:string;place?:string;phone?:string;age?:string}>({});

  function submit(event:FormEvent<HTMLFormElement>) {
    event.preventDefault();
    let ageError = '';
    try { validatePetAge(form.age); } catch (error) { ageError = (error as Error).message; }
    const next = {
      ...(ageError ? {age: ageError} : {}),
      ...(!form.description.trim() ? { description:t('adoption_description_required') } : {}),
      ...(!form.place.trim() ? { place:t('adoption_place_required') } : {}),
      ...(!/^\d{8}$/.test(form.phone) ? { phone:t('adoption_phone_invalid') } : {}),
    };
    setErrors(next);
    if (!Object.keys(next).length) onSave(form);
  }

  return <form className="edit-form" onSubmit={submit} aria-label={t('detail_edit_btn')}>
    <h2>{t('detail_edit_btn')}</h2>
    <div className="field-grid">
      <label htmlFor="edit-name">{t('adoption_name_label')}</label><input id="edit-name" value={form.name} onChange={(event)=>setForm({...form,name:event.target.value})} maxLength={100}/>
      <label htmlFor="edit-type">{t('type_label')}</label><select id="edit-type" value={form.type} onChange={(event)=>setForm({...form,type:event.target.value as PetType,breed:''})}>{TYPE_VALUES.map((value)=><option key={value} value={value}>{t(`type_${value==='Нохой'?'dog':value==='Муур'?'cat':'other'}`)}</option>)}</select>
      <label htmlFor="edit-age">{t('adoption_age_label')}</label><input aria-describedby="edit-age-hint" aria-invalid={Boolean(errors.age)} id="edit-age" value={form.age} onChange={(event)=>setForm({...form,age:event.target.value})} maxLength={100}/><small id="edit-age-hint">{t('adoption_age_placeholder')}</small>{errors.age && <p role="alert">{errors.age}</p>}
      <label htmlFor="edit-gender">{t('adoption_gender_label')}</label><select id="edit-gender" value={form.gender} onChange={(event)=>setForm({...form,gender:event.target.value as AdoptionGender})}>{GENDER_VALUES.map((value)=><option key={value} value={value}>{value==='Эрэгтэй'?t('gender_male'):value==='Эмэгтэй'?t('gender_female'):t('gender_unknown')}</option>)}</select>
      <label htmlFor="edit-breed">{t('breed_label')}</label><BreedSelect id="edit-breed" type={form.type} value={form.breed} onChange={(breed)=>setForm({...form,breed})}/>
      <label htmlFor="edit-desc">{t('adoption_description_label')}</label><textarea id="edit-desc" value={form.description} onChange={(event)=>{setForm({...form,description:event.target.value});setErrors((current)=>({...current,description:undefined}));}} rows={5} maxLength={2000} required aria-invalid={Boolean(errors.description)} aria-describedby={errors.description?'edit-desc-error':undefined}/>
      {errors.description&&<p id="edit-desc-error" className="field-error" role="alert"><Icon name="alert" size={16}/>{errors.description}</p>}
      <label htmlFor="edit-district">{t('district_label')}</label><select id="edit-district" value={form.district} onChange={(event)=>setForm({...form,district:event.target.value as District})}>{DISTRICTS.map((district)=><option key={district}>{district}</option>)}</select>
      <label htmlFor="edit-place">{t('detail_place').replace(':','')}</label><input id="edit-place" value={form.place} onChange={(event)=>{setForm({...form,place:event.target.value});setErrors((current)=>({...current,place:undefined}));}} maxLength={300} required aria-invalid={Boolean(errors.place)} aria-describedby={errors.place?'edit-place-error':undefined}/>
      {errors.place&&<p id="edit-place-error" className="field-error" role="alert"><Icon name="alert" size={16}/>{errors.place}</p>}
      <label htmlFor="edit-phone">{t('phone_label').replace(' *','')}</label><input id="edit-phone" inputMode="tel" autoComplete="tel" maxLength={14} value={formatPhone(form.phone)} onChange={(event)=>{setForm({...form,phone:normalizePhone(event.target.value)});setErrors((current)=>({...current,phone:undefined}));}} aria-invalid={Boolean(errors.phone)} aria-describedby={errors.phone?'edit-phone-error':undefined}/>
      {errors.phone&&<p id="edit-phone-error" className="field-error" role="alert"><Icon name="alert" size={16}/>{errors.phone}</p>}
    </div>
    <div className="edit-actions"><Button type="submit" disabled={saving} variant="primary">{saving?t('detail_saving'):t('detail_save')}</Button><Button type="button" onClick={onCancel} variant="ghost">{t('detail_cancel')}</Button></div>
    <style jsx>{`.edit-form{max-width:46rem;margin-inline:auto;padding:var(--sp-6);background:var(--card);border:1px solid var(--line);border-radius:var(--r-xl);box-shadow:var(--shadow-sm)}h2{margin:0 0 var(--sp-5);font-family:var(--font-heading)}.field-grid{display:flex;flex-direction:column}.field-grid label{margin:var(--sp-4) 0 var(--sp-2);color:var(--primary);font-size:var(--text-sm);font-weight:700}.field-grid label:first-child{margin-top:0}input,select,textarea{width:100%;min-height:var(--touch-target);padding:var(--sp-3) var(--sp-4);color:var(--ink);background:var(--surface-2);border:1.5px solid var(--line);border-radius:var(--r-sm);font:inherit}textarea{resize:vertical}input:focus-visible,select:focus-visible,textarea:focus-visible{outline:none;border-color:var(--accent);box-shadow:0 0 0 3px color-mix(in srgb,var(--accent) 18%,transparent)}[aria-invalid='true']{border-color:var(--alert)}.field-error{display:flex;gap:var(--sp-2);margin:var(--sp-2) 0 0;color:var(--alert);font-size:var(--text-sm);font-weight:600}.edit-actions{display:flex;gap:var(--sp-3);margin-top:var(--sp-6)}.edit-actions :global(.btn-base){flex:1}@media(max-width:640px){.edit-form{padding:var(--sp-4);border-radius:var(--r-lg)}input,select,textarea{font-size:1rem}.edit-actions{flex-direction:column}}`}</style>
  </form>;
}
