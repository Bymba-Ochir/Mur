'use client';
import { useState } from 'react';
import { createPetReport } from '../lib/petService';

const DISTRICTS = [
  'Баянзүрх', 'Хан-Уул', 'Сүхбаатар', 'Чингэлтэй', 'Баянгол',
  'Сонгинохайрхан', 'Налайх', 'Багануур', 'Багахангай',
];

export default function PetForm({ status }) {
  // status: 'lost' | 'found'
  const [form, setForm] = useState({
    name: '', type: 'Нохой', color: '', place: '', district: DISTRICTS[0], phone: '',
  });
  const [photoFile, setPhotoFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
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

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await createPetReport({ ...form, status, photoFile });
      setDone(true);
      setForm({ name: '', type: 'Нохой', color: '', place: '', district: DISTRICTS[0], phone: '' });
      setPhotoFile(null);
      setPreview(null);
    } catch (err) {
      console.error(err);
      setError('Алдаа гарлаа. Дахин оролдоно уу. (Firebase тохиргоо шалгах хэрэгтэй байж болно)');
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="success-box">
        <p>✅ Амжилттай нийтлэгдлээ! Жагсаалт хэсгээс харагдана.</p>
        <button onClick={() => setDone(false)} className="btn">Дахин нэмэх</button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="pet-form">
      <label>Зураг</label>
      <div className="upload-zone" onClick={() => document.getElementById('photo-input').click()}>
        {preview ? <img src={preview} alt="preview" /> : <span>📷 Зураг оруулах</span>}
      </div>
      <input id="photo-input" type="file" accept="image/*" onChange={handlePhoto} style={{ display: 'none' }} />

      <label>Нэр (мэдэх бол)</label>
      <input name="name" value={form.name} onChange={handleChange} placeholder="жишээ: Богино" />

      <label>Төрөл</label>
      <select name="type" value={form.type} onChange={handleChange}>
        <option>Нохой</option>
        <option>Муур</option>
        <option>Бусад</option>
      </select>

      <label>Өнгө</label>
      <input name="color" value={form.color} onChange={handleChange} placeholder="жишээ: хар халзан" required />

      <label>Дүүрэг</label>
      <select name="district" value={form.district} onChange={handleChange}>
        {DISTRICTS.map((d) => <option key={d}>{d}</option>)}
      </select>

      <label>{status === 'lost' ? 'Сүүлд харагдсан газар' : 'Олдсон газар'}</label>
      <input name="place" value={form.place} onChange={handleChange} placeholder="жишээ: 3-р хороо, дэлгүүрийн ойролцоо" required />

      <label>Утасны дугаар</label>
      <input name="phone" value={form.phone} onChange={handleChange} placeholder="99112233" required />

      {error && <p className="error">{error}</p>}

      <button type="submit" disabled={submitting} className="btn btn-primary">
        {submitting ? 'Илгээж байна...' : status === 'lost' ? 'Алдсан мэдэгдэл нийтлэх' : 'Олдсон мэдэгдэл нийтлэх'}
      </button>

      <style jsx>{`
        .pet-form { display: flex; flex-direction: column; gap: 4px; max-width: 420px; }
        label { font-size: 13px; font-weight: 600; color: #1F4B5C; margin-top: 12px; }
        input, select { padding: 10px 12px; border: 1.5px solid #E1E4DF; border-radius: 9px; font-size: 14px; }
        .upload-zone {
          border: 2px dashed #E1E4DF; border-radius: 12px; padding: 20px;
          text-align: center; cursor: pointer; color: #6B7680; background: #FBFBFA;
        }
        .upload-zone img { max-width: 140px; border-radius: 10px; }
        .btn {
          margin-top: 18px; padding: 12px; border-radius: 10px; border: none;
          font-weight: 600; cursor: pointer; font-size: 14.5px;
        }
        .btn-primary { background: #1F4B5C; color: #fff; }
        .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
        .error { color: #C6473B; font-size: 13px; margin-top: 8px; }
        .success-box { padding: 24px; background: #F0F6F1; border-radius: 12px; text-align: center; }
      `}</style>
    </form>
  );
}
