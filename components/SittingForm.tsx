'use client';
import { useState } from 'react';
import Image from 'next/image';
import type { ChangeEvent, FormEvent, KeyboardEvent } from 'react';
import { DISTRICTS } from '../lib/districts';
import { useLanguage } from '../lib/i18n';
import Button from './ui/Button';
import ShareButtons from './ShareButtons';
import FieldHint from './ui/FieldHint';
import SittingCardView from './SittingCardView';
import PawTrail from './PawTrail';
import LocationMap from './LocationMap';
import { usePetLocation } from '../lib/usePetForm';
import { compressImage } from '../lib/imageCompress';
import { createSittingListing } from '../lib/sittingService';
import { useToast } from './Toast';
import { normalizePhone, formatPhone, getErrorMessage } from '../lib/utils';
import type { SittingPetType } from '../lib/types';
import type { District } from '../lib/districts';

const PET_TYPE_VALUES: SittingPetType[] = ['Нохой', 'Муур', 'Бусад', 'Бүгд'];

export default function SittingForm() {
  const { t } = useLanguage();
  const showToast = useToast();
  const STEPS = [t('sitting_form_step_photo'), t('sitting_form_step_info'), t('sitting_form_step_contact')];

  const [step, setStep] = useState(0);
  const [petType, setPetType] = useState<SittingPetType>('Нохой');
  const [description, setDescription] = useState('');
  const [experience, setExperience] = useState('');
  const [availability, setAvailability] = useState('');
  const [price, setPrice] = useState('');
  const [district, setDistrict] = useState<District>(DISTRICTS[0]);
  const [place, setPlace] = useState('');
  const [phone, setPhone] = useState('');

  // Газрын зураг дээр байршил тэмдэглэх + geolocation товч (дүүрэг автоматаар таамаглана)
  const location = usePetLocation((d) => setDistrict(d));

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [compressing, setCompressing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [done, setDone] = useState(false);
  const [newId, setNewId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handlePhoto(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCompressing(true);
    try {
      const compressed = await compressImage(file);
      setPhotoFile(compressed);
      setPhotoPreview(URL.createObjectURL(compressed));
    } catch {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    } finally {
      setCompressing(false);
    }
  }

  function handleUploadKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      document.getElementById('sitting-photo-input')?.click();
    }
  }

  function resetAll() {
    setStep(0); setPetType('Нохой'); setDescription(''); setExperience('');
    setAvailability(''); setPrice(''); setDistrict(DISTRICTS[0]); setPlace(''); setPhone('');
    setPhotoFile(null); setPhotoPreview(null); setDone(false); setNewId(null); setError(null);
    location.reset();
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setStatusMsg(t('submitting'));
    try {
      const id = await createSittingListing({
        petType, description, district, place, experience, availability,
        phone: normalizePhone(phone),
        price: price ? Number(price) : null,
        photoFile,
        lat: location.coords?.lat ?? null,
        lng: location.coords?.lng ?? null,
      });
      setNewId(id); setDone(true); resetAll();
    } catch (err) {
      setError(getErrorMessage(err) || 'Алдаа гарлаа.');
    } finally {
      setSubmitting(false); setStatusMsg('');
    }
  }

  const canNext = [true, !!description, !!place && normalizePhone(phone).length === 8][step];

  if (done && newId) {
    const url = typeof window !== 'undefined' ? `${window.location.origin}/sitting/${newId}` : '';
    return (
      <div className="rounded-[var(--r-lg)] border border-[color-mix(in_srgb,var(--success)_30%,transparent)] bg-[var(--success-bg)] p-[var(--sp-6)] text-center" role="status">
        <p>{t('sitting_success_msg')}</p>
        <ShareButtons url={url} title="Асрах үйлчилгээ" />
        <Button variant="secondary" onClick={() => { setDone(false); setNewId(null); }} className="mt-4">{t('add_another')}</Button>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-[var(--sp-5)] max-[860px]:gap-0 min-[1200px]:gap-[var(--sp-8)]">
      <form onSubmit={handleSubmit} className="flex min-w-0 max-w-[440px] flex-1 flex-col gap-[var(--sp-1)] rounded-[var(--r-xl)] border border-[var(--line)] bg-[var(--card)] p-[var(--sp-6)] shadow-[var(--shadow-md)] [&_label]:mt-[var(--sp-4)] [&_label]:block [&_label]:text-[12.5px] [&_label]:font-semibold [&_label]:text-[var(--primary)] [&_input:not([type='file'])]:min-h-[var(--touch-target)] [&_input:not([type='file'])]:w-full [&_input:not([type='file'])]:rounded-[var(--r-sm)] [&_input:not([type='file'])]:border-[1.5px] [&_input:not([type='file'])]:border-[var(--line)] [&_input:not([type='file'])]:bg-[var(--card)] [&_input:not([type='file'])]:px-[var(--sp-3)] [&_input:not([type='file'])]:py-[var(--sp-2)] [&_input:not([type='file'])]:font-[family-name:var(--font-body)] [&_input:not([type='file'])]:text-[length:var(--text-base)] [&_input:not([type='file'])]:text-[var(--ink)] [&_select]:min-h-[var(--touch-target)] [&_select]:w-full [&_select]:rounded-[var(--r-sm)] [&_select]:border-[1.5px] [&_select]:border-[var(--line)] [&_select]:bg-[var(--card)] [&_select]:px-[var(--sp-3)] [&_select]:py-[var(--sp-2)] [&_select]:font-[family-name:var(--font-body)] [&_select]:text-[length:var(--text-base)] [&_select]:text-[var(--ink)] [&_textarea]:min-h-20 [&_textarea]:w-full [&_textarea]:resize-y [&_textarea]:rounded-[var(--r-sm)] [&_textarea]:border-[1.5px] [&_textarea]:border-[var(--line)] [&_textarea]:bg-[var(--card)] [&_textarea]:px-[var(--sp-3)] [&_textarea]:py-[var(--sp-2)] [&_textarea]:font-[family-name:var(--font-body)] [&_textarea]:text-[length:var(--text-base)] [&_textarea]:text-[var(--ink)] max-sm:max-w-full max-sm:rounded-[var(--r-lg)] max-sm:p-[var(--sp-5)] max-[480px]:rounded-[var(--r-md)] max-[480px]:p-[var(--sp-4)] min-[1025px]:max-w-[520px] min-[1025px]:p-[var(--sp-7)]" aria-label="Асрах зар нэмэх">
        <PawTrail labels={STEPS} current={step} />
        <p className="mt-[var(--sp-2)] mb-[var(--sp-5)] text-center font-[family-name:var(--font-mono)] text-[11.5px] text-[var(--muted)]" aria-live="polite">{step + 1}/{STEPS.length}: {STEPS[step]}</p>

        {step === 0 && (
          <>
            <label id="photo-label">{t('photo_label')}</label>
            <FieldHint mn="Өөрийн зураг эсвэл асарч байсан амьтантай зургаа оруулж болно. Заавал биш." en="You may add a photo of yourself or a pet you have cared for. Optional." />
            <div className="flex min-h-[var(--touch-target)] cursor-pointer items-center justify-center rounded-[var(--r-md)] border-[1.5px] border-dashed border-[var(--line)] bg-[var(--overcast)] px-5 py-7 text-center text-[var(--muted)] transition-colors hover:border-[var(--accent)] hover:bg-[var(--eyebrow-bg)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] [&_img]:max-w-[150px] [&_img]:rounded-[var(--r-sm)]" onClick={() => document.getElementById('sitting-photo-input')?.click()} onKeyDown={handleUploadKeyDown} role="button" tabIndex={0} aria-labelledby="photo-label">
              {compressing ? <span>⏳ Зураг оновчлож байна...</span> : photoPreview ? (
                <Image src={photoPreview} alt={t('photo_preview_alt')} width={640} height={420} unoptimized />
              ) : <span>{t('photo_hint')}</span>}
            </div>
            <input id="sitting-photo-input" type="file" accept="image/*" onChange={handlePhoto} className="hidden" />
          </>
        )}

        {step === 1 && (
          <>
            <label htmlFor="s-type">{t('sitting_pet_type_label')}</label>
            <select id="s-type" value={petType} onChange={(e) => setPetType(e.target.value as SittingPetType)}>
              <option value="Нохой">{t('type_dog')}</option>
              <option value="Муур">{t('type_cat')}</option>
              <option value="Бусад">{t('type_other')}</option>
              <option value="Бүгд">{t('sitting_pet_type_all')}</option>
            </select>
            <label htmlFor="s-desc">{t('sitting_description_label')}</label>
            <FieldHint mn="Ямар үйлчилгээ үзүүлэх, хаана асрах болон таны давуу талыг тодорхой бичнэ." en="Explain the service, where care is provided and what you offer." />
            <textarea id="s-desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder={t('sitting_description_placeholder')} required />
            <label htmlFor="s-exp">{t('sitting_experience_label')}</label>
            <FieldHint mn="Хэдэн жил, ямар төрлийн амьтан асарч байсан туршлагаа бичнэ. Заавал биш." en="Describe years and types of pet-care experience. Optional." />
            <input id="s-exp" value={experience} onChange={(e) => setExperience(e.target.value)} placeholder={t('sitting_experience_placeholder')} />
            <label htmlFor="s-avail">{t('sitting_availability_label')}</label>
            <FieldHint mn="Боломжтой өдөр, цагийг бичнэ. Жишээ: ажлын өдөр 18:00-аас хойш." en="Enter available days and times, e.g. weekdays after 18:00." />
            <input id="s-avail" value={availability} onChange={(e) => setAvailability(e.target.value)} placeholder={t('sitting_availability_placeholder')} />
            <label htmlFor="s-price">{t('sitting_price_label')}</label>
            <FieldHint mn="Нэг өдөр эсвэл нэг удаагийн үйлчилгээний үнийг төгрөгөөр оруулна." en="Enter the price in MNT per day or per service." />
            <input id="s-price" type="number" min="0" value={price} onChange={(e) => setPrice(e.target.value)} placeholder={t('sitting_price_placeholder')} />
          </>
        )}

        {step === 2 && (
          <>
            <label htmlFor="s-district">{t('district_label')}</label>
            <select id="s-district" value={district} onChange={(e) => setDistrict(e.target.value as District)}>
              {DISTRICTS.map((d) => <option key={d}>{d}</option>)}
            </select>
            <label htmlFor="s-place">{t('adoption_place_label')}</label>
            <FieldHint mn="Үйлчилгээ үзүүлэх боломжтой хороо эсвэл ойролцоо газрыг бичнэ." en="Enter the khoroo or nearby area where you can provide the service." />
            <input id="s-place" value={place} onChange={(e) => setPlace(e.target.value)} placeholder={t('adoption_place_placeholder')} required />

            <button type="button" onClick={location.handleUseLocation} disabled={location.locating} className="mt-[var(--sp-4)] min-h-[var(--touch-target)] w-full cursor-pointer rounded-[var(--r-sm)] border-[1.5px] border-[var(--line)] bg-[var(--eyebrow-bg)] px-[var(--sp-3)] py-[var(--sp-2)] font-[family-name:var(--font-body)] text-[length:var(--text-base)] font-semibold text-[var(--primary)] hover:border-[var(--accent)] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--accent)] disabled:cursor-default disabled:opacity-60">
              {location.locating ? t('locate_loading') : t('locate_btn')}
            </button>
            <label id="s-map-label">
              {t('map_label')} <span className="font-normal text-[var(--muted)]">{t('map_optional')}</span>
            </label>
            <div aria-labelledby="s-map-label" role="application" aria-label={t('map_label')}>
              <LocationMap lat={location.coords?.lat} lng={location.coords?.lng} editable onPick={location.setCoords} />
            </div>
            {location.coords && (
              <p className="mt-1 text-xs text-[var(--muted)]" aria-live="polite">
                {location.coords.lat.toFixed(4)}, {location.coords.lng.toFixed(4)}
              </p>
            )}

            <label htmlFor="s-phone">{t('phone_label')}</label>
            <FieldHint mn="Хэрэглэгч холбогдох боломжтой 8 оронтой утасны дугаар оруулна." en="Enter a reachable 8-digit Mongolian phone number." />
            <input id="s-phone" value={formatPhone(phone)} onChange={(e) => setPhone(normalizePhone(e.target.value))} placeholder={t('phone_placeholder')} required inputMode="tel" />
            {error && <p className="mt-[var(--sp-2)] text-[13px] text-[var(--alert)]" role="alert">{error}</p>}
            <Button type="submit" disabled={submitting} variant="primary" fullWidth className="mt-[var(--sp-5)]">
              {submitting ? statusMsg || t('submitting') : t('sitting_submit')}
            </Button>
          </>
        )}

        <div className="mt-[var(--sp-5)] flex gap-2.5 [&_.btn-base]:flex-1 [&_.btn-base]:justify-center">
          {step > 0 && <Button type="button" onClick={() => setStep(step - 1)} variant="secondary" className="flex-1">{t('form_back')}</Button>}
          {step < STEPS.length - 1 && (
            <Button type="button" onClick={() => canNext && setStep(step + 1)} disabled={!canNext} variant="accent" className="flex-1">{t('form_next')}</Button>
          )}
        </div>
      </form>

      <div className="sticky top-[100px] hidden min-[860px]:block">
        <SittingCardView
          badgeLabel={t('sitting_badge')}
          petType={petType}
          description={description}
          district={district}
          place={place}
          experience={experience}
          availability={availability}
          price={price ? Number(price) : null}
          phone={formatPhone(phone)}
          interactive={false}
          imageNode={photoPreview ? <Image src={photoPreview} alt="" width={640} height={420} unoptimized /> : undefined}
        />
      </div>
    </div>
  );
}
