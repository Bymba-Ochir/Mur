'use client';
import { useEffect, useState } from 'react';
import type { ChangeEvent } from 'react';
import { fetchPets, rankBySimilarity } from '../../lib/petService';
import { getImageEmbedding } from '../../lib/similarity';
import PetCard from '../../components/PetCard';
import NotifySubscribe from '../../components/NotifySubscribe';
import VolunteerBadge from '../../components/VolunteerBadge';
import SkeletonCard from '../../components/SkeletonCard';
import Link from 'next/link';
import { useLanguage } from '../../lib/i18n';
import { DISTRICTS as DISTRICT_VALUES } from '../../lib/districts';
import type { District } from '../../lib/districts';
import type { Pet, PetStatus, PetType } from '../../lib/types';
import { getErrorMessage } from '../../lib/utils';

// Шүүлтүүрийн "Бүгд" сонголт (хоосон) 9 дүүргийн өмнө явна
const DISTRICTS: (District | '')[] = ['', ...DISTRICT_VALUES];

export default function ListingsPage() {
  const { t } = useLanguage();
  const [status, setStatus] = useState<PetStatus | ''>('');
  const [type, setType] = useState<PetType | ''>('');
  const [district, setDistrict] = useState<District | ''>('');
  const [search, setSearch] = useState('');
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [matchFile, setMatchFile] = useState<File | null>(null);
  const [matching, setMatching] = useState<boolean | string>(false);
  const [matchError, setMatchError] = useState<string | null>(null);
  const [matchedCount, setMatchedCount] = useState<number | null>(null);

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

  async function handleMatchUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
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
      setMatchError(getErrorMessage(err) || 'Төстэй байдал тооцоход алдаа гарлаа. Дахин оролдоно уу.');
    } finally {
      setMatching(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <div className="eyebrow">{t('listings_eyebrow')}</div>
        <h1>{t('listings_title')}</h1>
      </div>

      <div className="filter-bar">
        <input
          type="text"
          placeholder={t('search_placeholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="filter"
          aria-label={t('search_placeholder')}
          style={{ flex: '1 1 220px', minWidth: 180 }}
        />
        <select className="filter" value={status} onChange={(e) => setStatus(e.target.value as PetStatus | '')} aria-label="Статусаар шүүх">
          <option value="">{t('filter_all')}</option>
          <option value="lost">{t('filter_lost')}</option>
          <option value="found">{t('filter_found')}</option>
        </select>
        <select className="filter" value={type} onChange={(e) => setType(e.target.value as PetType | '')} aria-label="Төрлөөр шүүх">
          <option value="">{t('filter_all_types')}</option>
          <option value="Нохой">{t('type_dog')}</option>
          <option value="Муур">{t('type_cat')}</option>
          <option value="Бусад">{t('type_other')}</option>
        </select>
        <select className="filter" value={district} onChange={(e) => setDistrict(e.target.value as District | '')} aria-label="Дүүргээр шүүх">
          {DISTRICTS.map((d) => (
            <option key={d} value={d}>{d || t('filter_all_districts')}</option>
          ))}
        </select>
      </div>

      {district && <VolunteerBadge district={district} />}
      {district && <NotifySubscribe district={district} />}

      <div className="match-upload">
        <input
          type="file" id="match-file" accept="image/*"
          onChange={handleMatchUpload} disabled={!!matching} className="file-input"
          aria-label="Төстэй байдлаар эрэмбэлэх зураг сонгох"
        />
        <label htmlFor="match-file" className="btn btn-ghost">{t('match_label')}</label>
        {matching && <span className="match-status"> — {typeof matching === 'string' ? matching : 'AI шинжилж байна (эхний удаа 10-30 сек)...'}</span>}
        {matchFile && !matching && !matchError && matchedCount === 0 && (
          <span className="match-status err">
            — Харьцуулах боломжтой бичлэг олдсонгүй (хуучин бичлэгүүд өөр
            embedding-тэй байж болзошгүй — шинээр бүртгэсэн 2 бичлэгээр туршина уу).
          </span>
        )}
        {matchFile && !matching && !matchError && matchedCount != null && matchedCount > 0 && (
          <span className="match-status"> — {matchedCount} бичлэгтэй харьцуулж эрэмбэлэгдлээ</span>
        )}
        {matchError && <span className="match-status err"> — {matchError}</span>}
      </div>

      {loading ? (
        <div className="grid">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : pets.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon" aria-hidden="true">
            <svg width="34" height="34" viewBox="0 0 48 48" fill="currentColor" focusable="false">
              <ellipse cx="24" cy="30" rx="11" ry="9" /><circle cx="10" cy="18" r="5.5" /><circle cx="38" cy="18" r="5.5" /><circle cx="17" cy="8" r="5" /><circle cx="31" cy="8" r="5" />
            </svg>
          </div>
          <p className="empty-title">
            {search || district || status || type ? t('empty_no_results_title') : t('empty_no_posts_title')}
          </p>
          <p className="empty-desc">
            {search || district || status || type ? t('empty_no_results_desc') : t('empty_no_posts_desc')}
          </p>
          <div className="empty-actions">
            <Link href="/report-lost" className="btn btn-accent">{t('hero_btn_lost')}</Link>
            <Link href="/report-found" className="btn btn-ghost">{t('hero_btn_found')}</Link>
          </div>
        </div>
      ) : (
        <>
          <div className="grid">
            {pets.map((p) => <PetCard key={p.id} pet={p} />)}
          </div>
          {hasMore && !matchFile && (
            <div className="load-more-wrap">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="btn btn-ghost"
              >
                {loadingMore ? t('loading_more') : t('load_more')}
              </button>
            </div>
          )}
        </>
      )}

      <style jsx>{`
        .match-upload { display: flex; align-items: center; gap: var(--sp-2); flex-wrap: wrap; margin-bottom: var(--sp-5); }
        @media (max-width: 640px) {
          .match-upload { margin-bottom: var(--sp-4); }
        }
        .file-input { position: absolute; width: 1px; height: 1px; opacity: 0; overflow: hidden; }
        .file-input:focus-visible + label { outline: 2.5px solid var(--accent); outline-offset: 2px; }
        .file-input:disabled + label { opacity: 0.6; cursor: not-allowed; }
        .match-status { font-size: 12px; color: var(--muted); line-height: 1.5; }
        @media (max-width: 480px) {
          .match-status { font-size: 13px; line-height: 1.6; width: 100%; margin-top: var(--sp-1); }
        }
        .match-status.err { color: var(--alert); }
        .empty-state {
          text-align: center; padding: 52px 24px; margin-top: var(--sp-2);
          background: var(--card); border: 1px solid var(--line); border-radius: var(--r-xl);
          box-shadow: var(--shadow-sm); position: relative; overflow: hidden;
        }
        .empty-state::before {
          content: ''; position: absolute; inset: -40% -20% auto; height: 80%;
          background: radial-gradient(60% 60% at 50% 0%, rgba(224,122,62,0.08), transparent 70%);
          pointer-events: none;
        }
        @media (max-width: 640px) {
          .empty-state { padding: 40px 20px; margin-top: var(--sp-3); border-radius: var(--r-lg); }
        }
        @media (max-width: 480px) {
          .empty-state { padding: 32px 16px; }
        }
        .empty-icon {
          position: relative;
          width: 72px; height: 72px; margin: 0 auto var(--sp-3);
          display: flex; align-items: center; justify-content: center;
          background: var(--eyebrow-bg); color: var(--primary);
          border: 1px solid var(--glass-border); border-radius: 50%;
        }
        @media (max-width: 480px) {
          .empty-icon { width: 76px; height: 76px; margin-bottom: var(--sp-4); }
        }
        .empty-title { font-weight: 700; color: var(--primary); font-size: 16px; margin-bottom: var(--sp-2); position: relative; }
        @media (max-width: 480px) {
          .empty-title { font-size: 17px; }
        }
        .empty-desc { color: var(--muted); font-size: 13.5px; margin-bottom: var(--sp-4); position: relative; }
        @media (max-width: 480px) {
          .empty-desc { font-size: 14px; margin-bottom: var(--sp-5); line-height: 1.6; }
        }
        .empty-actions { display: flex; gap: var(--sp-3); justify-content: center; flex-wrap: wrap; }
        @media (max-width: 480px) {
          .empty-actions { gap: var(--sp-2); flex-direction: column; }
          .empty-actions :global(.btn) { width: 100%; justify-content: center; }
        }
        .load-more-wrap { text-align: center; margin-top: var(--sp-6); }
        @media (max-width: 640px) {
          .load-more-wrap { margin-top: var(--sp-5); }
        }
      `}</style>
    </div>
  );
}
