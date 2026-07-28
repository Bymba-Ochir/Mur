'use client';
import { useEffect, useState } from 'react';
import { fetchPets, rankBySimilarity } from '../../lib/petService';
import { getImageEmbedding } from '../../lib/similarity';
import PetCard from '../../components/PetCard';
import NotifySubscribe from '../../components/NotifySubscribe';
import VolunteerBadge from '../../components/VolunteerBadge';
import SkeletonCard from '../../components/SkeletonCard';
import Link from 'next/link';

const DISTRICTS = [
  '', 'Баянзүрх', 'Хан-Уул', 'Сүхбаатар', 'Чингэлтэй', 'Баянгол',
  'Сонгинохайрхан', 'Налайх', 'Багануур', 'Багахангай',
];

export default function ListingsPage() {
  const [status, setStatus] = useState('');
  const [district, setDistrict] = useState('');
  const [search, setSearch] = useState('');
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [matchFile, setMatchFile] = useState(null);
  const [matching, setMatching] = useState(false);
  const [matchError, setMatchError] = useState(null);
  const [matchedCount, setMatchedCount] = useState(null);

  useEffect(() => {
    // Хайлтын текст бичих бүрд шууд дуудахгүй, 400мс хүлээгээд дуудна (debounce)
    const timer = setTimeout(load, 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, district, search]);

  async function load() {
    setLoading(true);
    try {
      const data = await fetchPets({
        status: status || undefined,
        district: district || undefined,
        search: search || undefined,
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
        <input
          type="text"
          placeholder="🔍 Нэр, өнгө, байршлаар хайх..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="filter"
          aria-label="Нэр, өнгө, байршлаар хайх"
          style={{ flex: '1 1 220px', minWidth: 180 }}
        />
        <select className="filter" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Статусаар шүүх">
          <option value="">Бүгд</option>
          <option value="lost">Алдсан</option>
          <option value="found">Олдсон</option>
        </select>
        <select className="filter" value={district} onChange={(e) => setDistrict(e.target.value)} aria-label="Дүүргээр шүүх">
          {DISTRICTS.map((d) => (
            <option key={d} value={d}>{d || 'Бүх дүүрэг'}</option>
          ))}
        </select>
      </div>

      {district && <VolunteerBadge district={district} />}
      {district && <NotifySubscribe district={district} />}

      <div style={{ marginBottom: 20 }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--primary)' }}>
          Өөрийн зурагтай төстэйгээр эрэмбэлэх (туршилт):{' '}
        </label>
        <input type="file" accept="image/*" onChange={handleMatchUpload} disabled={!!matching} aria-label="Төстэй байдлаар эрэмбэлэх зураг сонгох" />
        {matching && <span style={{ fontSize: 12, color: 'var(--muted)' }}> — {typeof matching === 'string' ? matching : 'AI шинжилж байна (эхний удаа 10-30 сек)...'}</span>}
        {matchFile && !matching && !matchError && matchedCount === 0 && (
          <span style={{ fontSize: 12, color: 'var(--alert)' }}>
            {' '}— Харьцуулах боломжтой бичлэг олдсонгүй (хуучин бичлэгүүд өөр
            embedding-тэй байж болзошгүй — шинээр бүртгэсэн 2 бичлэгээр туршина уу).
          </span>
        )}
        {matchFile && !matching && !matchError && matchedCount > 0 && (
          <span style={{ fontSize: 12, color: 'var(--muted)' }}> — {matchedCount} бичлэгтэй харьцуулж эрэмбэлэгдлээ</span>
        )}
        {matchError && <span style={{ fontSize: 12, color: 'var(--alert)' }}> — {matchError}</span>}
      </div>

      {loading ? (
        <div className="grid">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : pets.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '48px 20px', background: 'var(--card)',
          border: '1px dashed var(--line)', borderRadius: 16, marginTop: 8,
        }}>
          <div style={{ fontSize: 46, marginBottom: 10 }}>🐾</div>
          <p style={{ fontWeight: 600, color: 'var(--primary)', marginBottom: 4 }}>
            {search || district || status ? 'Хайлтад тохирох бичлэг олдсонгүй' : 'Одоогоор бичлэг алга'}
          </p>
          <p style={{ color: 'var(--muted)', fontSize: 13.5, marginBottom: 18 }}>
            {search || district || status
              ? 'Шүүлтүүрээ өөрчилж эсвэл цэвэрлээд дахин үзнэ үү.'
              : 'Хамгийн эхний мэдэгдлийг та нийтэлж болно.'}
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/report-lost" className="btn btn-accent">🐾 Алдсан мэдэгдэх</Link>
            <Link href="/report-found" className="btn btn-primary">👀 Олсон зурагтай</Link>
          </div>
        </div>
      ) : (
        <div className="grid">
          {pets.map((p) => <PetCard key={p.id} pet={p} />)}
        </div>
      )}
    </div>
  );
}
