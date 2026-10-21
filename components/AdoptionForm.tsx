'use client';
import { useState } from 'react';
import type { ChangeEvent, FormEvent, KeyboardEvent } from 'react';
import { DISTRICTS } from '../lib/districts';
import { useLanguage } from '../lib/i18n';
import Button from './ui/Button';
import Icon from './ui/icons';
import ShareButtons from './ShareButtons';
import AdoptionPreviewCard from './AdoptionPreviewCard';
import PawTrail from './PawTrail';
import { useAdoptionPhoto, useAdoptionSubmit, TYPE_VALUES, GENDER_VALUES } from '../lib/useAdoptionForm';
import type { AdoptionFormData } from '../lib/useAdoptionForm';
import type { PetType } from '../lib/types';
import { normalizePhone, formatPhone } from '../lib/utils';
import BreedSelect from './BreedSelect';
import FieldHint from './ui/FieldHint';
import AuthRequired from './AuthRequired';

type FieldErrors = Partial<Record<'description' | 'place' | 'phone', string>>;

export default function AdoptionForm() {
  return (
    <AuthRequired>
      <AuthenticatedAdoptionForm />
    </AuthRequired>
  );
}

function AuthenticatedAdoptionForm() {
  const { t } = useLanguage();
  const steps = [t('adoptions_form_step_photo'), t('adoptions_form_step_info'), t('adoptions_form_step_contact')];
  const typeLabels: Record<PetType, string> = { 'Нохой': t('type_dog'), 'Муур': t('type_cat'), 'Бусад': t('type_other') };
  const [step, setStep] = useState(0);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [form, setForm] = useState<AdoptionFormData>({ name: '', type: 'Нохой', age: '', gender: 'Тодорхойгүй', breed: '', description: '', place: '', district: DISTRICTS[0], phone: '' });
  const photo = useAdoptionPhoto();

  function resetAll() {
    setForm({ name: '', type: 'Нохой', age: '', gender: 'Тодорхойгүй', breed: '', description: '', place: '', district: DISTRICTS[0], phone: '' });
    setStep(0);
    setFieldErrors({});
    photo.reset();
  }

  const submit = useAdoptionSubmit({ form, photoFiles: photo.photoFiles, onSuccess: resetAll });

  function clearError(name: keyof FieldErrors) {
    setFieldErrors((current) => ({ ...current, [name]: undefined }));
  }

  function handleChange(event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }) as AdoptionFormData);
    if (name === 'description' || name === 'place') clearError(name);
  }

  function validateStep(targetStep: number) {
    const errors: FieldErrors = {};
    if (targetStep === 1 && !form.description.trim()) errors.description = t('adoption_description_required');
    if (targetStep === 2 && !form.place.trim()) errors.place = t('adoption_place_required');
    if (targetStep === 2 && !/^\d{8}$/.test(form.phone)) errors.phone = t('adoption_phone_invalid');
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function goNext() {
    if (validateStep(step)) setStep((current) => Math.min(current + 1, steps.length - 1));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    if (!validateStep(2)) { event.preventDefault(); return; }
    void submit.handleSubmit(event);
  }

  function handleUploadKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); photo.openFilePicker(); }
  }

  if (submit.done) {
    const adoptionUrl = typeof window !== 'undefined' ? `${window.location.origin}/adoptions/${submit.newAdoptionId}` : '';
    return (
      <section className="success-box" role="status" aria-labelledby="adoption-success-title">
        <span className="success-icon" aria-hidden="true"><Icon name="check" size={28} /></span>
        <h2 id="adoption-success-title">{t('adoptions_new_eyebrow')}</h2>
        <p>{t('adoption_success_msg')}</p>
        <ShareButtons url={adoptionUrl} title={t('adoptions_new_eyebrow')} />
        <Button variant="secondary" onClick={() => { submit.reset(); resetAll(); }} className="add-another">{t('add_another')}</Button>
        <style jsx>{`.success-box{max-width:38rem;margin-inline:auto;padding:var(--sp-7);background:var(--success-bg);border:1px solid color-mix(in srgb,var(--success) 30%,transparent);border-radius:var(--r-xl);text-align:center}.success-icon{display:grid;place-items:center;width:3rem;height:3rem;margin:0 auto var(--sp-3);color:var(--success);background:var(--card);border-radius:50%}h2{margin:0 0 var(--sp-2);font-family:var(--font-heading)}p{margin:0 0 var(--sp-5);color:var(--muted)}.add-another{margin-top:var(--sp-4)}`}</style>
      </section>
    );
  }

  return (
    <div className="form-layout">
      <form onSubmit={handleSubmit} className="adoption-form" aria-label={t('adoption_form_aria')}>
        <PawTrail labels={steps} current={step} ariaLabel={t('form_steps_aria')} />
        <p className="progress-text" aria-live="polite">{step + 1}/{steps.length}: {steps[step]}</p>

        {step === 0 && <fieldset className="form-step">
          <legend className="sr-only">{steps[0]}</legend>
          <label id="adoption-photo-label">{t('adoption_photo_label')}</label>
          <p id="adoption-photo-help" className="photo-help">{t('adoption_photo_help')}</p>
          <div className="upload-zone" onClick={photo.openFilePicker} onKeyDown={handleUploadKeyDown} role="button" tabIndex={0} aria-labelledby="adoption-photo-label" aria-describedby="adoption-photo-help" aria-busy={photo.compressing}>
            <Icon name={photo.compressing ? 'sparkles' : 'camera'} size={22} />
            <span>{photo.compressing ? t('photo_optimizing') : photo.previews.length ? `${t('adoption_photo_add_more')} (${photo.previews.length}/4)` : t('adoption_photo_add')}</span>
          </div>
          {photo.previews.length > 0 && <div className="photo-grid" role="list" aria-label={t('adoption_selected_photos')}>
            {photo.previews.map((preview, index) => <div className="photo-item" key={preview} role="listitem">
              {/* Blob preview-г next/image оновчлох шаардлагагүй. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt={`${t('photo_preview_alt')} ${index + 1}`} />
              {index === 0 && <span className="cover-badge">{t('adoption_cover_photo')}</span>}
              <button type="button" aria-label={`${index + 1}: ${t('photo_remove')}`} onClick={() => photo.removePhoto(index)}><Icon name="close" size={18} /></button>
            </div>)}
          </div>}
          <input id="adoption-photo-input" className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={photo.handlePhoto} disabled={photo.compressing || photo.photoFiles.length >= 4} aria-label={t('adoption_photo_label')} />
        </fieldset>}

        {step === 1 && <fieldset className="form-step">
          <legend className="sr-only">{steps[1]}</legend>
          <label htmlFor="adopt-name">{t('adoption_name_label')}</label><FieldHint mn="Нэрийг мэдэхгүй бол хоосон үлдээж болно." en="Leave this blank if the pet's name is unknown." />
          <input id="adopt-name" name="name" value={form.name} onChange={handleChange} placeholder={t('adoption_name_placeholder')} maxLength={100} />
          <label htmlFor="adopt-type">{t('type_label')}</label>
          <select id="adopt-type" name="type" value={form.type} onChange={(event) => setForm((current) => ({ ...current, type: event.target.value as PetType, breed: '' }))}>{TYPE_VALUES.map((value) => <option key={value} value={value}>{typeLabels[value]}</option>)}</select>
          <label htmlFor="adopt-age">{t('adoption_age_label')}</label><FieldHint mn="Насыг нэгжтэй бичнэ: 2 жил, 6 сар. Мэдэхгүй бол хоосон үлдээнэ." en="Include the unit: 2 years or 6 months. Leave blank if unknown." />
          <input id="adopt-age" name="age" value={form.age} onChange={handleChange} placeholder={t('adoption_age_placeholder')} maxLength={100} />
          <label htmlFor="adopt-gender">{t('adoption_gender_label')}</label>
          <select id="adopt-gender" name="gender" value={form.gender} onChange={handleChange}>{GENDER_VALUES.map((value) => <option key={value} value={value}>{value === 'Эрэгтэй' ? t('gender_male') : value === 'Эмэгтэй' ? t('gender_female') : t('gender_unknown')}</option>)}</select>
          <label htmlFor="adopt-breed">{t('breed_label')}</label><FieldHint mn="Үүлдэр тодорхойгүй бол “Тодорхойгүй” эсвэл “Холимог үүлдэр” сонгоно." en="Choose Unknown or Mixed breed when uncertain." />
          <BreedSelect id="adopt-breed" type={form.type} value={form.breed} onChange={(breed) => setForm((current) => ({ ...current, breed }))} />
          <label htmlFor="adopt-desc">{t('adoption_description_label')}</label><FieldHint mn="Зан ааш, вакцин, ариутгал, эрүүл мэнд болон шинэ эзэнд тавих нөхцөлийг бичнэ." en="Describe temperament, vaccination, health and adopter requirements." />
          <textarea id="adopt-desc" name="description" value={form.description} onChange={handleChange} rows={5} placeholder={t('adoption_description_placeholder')} required maxLength={2000} aria-invalid={Boolean(fieldErrors.description)} aria-describedby={fieldErrors.description ? 'adopt-desc-error' : undefined} />
          <span className="char-count">{form.description.length}/2000</span>
          {fieldErrors.description && <p id="adopt-desc-error" className="field-error" role="alert"><Icon name="alert" size={16} />{fieldErrors.description}</p>}
        </fieldset>}

        {step === 2 && <fieldset className="form-step">
          <legend className="sr-only">{steps[2]}</legend>
          <label htmlFor="adopt-district">{t('district_label')}</label>
          <select id="adopt-district" name="district" value={form.district} onChange={handleChange}>{DISTRICTS.map((district) => <option key={district}>{district}</option>)}</select>
          <label htmlFor="adopt-place">{t('adoption_place_label')}</label><FieldHint mn="Гэрийн нарийн хаяг биш, уулзаж болох хороо эсвэл танигдах газрын нэр бичнэ." en="Enter a khoroo or public landmark, not a precise home address." />
          <input id="adopt-place" name="place" value={form.place} onChange={handleChange} placeholder={t('adoption_place_placeholder')} required maxLength={300} aria-invalid={Boolean(fieldErrors.place)} aria-describedby={fieldErrors.place ? 'adopt-place-error' : undefined} />
          {fieldErrors.place && <p id="adopt-place-error" className="field-error" role="alert"><Icon name="alert" size={16} />{fieldErrors.place}</p>}
          <label htmlFor="adopt-phone">{t('phone_label')}</label><FieldHint mn="Холбогдох боломжтой 8 оронтой Монгол утасны дугаар оруулна." en="Enter a reachable 8-digit Mongolian phone number." />
          <input id="adopt-phone" name="phone" value={formatPhone(form.phone)} onChange={(event) => { setForm((current) => ({ ...current, phone: normalizePhone(event.target.value) })); clearError('phone'); }} placeholder={t('phone_placeholder')} required inputMode="tel" autoComplete="tel" maxLength={14} aria-invalid={Boolean(fieldErrors.phone)} aria-describedby={fieldErrors.phone ? 'adopt-phone-error' : undefined} />
          {fieldErrors.phone && <p id="adopt-phone-error" className="field-error" role="alert"><Icon name="alert" size={16} />{fieldErrors.phone}</p>}
          {submit.error && <p className="field-error submit-error" role="alert"><Icon name="alert" size={17} />{submit.error}</p>}
          <Button type="submit" disabled={submit.submitting} variant="primary" fullWidth className="form-submit" aria-busy={submit.submitting}>{submit.submitting ? submit.statusMsg || t('submitting') : t('adoption_submit')}</Button>
        </fieldset>}

        <div className="nav-row">
          {step > 0 && <Button type="button" onClick={() => { setFieldErrors({}); setStep((current) => current - 1); }} variant="ghost"><Icon name="arrowLeft" size={18} />{t('form_back_plain')}</Button>}
          {step < steps.length - 1 && <Button type="button" onClick={goNext} disabled={photo.compressing} variant="accent">{t('form_next_plain')}<Icon name="arrowRight" size={18} /></Button>}
        </div>
      </form>

      <aside className="preview-col" aria-label={t('preview_label')}><AdoptionPreviewCard name={form.name} type={form.type} age={form.age} gender={form.gender} breed={form.breed} district={form.district} place={form.place} phone={form.phone} photoPreview={photo.previews[0] ?? null} /></aside>

      <style jsx>{`
        .form-layout{display:grid;grid-template-columns:minmax(0,35rem) minmax(17rem,20rem);justify-content:center;align-items:start;gap:var(--sp-8);width:100%}.adoption-form{display:flex;flex-direction:column;min-width:0;padding:var(--sp-7);background:var(--card);border:1px solid var(--line);border-radius:var(--r-xl);box-shadow:var(--shadow-md)}.preview-col{position:sticky;top:6.5rem;width:100%;min-width:0}.form-step{display:flex;flex-direction:column;min-width:0;margin:0;padding:0;border:0}.progress-text{margin:var(--sp-3) 0 var(--sp-6);color:var(--muted);font-family:var(--font-mono);font-size:var(--text-xs);text-align:center}label{display:block;margin-top:var(--sp-5);color:var(--primary);font-size:var(--text-sm);font-weight:700}.form-step>label:first-of-type{margin-top:0}.photo-help{margin:var(--sp-1) 0 var(--sp-3);color:var(--muted);font-size:var(--text-xs)}input,select,textarea{width:100%;min-height:var(--touch-target);padding:var(--sp-3) var(--sp-4);color:var(--ink);background:var(--card);border:1.5px solid var(--line);border-radius:var(--r-sm);font:inherit}textarea{min-height:8rem;resize:vertical}input:hover,select:hover,textarea:hover{border-color:var(--muted)}input:focus-visible,select:focus-visible,textarea:focus-visible{outline:none;border-color:var(--accent);box-shadow:0 0 0 3px color-mix(in srgb,var(--accent) 18%,transparent)}[aria-invalid='true']{border-color:var(--alert)}.upload-zone{display:flex;align-items:center;justify-content:center;gap:var(--sp-2);min-height:9rem;padding:var(--sp-4);color:var(--primary);background:var(--overcast);border:1.5px dashed var(--line);border-radius:var(--r-md);font-weight:700;text-align:center;cursor:pointer}.upload-zone:hover{border-color:var(--accent);background:var(--eyebrow-bg)}.upload-zone:focus-visible{outline:2px solid var(--accent);outline-offset:3px}.photo-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:var(--sp-2);margin-top:var(--sp-3)}.photo-item{position:relative;aspect-ratio:1;overflow:hidden;background:var(--surface-3);border:1px solid var(--line);border-radius:var(--r-sm)}.photo-item img{display:block;width:100%;height:100%;object-fit:cover}.photo-item button{position:absolute;top:var(--sp-1);right:var(--sp-1);display:grid;place-items:center;width:var(--touch-target);height:var(--touch-target);padding:0;color:var(--text-on-accent);background:color-mix(in srgb,var(--ink) 78%,transparent);border:0;border-radius:50%;cursor:pointer}.photo-item button:hover{background:var(--alert)}.cover-badge{position:absolute;left:var(--sp-1);bottom:var(--sp-1);padding:var(--sp-1) var(--sp-2);color:var(--text-on-accent);background:var(--primary);border-radius:var(--r-pill);font-size:.68rem;font-weight:800}.char-count{align-self:flex-end;margin-top:var(--sp-1);color:var(--muted);font-size:var(--text-xs)}.field-error{display:flex;align-items:flex-start;gap:var(--sp-2);margin:var(--sp-2) 0 0;color:var(--alert);font-size:var(--text-sm);font-weight:600}.submit-error{margin-top:var(--sp-4)}.form-submit{margin-top:var(--sp-6)}.nav-row{display:flex;gap:var(--sp-3);margin-top:var(--sp-6)}.nav-row :global(.btn-base){flex:1}.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}@media(max-width:900px){.form-layout{grid-template-columns:minmax(0,38rem);gap:0}.preview-col{display:none}}@media(max-width:640px){.adoption-form{padding:var(--sp-5);border-radius:var(--r-lg)}input,select,textarea{font-size:1rem}.photo-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:420px){.adoption-form{padding:var(--sp-4);border-radius:var(--r-md)}.nav-row{gap:var(--sp-2)}}
      `}</style>
    </div>
  );
}
