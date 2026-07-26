'use client';
import { useEffect, useState } from 'react';
import { fetchPets, rankBySimilarity } from '../../lib/petService';
import { getImageEmbedding } from '../../lib/similarity';
import PetCard from '../../components/PetCard';
import NotifySubscribe from '../../components/NotifySubscribe';

const DISTRICTS = [
  '', 'Баянзүрх', 'Хан-Уул', 'Сүхбаатар', 'Чингэлтэй', 'Баянгол',
  'Сонгинохайрхан', 'Налайх', 'Багануур', 'Багахангай',
];

export default function ListingsPage() {
  const [status, setStatus] = useState('');
  const [district, setDistrict] = useState('');
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [matchFile, setMatchFile] = useState(null);
  const [matching, setMatching] = useState(false);
  const [matchError, setMatchError] = useState(null);
  const [matchedCount, setMatchedCount] = useState(null);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, district]);

  async function load() {
    setLoading(true);
    try {
      const data = await fetchPets({
        status: status || undefined,
        district: district || undefined,
      });
      setPets(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleMatchUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    setMatchFile(file);
    setMatching(true);
    setMatchError(null);
    try {
      const embedding = await getImageEmbedding(file, (msg) => setMatching(msg));
      setPets((prev) => {
        const ranked = rankBySimilarity(embedding, prev);
        setMatchedCount(ranked.length);
        return ranked;
      });
    } catch (err) {
      setMatchError(err.message || 'Төстэй байдал тооцоход алдаа гарлаа. Дахин оролдоно уу.');
    } finally {
      setMatching(false);
    }
  }

  return (
    <div>
      <div className="eyebrow">🔍 Жагсаалт</div>
      <h1 style={{ fontSize: 26, marginBottom: 16 }}>Алдсан ба олдсон амьтад</h1>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 8 }}>
        <select className="filter" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Бүгд</option>
          <option value="lost">Алдсан</option>
          <option value="found">Олдсон</option>
        </select>
        <select className="filter" value={district} onChange={(e) => setDistrict(e.target.value)}>
          {DISTRICTS.map((d) => (
            <option key={d} value={d}>{d || 'Бүх дүүрэг'}</option>
          ))}
        </select>
      </div>

      {district && <NotifySubscribe district={district} />}

      <div style={{ marginBottom: 20 }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: '#1F4B5C' }}>
          Өөрийн зурагтай төстэйгээр эрэмбэлэх (туршилт):{' '}
        </label>
        <input type="file" accept="image/*" onChange={handleMatchUpload} disabled={!!matching} />
        {matching && <span style={{ fontSize: 12, color: '#6B7680' }}> — {typeof matching === 'string' ? matching : 'AI шинжилж байна (эхний удаа 10-30 сек)...'}</span>}
        {matchFile && !matching && !matchError && matchedCount === 0 && (
          <span style={{ fontSize: 12, color: '#C6473B' }}>
            {' '}— Харьцуулах боломжтой бичлэг олдсонгүй (хуучин бичлэгүүд өөр
            embedding-тэй байж болзошгүй — шинээр бүртгэсэн 2 бичлэгээр туршина уу).
          </span>
        )}
        {matchFile && !matching && !matchError && matchedCount > 0 && (
          <span style={{ fontSize: 12, color: '#6B7680' }}> — {matchedCount} бичлэгтэй харьцуулж эрэмбэлэгдлээ</span>
        )}
        {matchError && <span style={{ fontSize: 12, color: '#C6473B' }}> — {matchError}</span>}
      </div>

      {loading ? (
        <p style={{ color: '#6B7680' }}>Ачааллаж байна...</p>
      ) : pets.length === 0 ? (
        <p style={{ color: '#6B7680' }}>Одоогоор бүртгэл алга.</p>
      ) : (
        <div className="grid">
          {pets.map((p) => <PetCard key={p.id} pet={p} />)}
        </div>
      )}
    </div>
  );
}
