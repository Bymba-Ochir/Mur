'use client';
import { useEffect, useState } from 'react';
import { fetchPets, rankBySimilarity } from '../../lib/petService';
import { getImageEmbedding } from '../../lib/similarity';
import PetCard from '../../components/PetCard';
import NotifySubscribe from '../../components/NotifySubscribe';
import VolunteerBadge from '../../components/VolunteerBadge';
import SkeletonCard from '../../components/SkeletonCard';
import Link from 'next/link';
import { useLanguage } from '../../lib/i18n';

const DISTRICTS = [
  '', 'Баянзүрх', 'Хан-Уул', 'Сүхбаатар', 'Чингэлтэй', 'Баянгол',
  'Сонгинохайрхан', 'Налайх', 'Багануур', 'Багахангай',
];

export default function ListingsPage() {
  const { t } = useLanguage();
  const [status, setStatus] = useState('');
  const [type, setType] = useState('');
  const [district, setDistrict] = useState('');
  const [search, setSearch] = useState('');
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [matchFile, setMatchFile] = useState(null);
  const [matching, setMatching] = useState(false);
  const [matchError, setMatchError] = useState(null);
  const [matchedCount, setMatchedCount] = useState(null);

  useEffect(() => {
    // Шүүлтүүр өөрчлөгдөхөд эхний хуудаснаас дахин ачаална
    const timer = setTimeout(() => load(0), 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, type, district, search]);

  async function load(pageToLoad = 0) {
    if (pageToLoad === 0) setLoading(true);
    else setLoadingMore(true);
    try {
      const { pets: data, hasMore: more } = await fetchPets({
        status: status || undefined,
        type: type || undefined,
        district: district || undefined,
        search: search || undefined,
        page: pageToLoad,
      });
      setPets((prev) => (pageToLoad === 0 ? data : [...prev, ...data]));
      setHasMore(more);
      setPage(pageToLoad);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }

  function handleLoadMore() {
    load(page + 1);
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
      <div className="eyebrow">{t('listings_eyebrow')}</div>
      <h1 style={{ fontSize: 26, marginBottom: 16 }}>{t('listings_title')}</h1>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 8 }}>
        <input
          type="text"
          placeholder={t('search_placeholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="filter"
          aria-label={t('search_placeholder')}
          style={{ flex: '1 1 220px', minWidth: 180 }}
        />
        <select className="filter" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Статусаар шүүх">
          <option value="">{t('filter_all')}</option>
          <option value="lost">{t('filter_lost')}</option>
          <option value="found">{t('filter_found')}</option>
        </select>
        <select className="filter" value={type} onChange={(e) => setType(e.target.value)} aria-label="Төрлөөр шүүх">
          <option value="">{t('filter_all_types')}</option>
          <option value="Нохой">{t('type_dog')}</option>
          <option value="Муур">{t('type_cat')}</option>
          <option value="Бусад">{t('type_other')}</option>
        </select>
        <select className="filter" value={district} onChange={(e) => setDistrict(e.target.value)} aria-label="Дүүргээр шүүх">
          {DISTRICTS.map((d) => (
            <option key={d} value={d}>{d || t('filter_all_districts')}</option>
          ))}
        </select>
      </div>

      {district && <VolunteerBadge district={district} />}
      {district && <NotifySubscribe district={district} />}

      <div style={{ marginBottom: 20 }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--primary)' }}>
          {t('match_label')}{' '}
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
          border: '1px dashed var(--line)', borderRadius: 'var(--r-lg)', marginTop: 8,
        }}>
          <div style={{ fontSize: 46, marginBottom: 10 }}>🐾</div>
          <p style={{ fontWeight: 600, color: 'var(--primary)', marginBottom: 4 }}>
            {search || district || status || type ? t('empty_no_results_title') : t('empty_no_posts_title')}
          </p>
          <p style={{ color: 'var(--muted)', fontSize: 13.5, marginBottom: 18 }}>
            {search || district || status || type ? t('empty_no_results_desc') : t('empty_no_posts_desc')}
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/report-lost" className="btn btn-accent">{t('hero_btn_lost')}</Link>
            <Link href="/report-found" className="btn btn-primary">{t('hero_btn_found')}</Link>
          </div>
        </div>
      ) : (
        <>
          <div className="grid">
            {pets.map((p) => <PetCard key={p.id} pet={p} />)}
          </div>
          {hasMore && !matchFile && (
            <div style={{ textAlign: 'center', marginTop: 'var(--sp-5)' }}>
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="btn"
                style={{ background: 'var(--eyebrow-bg)', color: 'var(--primary)' }}
              >
                {loadingMore ? t('loading_more') : t('load_more')}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
