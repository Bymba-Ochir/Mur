'use client';
import { useState } from 'react';
import { createPetReport } from '../lib/petService';
import { nearestDistrict } from '../lib/districtCoords';
import { compressImage } from '../lib/imageCompress';
import { checkImageContent } from '../lib/contentModeration';
import { useToast } from './Toast';
import ShareButtons from './ShareButtons';
import LocationMap from './LocationMap';

const DISTRICTS = [
  'Баянзүрх', 'Хан-Уул', 'Сүхбаатар', 'Чингэлтэй', 'Баянгол',
  'Сонгинохайрхан', 'Налайх', 'Багануур', 'Багахангай',
];

const STEPS = ['Зураг', 'Мэдээлэл', 'Байршил', 'Холбоо барих'];

export default function PetForm({ status }) {
  const showToast = useToast();
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
    true, // Зураг — заавал биш
    !!form.color, // Мэдээлэл — өнгө заавал
    !!form.place, // Байршил — газар заавал
    true,
  ][step];

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setStatusMsg('Илгээж байна...');
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
        <p>✅ Амжилттай нийтлэгдлээ! Илүү олон хүн харахын тулд хуваалцаарай:</p>
        <ShareButtons url={petUrl} title={status === 'lost' ? 'Алдсан амьтан' : 'Олдсон амьтан'} />
        <button onClick={() => setDone(false)} className="btn" style={{ marginTop: 16 }}>Дахин нэмэх</button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="pet-form" aria-label={status === 'lost' ? 'Алдсан амьтан мэдэгдэх форм' : 'Олдсон амьтан мэдэгдэх форм'}>
      {/* Явцын заагч */}
      <div className="progress-row" role="list" aria-label="Формын алхмууд">
        {STEPS.map((label, i) => (
          <div
            key={label}
            className={`progress-step ${i === step ? 'active' : i < step ? 'done' : ''}`}
            role="listitem"
            aria-current={i === step ? 'step' : undefined}
          >
            <div className="progress-dot" aria-hidden="true">{i < step ? '✓' : i + 1}</div>
            <span className="progress-label">{label}</span>
          </div>
        ))}
      </div>
      <p className="progress-text" aria-live="polite">{step + 1}/{STEPS.length}: {STEPS[step]}</p>

      {/* Алхам 0 — Зураг */}
      {step === 0 && (
        <>
          <label id="photo-label">Зураг</label>
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
              <img src={preview} alt="Сонгосон зургийн урьдчилсан харагдац" />
            ) : (
              <span id="photo-hint">📷 Зураг оруулах (заавал биш)</span>
            )}
          </div>
          <input
            id="photo-input" type="file" accept="image/*" onChange={handlePhoto}
            style={{ display: 'none' }} disabled={compressing}
            aria-label="Зураг сонгох"
          />
        </>
      )}

      {/* Алхам 1 — Мэдээлэл */}
      {step === 1 && (
        <>
          <label htmlFor="pet-name">Нэр (мэдэх бол)</label>
          <input id="pet-name" name="name" value={form.name} onChange={handleChange} placeholder="жишээ: Богино" />

          <label htmlFor="pet-type">Төрөл</label>
          <select id="pet-type" name="type" value={form.type} onChange={handleChange}>
            <option>Нохой</option>
            <option>Муур</option>
            <option>Бусад</option>
          </select>

          <label htmlFor="pet-color">Өнгө *</label>
          <input id="pet-color" name="color" value={form.color} onChange={handleChange} placeholder="жишээ: хар халзан" required />
        </>
      )}

      {/* Алхам 2 — Байршил */}
      {step === 2 && (
        <>
          <button type="button" onClick={handleUseLocation} disabled={locating} className="locate-btn">
            {locating ? '📍 Тодорхойлж байна...' : '📍 Миний байршлыг ашиглах'}
          </button>

          <label htmlFor="pet-district">Дүүрэг</label>
          <select id="pet-district" name="district" value={form.district} onChange={handleChange}>
            {DISTRICTS.map((d) => <option key={d}>{d}</option>)}
          </select>

          <label htmlFor="pet-place">{status === 'lost' ? 'Сүүлд харагдсан газар *' : 'Олдсон газар *'}</label>
          <input id="pet-place" name="place" value={form.place} onChange={handleChange} placeholder="жишээ: 3-р хороо, дэлгүүрийн ойролцоо" required />

          <label id="map-label">
            Газрын зураг дээр байршил тэмдэглэх <span style={{ fontWeight: 400, color: 'var(--muted)' }}>(заавал биш)</span>
          </label>
          <div aria-labelledby="map-label" role="application" aria-label="Байршил сонгох газрын зураг">
            <LocationMap lat={coords?.lat} lng={coords?.lng} editable onPick={setCoords} />
          </div>
          {coords && (
            <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }} aria-live="polite">
              📍 Байршил сонгогдлоо ({coords.lat.toFixed(4)}, {coords.lng.toFixed(4)})
            </p>
          )}
        </>
      )}

      {/* Алхам 3 — Холбоо барих */}
      {step === 3 && (
        <>
          <label htmlFor="pet-phone">Утасны дугаар *</label>
          <input id="pet-phone" name="phone" value={form.phone} onChange={handleChange} placeholder="99112233" required />

          {error && <p className="error" role="alert">{error}</p>}

          <button type="submit" disabled={submitting} className="btn btn-primary" aria-busy={submitting}>
            {submitting ? statusMsg || 'Илгээж байна...' : status === 'lost' ? 'Алдсан мэдэгдэл нийтлэх' : 'Олдсон мэдэгдэл нийтлэх'}
          </button>
          {submitting && statusMsg.includes('AI') && (
            <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6 }} aria-live="polite">
              Анхны хүсэлт 10-30 секунд удааширч болно, түр хүлээгээрэй...
            </p>
          )}
        </>
      )}

      {/* Алхмын товчнууд */}
      <div className="nav-row">
        {step > 0 && (
          <button type="button" onClick={() => setStep(step - 1)} className="btn nav-back">← Буцах</button>
        )}
        {step < STEPS.length - 1 && (
          <button
            type="button"
            onClick={() => canNext && setStep(step + 1)}
            disabled={!canNext}
            className="btn nav-next"
          >
            Дараах →
          </button>
        )}
      </div>

      <style jsx>{`
        .pet-form { display: flex; flex-direction: column; gap: 4px; max-width: 420px; }
        label { font-size: 13px; font-weight: 600; color: var(--primary); margin-top: 12px; display: block; }
        label:first-child { margin-top: 0; }
        input, select { padding: 10px 12px; border: 1.5px solid var(--line); border-radius: 9px; font-size: 14px; width: 100%; }
        input:focus-visible, select:focus-visible { outline: 2px solid var(--accent); outline-offset: 1px; }
        .upload-zone {
          border: 2px dashed var(--line); border-radius: 12px; padding: 20px;
          text-align: center; cursor: pointer; color: var(--muted); background: var(--bg);
        }
        .upload-zone:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
        .upload-zone img { max-width: 140px; border-radius: 10px; }
        .btn {
          padding: 12px; border-radius: 10px; border: none;
          font-weight: 600; cursor: pointer; font-size: 14.5px;
        }
        .btn:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
        .btn-primary { background: var(--brand); color: #fff; width: 100%; margin-top: 18px; }
        .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
        .error { color: var(--alert); font-size: 13px; margin-top: 8px; }
        .success-box { padding: 24px; background: var(--success-bg); border-radius: 12px; text-align: center; }

        .progress-row { display: flex; justify-content: space-between; margin-bottom: 4px; }
        .progress-step { display: flex; flex-direction: column; align-items: center; flex: 1; gap: 4px; }
        .progress-dot {
          width: 26px; height: 26px; border-radius: 50%; background: var(--line); color: var(--muted);
          display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700;
        }
        .progress-step.active .progress-dot { background: var(--accent); color: var(--primary); }
        .progress-step.done .progress-dot { background: var(--success); color: #fff; }
        .progress-label { font-size: 10.5px; color: var(--muted); text-align: center; }
        .progress-text { font-size: 12.5px; color: var(--muted); margin-bottom: 14px; text-align: center; }

        .locate-btn {
          padding: 10px 14px; border-radius: 9px; border: 1.5px solid var(--primary);
          background: var(--card); color: var(--primary); font-weight: 600; cursor: pointer; font-size: 13px; margin-bottom: 8px;
        }
        .locate-btn:disabled { opacity: 0.6; }
        .locate-btn:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }

        .nav-row { display: flex; gap: 10px; margin-top: 20px; }
        .nav-back { background: var(--eyebrow-bg); color: var(--primary); flex: 1; }
        .nav-next { background: var(--accent); color: var(--primary); flex: 1; }
        .nav-next:disabled { opacity: 0.5; cursor: not-allowed; }
      `}</style>
    </form>
  );
}
