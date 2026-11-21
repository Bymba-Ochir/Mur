'use client';

import { useEffect, useId, useRef, useState } from 'react';
import Image from 'next/image';
import { useLanguage } from '../lib/i18n';
import { compressImage } from '../lib/imageCompress';
import { validateMyPetPhoto } from '../lib/myPetPhoto';
import { getErrorMessage } from '../lib/utils';
import type { MyPet, PetType, UpdateMyPetFields } from '../lib/types';
import BreedSelect from './BreedSelect';
import Button from './ui/Button';
import Icon from './ui/icons';

export type MyPetRegistrationValues = UpdateMyPetFields & { name: string; type: string };

export default function MyPetRegistrationForm({ initial, saving, onSave, onCancel }: {
  initial?: MyPet;
  saving: boolean;
  onSave: (values: MyPetRegistrationValues) => Promise<void>;
  onCancel?: () => void;
}) {
  const { t } = useLanguage();
  const breedId = useId();
  const photoId = useId();
  const photoInput = useRef<HTMLInputElement>(null);
  const markingsId = useId();
  const [name, setName] = useState(initial?.name ?? '');
  const [type, setType] = useState<PetType>(initial?.type === 'Муур' || initial?.type === 'Бусад' ? initial.type : 'Нохой');
  const [breed, setBreed] = useState(initial?.breed ?? '');
  const [markings, setMarkings] = useState(initial?.markings ?? '');
  const [age, setAge] = useState(initial?.age ?? '');
  const [weight, setWeight] = useState(initial?.weight?.toString() ?? '');
  const [vaccineName, setVaccineName] = useState(initial?.nextVaccineName ?? '');
  const [vaccineDate, setVaccineDate] = useState(initial?.nextVaccineDate ?? '');
  const [photoFile, setPhotoFile] = useState<File | null | undefined>(undefined);
  const [preview, setPreview] = useState<string | null>(null);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [error, setError] = useState('');
  const [photoError, setPhotoError] = useState('');
  const mounted = useRef(true);
  const image = photoFile === undefined ? initial?.photoUrl : preview;
  const busy = saving || photoBusy;

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  async function selectPhoto(event: React.ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) return;
    setPhotoBusy(true); setPhotoError('');
    try {
      validateMyPetPhoto(file);
      const compressed = await compressImage(file);
      if (!mounted.current) return;
      validateMyPetPhoto(compressed);
      setPhotoFile(compressed);
      setPreview(URL.createObjectURL(compressed));
    } catch (reason) { if (mounted.current) setPhotoError(getErrorMessage(reason)); }
    finally { if (mounted.current) { setPhotoBusy(false); input.value = ''; } }
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || !name.trim()) return;
    setError('');
    try {
      await onSave({ name, type, breed: breed || null, markings: markings || null, photoFile,
        age: age || null, weight: weight ? Number(weight) : null,
        nextVaccineName: vaccineName || null, nextVaccineDate: vaccineDate || null });
    } catch (reason) { setError(getErrorMessage(reason)); }
  }

  return <form className="registration-form" onSubmit={submit}>
    <p className="form-hint">{t('mypets_identity_hint')}</p>
    <fieldset disabled={busy}>
      <legend className="sr-only">{t('mypets_form_title')}</legend>
      <div className="photo-field">
        {image && <Image src={image} alt={t('photo_preview_alt')} width={112} height={112} unoptimized className="pet-photo" />}
        <div><label className="photo-label" htmlFor={photoId}><span>{t('photo_label')}</span></label>
          <input ref={photoInput} id={photoId} className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" onChange={event => void selectPhoto(event)} />
          <Button variant="secondary" size="sm" onClick={() => photoInput.current?.click()}><Icon name="camera" size={16} />{t('mypets_photo_choose')}</Button>
          <p className="field-hint">{t('mypets_photo_hint')}</p>
          {photoBusy && <p role="status">{t('photo_optimizing')}</p>}
          {image && <Button type="button" variant="ghost" size="sm" onClick={() => { setPhotoFile(null); setPreview(null); setPhotoError(''); }}>{t('photo_remove')}</Button>}
          {photoError && <p className="form-error" role="alert">{photoError}</p>}
        </div>
      </div>
      <div className="identity-grid">
        <label><span>{t('mypets_name_label')} *</span><input className="field" value={name} onChange={event => setName(event.target.value)} placeholder={t('mypets_name_ph')} maxLength={100} required /></label>
        <label><span>{t('mypets_type_label')} *</span><select className="field" value={type} onChange={event => { setType(event.target.value as PetType); setBreed(''); }}>
          <option value="Нохой">{t('type_dog')}</option><option value="Муур">{t('type_cat')}</option><option value="Бусад">{t('type_other')}</option>
        </select></label>
        <div className="breed-field"><label htmlFor={breedId}>{t('mypets_breed_label')}</label><BreedSelect id={breedId} type={type} value={breed} onChange={setBreed} /></div>
        <div className="markings-field"><label htmlFor={markingsId}>{t('color_label').replace(' *', '')}</label><textarea id={markingsId} className="field" value={markings} onChange={event => setMarkings(event.target.value)} placeholder={t('color_placeholder')} rows={2} maxLength={100} aria-describedby={markingsId + '-hint'} /><small id={markingsId + '-hint'}>{t('mypets_markings_hint')}</small></div>
      </div>
      <details className="health-details">
        <summary>{t('mypets_health_optional')}</summary>
        <div className="identity-grid">
          <label><span>{t('mypets_age_label')}</span><input className="field" value={age} onChange={event => setAge(event.target.value)} placeholder={t('health_age_ph')} maxLength={100} /></label>
          <label><span>{t('mypets_weight_label')}</span><input className="field" type="number" min="0" max="999.99" step="0.01" value={weight} onChange={event => setWeight(event.target.value)} placeholder={t('health_weight_ph')} /></label>
          <label><span>{t('mypets_vaccine_label')}</span><input className="field" value={vaccineName} onChange={event => setVaccineName(event.target.value)} placeholder={t('health_next_vaccine_name_ph')} maxLength={200} /></label>
          <label><span>{t('mypets_vaccine_date_label')}</span><input className="field" type="date" value={vaccineDate} onChange={event => setVaccineDate(event.target.value)} /></label>
        </div>
      </details>
    </fieldset>
    {error && <p className="form-error" role="alert">{error}</p>}
    <div className="registration-actions">{onCancel && <Button variant="ghost" disabled={busy} onClick={onCancel}>{t('detail_cancel')}</Button>}
      <Button type="submit" variant="primary" disabled={busy || !name.trim()} aria-busy={busy}>{initial && <Icon name="check" size={17} />}{saving ? t('health_saving') : initial ? t('detail_save') : t('mypets_add')}</Button>
    </div>
    <style jsx>{`
      .registration-form{display:grid;gap:var(--sp-4)}fieldset{min-width:0;margin:0;padding:0;border:0}.form-hint,.field-hint,small{color:var(--muted);font-size:var(--text-xs);line-height:1.6}.form-hint{margin:0;max-width:65ch}.photo-field{display:flex;align-items:flex-start;gap:var(--sp-4);padding-block:var(--sp-4);border-bottom:1px solid var(--line)}.photo-field>div{min-width:0}.photo-field :global(.pet-photo){width:112px;height:112px;object-fit:cover;border-radius:var(--r-md)}.photo-label{display:grid;gap:var(--sp-2)}.photo-label input{max-width:100%;font:inherit;font-size:var(--text-xs)}.field-hint{max-width:44ch;margin-top:var(--sp-2)}.identity-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:var(--sp-4);margin-top:var(--sp-4)}label,.breed-field{display:flex;min-width:0;flex-direction:column;gap:var(--sp-2)}label>span,.breed-field>label{font-size:var(--text-xs);font-weight:650;color:var(--ink)}.identity-grid .field{width:100%;min-height:var(--touch-target);font-size:16px}textarea{resize:vertical}.markings-field{grid-column:1/-1}.health-details{margin-top:var(--sp-5);border-top:1px solid var(--line)}summary{padding-block:var(--sp-3);min-height:var(--touch-target);font-size:var(--text-sm);font-weight:650;cursor:pointer}.registration-actions{display:flex;justify-content:flex-end;gap:var(--sp-2)}.form-error{color:var(--alert);font-size:var(--text-sm);line-height:1.5}small{font-weight:400}
      @media(max-width:600px){.identity-grid{grid-template-columns:1fr}.photo-field{flex-direction:column}.registration-actions{flex-wrap:wrap}.registration-actions :global(.btn-base){flex:1}}
    `}</style>
  </form>;
}
