'use client';
import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { fetchPets, fetchPetMatches, rankBySimilarity } from '../../lib/petService';
import { getImageEmbedding, getImageHash, preloadImageModel } from '../../lib/similarity';
import PetCard from '../../components/PetCard';
import NotifySubscribe from '../../components/NotifySubscribe';
import VolunteerBadge from '../../components/VolunteerBadge';
import SkeletonCard from '../../components/SkeletonCard';
import Button from '../../components/ui/Button';
import Link from 'next/link';
import { useLanguage } from '../../lib/i18n';
import { DISTRICTS as DISTRICT_VALUES } from '../../lib/districts';
import type { District } from '../../lib/districts';
import type { Pet, PetStatus, PetType } from '../../lib/types';
import { getErrorMessage } from '../../lib/utils';
import { saveSearch } from '../../lib/listingService';
import { useToast } from '../../components/Toast';
import PetResultsMap from '../../components/PetResultsMap';

// Шүүлтүүрийн "Бүгд" сонголт (хоосон) 9 дүүргийн өмнө явна
const DISTRICTS: (District | '')[] = ['', ...DISTRICT_VALUES];

export default function ListingsPage() {
  const { t } = useLanguage();
  const showToast = useToast();
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
  const [matchIntent, setMatchIntent] = useState<PetStatus>('lost');
  const [sortBy, setSortBy] = useState<'newest' | 'match' | 'popular'>('newest');
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [matching, setMatching] = useState<boolean | string>(false);
  const [matchError, setMatchError] = useState<string | null>(null);
  const [matchedCount, setMatchedCount] = useState<number | null>(null);
  const [matchSource, setMatchSource] = useState<'database' | 'browser' | null>(null);
  const matchAbortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // Шүүлтүүр өөрчлөгдөхөд эхний хуудаснаас дахин ачаална
    const timer = setTimeout(() => load(0), 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, type, district, search]);

  useEffect(() => {
    const timer = window.setTimeout(() => { preloadImageModel().catch(() => undefined); }, 800);
    return () => window.clearTimeout(timer);
  }, []);

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
    setMatchedCount(null);
    setMatchSource(null);
    matchAbortRef.current?.abort();
    const controller = new AbortController();
    matchAbortRef.current = controller;
    try {
      const [embedding, imageHash] = await Promise.all([
        getImageEmbedding(file, (msg) => setMatching(msg), controller.signal),
        getImageHash(file),
      ]);
      setMatching('Бүх зар дундаас тохирол хайж байна...');
      const databaseMatches = await fetchPetMatches({
        embedding,
        imageHash,
        status: status || undefined,
        type: type || undefined,
        district: district || undefined,
      });
      if (controller.signal.aborted) return;
      if (databaseMatches) {
        setPets(databaseMatches);
        setMatchedCount(databaseMatches.length);
        setMatchSource('database');
        setHasMore(false);
      } else {
        setPets((prev) => {
          const ranked = rankBySimilarity(embedding, prev);
          setMatchedCount(ranked.length);
          return ranked;
        });
        setMatchSource('browser');
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setMatchError(getErrorMessage(err) || 'Төстэй байдал тооцоход алдаа гарлаа. Дахин оролдоно уу.');
    } finally {
      if (!controller.signal.aborted) setMatching(false);
    }
  }

  function cancelMatching() {
    matchAbortRef.current?.abort();
    setMatching(false);
    setMatchError(null);
  }

  const sortedPets = [...pets].sort((a, b) => sortBy === 'match'
    ? (b.hybridScore ?? b.similarity ?? 0) - (a.hybridScore ?? a.similarity ?? 0)
    : sortBy === 'popular' ? (b.favoriteCount ?? 0) - (a.favoriteCount ?? 0)
    : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div>
      <div className="page-header">
        <div className="eyebrow">{t('listings_eyebrow')}</div>
        <h1>{t('listings_title')}</h1>
      </div>

      <section className="search-panel" aria-label="Зарын хайлт ба шүүлтүүр">
        <div className="search-row">
          <label className="search-field">
            <span className="field-label">Хайх</span>
            <input
              type="search"
              placeholder={t('search_placeholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="filter"
              aria-label={t('search_placeholder')}
            />
          </label>
          <label>
            <span className="field-label">Төлөв</span>
            <select className="filter" value={status} onChange={(e) => setStatus(e.target.value as PetStatus | '')}>
              <option value="">{t('filter_all')}</option>
              <option value="lost">{t('filter_lost')}</option>
              <option value="found">{t('filter_found')}</option>
            </select>
          </label>
          <label>
            <span className="field-label">Амьтны төрөл</span>
            <select className="filter" value={type} onChange={(e) => setType(e.target.value as PetType | '')}>
              <option value="">{t('filter_all_types')}</option>
              <option value="Нохой">{t('type_dog')}</option>
              <option value="Муур">{t('type_cat')}</option>
              <option value="Бусад">{t('type_other')}</option>
            </select>
          </label>
          <label>
            <span className="field-label">Байршил</span>
            <select className="filter" value={district} onChange={(e) => setDistrict(e.target.value as District | '')}>
              {DISTRICTS.map((d) => <option key={d} value={d}>{d || t('filter_all_districts')}</option>)}
            </select>
          </label>
        </div>

        <div className="toolbar-row">
          <label className="sort-field">
            <span className="field-label">Эрэмбэлэх</span>
            <select className="filter" value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)}>
              <option value="newest">Хамгийн шинэ</option>
              <option value="match">AI тохирол өндөр</option>
              <option value="popular">Хамгийн их хадгалсан</option>
            </select>
          </label>
          <div className="toolbar-actions">
            {(search || status || type || district) && <Button variant="ghost" onClick={() => { setSearch(''); setStatus(''); setType(''); setDistrict(''); }}>Шүүлтүүр цэвэрлэх</Button>}
            <Button variant="ghost" onClick={() => setViewMode((mode) => mode === 'list' ? 'map' : 'list')}>{viewMode === 'list' ? 'Газрын зураг' : 'Жагсаалт'}</Button>
            <Button variant="ghost" onClick={async () => { try { await saveSearch({ status: status || undefined, petType: type || undefined, district: district || undefined, searchText: search }); showToast('Хайлт хадгалагдлаа. Шинэ зарын мэдэгдэл авах боломжтой.', 'success'); } catch { showToast('Хайлт хадгалахын тулд нэвтэрнэ үү', 'info'); } }}>Хайлтаа хадгалах</Button>
            <Button as="link" href="/saved" variant="ghost">Хадгалсан зүйлс</Button>
          </div>
        </div>

        <div className="ai-search-row">
          <div className="ai-copy"><strong>Зургаар төстэй амьтан хайх</strong><span>AI зураг харьцуулж, боломжит тохирлыг эрэмбэлнэ.</span></div>
          <select className="filter match-intent" value={matchIntent} onChange={(e) => setMatchIntent(e.target.value as PetStatus)} aria-label="Оруулж буй зургийн статус">
            <option value="lost">Алдсан амьтны зураг</option>
            <option value="found">Олсон амьтны зураг</option>
          </select>
          <input type="file" id="match-file" accept="image/*" onChange={handleMatchUpload} disabled={!!matching} className="file-input" aria-label="Төстэй байдлаар эрэмбэлэх зураг сонгох" />
          <Button as="label" htmlFor="match-file" variant="primary">Зураг сонгох</Button>
          {matching && <Button variant="ghost" onClick={cancelMatching}>{t('match_cancel')}</Button>}
        </div>
        {matching && <p className="match-status">{typeof matching === 'string' ? matching : 'AI шинжилж байна (эхний удаа 10–30 секунд)...'}</p>}
        {matchFile && !matching && !matchError && matchedCount === 0 && <p className="match-status err">Харьцуулах боломжтой шинэ embedding-тэй бичлэг олдсонгүй.</p>}
        {matchFile && !matching && !matchError && matchedCount != null && matchedCount > 0 && <p className="match-status">{matchedCount} {t('match_results')} · {matchSource === 'database' ? t('match_all_database') : t('match_browser_fallback')}</p>}
        {matchError && <p className="match-status err">{matchError}</p>}
      </section>

      {district && <VolunteerBadge district={district} />}
      {district && <NotifySubscribe district={district} />}

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
            <Button as="link" href="/report-lost" variant="accent">{t('hero_btn_lost')}</Button>
            <Button as="link" href="/report-found" variant="ghost">{t('hero_btn_found')}</Button>
          </div>
        </div>
      ) : (
        <>
          <p className="result-count">{pets.length} {t('results_count')}</p>
          {viewMode === 'map' ? <PetResultsMap pets={sortedPets} /> : <div className="grid">{sortedPets.map((p) => <PetCard key={p.id} pet={p} />)}</div>}
          {hasMore && !matchFile && (
            <div className="load-more-wrap">
              <Button onClick={handleLoadMore} disabled={loadingMore} variant="ghost">
                {loadingMore ? t('loading_more') : t('load_more')}
              </Button>
            </div>
          )}
        </>
      )}

      <style jsx>{`
        .search-panel {
          margin-bottom: var(--sp-5); padding: 20px;
          background: var(--card); border: 1px solid var(--line); border-radius: var(--r-xl);
          box-shadow: var(--shadow-sm);
        }
        .search-row {
          display: grid; grid-template-columns: minmax(260px, 1.7fr) repeat(3, minmax(150px, 1fr));
          gap: 12px; align-items: end;
        }
        .search-row label, .sort-field { min-width: 0; }
        .field-label {
          display: block; margin: 0 0 7px 3px; color: var(--muted);
          font-size: 11px; font-weight: 700; letter-spacing: .04em;
        }
        .search-panel .filter { width: 100%; min-width: 0; }
        .toolbar-row {
          display: flex; align-items: end; justify-content: space-between; gap: 14px;
          margin-top: 14px; padding-top: 14px; border-top: 1px solid var(--line);
        }
        .sort-field { width: min(260px, 100%); flex: 0 0 240px; }
        .toolbar-actions { display: flex; justify-content: flex-end; gap: 8px; flex-wrap: wrap; }
        .ai-search-row {
          display: grid; grid-template-columns: minmax(230px, 1fr) minmax(190px, 260px) auto auto;
          align-items: center; gap: 10px; margin-top: 16px; padding: 15px;
          background: var(--eyebrow-bg); border: 1px solid var(--glass-border); border-radius: var(--r-lg);
        }
        .ai-copy { display: flex; flex-direction: column; gap: 3px; }
        .ai-copy strong { color: var(--primary); font-size: 14px; }
        .ai-copy span { color: var(--muted); font-size: 11.5px; line-height: 1.45; }
        .file-input { position: absolute; width: 1px; height: 1px; opacity: 0; overflow: hidden; }
        .file-input:focus-visible + label { outline: 2.5px solid var(--accent); outline-offset: 2px; }
        .file-input:disabled + label { opacity: 0.6; cursor: not-allowed; }
        .match-status { margin: 10px 4px 0; font-size: 12px; color: var(--muted); line-height: 1.5; }
        .match-status.err { color: var(--alert); }
        @media (max-width: 1100px) {
          .search-row { grid-template-columns: minmax(240px, 1.5fr) repeat(2, minmax(150px, 1fr)); }
          .search-row label:last-child { grid-column: span 1; }
          .ai-search-row { grid-template-columns: 1fr minmax(190px, 240px) auto; }
          .ai-search-row :global(.btn-base:last-child) { grid-column: 3; }
        }
        @media (max-width: 760px) {
          .search-panel { padding: 15px; border-radius: var(--r-lg); }
          .search-row { grid-template-columns: 1fr 1fr; }
          .search-field { grid-column: 1 / -1; }
          .toolbar-row { align-items: stretch; flex-direction: column; }
          .sort-field { width: 100%; flex-basis: auto; }
          .toolbar-actions { justify-content: stretch; display: grid; grid-template-columns: 1fr 1fr; }
          .toolbar-actions :global(.btn-base) { justify-content: center; width: 100%; }
          .ai-search-row { grid-template-columns: 1fr 1fr; }
          .ai-copy { grid-column: 1 / -1; }
        }
        @media (max-width: 480px) {
          .search-panel { padding: 12px; }
          .search-row, .ai-search-row, .toolbar-actions { grid-template-columns: 1fr; }
          .search-field, .ai-copy { grid-column: auto; }
          .ai-search-row :global(.btn-base), .ai-search-row .filter { width: 100%; justify-content: center; }
          .match-status { font-size: 13px; line-height: 1.6; }
        }
        .empty-state {
          text-align: center; padding: 52px 24px; margin-top: var(--sp-2);
          background: var(--card); border: 1px solid var(--line); border-radius: var(--r-xl);
          box-shadow: var(--shadow-sm); position: relative; overflow: hidden;
        }
        .empty-state::before {
          content: ''; position: absolute; inset: -40% -20% auto; height: 80%;
          background: radial-gradient(60% 60% at 50% 0%, color-mix(in srgb, var(--accent) 8%, transparent), transparent 70%);
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
          .empty-actions :global(.btn-base) { width: 100%; justify-content: center; }
        }
        .load-more-wrap { text-align: center; margin-top: var(--sp-6); }
        @media (max-width: 640px) {
          .load-more-wrap { margin-top: var(--sp-5); }
        }
      `}</style>
    </div>
  );
}
