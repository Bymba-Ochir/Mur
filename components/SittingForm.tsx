'use client';
import { useState } from 'react';
import type { ChangeEvent, FormEvent, KeyboardEvent } from 'react';
import { DISTRICTS } from '../lib/districts';
import { useLanguage } from '../lib/i18n';
import ShareButtons from './ShareButtons';
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
      <div className="success-box" role="status">
        <p>{t('sitting_success_msg')}</p>
        <ShareButtons url={url} title="Асрах үйлчилгээ" />
        <button onClick={() => { setDone(false); setNewId(null); }} className="btn" style={{ marginTop: 16 }}>{t('add_another')}</button>
      </div>
    );
  }

  return (
    <div className="form-layout">
      <form onSubmit={handleSubmit} className="pet-form" aria-label="Асрах зар нэмэх">
        <PawTrail labels={STEPS} current={step} />
        <p className="progress-text" aria-live="polite">{step + 1}/{STEPS.length}: {STEPS[step]}</p>

        {step === 0 && (
          <>
            <label id="photo-label">{t('photo_label')}</label>
            <div className="upload-zone" onClick={() => document.getElementById('sitting-photo-input')?.click()} onKeyDown={handleUploadKeyDown} role="button" tabIndex={0} aria-labelledby="photo-label">
              {compressing ? <span>⏳ Зураг оновчлож байна...</span> : photoPreview ? (
                <img src={photoPreview} alt={t('photo_preview_alt')} />
              ) : <span>{t('photo_hint')}</span>}
            </div>
            <input id="sitting-photo-input" type="file" accept="image/*" onChange={handlePhoto} style={{ display: 'none' }} />
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
            <textarea id="s-desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder={t('sitting_description_placeholder')} required />
            <label htmlFor="s-exp">{t('sitting_experience_label')}</label>
            <input id="s-exp" value={experience} onChange={(e) => setExperience(e.target.value)} placeholder={t('sitting_experience_placeholder')} />
            <label htmlFor="s-avail">{t('sitting_availability_label')}</label>
            <input id="s-avail" value={availability} onChange={(e) => setAvailability(e.target.value)} placeholder={t('sitting_availability_placeholder')} />
            <label htmlFor="s-price">{t('sitting_price_label')}</label>
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
            <input id="s-place" value={place} onChange={(e) => setPlace(e.target.value)} placeholder={t('adoption_place_placeholder')} required />

            <button type="button" onClick={location.handleUseLocation} disabled={location.locating} className="locate-btn">
              {location.locating ? t('locate_loading') : t('locate_btn')}
            </button>
            <label id="s-map-label">
              {t('map_label')} <span style={{ fontWeight: 400, color: 'var(--muted)' }}>{t('map_optional')}</span>
            </label>
            <div aria-labelledby="s-map-label" role="application" aria-label={t('map_label')}>
              <LocationMap lat={location.coords?.lat} lng={location.coords?.lng} editable onPick={location.setCoords} />
            </div>
            {location.coords && (
              <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }} aria-live="polite">
                📍 {location.coords.lat.toFixed(4)}, {location.coords.lng.toFixed(4)}
              </p>
            )}

            <label htmlFor="s-phone">{t('phone_label')}</label>
            <input id="s-phone" value={formatPhone(phone)} onChange={(e) => setPhone(normalizePhone(e.target.value))} placeholder={t('phone_placeholder')} required inputMode="tel" />
            {error && <p className="error" role="alert">{error}</p>}
            <button type="submit" disabled={submitting} className="btn btn-primary">
              {submitting ? statusMsg || t('submitting') : t('sitting_submit')}
            </button>
          </>
        )}

        <div className="nav-row">
          {step > 0 && <button type="button" onClick={() => setStep(step - 1)} className="btn nav-back">{t('form_back')}</button>}
          {step < STEPS.length - 1 && (
            <button type="button" onClick={() => canNext && setStep(step + 1)} disabled={!canNext} className="btn nav-next">{t('form_next')}</button>
          )}
        </div>
      </form>

      <div className="preview-col">
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
          imageNode={photoPreview ? <img src={photoPreview} alt="" /> : undefined}
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
        input:focus-visible, select:focus-visible, textarea:focus-visible { outline: 2px solid var(--accent); outline-offset: 1px; border-color: var(--accent); }
        .upload-zone {
          border: 1.5px dashed var(--line); border-radius: var(--r-md); padding: 28px 20px;
          text-align: center; cursor: pointer; color: var(--muted); background: var(--overcast);
          min-height: var(--touch-target); display: flex; align-items: center; justify-content: center;
        }
        .upload-zone:hover { border-color: var(--accent); background: var(--eyebrow-bg); }
        .upload-zone:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
        .upload-zone img { max-width: 150px; border-radius: var(--r-sm); }
        .locate-btn {
          background: var(--eyebrow-bg); border: 1.5px solid var(--line); border-radius: var(--r-sm);
          padding: var(--sp-2) var(--sp-3); font-size: var(--text-base); width: 100%; color: var(--primary); font-weight: 600;
          min-height: var(--touch-target); cursor: pointer; margin-top: var(--sp-4); font-family: var(--font-body);
        }
        .locate-btn:hover { border-color: var(--accent); }
        .locate-btn:disabled { opacity: 0.6; cursor: default; }
        .locate-btn:focus-visible { outline: 2px solid var(--accent); outline-offset: 1px; }
        .btn-primary { width: 100%; margin-top: var(--sp-5); justify-content: center; font-size: 15px; padding: 14px; min-height: var(--touch-target); }
        .btn-primary:disabled { opacity: 0.55; cursor: not-allowed; transform: none; }
        .error { color: var(--alert); font-size: 13px; margin-top: var(--sp-2); }
        .success-box { padding: var(--sp-6); background: var(--success-bg); border-radius: var(--r-lg); text-align: center; border: 1px solid color-mix(in srgb, var(--success) 30%, transparent); }
        .progress-text { font-family: var(--font-mono); font-size: 11.5px; color: var(--muted); margin: var(--sp-2) 0 var(--sp-5); text-align: center; }
        .nav-row { display: flex; gap: 10px; margin-top: var(--sp-5); }
        .nav-back { background: var(--eyebrow-bg); color: var(--primary); flex: 1; justify-content: center; min-height: var(--touch-target); }
        .nav-next { background: var(--accent); color: var(--accent-ink); flex: 1; justify-content: center; min-height: var(--touch-target); }
        .nav-next:disabled { opacity: 0.45; cursor: not-allowed; transform: none; }
      `}</style>
    </div>
  );
}
