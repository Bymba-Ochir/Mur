'use client';
import { useState } from 'react';
import type { ChangeEvent, KeyboardEvent } from 'react';
import { DISTRICTS } from '../lib/districts';
import { useLanguage } from '../lib/i18n';
import ShareButtons from './ShareButtons';
import LocationMap from './LocationMap';
import PetPreviewCard from './PetPreviewCard';
import PawTrail from './PawTrail';
import { usePhotoUpload, usePetLocation, usePetSubmit, TYPE_VALUES } from '../lib/usePetForm';
import type { PetFormData } from '../lib/usePetForm';
import type { PetStatus, PetType } from '../lib/types';
import { normalizePhone, formatPhone } from '../lib/utils';

export default function PetForm({ status }: { status: PetStatus }) {
  const { t } = useLanguage();
  const STEPS = [t('form_step_photo'), t('form_step_info'), t('form_step_location'), t('form_step_contact')];
  const TYPE_LABELS: Record<PetType, string> = { 'Нохой': t('type_dog'), 'Муур': t('type_cat'), 'Бусад': t('type_other') };
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<PetFormData>({
    name: '', type: 'Нохой', color: '', place: '', district: DISTRICTS[0], phone: '', hasReward: false, reward: '',
  });

  const photo = usePhotoUpload();
  const location = usePetLocation((d) => setForm((f) => ({ ...f, district: d })));

  // Амжилттай хадгалагдсаны дараа бүх форм төлөвийг цэвэрлэнэ
  function resetAll() {
    setForm({ name: '', type: 'Нохой', color: '', place: '', district: DISTRICTS[0], phone: '', hasReward: false, reward: '' });
    setStep(0);
    photo.reset();
    location.reset();
  }

  const submit = usePetSubmit({
    status,
    form,
    photoFile: photo.photoFile,
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
      <div className="success-box" role="status">
        <p>{t('success_msg')}</p>
        <ShareButtons url={petUrl} title={status === 'lost' ? 'Алдсан амьтан' : 'Олдсон амьтан'} />
        <button onClick={addAnother} className="btn" style={{ marginTop: 16 }}>{t('add_another')}</button>
      </div>
    );
  }

  return (
    <div className="form-layout">
    <form onSubmit={submit.handleSubmit} className="pet-form" aria-label={status === 'lost' ? 'Алдсан амьтан мэдэгдэх форм' : 'Олдсон амьтан мэдэгдэх форм'}>
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
              <span role="status">⏳ {photo.compressStatus || 'Зураг оновчлож байна...'}</span>
            ) : photo.preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photo.preview} alt={t('photo_preview_alt')} />
            ) : (
              <span id="photo-hint">{t('photo_hint')}</span>
            )}
          </div>
          <div className="photo-quality" role="note">
            <p className="pq-title">{t('photo_requirements_title')}</p>
            <ul>
              <li>{t('photo_quality_bright')}</li>
              <li>{t('photo_quality_close')}</li>
            </ul>
            <p className="pq-match">{t('photo_quality_match')}</p>
          </div>
          <input
            id="photo-input" type="file" accept="image/*" onChange={photo.handlePhoto}
            style={{ display: 'none' }} disabled={photo.compressing}
            aria-label={t('photo_label')}
          />
        </>
      )}

      {step === 1 && (
        <>
          <label htmlFor="pet-name">{t('name_label')}</label>
          <input id="pet-name" name="name" value={form.name} onChange={handleChange} placeholder={t('name_placeholder')} />

          <label htmlFor="pet-type">{t('type_label')}</label>
          <select id="pet-type" name="type" value={form.type} onChange={handleChange}>
            {TYPE_VALUES.map((v) => <option key={v} value={v}>{TYPE_LABELS[v]}</option>)}
          </select>

          <label htmlFor="pet-color">{t('color_label')}</label>
          <input id="pet-color" name="color" value={form.color} onChange={handleChange} placeholder={t('color_placeholder')} required />
        </>
      )}

      {step === 2 && (
        <>
          <button type="button" onClick={location.handleUseLocation} disabled={location.locating} className="locate-btn">
            {location.locating ? t('locate_loading') : t('locate_btn')}
          </button>

          <label htmlFor="pet-district">{t('district_label')}</label>
          <select id="pet-district" name="district" value={form.district} onChange={handleChange}>
            {DISTRICTS.map((d) => <option key={d}>{d}</option>)}
          </select>

          <label htmlFor="pet-place">{status === 'lost' ? t('place_label_lost') : t('place_label_found')}</label>
          <input id="pet-place" name="place" value={form.place} onChange={handleChange} placeholder={t('place_placeholder')} required />

          <label id="map-label">
            {t('map_label')} <span style={{ fontWeight: 400, color: 'var(--muted)' }}>{t('map_optional')}</span>
          </label>
          <div aria-labelledby="map-label" role="application" aria-label={t('map_label')}>
            <LocationMap lat={location.coords?.lat} lng={location.coords?.lng} editable onPick={location.setCoords} />
          </div>
          {location.coords && (
            <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }} aria-live="polite">
              📍 {location.coords.lat.toFixed(4)}, {location.coords.lng.toFixed(4)}
            </p>
          )}
        </>
      )}

      {step === 3 && (
        <>
          {status === 'lost' && (
            <>
              <label className="reward-check" htmlFor="pet-has-reward">
                <input
                  id="pet-has-reward" type="checkbox"
                  checked={form.hasReward}
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
          <input
            id="pet-phone"
            name="phone"
            value={formatPhone(form.phone)}
            onChange={(e) => setForm((f) => ({ ...f, phone: normalizePhone(e.target.value) }))}
            placeholder={t('phone_placeholder')}
            required
            inputMode="tel"
          />

          {submit.error && <p className="error" role="alert">{submit.error}</p>}

          <button type="submit" disabled={submit.submitting} className="btn btn-primary" aria-busy={submit.submitting}>
            {submit.submitting ? submit.statusMsg || t('submitting') : status === 'lost' ? t('submit_lost') : t('submit_found')}
          </button>

          {submit.submitting && submit.statusMsg.includes('AI') && (
            <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6 }} aria-live="polite">
              Анхны хүсэлт 10-30 секунд удааширч болно, түр хүлээгээрэй...
            </p>
          )}
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
      <PetPreviewCard
        status={status}
        name={form.name}
        type={form.type}
        color={form.color}
        district={form.district}
        place={form.place}
        phone={formatPhone(form.phone)}
        photoPreview={photo.preview}
        hasReward={form.hasReward}
      />
    </div>

      <style jsx>{`
        .form-layout { display: flex; gap: 48px; align-items: flex-start; }
        @media (max-width: 860px) {
          .form-layout { gap: 0; }
        }
        @media (min-width: 1200px) {
          .form-layout { gap: 64px; }
        }
        .preview-col { display: none; position: sticky; top: 100px; }
        @media (min-width: 860px) {
          .preview-col { display: block; }
        }
        .pet-form {
          display: flex; flex-direction: column; gap: 4px; max-width: 440px; flex: 1; min-width: 0;
          background: var(--card); border: 1px solid var(--line); border-radius: var(--r-xl);
          padding: var(--sp-6); box-shadow: var(--shadow-md);
        }
        @media (min-width: 1025px) {
          .pet-form { max-width: 520px; padding: var(--sp-7); }
        }
        @media (max-width: 640px) {
          .pet-form { padding: var(--sp-5); border-radius: var(--r-lg); max-width: 100%; }
        }
        @media (max-width: 480px) {
          .pet-form { padding: var(--sp-4); border-radius: var(--r-md); }
        }
        label { font-size: 12.5px; font-weight: 600; color: var(--primary); margin-top: var(--sp-4); display: block; letter-spacing: 0.01em; }
        label:first-child { margin-top: 0; }
        @media (max-width: 480px) {
          label { font-size: 13px; margin-top: var(--sp-3); }
        }
        @media (min-width: 1025px) {
          label { font-size: 13.5px; margin-top: var(--sp-5); }
        }

        input, select {
          padding: 11px 13px; border: 1.5px solid var(--line); border-radius: var(--r-sm);
          font-size: 14.5px; width: 100%; font-family: var(--font-body); background: var(--card); color: var(--ink);
          transition: border-color 0.15s ease;
          min-height: var(--touch-target);
        }
        @media (max-width: 480px) {
          input, select { font-size: 16px; padding: 12px 14px; }
        }
        @media (min-width: 1025px) {
          input, select { font-size: 15px; padding: 12px 16px; }
        }
        input:hover, select:hover { border-color: var(--muted); }
        input:focus-visible, select:focus-visible { outline: 2px solid var(--accent); outline-offset: 1px; border-color: var(--accent); }
        .upload-zone {
          border: 1.5px dashed var(--line); border-radius: var(--r-md); padding: 28px 20px;
          text-align: center; cursor: pointer; color: var(--muted); background: var(--overcast);
          transition: border-color 0.15s ease, background 0.15s ease;
          min-height: var(--touch-target);
          display: flex; align-items: center; justify-content: center;
        }
        @media (max-width: 480px) {
          .upload-zone { padding: 24px 16px; }
        }
        @media (min-width: 1025px) {
          .upload-zone { padding: 32px 24px; }
        }
        .upload-zone:hover { border-color: var(--accent); background: var(--eyebrow-bg); }
        .upload-zone:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
        .upload-zone img { max-width: 150px; border-radius: var(--r-sm); }
        @media (min-width: 1025px) {
          .upload-zone img { max-width: 180px; }
        }
        .photo-quality {
          background: var(--eyebrow-bg); border: 1px solid var(--line); border-radius: var(--r-md);
          padding: 10px 14px; margin-top: var(--sp-3); color: var(--muted); font-size: 12.5px;
        }
        @media (max-width: 480px) {
          .photo-quality { padding: 12px 16px; font-size: 13px; }
        }
        @media (min-width: 1025px) {
          .photo-quality { padding: 14px 18px; font-size: 13px; }
        }
        .pq-title { font-weight: 700; color: var(--primary); font-size: 12.5px; margin: 0 0 6px; }
        @media (max-width: 480px) {
          .pq-title { font-size: 13px; }
        }
        @media (min-width: 1025px) {
          .pq-title { font-size: 13.5px; }
        }
        .photo-quality ul { margin: 0; padding-left: 18px; display: flex; flex-direction: column; gap: 3px; }
        .photo-quality li { margin: 0; line-height: 1.4; }
        .pq-match { margin: 8px 0 0; font-size: 12px; }
        .btn-primary { width: 100%; margin-top: var(--sp-5); justify-content: center; font-size: 15px; padding: 14px; min-height: var(--touch-target); }
        @media (max-width: 480px) {
          .btn-primary { font-size: 16px; padding: 16px; margin-top: var(--sp-4); }
        }
        @media (min-width: 1025px) {
          .btn-primary { font-size: 16px; padding: 16px 24px; margin-top: var(--sp-6); }
        }
        .btn-primary:disabled { opacity: 0.55; cursor: not-allowed; transform: none; }
        .error { color: var(--alert); font-size: 13px; margin-top: var(--sp-2); }
        @media (max-width: 480px) {
          .error { font-size: 14px; }
        }
        .success-box {
          padding: var(--sp-6); background: var(--success-bg); border-radius: var(--r-lg); text-align: center;
          border: 1px solid color-mix(in srgb, var(--success) 30%, transparent);
        }
        @media (max-width: 480px) {
          .success-box { padding: var(--sp-5); }
        }
        @media (min-width: 1025px) {
          .success-box { padding: var(--sp-7); }
        }

        .progress-text { font-family: var(--font-mono); font-size: 11.5px; color: var(--muted); margin: var(--sp-2) 0 var(--sp-5); text-align: center; letter-spacing: 0.02em; }
        @media (max-width: 480px) {
          .progress-text { font-size: 12px; margin: var(--sp-2) 0 var(--sp-4); }
        }
        @media (min-width: 1025px) {
          .progress-text { font-size: 12.5px; margin: var(--sp-3) 0 var(--sp-6); }
        }

        .reward-check {
          display: flex; align-items: center; gap: 8px; cursor: pointer;
          margin-top: var(--sp-4); font-size: 13px; font-weight: 600; color: var(--primary); letter-spacing: 0;
          min-height: var(--touch-target);
        }
        @media (max-width: 480px) {
          .reward-check { font-size: 14px; gap: 10px; }
        }
        @media (min-width: 1025px) {
          .reward-check { font-size: 14px; gap: 12px; margin-top: var(--sp-5); }
        }
        .reward-check input { width: auto; margin: 0; accent-color: var(--accent); }
        .locate-btn {
          padding: 10px 15px; border-radius: var(--r-pill); border: 1.5px solid var(--primary);
          background: transparent; color: var(--primary); font-weight: 600; cursor: pointer; font-size: 13px; margin-bottom: var(--sp-3);
          transition: background 0.15s ease;
          min-height: var(--touch-target);
        }
        @media (max-width: 480px) {
          .locate-btn { font-size: 14px; padding: 12px 20px; width: 100%; }
        }
        @media (min-width: 1025px) {
          .locate-btn { font-size: 14px; padding: 12px 24px; margin-bottom: var(--sp-4); }
        }
        .locate-btn:hover { background: var(--eyebrow-bg); }
        .locate-btn:disabled { opacity: 0.6; }
        .locate-btn:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }

        .nav-row { display: flex; gap: 10px; margin-top: var(--sp-5); }
        @media (max-width: 480px) {
          .nav-row { gap: 12px; margin-top: var(--sp-4); }
        }
        @media (min-width: 1025px) {
          .nav-row { gap: 14px; margin-top: var(--sp-6); }
        }
        .nav-back { background: var(--eyebrow-bg); color: var(--primary); flex: 1; justify-content: center; min-height: var(--touch-target); }
        .nav-next { background: var(--accent); color: #fff; flex: 1; justify-content: center; min-height: var(--touch-target); }
        .nav-next:disabled { opacity: 0.45; cursor: not-allowed; transform: none; }
      `}</style>
    </div>
  );
}
