'use client';
import { useState } from 'react';
import { createPetReport } from '../lib/petService';
import { nearestDistrict } from '../lib/districtCoords';
import { compressImage } from '../lib/imageCompress';
import { checkImageContent } from '../lib/contentModeration';
import { useToast } from './Toast';
import { useLanguage } from '../lib/i18n';
import ShareButtons from './ShareButtons';
import LocationMap from './LocationMap';
import PetPreviewCard from './PetPreviewCard';
import PawTrail from './PawTrail';

const DISTRICTS = [
  'Баянзүрх', 'Хан-Уул', 'Сүхбаатар', 'Чингэлтэй', 'Баянгол',
  'Сонгинохайрхан', 'Налайх', 'Багануур', 'Багахангай',
];

// Дотоод утга (DB-д хадгалагдах) үргэлж Монгол хэвээр — зөвхөн харагдац орчуулагдана
const TYPE_VALUES = ['Нохой', 'Муур', 'Бусад'];

export default function PetForm({ status }) {
  const showToast = useToast();
  const { t } = useLanguage();
  const STEPS = [t('form_step_photo'), t('form_step_info'), t('form_step_location'), t('form_step_contact')];
  const TYPE_LABELS = { 'Нохой': t('type_dog'), 'Муур': t('type_cat'), 'Бусад': t('type_other') };
  const [step, setStep] = useState(0);

  const [form, setForm] = useState({
    name: '', type: 'Нохой', color: '', place: '', district: DISTRICTS[0], phone: '',
  });
  const [coords, setCoords] = useState(null);
  const [locating, setLocating] = useState(false);
  const [photoFile, setPhotoFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [compressing, setCompressing] = useState(false);
  const [compressStatus, setCompressStatus] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [done, setDone] = useState(false);
  const [newPetId, setNewPetId] = useState(null);
  const [error, setError] = useState(null);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handlePhoto(e) {
    const file = e.target.files[0];
    if (!file) return;
    setCompressing(true);
    try {
      const originalKB = Math.round(file.size / 1024);
      const compressed = await compressImage(file);
      const newKB = Math.round(compressed.size / 1024);

      const check = await checkImageContent(compressed, setCompressStatus);
      if (!check.ok) {
        showToast(check.reason, 'error');
        e.target.value = '';
        return;
      }
      if (check.warning) {
        showToast(check.warning, 'info');
      }

      setPhotoFile(compressed);
      setPreview(URL.createObjectURL(compressed));
      if (originalKB > newKB + 20) {
        showToast(`Зураг оновчлогдлоо: ${originalKB}KB → ${newKB}KB`, 'success');
      }
    } catch (err) {
      setPhotoFile(file);
      setPreview(URL.createObjectURL(file));
    } finally {
      setCompressing(false);
      setCompressStatus('');
    }
  }

  function openFilePicker() {
    if (!compressing) document.getElementById('photo-input').click();
  }

  function handleUploadKeyDown(e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openFilePicker();
    }
  }

  function handleUseLocation() {
    if (!navigator.geolocation) {
      showToast('Энэ browser байршил тодорхойлохыг дэмждэггүй', 'error');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setCoords({ lat: latitude, lng: longitude });
        const guessed = nearestDistrict(latitude, longitude);
        setForm((f) => ({ ...f, district: guessed }));
        setLocating(false);
        showToast(`Байршил тодорхойлогдлоо: ${guessed}`, 'success');
      },
      () => {
        setLocating(false);
        showToast('Байршил тодорхойлж чадсангүй. Зөвшөөрөл шалгана уу.', 'error');
      }
    );
  }

  const canNext = [
    true,
    !!form.color,
    !!form.place,
    true,
  ][step];

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setStatusMsg(t('submitting'));
    try {
      const id = await createPetReport(
        { ...form, status, photoFile, lat: coords?.lat, lng: coords?.lng },
        setStatusMsg
      );
      setNewPetId(id);
      setDone(true);
      setForm({ name: '', type: 'Нохой', color: '', place: '', district: DISTRICTS[0], phone: '' });
      setCoords(null);
      setPhotoFile(null);
      setPreview(null);
      setStep(0);
    } catch (err) {
      console.error(err);
      setError(err.message && err.message.includes('олон удаа')
        ? err.message
        : 'Алдаа гарлаа. Дахин оролдоно уу.');
    } finally {
      setSubmitting(false);
      setStatusMsg('');
    }
  }

  if (done) {
    const petUrl = typeof window !== 'undefined' ? `${window.location.origin}/pets/${newPetId}` : '';
    return (
      <div className="success-box" role="status">
        <p>{t('success_msg')}</p>
        <ShareButtons url={petUrl} title={status === 'lost' ? 'Алдсан амьтан' : 'Олдсон амьтан'} />
        <button onClick={() => setDone(false)} className="btn" style={{ marginTop: 16 }}>{t('add_another')}</button>
      </div>
    );
  }

  return (
    <div className="form-layout">
    <form onSubmit={handleSubmit} className="pet-form" aria-label={status === 'lost' ? 'Алдсан амьтан мэдэгдэх форм' : 'Олдсон амьтан мэдэгдэх форм'}>
      <PawTrail labels={STEPS} current={step} />
      <p className="progress-text" aria-live="polite">{step + 1}/{STEPS.length}: {STEPS[step]}</p>

      {step === 0 && (
        <>
          <label id="photo-label">{t('photo_label')}</label>
          <div
            className="upload-zone"
            onClick={openFilePicker}
            onKeyDown={handleUploadKeyDown}
            role="button"
            tabIndex={0}
            aria-labelledby="photo-label"
            aria-describedby="photo-hint"
          >
            {compressing ? (
              <span role="status">⏳ {compressStatus || 'Зураг оновчлож байна...'}</span>
            ) : preview ? (
              <img src={preview} alt={t('photo_preview_alt')} />
            ) : (
              <span id="photo-hint">{t('photo_hint')}</span>
            )}
          </div>
          <input
            id="photo-input" type="file" accept="image/*" onChange={handlePhoto}
            style={{ display: 'none' }} disabled={compressing}
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
          <button type="button" onClick={handleUseLocation} disabled={locating} className="locate-btn">
            {locating ? t('locate_loading') : t('locate_btn')}
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
            <LocationMap lat={coords?.lat} lng={coords?.lng} editable onPick={setCoords} />
          </div>
          {coords && (
            <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }} aria-live="polite">
              📍 {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
            </p>
          )}
        </>
      )}

      {step === 3 && (
        <>
          <label htmlFor="pet-phone">{t('phone_label')}</label>
          <input id="pet-phone" name="phone" value={form.phone} onChange={handleChange} placeholder={t('phone_placeholder')} required />

          {error && <p className="error" role="alert">{error}</p>}

          <button type="submit" disabled={submitting} className="btn btn-primary" aria-busy={submitting}>
            {submitting ? statusMsg || t('submitting') : status === 'lost' ? t('submit_lost') : t('submit_found')}
          </button>
          {submitting && statusMsg.includes('AI') && (
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
        phone={form.phone}
        photoPreview={preview}
      />
    </div>

      <style jsx>{`
        .form-layout { display: flex; gap: 48px; align-items: flex-start; }
        .preview-col { display: none; position: sticky; top: 100px; }
        @media (min-width: 860px) {
          .preview-col { display: block; }
        }
        .pet-form {
          display: flex; flex-direction: column; gap: 4px; max-width: 440px; flex: 1; min-width: 0;
          background: var(--card); border: 1px solid var(--line); border-radius: var(--r-lg);
          padding: var(--sp-6); box-shadow: var(--shadow-sm);
        }
        label { font-size: 12.5px; font-weight: 600; color: var(--primary); margin-top: var(--sp-4); display: block; letter-spacing: 0.01em; }
        label:first-child { margin-top: 0; }
        input, select {
          padding: 11px 13px; border: 1.5px solid var(--line); border-radius: var(--r-sm);
          font-size: 14.5px; width: 100%; font-family: var(--font-body); background: var(--card); color: var(--ink);
          transition: border-color 0.15s ease;
        }
        input:hover, select:hover { border-color: var(--muted); }
        input:focus-visible, select:focus-visible { outline: 2px solid var(--accent); outline-offset: 1px; border-color: var(--accent); }
        .upload-zone {
          border: 1.5px dashed var(--line); border-radius: var(--r-md); padding: 28px 20px;
          text-align: center; cursor: pointer; color: var(--muted); background: var(--overcast);
          transition: border-color 0.15s ease, background 0.15s ease;
        }
        .upload-zone:hover { border-color: var(--accent); background: var(--eyebrow-bg); }
        .upload-zone:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
        .upload-zone img { max-width: 150px; border-radius: var(--r-sm); }
        .btn-primary { width: 100%; margin-top: var(--sp-5); justify-content: center; font-size: 15px; padding: 14px; }
        .btn-primary:disabled { opacity: 0.55; cursor: not-allowed; transform: none; }
        .error { color: var(--alert); font-size: 13px; margin-top: var(--sp-2); }
        .success-box {
          padding: var(--sp-6); background: var(--success-bg); border-radius: var(--r-lg); text-align: center;
          border: 1px solid color-mix(in srgb, var(--success) 30%, transparent);
        }

        .progress-text { font-family: var(--font-mono); font-size: 11.5px; color: var(--muted); margin: var(--sp-2) 0 var(--sp-5); text-align: center; letter-spacing: 0.02em; }

        .locate-btn {
          padding: 10px 15px; border-radius: var(--r-pill); border: 1.5px solid var(--primary);
          background: transparent; color: var(--primary); font-weight: 600; cursor: pointer; font-size: 13px; margin-bottom: var(--sp-3);
          transition: background 0.15s ease;
        }
        .locate-btn:hover { background: var(--eyebrow-bg); }
        .locate-btn:disabled { opacity: 0.6; }
        .locate-btn:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }

        .nav-row { display: flex; gap: 10px; margin-top: var(--sp-5); }
        .nav-back { background: var(--eyebrow-bg); color: var(--primary); flex: 1; justify-content: center; }
        .nav-next { background: var(--accent); color: #fff; flex: 1; justify-content: center; }
        .nav-next:disabled { opacity: 0.45; cursor: not-allowed; transform: none; }
      `}</style>
    </div>
  );
}
