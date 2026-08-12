'use client';
import { useState } from 'react';
import type { ChangeEvent, KeyboardEvent } from 'react';
import { DISTRICTS } from '../lib/districts';
import { useLanguage } from '../lib/i18n';
import Button from './ui/Button';
import ShareButtons from './ShareButtons';
import AdoptionPreviewCard from './AdoptionPreviewCard';
import PawTrail from './PawTrail';
import { useAdoptionPhoto, useAdoptionSubmit, TYPE_VALUES, GENDER_VALUES } from '../lib/useAdoptionForm';
import type { AdoptionFormData } from '../lib/useAdoptionForm';
import type { AdoptionGender, PetType } from '../lib/types';
import { normalizePhone, formatPhone } from '../lib/utils';
import BreedSelect from './BreedSelect';
import FieldHint from './ui/FieldHint';

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
    photoFiles: photo.photoFiles,
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
        <Button variant="secondary" onClick={addAnother} style={{ marginTop: 16 }}>{t('add_another')}</Button>
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
          <label id="photo-label">Зураг оруулах</label>
          <p id="photo-hint" className="photo-help">Дээд тал нь 4 зураг оруулах боломжтой · JPG, PNG эсвэл WebP</p>
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
            ) : (
              <span>{photo.previews.length ? `+ Зураг нэмэх (${photo.previews.length}/4)` : '+ Зураг сонгох'}</span>
            )}
          </div>
          {photo.previews.length > 0 && (
            <div className="photo-grid" aria-label="Сонгосон зургууд">
              {photo.previews.map((preview, index) => (
                <div className="photo-item" key={preview}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={preview} alt={`Сонгосон ${index + 1}-р зураг`} />
                  {index === 0 && <span className="cover-badge">Нүүр зураг</span>}
                  <button type="button" aria-label={`${index + 1}-р зургийг устгах`} onClick={() => photo.removePhoto(index)}>×</button>
                </div>
              ))}
            </div>
          )}
          <input
            id="adoption-photo-input" type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={photo.handlePhoto}
            style={{ display: 'none' }} disabled={photo.compressing || photo.photoFiles.length >= 4}
            aria-label={t('photo_label')}
          />
        </>
      )}

      {step === 1 && (
        <>
          <label htmlFor="adopt-name">{t('adoption_name_label')}</label>
          <FieldHint mn="Нэрийг мэдэхгүй бол хоосон үлдээж болно." en="Leave this blank if the pet's name is unknown." />
          <input id="adopt-name" name="name" value={form.name} onChange={handleChange} placeholder={t('adoption_name_placeholder')} />

          <label htmlFor="adopt-type">{t('type_label')}</label>
          <FieldHint mn="Зөв төрлийг сонговол хайлт, шүүлтүүр илүү зөв ажиллана." en="Choose the correct type so search and filters work accurately." />
          <select id="adopt-type" name="type" value={form.type} onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value as PetType, breed: '' }))}>
            {TYPE_VALUES.map((v) => <option key={v} value={v}>{TYPE_LABELS[v]}</option>)}
          </select>

          <label htmlFor="adopt-age">{t('adoption_age_label')}</label>
          <FieldHint mn="Тодорхой нас мэдэхгүй бол “ойролцоогоор 6 сартай” гэж бичиж болно." en="If unknown, enter an estimate such as “about 6 months old”." />
          <input id="adopt-age" name="age" value={form.age} onChange={handleChange} placeholder={t('adoption_age_placeholder')} />

          <label htmlFor="adopt-gender">{t('adoption_gender_label')}</label>
          <select id="adopt-gender" name="gender" value={form.gender} onChange={handleChange}>
            {GENDER_VALUES.map((v) => <option key={v} value={v}>{v === 'Эрэгтэй' ? t('gender_male') : v === 'Эмэгтэй' ? t('gender_female') : t('gender_unknown')}</option>)}
          </select>

          <label htmlFor="adopt-breed">{t('breed_label')}</label>
          <FieldHint mn="Үүлдэр тодорхойгүй бол “Тодорхойгүй” эсвэл “Холимог үүлдэр” сонгоно." en="Choose Unknown or Mixed breed when the breed is uncertain." />
          <BreedSelect id="adopt-breed" type={form.type} value={form.breed} onChange={(breed) => setForm((prev) => ({ ...prev, breed }))} />

          <label htmlFor="adopt-desc">{t('adoption_description_label')}</label>
          <FieldHint mn="Зан ааш, вакцин, ариутгал, эрүүл мэнд болон шинэ эзэнд тавих нөхцөлийг бичнэ. Заавал бөглөнө." en="Describe temperament, vaccination, neutering, health and adopter requirements. Required." />
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
          <FieldHint mn="Гэрийн нарийн хаяг биш, уулзаж болох хороо эсвэл танигдах газрын нэр бичнэ." en="Enter a khoroo or public landmark, not a precise home address." />
          <input id="adopt-place" name="place" value={form.place} onChange={handleChange} placeholder={t('adoption_place_placeholder')} required />

          <label htmlFor="adopt-phone">{t('phone_label')}</label>
          <FieldHint mn="Холбогдох боломжтой 8 оронтой Монгол утасны дугаар оруулна." en="Enter a reachable 8-digit Mongolian phone number." />
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

          <Button type="submit" disabled={submit.submitting} variant="primary" fullWidth className="form-submit" aria-busy={submit.submitting}>
            {submit.submitting ? submit.statusMsg || t('submitting') : t('adoption_submit')}
          </Button>
        </>
      )}

      <div className="nav-row">
        {step > 0 && (
          <Button type="button" onClick={() => setStep(step - 1)} variant="secondary" style={{ flex: 1 }}>{t('form_back')}</Button>
        )}
        {step < STEPS.length - 1 && (
          <Button
            type="button"
            onClick={() => canNext && setStep(step + 1)}
            disabled={!canNext}
            variant="accent"
            style={{ flex: 1 }}
          >
            {t('form_next')}
          </Button>
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
        photoPreview={photo.previews[0] ?? null}
      />
    </div>

      <style jsx>{`
        .form-layout { display: flex; gap: var(--sp-5); align-items: flex-start; }
        @media (max-width: 860px) { .form-layout { gap: 0; } }
        @media (min-width: 1200px) { .form-layout { gap: var(--sp-8); } }
        .preview-col { display: none; position: sticky; top: 100px; }
        @media (min-width: 860px) { .preview-col { display: block; } }
        .pet-form {
          display: flex; flex-direction: column; gap: var(--sp-1); max-width: 440px; flex: 1; min-width: 0;
          background: var(--card); border: 1px solid var(--line); border-radius: var(--r-xl);
          padding: var(--sp-6); box-shadow: var(--shadow-md);
        }
        @media (min-width: 1025px) { .pet-form { max-width: 520px; padding: var(--sp-7); } }
        @media (max-width: 640px) { .pet-form { padding: var(--sp-5); border-radius: var(--r-lg); max-width: 100%; } }
        @media (max-width: 480px) { .pet-form { padding: var(--sp-4); border-radius: var(--r-md); } }
        label { font-size: 12.5px; font-weight: 600; color: var(--primary); margin-top: var(--sp-4); display: block; letter-spacing: 0.01em; }
        .photo-help { margin: 4px 0 8px; color: var(--muted); font-size: 12px; line-height: 1.5; }
        label:first-child { margin-top: 0; }
        @media (max-width: 480px) { label { font-size: 13px; margin-top: var(--sp-3); } }
        @media (min-width: 1025px) { label { font-size: 13.5px; margin-top: var(--sp-5); } }
        input, select, textarea {
          padding: var(--sp-2) var(--sp-3); border: 1.5px solid var(--line); border-radius: var(--r-sm);
          font-size: var(--text-base); width: 100%; font-family: var(--font-body); background: var(--card); color: var(--ink);
          transition: border-color 0.15s ease; min-height: var(--touch-target);
        }
        @media (max-width: 480px) { input, select, textarea { font-size: 16px; padding: 12px 14px; } }
        @media (min-width: 1025px) { input, select, textarea { font-size: 15px; padding: 12px 16px; } }
        input:hover, select:hover, textarea:hover { border-color: var(--muted); }
        input:focus-visible, select:focus-visible, textarea:focus-visible {
          outline: none; border-color: var(--accent);
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 15%, transparent);
        }
        textarea { resize: vertical; min-height: 80px; }
        .upload-zone {
          border: 1.5px dashed var(--line); border-radius: var(--r-md); padding: 28px 20px;
          text-align: center; cursor: pointer; color: var(--muted); background: var(--overcast);
          transition: border-color 0.15s ease, background 0.15s ease; min-height: var(--touch-target);
          display: flex; align-items: center; justify-content: center;
        }
        .photo-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-top: 10px; }
        .photo-item { position: relative; aspect-ratio: 1; overflow: hidden; border-radius: var(--r-sm); border: 1px solid var(--line); background: var(--overcast); }
        .photo-item img { width: 100%; height: 100%; object-fit: cover; }
        .photo-item button { position: absolute; top: 5px; right: 5px; width: 28px; height: 28px; min-height: 0; padding: 0; border: 0; border-radius: 50%; background: rgba(15,20,35,.75); color: #fff; font-size: 20px; line-height: 1; cursor: pointer; }
        .cover-badge { position: absolute; left: 5px; bottom: 5px; padding: 3px 6px; border-radius: var(--r-pill); background: var(--primary); color: #fff; font-size: 9px; font-weight: 700; }
        @media (max-width: 480px) { .photo-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 480px) { .upload-zone { padding: 24px 16px; } }
        @media (min-width: 1025px) { .upload-zone { padding: 32px 24px; } }
        .upload-zone:hover { border-color: var(--accent); background: var(--eyebrow-bg); }
        .upload-zone:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
        .upload-zone img { max-width: 150px; border-radius: var(--r-sm); }
        @media (min-width: 1025px) { .upload-zone img { max-width: 180px; } }
        .form-submit { margin-top: var(--sp-5); }
        @media (max-width: 480px) { .form-submit { margin-top: var(--sp-4); } }
        @media (min-width: 1025px) { .form-submit { margin-top: var(--sp-6); } }
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
        .nav-row :global(.btn-base) { flex: 1; justify-content: center; }
      `}</style>
    </div>
  );
}
