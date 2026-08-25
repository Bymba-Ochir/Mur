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
      <div className="rounded-[var(--r-lg)] border border-[color-mix(in_srgb,var(--success)_30%,transparent)] bg-[var(--success-bg)] p-[var(--sp-6)] text-center max-[480px]:p-[var(--sp-5)] min-[1025px]:p-[var(--sp-7)]" role="status">
        <p>{t('adoption_success_msg')}</p>
        <ShareButtons url={adoptionUrl} title="Үрчлүүлэх амьтан" />
        <Button variant="secondary" onClick={addAnother} className="mt-4">{t('add_another')}</Button>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-[var(--sp-5)] max-[860px]:gap-0 min-[1200px]:gap-[var(--sp-8)]">
    <form onSubmit={submit.handleSubmit} className="flex min-w-0 max-w-[440px] flex-1 flex-col gap-[var(--sp-1)] rounded-[var(--r-xl)] border border-[var(--line)] bg-[var(--card)] p-[var(--sp-6)] shadow-[var(--shadow-md)] [&_label]:mt-[var(--sp-4)] [&_label]:block [&_label]:text-[12.5px] [&_label]:font-semibold [&_label]:tracking-[0.01em] [&_label]:text-[var(--primary)] [&_input:not([type='file'])]:min-h-[var(--touch-target)] [&_input:not([type='file'])]:w-full [&_input:not([type='file'])]:rounded-[var(--r-sm)] [&_input:not([type='file'])]:border-[1.5px] [&_input:not([type='file'])]:border-[var(--line)] [&_input:not([type='file'])]:bg-[var(--card)] [&_input:not([type='file'])]:px-[var(--sp-3)] [&_input:not([type='file'])]:py-[var(--sp-2)] [&_input:not([type='file'])]:font-[family-name:var(--font-body)] [&_input:not([type='file'])]:text-[length:var(--text-base)] [&_input:not([type='file'])]:text-[var(--ink)] [&_select]:min-h-[var(--touch-target)] [&_select]:w-full [&_select]:rounded-[var(--r-sm)] [&_select]:border-[1.5px] [&_select]:border-[var(--line)] [&_select]:bg-[var(--card)] [&_select]:px-[var(--sp-3)] [&_select]:py-[var(--sp-2)] [&_select]:font-[family-name:var(--font-body)] [&_select]:text-[length:var(--text-base)] [&_select]:text-[var(--ink)] [&_textarea]:min-h-20 [&_textarea]:w-full [&_textarea]:resize-y [&_textarea]:rounded-[var(--r-sm)] [&_textarea]:border-[1.5px] [&_textarea]:border-[var(--line)] [&_textarea]:bg-[var(--card)] [&_textarea]:px-[var(--sp-3)] [&_textarea]:py-[var(--sp-2)] [&_textarea]:font-[family-name:var(--font-body)] [&_textarea]:text-[length:var(--text-base)] [&_textarea]:text-[var(--ink)] max-sm:max-w-full max-sm:rounded-[var(--r-lg)] max-sm:p-[var(--sp-5)] max-[480px]:rounded-[var(--r-md)] max-[480px]:p-[var(--sp-4)] max-[480px]:[&_label]:mt-[var(--sp-3)] max-[480px]:[&_label]:text-[13px] min-[1025px]:max-w-[520px] min-[1025px]:p-[var(--sp-7)] min-[1025px]:[&_label]:mt-[var(--sp-5)] min-[1025px]:[&_label]:text-[13.5px]" aria-label="Үрчлүүлэх амьтан зар үүсгэх форм">
      <PawTrail labels={STEPS} current={step} />
      <p className="mt-[var(--sp-2)] mb-[var(--sp-5)] text-center font-[family-name:var(--font-mono)] text-[11.5px] tracking-[0.02em] text-[var(--muted)] max-[480px]:mb-[var(--sp-4)] max-[480px]:text-xs min-[1025px]:mt-[var(--sp-3)] min-[1025px]:mb-[var(--sp-6)] min-[1025px]:text-[12.5px]" aria-live="polite">{step + 1}/{STEPS.length}: {STEPS[step]}</p>

      {step === 0 && (
        <>
          <label id="photo-label">Зураг оруулах</label>
          <p id="photo-hint" className="mt-1 mb-2 text-xs leading-[1.5] text-[var(--muted)]">Дээд тал нь 4 зураг оруулах боломжтой · JPG, PNG эсвэл WebP</p>
          <div
            className="flex min-h-[var(--touch-target)] cursor-pointer items-center justify-center rounded-[var(--r-md)] border-[1.5px] border-dashed border-[var(--line)] bg-[var(--overcast)] px-5 py-7 text-center text-[var(--muted)] transition-[border-color,background-color] hover:border-[var(--accent)] hover:bg-[var(--eyebrow-bg)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] max-[480px]:px-4 max-[480px]:py-6 min-[1025px]:px-6 min-[1025px]:py-8"
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
            <div className="mt-2.5 grid grid-cols-4 gap-2 max-[480px]:grid-cols-2" aria-label="Сонгосон зургууд">
              {photo.previews.map((preview, index) => (
                <div className="relative aspect-square overflow-hidden rounded-[var(--r-sm)] border border-[var(--line)] bg-[var(--overcast)]" key={preview}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img className="size-full object-cover" src={preview} alt={`Сонгосон ${index + 1}-р зураг`} />
                  {index === 0 && <span className="absolute bottom-[5px] left-[5px] rounded-[var(--r-pill)] bg-[var(--primary)] px-1.5 py-[3px] text-[9px] font-bold text-white">Нүүр зураг</span>}
                  <button className="absolute top-[5px] right-[5px] size-7 min-h-0 cursor-pointer rounded-full border-0 bg-[rgba(15,20,35,.75)] p-0 text-xl leading-none text-white" type="button" aria-label={`${index + 1}-р зургийг устгах`} onClick={() => photo.removePhoto(index)}>×</button>
                </div>
              ))}
            </div>
          )}
          <input
            id="adoption-photo-input" type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={photo.handlePhoto}
            className="hidden" disabled={photo.compressing || photo.photoFiles.length >= 4}
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

          {submit.error && <p className="mt-[var(--sp-2)] text-[13px] text-[var(--alert)] max-[480px]:text-sm" role="alert">{submit.error}</p>}

          <Button type="submit" disabled={submit.submitting} variant="primary" fullWidth className="mt-[var(--sp-5)] max-[480px]:mt-[var(--sp-4)] min-[1025px]:mt-[var(--sp-6)]" aria-busy={submit.submitting}>
            {submit.submitting ? submit.statusMsg || t('submitting') : t('adoption_submit')}
          </Button>
        </>
      )}

      <div className="mt-[var(--sp-5)] flex gap-2.5 [&_.btn-base]:flex-1 [&_.btn-base]:justify-center max-[480px]:mt-[var(--sp-4)] max-[480px]:gap-3 min-[1025px]:mt-[var(--sp-6)] min-[1025px]:gap-3.5">
        {step > 0 && (
          <Button type="button" onClick={() => setStep(step - 1)} variant="secondary" className="flex-1">{t('form_back')}</Button>
        )}
        {step < STEPS.length - 1 && (
          <Button
            type="button"
            onClick={() => canNext && setStep(step + 1)}
            disabled={!canNext}
            variant="accent"
            className="flex-1"
          >
            {t('form_next')}
          </Button>
        )}
      </div>
    </form>

    <div className="sticky top-[100px] hidden min-[860px]:block">
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
    </div>
  );
}
