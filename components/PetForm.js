'use client';
import { useState } from 'react';
import { createPetReport } from '../lib/petService';
import { nearestDistrict } from '../lib/districtCoords';
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
  const [submitting, setSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [done, setDone] = useState(false);
  const [newPetId, setNewPetId] = useState(null);
  const [error, setError] = useState(null);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handlePhoto(e) {
    const file = e.target.files[0];
    if (!file) return;
    setPhotoFile(file);
    setPreview(URL.createObjectURL(file));
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
      setError('Алдаа гарлаа. Дахин оролдоно уу.');
    } finally {
      setSubmitting(false);
      setStatusMsg('');
    }
  }

  if (done) {
    const petUrl = typeof window !== 'undefined' ? `${window.location.origin}/pets/${newPetId}` : '';
    return (
      <div className="success-box">
        <p>✅ Амжилттай нийтлэгдлээ! Илүү олон хүн харахын тулд хуваалцаарай:</p>
        <ShareButtons url={petUrl} title={status === 'lost' ? 'Алдсан амьтан' : 'Олдсон амьтан'} />
        <button onClick={() => setDone(false)} className="btn" style={{ marginTop: 16 }}>Дахин нэмэх</button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="pet-form">
      {/* Явцын заагч */}
      <div className="progress-row">
        {STEPS.map((label, i) => (
          <div key={label} className={`progress-step ${i === step ? 'active' : i < step ? 'done' : ''}`}>
            <div className="progress-dot">{i < step ? '✓' : i + 1}</div>
            <span className="progress-label">{label}</span>
          </div>
        ))}
      </div>
      <p className="progress-text">{step + 1}/{STEPS.length}: {STEPS[step]}</p>

      {/* Алхам 0 — Зураг */}
      {step === 0 && (
        <>
          <label>Зураг</label>
          <div className="upload-zone" onClick={() => document.getElementById('photo-input').click()}>
            {preview ? <img src={preview} alt="preview" /> : <span>📷 Зураг оруулах (заавал биш)</span>}
          </div>
          <input id="photo-input" type="file" accept="image/*" onChange={handlePhoto} style={{ display: 'none' }} />
        </>
      )}

      {/* Алхам 1 — Мэдээлэл */}
      {step === 1 && (
        <>
          <label>Нэр (мэдэх бол)</label>
          <input name="name" value={form.name} onChange={handleChange} placeholder="жишээ: Богино" />

          <label>Төрөл</label>
          <select name="type" value={form.type} onChange={handleChange}>
            <option>Нохой</option>
            <option>Муур</option>
            <option>Бусад</option>
          </select>

          <label>Өнгө *</label>
          <input name="color" value={form.color} onChange={handleChange} placeholder="жишээ: хар халзан" required />
        </>
      )}

      {/* Алхам 2 — Байршил */}
      {step === 2 && (
        <>
          <button type="button" onClick={handleUseLocation} disabled={locating} className="locate-btn">
            {locating ? '📍 Тодорхойлж байна...' : '📍 Миний байршлыг ашиглах'}
          </button>

          <label>Дүүрэг</label>
          <select name="district" value={form.district} onChange={handleChange}>
            {DISTRICTS.map((d) => <option key={d}>{d}</option>)}
          </select>

          <label>{status === 'lost' ? 'Сүүлд харагдсан газар *' : 'Олдсон газар *'}</label>
          <input name="place" value={form.place} onChange={handleChange} placeholder="жишээ: 3-р хороо, дэлгүүрийн ойролцоо" required />

          <label>
            Газрын зураг дээр байршил тэмдэглэх <span style={{ fontWeight: 400, color: '#6B7680' }}>(заавал биш)</span>
          </label>
          <LocationMap lat={coords?.lat} lng={coords?.lng} editable onPick={setCoords} />
          {coords && (
            <p style={{ fontSize: 12, color: '#6B7680', marginTop: 4 }}>
              📍 Байршил сонгогдлоо ({coords.lat.toFixed(4)}, {coords.lng.toFixed(4)})
            </p>
          )}
        </>
      )}

      {/* Алхам 3 — Холбоо барих */}
      {step === 3 && (
        <>
          <label>Утасны дугаар *</label>
          <input name="phone" value={form.phone} onChange={handleChange} placeholder="99112233" required />

          {error && <p className="error">{error}</p>}

          <button type="submit" disabled={submitting} className="btn btn-primary">
            {submitting ? statusMsg || 'Илгээж байна...' : status === 'lost' ? 'Алдсан мэдэгдэл нийтлэх' : 'Олдсон мэдэгдэл нийтлэх'}
          </button>
          {submitting && statusMsg.includes('AI') && (
            <p style={{ fontSize: 12, color: '#6B7680', marginTop: 6 }}>
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
        label { font-size: 13px; font-weight: 600; color: #1F4B5C; margin-top: 12px; }
        label:first-child { margin-top: 0; }
        input, select { padding: 10px 12px; border: 1.5px solid #E1E4DF; border-radius: 9px; font-size: 14px; }
        .upload-zone {
          border: 2px dashed #E1E4DF; border-radius: 12px; padding: 20px;
          text-align: center; cursor: pointer; color: #6B7680; background: #FBFBFA;
        }
        .upload-zone img { max-width: 140px; border-radius: 10px; }
        .btn {
          padding: 12px; border-radius: 10px; border: none;
          font-weight: 600; cursor: pointer; font-size: 14.5px;
        }
        .btn-primary { background: #1F4B5C; color: #fff; width: 100%; margin-top: 18px; }
        .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
        .error { color: #C6473B; font-size: 13px; margin-top: 8px; }
        .success-box { padding: 24px; background: #F0F6F1; border-radius: 12px; text-align: center; }

        .progress-row { display: flex; justify-content: space-between; margin-bottom: 4px; }
        .progress-step { display: flex; flex-direction: column; align-items: center; flex: 1; gap: 4px; }
        .progress-dot {
          width: 26px; height: 26px; border-radius: 50%; background: #E1E4DF; color: #6B7680;
          display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700;
        }
        .progress-step.active .progress-dot { background: #E8A33D; color: #1F4B5C; }
        .progress-step.done .progress-dot { background: #4C8C6B; color: #fff; }
        .progress-label { font-size: 10.5px; color: #6B7680; text-align: center; }
        .progress-text { font-size: 12.5px; color: #6B7680; margin-bottom: 14px; text-align: center; }

        .locate-btn {
          padding: 10px 14px; border-radius: 9px; border: 1.5px solid #1F4B5C;
          background: #fff; color: #1F4B5C; font-weight: 600; cursor: pointer; font-size: 13px; margin-bottom: 8px;
        }
        .locate-btn:disabled { opacity: 0.6; }

        .nav-row { display: flex; gap: 10px; margin-top: 20px; }
        .nav-back { background: #E9EFE9; color: #1F4B5C; flex: 1; }
        .nav-next { background: #E8A33D; color: #1F4B5C; flex: 1; }
        .nav-next:disabled { opacity: 0.5; cursor: not-allowed; }
      `}</style>
    </form>
  );
}
