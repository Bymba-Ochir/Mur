'use client';
import { useState } from 'react';
import type { ChangeEvent, KeyboardEvent } from 'react';
import { DISTRICTS } from '../lib/districts';
import { useLanguage } from '../lib/i18n';
import ShareButtons from './ShareButtons';
import AdoptionPreviewCard from './AdoptionPreviewCard';
import PawTrail from './PawTrail';
import { useAdoptionPhoto, useAdoptionSubmit, TYPE_VALUES, GENDER_VALUES } from '../lib/useAdoptionForm';
import type { AdoptionFormData } from '../lib/useAdoptionForm';
import type { AdoptionGender, PetType } from '../lib/types';
import { normalizePhone, formatPhone } from '../lib/utils';

export default function AdoptionForm() {
  const { t } = useLanguage();
  const STEPS = [t('adoptions_form_step_photo'), t('adoptions_form_step_info'), t('adoptions_form_step_contact')];
  const TYPE_LABELS: Record<PetType, string> = { 'Нохой': t('type_dog'), 'Муур': t('type_cat'), 'Бусад': t('type_other') };
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<AdoptionFormData>({
    name: '', type: 'Нохой', age: '', gender: 'Тодорхойгүй', breed: '', description: '', place: '', district: DISTRICTS[0], phone: '',
  });

  const photo = useAdoptionPhoto();

  function resetAll() {
    setForm({ name: '', type: 'Нохой', age: '', gender: 'Тодорхойгүй', breed: '', description: '', place: '', district: DISTRICTS[0], phone: '' });
    setStep(0);
    photo.reset();
  }

  const submit = useAdoptionSubmit({
    form,
    photoFile: photo.photoFile,
    onSuccess: resetAll,
  });

  function handleChange(e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }) as AdoptionFormData);
  }

  function handleUploadKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      photo.openFilePicker();
    }
  }

  function addAnother() {
    submit.reset();
    resetAll();
  }

  const canNext = [
    true,
    !!form.description,
    !!form.place && normalizePhone(form.phone).length === 8,
  ][step];

  if (submit.done) {
    const adoptionUrl = typeof window !== 'undefined' ? `${window.location.origin}/adoptions/${submit.newAdoptionId}` : '';
    return (
      <div className="success-box" role="status">
        <p>{t('adoption_success_msg')}</p>
        <ShareButtons url={adoptionUrl} title="Үрчлүүлэх амьтан" />
        <button onClick={addAnother} className="btn" style={{ marginTop: 16 }}>{t('add_another')}</button>
      </div>
    );
  }

  return (
    <div className="form-layout">
    <form onSubmit={submit.handleSubmit} className="pet-form" aria-label="Үрчлүүлэх амьтан зар үүсгэх форм">
      <PawTrail labels={STEPS} current={step} />
      <p className="progress-text" aria-live="polite">{step + 1}/{STEPS.length}: {STEPS[step]}</p>

      {step === 0 && (
        <>
          <label id="photo-label">{t('photo_label')}</label>
          <div
            className="upload-zone"
            onClick={photo.openFilePicker}
            onKeyDown={handleUploadKeyDown}
            role="button"
            tabIndex={0}
            aria-labelledby="photo-label"
            aria-describedby="photo-hint"
          >
            {photo.compressing ? (
              <span role="status">⏳ Зураг оновчлож байна...</span>
            ) : photo.preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photo.preview} alt={t('photo_preview_alt')} />
            ) : (
              <span id="photo-hint">{t('photo_hint')}</span>
            )}
          </div>
          <input
            id="adoption-photo-input" type="file" accept="image/*" onChange={photo.handlePhoto}
            style={{ display: 'none' }} disabled={photo.compressing}
            aria-label={t('photo_label')}
          />
        </>
      )}

      {step === 1 && (
        <>
          <label htmlFor="adopt-name">{t('adoption_name_label')}</label>
          <input id="adopt-name" name="name" value={form.name} onChange={handleChange} placeholder={t('adoption_name_placeholder')} />

          <label htmlFor="adopt-type">{t('type_label')}</label>
          <select id="adopt-type" name="type" value={form.type} onChange={handleChange}>
            {TYPE_VALUES.map((v) => <option key={v} value={v}>{TYPE_LABELS[v]}</option>)}
          </select>

          <label htmlFor="adopt-age">{t('adoption_age_label')}</label>
          <input id="adopt-age" name="age" value={form.age} onChange={handleChange} placeholder={t('adoption_age_placeholder')} />

          <label htmlFor="adopt-gender">{t('adoption_gender_label')}</label>
          <select id="adopt-gender" name="gender" value={form.gender} onChange={handleChange}>
            {GENDER_VALUES.map((v) => <option key={v} value={v}>{v === 'Эрэгтэй' ? t('gender_male') : v === 'Эмэгтэй' ? t('gender_female') : t('gender_unknown')}</option>)}
          </select>

          <label htmlFor="adopt-breed">{t('adoption_breed_label')}</label>
          <input id="adopt-breed" name="breed" value={form.breed} onChange={handleChange} placeholder={t('adoption_breed_placeholder')} />

          <label htmlFor="adopt-desc">{t('adoption_description_label')}</label>
          <textarea id="adopt-desc" name="description" value={form.description} onChange={handleChange} rows={3} placeholder={t('adoption_description_placeholder')} required />
        </>
      )}

      {step === 2 && (
        <>
          <label htmlFor="adopt-district">{t('district_label')}</label>
          <select id="adopt-district" name="district" value={form.district} onChange={handleChange}>
            {DISTRICTS.map((d) => <option key={d}>{d}</option>)}
          </select>

          <label htmlFor="adopt-place">{t('adoption_place_label')}</label>
          <input id="adopt-place" name="place" value={form.place} onChange={handleChange} placeholder={t('adoption_place_placeholder')} required />

          <label htmlFor="adopt-phone">{t('phone_label')}</label>
          <input
            id="adopt-phone"
            name="phone"
            value={formatPhone(form.phone)}
            onChange={(e) => setForm((f) => ({ ...f, phone: normalizePhone(e.target.value) }))}
            placeholder={t('phone_placeholder')}
            required
            inputMode="tel"
          />

          {submit.error && <p className="error" role="alert">{submit.error}</p>}

          <button type="submit" disabled={submit.submitting} className="btn btn-primary" aria-busy={submit.submitting}>
            {submit.submitting ? submit.statusMsg || t('submitting') : t('adoption_submit')}
          </button>
        </>
      )}

      <div className="nav-row">
        {step > 0 && (
          <button type="button" onClick={() => setStep(step - 1)} className="btn nav-back">{t('form_back')}</button>
        )}
        {step < STEPS.length - 1 && (
          <button
            type="button"
            onClick={() => canNext && setStep(step + 1)}
            disabled={!canNext}
            className="btn nav-next"
          >
            {t('form_next')}
          </button>
        )}
      </div>
    </form>

    <div className="preview-col">
      <AdoptionPreviewCard
        name={form.name}
        type={form.type}
        age={form.age}
        gender={form.gender}
        breed={form.breed}
        district={form.district}
        place={form.place}
        phone={formatPhone(form.phone)}
        photoPreview={photo.preview}
      />
    </div>

      <style jsx>{`
        .form-layout { display: flex; gap: 48px; align-items: flex-start; }
        @media (max-width: 860px) { .form-layout { gap: 0; } }
        @media (min-width: 1200px) { .form-layout { gap: 64px; } }
        .preview-col { display: none; position: sticky; top: 100px; }
        @media (min-width: 860px) { .preview-col { display: block; } }
        .pet-form {
          display: flex; flex-direction: column; gap: 4px; max-width: 440px; flex: 1; min-width: 0;
          background: var(--card); border: 1px solid var(--line); border-radius: var(--r-xl);
          padding: var(--sp-6); box-shadow: var(--shadow-md);
        }
        @media (min-width: 1025px) { .pet-form { max-width: 520px; padding: var(--sp-7); } }
        @media (max-width: 640px) { .pet-form { padding: var(--sp-5); border-radius: var(--r-lg); max-width: 100%; } }
        @media (max-width: 480px) { .pet-form { padding: var(--sp-4); border-radius: var(--r-md); } }
        label { font-size: 12.5px; font-weight: 600; color: var(--primary); margin-top: var(--sp-4); display: block; letter-spacing: 0.01em; }
        label:first-child { margin-top: 0; }
        @media (max-width: 480px) { label { font-size: 13px; margin-top: var(--sp-3); } }
        @media (min-width: 1025px) { label { font-size: 13.5px; margin-top: var(--sp-5); } }
        input, select, textarea {
          padding: 11px 13px; border: 1.5px solid var(--line); border-radius: var(--r-sm);
          font-size: 14.5px; width: 100%; font-family: var(--font-body); background: var(--card); color: var(--ink);
          transition: border-color 0.15s ease; min-height: var(--touch-target);
        }
        @media (max-width: 480px) { input, select, textarea { font-size: 16px; padding: 12px 14px; } }
        @media (min-width: 1025px) { input, select, textarea { font-size: 15px; padding: 12px 16px; } }
        input:hover, select:hover, textarea:hover { border-color: var(--muted); }
        input:focus-visible, select:focus-visible, textarea:focus-visible { outline: 2px solid var(--accent); outline-offset: 1px; border-color: var(--accent); }
        textarea { resize: vertical; min-height: 80px; }
        .upload-zone {
          border: 1.5px dashed var(--line); border-radius: var(--r-md); padding: 28px 20px;
          text-align: center; cursor: pointer; color: var(--muted); background: var(--overcast);
          transition: border-color 0.15s ease, background 0.15s ease; min-height: var(--touch-target);
          display: flex; align-items: center; justify-content: center;
        }
        @media (max-width: 480px) { .upload-zone { padding: 24px 16px; } }
        @media (min-width: 1025px) { .upload-zone { padding: 32px 24px; } }
        .upload-zone:hover { border-color: var(--accent); background: var(--eyebrow-bg); }
        .upload-zone:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
        .upload-zone img { max-width: 150px; border-radius: var(--r-sm); }
        @media (min-width: 1025px) { .upload-zone img { max-width: 180px; } }
        .btn-primary { width: 100%; margin-top: var(--sp-5); justify-content: center; font-size: 15px; padding: 14px; min-height: var(--touch-target); }
        @media (max-width: 480px) { .btn-primary { font-size: 16px; padding: 16px; margin-top: var(--sp-4); } }
        @media (min-width: 1025px) { .btn-primary { font-size: 16px; padding: 16px 24px; margin-top: var(--sp-6); } }
        .btn-primary:disabled { opacity: 0.55; cursor: not-allowed; transform: none; }
        .error { color: var(--alert); font-size: 13px; margin-top: var(--sp-2); }
        @media (max-width: 480px) { .error { font-size: 14px; } }
        .success-box {
          padding: var(--sp-6); background: var(--success-bg); border-radius: var(--r-lg); text-align: center;
          border: 1px solid color-mix(in srgb, var(--success) 30%, transparent);
        }
        @media (max-width: 480px) { .success-box { padding: var(--sp-5); } }
        @media (min-width: 1025px) { .success-box { padding: var(--sp-7); } }
        .progress-text { font-family: var(--font-mono); font-size: 11.5px; color: var(--muted); margin: var(--sp-2) 0 var(--sp-5); text-align: center; letter-spacing: 0.02em; }
        @media (max-width: 480px) { .progress-text { font-size: 12px; margin: var(--sp-2) 0 var(--sp-4); } }
        @media (min-width: 1025px) { .progress-text { font-size: 12.5px; margin: var(--sp-3) 0 var(--sp-6); } }
        .nav-row { display: flex; gap: 10px; margin-top: var(--sp-5); }
        @media (max-width: 480px) { .nav-row { gap: 12px; margin-top: var(--sp-4); } }
        @media (min-width: 1025px) { .nav-row { gap: 14px; margin-top: var(--sp-6); } }
        .nav-back { background: var(--eyebrow-bg); color: var(--primary); flex: 1; justify-content: center; min-height: var(--touch-target); }
        .nav-next { background: var(--accent); color: #fff; flex: 1; justify-content: center; min-height: var(--touch-target); }
        .nav-next:disabled { opacity: 0.45; cursor: not-allowed; transform: none; }
      `}</style>
    </div>
  );
}
