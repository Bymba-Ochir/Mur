'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import type { ChangeEvent, FormEvent, KeyboardEvent } from 'react';
import { DISTRICTS } from '../lib/districts';
import { useLanguage } from '../lib/i18n';
import Button from './ui/Button';
import Icon from './ui/icons';
import ShareButtons from './ShareButtons';
import FieldHint from './ui/FieldHint';
import { useAuth } from '../lib/useAuth';
import LoginModal from './LoginModal';
import SittingCardView from './SittingCardView';
import PawTrail from './PawTrail';
import LocationMap from './LocationMap';
import { usePetLocation } from '../lib/usePetForm';
import { compressImage } from '../lib/imageCompress';
import { createSittingListing } from '../lib/sittingService';
import { normalizePhone, formatPhone, getErrorMessage } from '../lib/utils';
import type { SittingPetType } from '../lib/types';
import type { District } from '../lib/districts';

type FieldErrors = Partial<Record<'description' | 'place' | 'phone' | 'price', string>>;

export default function SittingForm() {
 const {user, loading} = useAuth(); const {t, lang} = useLanguage();
 const [login, setLogin] = useState(false);
 if (loading) return <div role="status" aria-busy="true">{t('detail_loading')}</div>;
 if (!user) return <section className="state-panel"><h2>{lang === 'mn' ? 'Зар оруулахын тулд нэвтэрнэ үү' : 'Sign in to create a listing'}</h2><Button onClick={()=>setLogin(true)}>{t('nav_login')}</Button>{login && <LoginModal onClose={()=>setLogin(false)} />}</section>;
 return <AuthenticatedSittingForm key={user.id} />;
}
function AuthenticatedSittingForm() {
  const { t, lang } = useLanguage();
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
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  useEffect(() => () => { if (photoPreview) URL.revokeObjectURL(photoPreview); }, [photoPreview]);

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
    setPhotoFile(null); setPhotoPreview(null); setError(null); setFieldErrors({});
    location.reset();
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const validation = validateStep(2);
    if (Object.keys(validation).length) { setFieldErrors(validation); return; }
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
      resetAll(); setNewId(id); setDone(true);
    } catch (err) {
      setError(getErrorMessage(err) || t('form_generic_error'));
    } finally {
      setSubmitting(false); setStatusMsg('');
    }
  }

  function validateStep(index: number): FieldErrors {
    const next: FieldErrors = {};
    if (index === 1) {
      if (!description.trim()) next.description = t('sitting_description_required');
      if (price && (Number(price) < 0 || Number(price) > 100000000)) next.price = t('sitting_price_invalid');
    }
    if (index === 2) {
      if (!place.trim()) next.place = t('sitting_place_required');
      if (normalizePhone(phone).length !== 8) next.phone = t('sitting_phone_invalid');
    }
    return next;
  }

  function goNext() {
    const validation = validateStep(step);
    setFieldErrors(validation);
    if (!Object.keys(validation).length) setStep((current) => current + 1);
  }

  function removePhoto() { setPhotoFile(null); setPhotoPreview(null); }

  if (done && newId) {
    const url = typeof window !== 'undefined' ? `${window.location.origin}/sitting/${newId}` : '';
    return (
      <div className="success-box" role="status">
        <p>{t('sitting_success_msg')}</p>
        <ShareButtons url={url} title={t('sitting_title')} />
        <div className="success-action"><Button variant="secondary" onClick={() => { setDone(false); setNewId(null); }}>{t('add_another')}</Button></div>
      </div>
    );
  }

  return (
    <div className="form-layout">
      <form onSubmit={handleSubmit} className="pet-form" aria-label={t('sitting_form_aria')} noValidate>
        <PawTrail labels={STEPS} current={step} />
        <p className="progress-text" aria-live="polite">{step + 1}/{STEPS.length}: {STEPS[step]}</p>

        {step === 0 && (
          <>
            <label id="photo-label">{t('sitting_photo_label')}</label>
            <p className="field-hint" id="sitting-photo-help">{t('sitting_photo_help')}</p>
            <div className="upload-zone" onClick={() => document.getElementById('sitting-photo-input')?.click()} onKeyDown={handleUploadKeyDown} role="button" tabIndex={0} aria-labelledby="photo-label">
              {compressing ? <span className="upload-status"><Icon name="sparkles" size={18} />{t('photo_optimizing')}</span> : photoPreview ? (
                <Image src={photoPreview} alt={t('photo_preview_alt')} width={640} height={420} unoptimized />
              ) : <span className="upload-status"><Icon name="camera" size={20} />{t('sitting_photo_choose')}</span>}
            </div>
            <input id="sitting-photo-input" className="sr-file" type="file" accept="image/*" onChange={handlePhoto} aria-describedby="sitting-photo-help" />
            {photoPreview && <button type="button" className="remove-photo" onClick={removePhoto}><Icon name="trash" size={15} />{t('sitting_photo_remove')}</button>}
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
            <textarea id="s-desc" value={description} onChange={(e) => { setDescription(e.target.value); setFieldErrors((current) => ({ ...current, description: undefined })); }} rows={4} placeholder={t('sitting_description_placeholder')} required maxLength={2000} aria-invalid={Boolean(fieldErrors.description)} aria-describedby={fieldErrors.description ? 's-desc-error' : undefined} />
            {fieldErrors.description && <p className="field-error" id="s-desc-error" role="alert">{fieldErrors.description}</p>}
            <label htmlFor="s-exp">{t('sitting_experience_label')}</label>
            <FieldHint mn="Хэдэн жил, ямар төрлийн амьтан асарч байсан туршлагаа бичнэ. Заавал биш." en="Describe years and types of pet-care experience. Optional." />
            <input id="s-exp" value={experience} onChange={(e) => setExperience(e.target.value)} placeholder={t('sitting_experience_placeholder')} maxLength={500} />
            <label htmlFor="s-avail">{t('sitting_availability_label')}</label>
            <FieldHint mn="Боломжтой өдөр, цагийг бичнэ. Жишээ: ажлын өдөр 18:00-аас хойш." en="Enter available days and times, e.g. weekdays after 18:00." />
            <input id="s-avail" value={availability} onChange={(e) => setAvailability(e.target.value)} placeholder={t('sitting_availability_placeholder')} maxLength={500} />
            <label htmlFor="s-price">{t('sitting_price_label')}</label>
            <FieldHint mn="Нэг өдрийн үнэ. Хоосон бол тохиролцоно, 0 бол үнэгүй." en="Daily price in MNT. Leave blank to negotiate, or enter 0 for free." />
            <input id="s-price" type="number" min="0" max="100000000" step="1" value={price} onChange={(e) => { setPrice(e.target.value); setFieldErrors((current) => ({ ...current, price: undefined })); }} placeholder={t('sitting_price_placeholder')} aria-invalid={Boolean(fieldErrors.price)} aria-describedby={fieldErrors.price ? 's-price-error' : undefined} />
            {fieldErrors.price && <p className="field-error" id="s-price-error" role="alert">{fieldErrors.price}</p>}
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
            <input id="s-place" value={place} onChange={(e) => { setPlace(e.target.value); setFieldErrors((current) => ({ ...current, place: undefined })); }} placeholder={t('adoption_place_placeholder')} required maxLength={300} aria-invalid={Boolean(fieldErrors.place)} aria-describedby={fieldErrors.place ? 's-place-error' : undefined} />
            {fieldErrors.place && <p className="field-error" id="s-place-error" role="alert">{fieldErrors.place}</p>}

            <button type="button" onClick={location.handleUseLocation} disabled={location.locating} className="locate-btn">
              {location.locating ? t('locate_loading') : t('locate_btn')}
            </button>
            <label id="s-map-label">
              {t('map_label')} <span className="optional">{t('map_optional')}</span>
            </label>
            <div aria-labelledby="s-map-label" role="application" aria-label={t('map_label')}>
              <LocationMap lat={location.coords?.lat} lng={location.coords?.lng} editable onPick={location.setCoords} />
            </div>
            {location.coords && (
              <p className="coordinates" aria-live="polite"><Icon name="pin" size={14} aria-hidden="true" />{location.coords.lat.toFixed(4)}, {location.coords.lng.toFixed(4)}
              </p>
            )}

            <label htmlFor="s-phone">{t('phone_label')}</label>
            <FieldHint mn="Хэрэглэгч холбогдох боломжтой 8 оронтой утасны дугаар оруулна." en="Enter a reachable 8-digit Mongolian phone number." />
            <input id="s-phone" value={formatPhone(phone)} onChange={(e) => { setPhone(normalizePhone(e.target.value)); setFieldErrors((current) => ({ ...current, phone: undefined })); }} placeholder={t('phone_placeholder')} required inputMode="tel" autoComplete="tel" maxLength={14} aria-invalid={Boolean(fieldErrors.phone)} aria-describedby={fieldErrors.phone ? 's-phone-error' : undefined} />
            {fieldErrors.phone && <p className="field-error" id="s-phone-error" role="alert">{fieldErrors.phone}</p>}
            {error && <p className="error" role="alert">{error}</p>}
            <Button type="submit" disabled={submitting} variant="primary" fullWidth className="form-submit">
              {submitting ? statusMsg || t('submitting') : t('sitting_submit')}
            </Button>
          </>
        )}

        <div className="nav-row">
          {step > 0 && <Button type="button" onClick={() => setStep(step - 1)} variant="secondary">{t('form_back_plain')}</Button>}
          {step < STEPS.length - 1 && (
            <Button type="button" onClick={goNext} variant="accent">{t('form_next_plain')}</Button>
          )}
        </div>
      </form>

      <div className="preview-col">
        <SittingCardView
          badgeLabel={t('sitting_badge')}
          petType={petType}
          petTypeLabel={petType === 'Нохой' ? t('type_dog') : petType === 'Муур' ? t('type_cat') : petType === 'Бусад' ? t('type_other') : t('sitting_pet_type_all')}
          description={description}
          district={district}
          place={place}
          experience={experience}
          availability={availability}
          price={price ? Number(price) : null}
          phone={formatPhone(phone)}
          interactive={false}
          freeLabel={t('sitting_price_free')}
          perDayLabel={t('sitting_price_per_day')}
          language={lang}
          imageNode={photoPreview ? <Image src={photoPreview} alt="" width={640} height={420} unoptimized /> : undefined}
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
        label { font-size: 12.5px; font-weight: 600; color: var(--primary); margin-top: var(--sp-4); display: block; }
        label:first-child { margin-top: 0; }
        input, select, textarea {
          padding: var(--sp-2) var(--sp-3); border: 1.5px solid var(--line); border-radius: var(--r-sm);
          font-size: var(--text-base); width: 100%; font-family: var(--font-body); background: var(--card); color: var(--ink);
          min-height: var(--touch-target);
        }
        textarea { resize: vertical; min-height: 80px; }
        input:focus-visible, select:focus-visible, textarea:focus-visible {
          outline: none; border-color: var(--accent);
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 15%, transparent);
        }
        .upload-zone {
          border: 1.5px dashed var(--line); border-radius: var(--r-md); padding: 28px 20px;
          text-align: center; cursor: pointer; color: var(--muted); background: var(--overcast);
          min-height: var(--touch-target); display: flex; align-items: center; justify-content: center;
        }
        .upload-zone:hover { border-color: var(--accent); background: var(--eyebrow-bg); }
        .upload-zone:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
        .upload-zone :global(img) { width:100%;max-width:22rem;height:auto;max-height:16rem;object-fit:cover;border-radius:var(--r-sm); }
        .upload-status,.coordinates,.remove-photo{display:inline-flex;align-items:center;gap:var(--sp-2)}
        .sr-file{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
        .remove-photo{align-self:flex-start;min-height:var(--touch-target);padding:var(--sp-2);color:var(--alert);background:transparent;border:0;border-radius:var(--r-sm);font:inherit;font-size:var(--text-sm);font-weight:700;cursor:pointer}.remove-photo:hover{background:var(--alert-bg)}
        .field-hint{margin:var(--sp-1) 0;color:var(--muted);font-size:var(--text-xs);line-height:1.5}.field-error{margin:var(--sp-1) 0 0;color:var(--alert);font-size:var(--text-xs);font-weight:650}.optional{color:var(--muted);font-weight:400}.coordinates{margin:var(--sp-1) 0 0;color:var(--muted);font-size:var(--text-xs)}
        .locate-btn {
          background: var(--eyebrow-bg); border: 1.5px solid var(--line); border-radius: var(--r-sm);
          padding: var(--sp-2) var(--sp-3); font-size: var(--text-base); width: 100%; color: var(--primary); font-weight: 600;
          min-height: var(--touch-target); cursor: pointer; margin-top: var(--sp-4); font-family: var(--font-body);
        }
        .locate-btn:hover { border-color: var(--accent); }
        .locate-btn:disabled { opacity: 0.6; cursor: default; }
        .locate-btn:focus-visible { outline: 2px solid var(--accent); outline-offset: 1px; }
        .form-submit { margin-top: var(--sp-5); }
        .error { color: var(--alert); font-size: 13px; margin-top: var(--sp-2); }
        .success-box { padding: var(--sp-6); background: var(--success-bg); border-radius: var(--r-lg); text-align: center; border: 1px solid color-mix(in srgb, var(--success) 30%, transparent); }
        .success-action{display:flex;justify-content:center;margin-top:var(--sp-4)}
        .progress-text { font-family: var(--font-mono); font-size: 11.5px; color: var(--muted); margin: var(--sp-2) 0 var(--sp-5); text-align: center; }
        .nav-row { display: flex; gap: 10px; margin-top: var(--sp-5); }
        .nav-row :global(.btn-base) { flex: 1; justify-content: center; }
      `}</style>
    </div>
  );
}
