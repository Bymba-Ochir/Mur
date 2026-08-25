'use client';
import { useState } from 'react';
import type { ChangeEvent, KeyboardEvent } from 'react';
import { DISTRICTS } from '../lib/districts';
import { useLanguage } from '../lib/i18n';
import Button from './ui/Button';
import ShareButtons from './ShareButtons';
import LocationMap from './LocationMap';
import PetPreviewCard from './PetPreviewCard';
import PawTrail from './PawTrail';
import { usePhotoUpload, usePetLocation, usePetSubmit, TYPE_VALUES } from '../lib/usePetForm';
import type { PetFormData } from '../lib/usePetForm';
import type { PetStatus, PetType } from '../lib/types';
import { normalizePhone, formatPhone } from '../lib/utils';
import BreedSelect from './BreedSelect';
import FieldHint from './ui/FieldHint';

export default function PetForm({ status }: { status: PetStatus }) {
  const { t } = useLanguage();
  const STEPS = [t('form_step_photo'), t('form_step_info'), t('form_step_location'), t('form_step_contact')];
  const TYPE_LABELS: Record<PetType, string> = { 'Нохой': t('type_dog'), 'Муур': t('type_cat'), 'Бусад': t('type_other') };
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<PetFormData>({
    name: '', type: 'Нохой', breed: '', color: '', place: '', district: DISTRICTS[0], phone: '', hasReward: false, reward: '',
  });

  const photo = usePhotoUpload();
  const location = usePetLocation((d) => setForm((f) => ({ ...f, district: d })));

  // Амжилттай хадгалагдсаны дараа бүх форм төлөвийг цэвэрлэнэ
  function resetAll() {
    setForm({ name: '', type: 'Нохой', breed: '', color: '', place: '', district: DISTRICTS[0], phone: '', hasReward: false, reward: '' });
    setStep(0);
    photo.reset();
    location.reset();
  }

  const submit = usePetSubmit({
    status,
    form,
    photoFiles: photo.photoFiles,
    coords: location.coords,
    onSuccess: resetAll,
  });

  function handleChange(e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    // DOM нь сонголтын утгыг хязгаарладаг тул ганц cast энд л хангалттай
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }) as PetFormData);
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
    !!form.color,
    !!form.place,
    true,
  ][step];

  if (submit.done) {
    const petUrl = typeof window !== 'undefined' ? `${window.location.origin}/pets/${submit.newPetId}` : '';
    return (
      <div className="rounded-[var(--r-lg)] border border-[color-mix(in_srgb,var(--success)_30%,transparent)] bg-[var(--success-bg)] p-[var(--sp-6)] text-center max-[480px]:p-[var(--sp-5)] min-[1025px]:p-[var(--sp-7)]" role="status">
        <p>{t('success_msg')}</p>
        <ShareButtons url={petUrl} title={status === 'lost' ? 'Алдсан амьтан' : 'Олдсон амьтан'} />
        <Button variant="secondary" onClick={addAnother} className="mt-4">{t('add_another')}</Button>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-[var(--sp-5)] max-[860px]:gap-0 min-[1200px]:gap-[var(--sp-8)]">
    <form onSubmit={submit.handleSubmit} className="flex min-w-0 max-w-[440px] flex-1 flex-col gap-[var(--sp-1)] rounded-[var(--r-xl)] border border-[var(--line)] bg-[var(--card)] p-[var(--sp-6)] shadow-[var(--shadow-md)] [&_label]:mt-[var(--sp-4)] [&_label]:block [&_label]:text-[12.5px] [&_label]:font-semibold [&_label]:tracking-[0.01em] [&_label]:text-[var(--primary)] [&_input:not([type='checkbox']):not([type='file'])]:min-h-[var(--touch-target)] [&_input:not([type='checkbox']):not([type='file'])]:w-full [&_input:not([type='checkbox']):not([type='file'])]:rounded-[var(--r-sm)] [&_input:not([type='checkbox']):not([type='file'])]:border-[1.5px] [&_input:not([type='checkbox']):not([type='file'])]:border-[var(--line)] [&_input:not([type='checkbox']):not([type='file'])]:bg-[var(--card)] [&_input:not([type='checkbox']):not([type='file'])]:px-[var(--sp-3)] [&_input:not([type='checkbox']):not([type='file'])]:py-[var(--sp-2)] [&_input:not([type='checkbox']):not([type='file'])]:font-[family-name:var(--font-body)] [&_input:not([type='checkbox']):not([type='file'])]:text-[length:var(--text-base)] [&_input:not([type='checkbox']):not([type='file'])]:text-[var(--ink)] [&_select]:min-h-[var(--touch-target)] [&_select]:w-full [&_select]:rounded-[var(--r-sm)] [&_select]:border-[1.5px] [&_select]:border-[var(--line)] [&_select]:bg-[var(--card)] [&_select]:px-[var(--sp-3)] [&_select]:py-[var(--sp-2)] [&_select]:font-[family-name:var(--font-body)] [&_select]:text-[length:var(--text-base)] [&_select]:text-[var(--ink)] max-sm:max-w-full max-sm:rounded-[var(--r-lg)] max-sm:p-[var(--sp-5)] max-[480px]:rounded-[var(--r-md)] max-[480px]:p-[var(--sp-4)] max-[480px]:[&_label]:mt-[var(--sp-3)] max-[480px]:[&_label]:text-[13px] min-[1025px]:max-w-[520px] min-[1025px]:p-[var(--sp-7)] min-[1025px]:[&_label]:mt-[var(--sp-5)] min-[1025px]:[&_label]:text-[13.5px]" aria-label={status === 'lost' ? 'Алдсан амьтан мэдэгдэх форм' : 'Олдсон амьтан мэдэгдэх форм'}>
      <PawTrail labels={STEPS} current={step} />
      <p className="mt-[var(--sp-2)] mb-[var(--sp-5)] text-center font-[family-name:var(--font-mono)] text-[11.5px] tracking-[0.02em] text-[var(--muted)] max-[480px]:mb-[var(--sp-4)] max-[480px]:text-xs min-[1025px]:mt-[var(--sp-3)] min-[1025px]:mb-[var(--sp-6)] min-[1025px]:text-[12.5px]" aria-live="polite">{step + 1}/{STEPS.length}: {STEPS[step]}</p>

      {step === 0 && (
        <>
          <label id="photo-label">{t('photo_label')}</label>
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
              <span role="status">⏳ {photo.compressStatus || 'Зураг оновчлож байна...'}</span>
            ) : photo.previews.length ? (
              <div className="grid size-full grid-cols-2 gap-2 p-2">
                {photo.previews.map((preview, index) => <div key={preview} className="relative min-h-[110px] overflow-hidden rounded-[var(--r-sm)] bg-[var(--surface-3)]">
                  {/* Blob preview-г next/image оновчлох шаардлагагүй. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img className="size-full object-cover" src={preview} alt={`${t('photo_preview_alt')} ${index + 1}`} />
                  <span className="absolute bottom-[7px] left-[7px] min-w-6 rounded-full bg-[rgba(10,14,28,.66)] px-1.5 py-[3px] text-[11px] font-extrabold text-white">{index + 1}</span>
                  <button className="absolute top-1.5 right-1.5 size-7 cursor-pointer rounded-full border-0 bg-[rgba(10,14,28,.72)] text-xl leading-none text-white" type="button" onClick={(event) => { event.stopPropagation(); photo.removePhoto(index); }} aria-label={`${index + 1}-р зургийг хасах`}>×</button>
                </div>)}
              </div>
              ) : (
              <span id="photo-hint">{t('photo_hint')}</span>
            )}
          </div>
          <div className="mt-[var(--sp-3)] rounded-[var(--r-md)] border border-[var(--line)] bg-[var(--eyebrow-bg)] px-3.5 py-2.5 text-[12.5px] text-[var(--muted)] max-[480px]:px-4 max-[480px]:py-3 max-[480px]:text-[13px] min-[1025px]:px-[18px] min-[1025px]:py-3.5 min-[1025px]:text-[13px]" role="note">
            <p className="mt-0 mb-1.5 text-[12.5px] font-bold text-[var(--primary)] max-[480px]:text-[13px] min-[1025px]:text-[13.5px]">{t('photo_requirements_title')}</p>
            <ul className="m-0 flex flex-col gap-[3px] pl-[18px] [&_li]:m-0 [&_li]:leading-[1.4]">
              <li>{t('photo_quality_bright')}</li>
              <li>{t('photo_quality_close')}</li>
            </ul>
            <p className="mt-2 mb-0 text-xs">{t('photo_quality_match')}</p>
          </div>
          <input
            id="photo-input" type="file" accept="image/*" multiple onChange={photo.handlePhoto}
            className="hidden" disabled={photo.compressing}
            aria-label={t('photo_label')}
          />
          <FieldHint mn="1–4 зураг сонгоно. Нүүр, бүтэн бие, онцлог шинж болон сүүлд харагдсан орчны зургийг оруулбал танихад хялбар." en="Choose 1–4 photos: face, full body, distinctive markings, and the last-seen area." />
        </>
      )}

      {step === 1 && (
        <>
          <label htmlFor="pet-name">{t('name_label')}</label>
          <FieldHint mn="Хүзүүвч дээр нэр байсан эсвэл нэрийг нь мэддэг бол бичнэ. Заавал биш." en="Enter the name only when known or shown on a tag. Optional." />
          <input id="pet-name" name="name" value={form.name} onChange={handleChange} placeholder={t('name_placeholder')} />

          <label htmlFor="pet-type">{t('type_label')}</label>
          <select id="pet-type" name="type" value={form.type} onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value as PetType, breed: '' }))}>
            {TYPE_VALUES.map((v) => <option key={v} value={v}>{TYPE_LABELS[v]}</option>)}
          </select>

          <label htmlFor="pet-breed">{t('breed_label')}</label>
          <FieldHint mn="Эргэлзэж байвал “Тодорхойгүй” эсвэл “Холимог үүлдэр” сонгоно." en="Choose Unknown or Mixed breed when unsure." />
          <BreedSelect id="pet-breed" type={form.type} value={form.breed} onChange={(breed) => setForm((prev) => ({ ...prev, breed }))} />

          <label htmlFor="pet-color">{t('color_label')}</label>
          <FieldHint mn="Үндсэн өнгө болон ялгарах шинжийг бичнэ. Жишээ: хар, цээж цагаан." en="Describe the main color and distinctive markings, e.g. black with a white chest." />
          <input id="pet-color" name="color" value={form.color} onChange={handleChange} placeholder={t('color_placeholder')} required />
        </>
      )}

      {step === 2 && (
        <>
          <button type="button" onClick={location.handleUseLocation} disabled={location.locating} className="mb-[var(--sp-3)] min-h-[var(--touch-target)] cursor-pointer rounded-[var(--r-pill)] border-[1.5px] border-[var(--primary)] bg-transparent px-[15px] py-2.5 text-[13px] font-semibold text-[var(--primary)] transition-colors hover:bg-[var(--eyebrow-bg)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] disabled:opacity-60 max-[480px]:w-full max-[480px]:px-5 max-[480px]:py-3 max-[480px]:text-sm min-[1025px]:mb-[var(--sp-4)] min-[1025px]:px-6 min-[1025px]:py-3 min-[1025px]:text-sm">
            {location.locating ? t('locate_loading') : t('locate_btn')}
          </button>

          <label htmlFor="pet-district">{t('district_label')}</label>
          <select id="pet-district" name="district" value={form.district} onChange={handleChange}>
            {DISTRICTS.map((d) => <option key={d}>{d}</option>)}
          </select>

          <label htmlFor="pet-place">{status === 'lost' ? t('place_label_lost') : t('place_label_found')}</label>
          <FieldHint mn="Хороо, гудамж, дэлгүүр зэрэг хүн танихуйц ойролцоо газрыг бичнэ." en="Enter a recognizable nearby khoroo, street or landmark." />
          <input id="pet-place" name="place" value={form.place} onChange={handleChange} placeholder={t('place_placeholder')} required />

          <label id="map-label">
            {t('map_label')} <span className="font-normal text-[var(--muted)]">{t('map_optional')}</span>
          </label>
          <div aria-labelledby="map-label" role="application" aria-label={t('map_label')}>
            <LocationMap lat={location.coords?.lat} lng={location.coords?.lng} editable onPick={location.setCoords} />
          </div>
          {location.coords && (
            <p className="mt-1 text-xs text-[var(--muted)]" aria-live="polite">
              📍 {location.coords.lat.toFixed(4)}, {location.coords.lng.toFixed(4)}
            </p>
          )}
        </>
      )}

      {step === 3 && (
        <>
          {status === 'lost' && (
            <>
              <label className="flex min-h-[var(--touch-target)] cursor-pointer items-center gap-2 text-[13px] font-semibold tracking-normal text-[var(--primary)] max-[480px]:gap-2.5 max-[480px]:text-sm min-[1025px]:gap-3 min-[1025px]:text-sm" htmlFor="pet-has-reward">
                <input
                  id="pet-has-reward" type="checkbox"
                  checked={form.hasReward}
                  className="m-0 w-auto accent-[var(--accent)]"
                  onChange={(e) => setForm((f) => ({ ...f, hasReward: e.target.checked }))}
                />
                <span>🎁 {t('reward_label')}</span>
              </label>
              {form.hasReward && (
                <>
                  <label htmlFor="pet-reward">{t('reward_amount_label')}</label>
                  <input
                    id="pet-reward" name="reward" inputMode="numeric" pattern="[0-9]*"
                    value={form.reward} onChange={handleChange} placeholder={t('reward_placeholder')}
                  />
                </>
              )}
            </>
          )}
          <label htmlFor="pet-phone">{t('phone_label')}</label>
          <FieldHint mn="Зарын эзэнтэй шууд холбогдох 8 оронтой дугаар. Нийтэд бүтнээр нь шууд харуулахгүй." en="An 8-digit contact number. It is masked until a viewer chooses to reveal it." />
          <input
            id="pet-phone"
            name="phone"
            value={formatPhone(form.phone)}
            onChange={(e) => setForm((f) => ({ ...f, phone: normalizePhone(e.target.value) }))}
            placeholder={t('phone_placeholder')}
            required
            inputMode="tel"
          />

          {submit.error && <p className="mt-[var(--sp-2)] text-[13px] text-[var(--alert)] max-[480px]:text-sm" role="alert">{submit.error}</p>}

          <Button type="submit" disabled={submit.submitting} variant="primary" fullWidth className="mt-[var(--sp-5)] max-[480px]:mt-[var(--sp-4)] min-[1025px]:mt-[var(--sp-6)]" aria-busy={submit.submitting}>
            {submit.submitting ? submit.statusMsg || t('submitting') : status === 'lost' ? t('submit_lost') : t('submit_found')}
          </Button>

          {submit.submitting && submit.statusMsg.includes('AI') && (
            <p className="mt-1.5 text-xs text-[var(--muted)]" aria-live="polite">
              Анхны хүсэлт 10-30 секунд удааширч болно, түр хүлээгээрэй...
            </p>
          )}
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
      <PetPreviewCard
        status={status}
        name={form.name}
        type={form.type}
        breed={form.breed}
        color={form.color}
        district={form.district}
        place={form.place}
        phone={formatPhone(form.phone)}
        photoPreview={photo.preview}
        hasReward={form.hasReward}
      />
    </div>
    </div>
  );
}
