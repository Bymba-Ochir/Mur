'use client';
import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { fetchPets, fetchPetMatches, rankBySimilarity } from '../../lib/petService';
import { getImageEmbedding, getImageHash } from '../../lib/similarity';
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
import { useAuth } from '../../lib/useAuth';
import { useToast } from '../../components/Toast';
import Icon from '../../components/ui/icons';

// Шүүлтүүрийн "Бүгд" сонголт (хоосон) 9 дүүргийн өмнө явна
const DISTRICTS: (District | '')[] = ['', ...DISTRICT_VALUES];

export default function ListingsPage() {
  const { t } = useLanguage();
  const { user } = useAuth();
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
  const [matching, setMatching] = useState<boolean | string>(false);
  const [matchError, setMatchError] = useState<string | null>(null);
  const [matchedCount, setMatchedCount] = useState<number | null>(null);
  const [matchSource, setMatchSource] = useState<'database' | 'browser' | null>(null);
  const [loadError, setLoadError] = useState('');
  const [savingSearch, setSavingSearch] = useState(false);
  const matchAbortRef = useRef<AbortController | null>(null);
  const requestVersion = useRef(0);
  const hasFilters = Boolean(status || type || district || search.trim());

  useEffect(() => {
    // Шүүлтүүр өөрчлөгдөхөд эхний хуудаснаас дахин ачаална
    const timer = setTimeout(() => load(0), 400);
    return () => { clearTimeout(timer); requestVersion.current += 1; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, type, district, search]);

  async function load(pageToLoad = 0) {
    const version = ++requestVersion.current;
    if (pageToLoad === 0) setLoading(true);
    else setLoadingMore(true);
    setLoadError('');
    try {
      const { pets: data, hasMore: more } = await fetchPets({
        status: status || undefined,
        type: type || undefined,
        district: district || undefined,
        search: search || undefined,
        page: pageToLoad,
      });
      if (version !== requestVersion.current) return;
      setPets((prev) => (pageToLoad === 0 ? data : [...prev, ...data]));
      setHasMore(more);
      setPage(pageToLoad);
    } catch (err) {
      if (version !== requestVersion.current) return;
      setLoadError(getErrorMessage(err));
    } finally {
      if (version === requestVersion.current) { setLoading(false); setLoadingMore(false); }
    }
  }

  async function handleSaveSearch() {
    if (!user) { showToast(t('listings_save_login'), 'info'); return; }
    if (!hasFilters) { showToast(t('listings_save_filter_required'), 'info'); return; }
    setSavingSearch(true);
    try {
      await saveSearch({ status: status || undefined, petType: type || undefined, district: district || undefined, searchText: search || undefined });
      showToast(t('listings_save_success'), 'success');
    } catch (reason) { showToast(getErrorMessage(reason), 'error'); }
    finally { setSavingSearch(false); }
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
      setMatching(t('listings_match_searching'));
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
      setMatchError(getErrorMessage(err) || t('listings_match_error'));
    } finally {
      if (!controller.signal.aborted) setMatching(false);
    }
  }

  function cancelMatching() {
    matchAbortRef.current?.abort();
    setMatching(false);
    setMatchError(null);
  }

  return (
    <div className="page-shell">
      <div className="page-header">
        <p className="eyebrow">{t('listings_eyebrow')}</p>
        <h1>{t('listings_title')}</h1>
        <p>{t('listings_desc')}</p>
        <div className="quick-actions"><Button as="link" href="/report-lost" variant="accent">{t('hero_btn_lost')}</Button><Button as="link" href="/report-found" variant="secondary">{t('hero_btn_found')}</Button></div>
      </div>

      <section className="filters-panel content-panel" aria-labelledby="listings-filters-heading">
        <h2 id="listings-filters-heading" className="sr-only">{t('listings_filters_label')}</h2>
        <div className="filter-bar">
          <label className="filter-field filter-field--search">
            <span className="filter-label">{t('listings_search_label')}</span>
            <span className="search-control">
              <Icon name="search" size={18} aria-hidden="true" />
              <input
                type="search"
                placeholder={t('search_placeholder')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="filter"
              />
            </span>
          </label>
          <label className="filter-field">
            <span className="filter-label">{t('listings_status_label')}</span>
            <select className="filter" value={status} onChange={(e) => setStatus(e.target.value as PetStatus | '')}>
              <option value="">{t('filter_all')}</option>
              <option value="lost">{t('filter_lost')}</option>
              <option value="found">{t('filter_found')}</option>
            </select>
          </label>
          <label className="filter-field">
            <span className="filter-label">{t('listings_type_label')}</span>
            <select className="filter" value={type} onChange={(e) => setType(e.target.value as PetType | '')}>
              <option value="">{t('filter_all_types')}</option>
              <option value="Нохой">{t('type_dog')}</option>
              <option value="Муур">{t('type_cat')}</option>
              <option value="Бусад">{t('type_other')}</option>
            </select>
          </label>
          <label className="filter-field">
            <span className="filter-label">{t('listings_district_label')}</span>
            <select className="filter" value={district} onChange={(e) => setDistrict(e.target.value as District | '')}>
              {DISTRICTS.map((d) => (
                <option key={d} value={d}>{d || t('filter_all_districts')}</option>
              ))}
            </select>
          </label>
        </div>
      </section>
      <div className="filter-actions">
        <Button variant="ghost" onClick={() => void handleSaveSearch()} disabled={savingSearch} aria-busy={savingSearch}>
          <Icon name="heart" size={16} aria-hidden="true" />
          {savingSearch ? t('listings_saving_search') : t('listings_save_search')}
        </Button>
        <Link href="/saved" className="saved-link">{t('listings_saved_link')}</Link>
      </div>

      {district && (
        <div className="district-tools">
          <VolunteerBadge district={district} />
          <NotifySubscribe district={district} />
        </div>
      )}

      <section className="match-upload" aria-labelledby="match-upload-heading">
        <div className="match-heading">
          <span className="match-icon" aria-hidden="true"><Icon name="camera" size={19} /></span>
          <div>
            <h2 id="match-upload-heading">{t('listings_match_group')}</h2>
            <p>{t('match_label')}</p>
          </div>
        </div>
        <input
          type="file" id="match-file" accept="image/*"
          onChange={handleMatchUpload} disabled={!!matching} className="file-input"
          aria-label={t('listings_match_file_label')}
        />
        <div className="match-actions">
          <Button as="label" htmlFor="match-file" variant="ghost" size="sm">
            <Icon name="camera" size={16} aria-hidden="true" /> {t('listings_match_file_label')}
          </Button>
          {matching && <Button variant="ghost" size="sm" onClick={cancelMatching}>{t('match_cancel')}</Button>}
        </div>
        <div className="match-feedback" aria-live="polite">
        {matching && <p className="match-status">{typeof matching === 'string' ? matching : t('listings_match_initial')}</p>}
        {matchFile && !matching && !matchError && matchedCount === 0 && (
          <p className="match-status err">{t('listings_match_none')}</p>
        )}
        {matchFile && !matching && !matchError && matchedCount != null && matchedCount > 0 && (
          <p className="match-status success">{matchedCount} {t('match_results')} · {matchSource === 'database' ? t('match_all_database') : t('match_browser_fallback')}</p>
        )}
        {matchError && <p className="match-status err">{matchError}</p>}
        </div>
      </section>

      <section className="results-section" aria-label={t('listings_results_region')} aria-busy={loading || loadingMore}>
      {loadError ? (
        <div className="state-panel state-panel--error" role="alert">
          <span className="state-panel__icon" aria-hidden="true"><Icon name="alert" size={28} /></span>
          <h2>{t('err_title')}</h2>
          <p>{loadError}</p>
          <Button variant="secondary" onClick={() => void load(0)}>{t('err_retry')}</Button>
        </div>
      ) : loading ? (
        <>
          <p className="sr-only" role="status">{t('listings_loading')}</p>
          <div className="listings-grid" aria-hidden="true">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        </>
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
          <p className="result-count" aria-live="polite">{pets.length} {t('results_count')}</p>
          <div className="listings-grid">
            {pets.map((p) => <PetCard key={p.id} pet={p} />)}
          </div>
          {hasMore && !matchFile && (
            <div className="load-more-wrap">
              <Button onClick={handleLoadMore} disabled={loadingMore} variant="ghost">
                {loadingMore ? t('loading_more') : t('load_more')}
              </Button>
            </div>
          )}
        </>
      )}
      </section>

      <style jsx>{`
        .sr-only {
          position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px;
          overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0;
        }
        .filters-panel { margin-bottom: var(--sp-3); }
        .filters-panel .filter-bar {
          display: grid; grid-template-columns: minmax(240px, 1.6fr) repeat(3, minmax(140px, 1fr));
          align-items: end; gap: var(--sp-3); margin: 0;
        }
        .filter-field { display: grid; min-width: 0; gap: var(--sp-2); }
        .filter-label { color: var(--text-secondary); font-size: var(--text-xs); font-weight: 650; }
        .filter-field .filter { width: 100%; min-width: 0; margin: 0; }
        .search-control {
          display: flex; align-items: center; min-height: var(--touch-target); padding-inline: var(--sp-3);
          color: var(--text-tertiary); background: var(--card); border: 1.5px solid var(--line);
          border-radius: var(--r-md); transition: border-color var(--dur-fast) ease, box-shadow var(--dur-fast) ease;
        }
        .search-control:hover { border-color: var(--muted); }
        .search-control:focus-within { border-color: var(--border-focus); box-shadow: 0 0 0 3px rgba(98, 91, 246, 0.12); }
        .search-control .filter { min-height: 41px; padding: var(--sp-2); border: 0; background: transparent; box-shadow: none; }
        .search-control .filter:focus-visible { outline: none; box-shadow: none; }
        .filter-actions {
          display: flex; align-items: center; justify-content: space-between; gap: var(--sp-3);
          flex-wrap: wrap; margin: 0 0 var(--sp-5); padding-inline: var(--sp-1);
        }
        .saved-link {
          min-height: 36px; display: inline-flex; align-items: center; color: var(--primary);
          font-size: var(--text-xs); font-weight: 650; text-decoration: underline;
          text-decoration-color: transparent; text-underline-offset: 4px;
          transition: color var(--dur-fast) ease, text-decoration-color var(--dur-fast) ease;
        }
        .saved-link:hover { color: var(--primary-deep); text-decoration-color: currentColor; }
        .district-tools { display: grid; gap: var(--sp-2); margin-bottom: var(--sp-4); }
        .match-upload {
          display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: center;
          gap: var(--sp-3) var(--sp-5); margin-bottom: var(--sp-5); padding: var(--sp-4);
          background: color-mix(in srgb, var(--primary) 4%, var(--surface-2));
          border: 1px solid var(--border-subtle); border-radius: var(--r-lg);
        }
        .match-heading { display: flex; align-items: flex-start; gap: var(--sp-3); min-width: 0; }
        .match-icon {
          width: 40px; height: 40px; flex: 0 0 40px; display: grid; place-items: center;
          color: var(--primary); background: var(--eyebrow-bg); border-radius: var(--r-md);
        }
        .match-heading h2 { margin-bottom: var(--sp-1); font-size: var(--text-base); }
        .match-heading p { max-width: 62ch; color: var(--text-secondary); font-size: var(--text-xs); line-height: 1.5; }
        .match-actions { display: flex; align-items: center; justify-content: flex-end; gap: var(--sp-2); flex-wrap: wrap; }
        .match-feedback { grid-column: 1 / -1; min-height: 0; }
        .match-feedback:empty { display: none; }
        .file-input {
          position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px;
          overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0;
        }
        .file-input:focus-visible ~ .match-actions :global(label) { outline: 2.5px solid var(--border-focus); outline-offset: 2px; }
        .file-input:disabled ~ .match-actions :global(label) { opacity: 0.55; cursor: not-allowed; }
        .match-status {
          display: flex; align-items: center; min-height: 36px; padding: var(--sp-2) var(--sp-3);
          color: var(--text-secondary); background: var(--surface-2); border-radius: var(--r-sm);
          font-size: var(--text-xs); line-height: 1.5;
        }
        .match-status.err { color: var(--alert); background: color-mix(in srgb, var(--alert) 8%, var(--surface-2)); }
        .match-status.success { color: var(--success); background: color-mix(in srgb, var(--success) 8%, var(--surface-2)); }
        .results-section { min-height: 240px; }
        .listings-grid {
          display: grid; grid-template-columns: repeat(3, minmax(0, 1fr));
          align-items: stretch; gap: var(--sp-5); margin-top: var(--sp-4);
        }
        @media (max-width: 980px) {
          .filters-panel .filter-bar { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }
        @media (max-width: 900px) {
          .listings-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--sp-4); }
          .match-upload { grid-template-columns: 1fr; }
          .match-actions { justify-content: flex-start; }
        }
        @media (max-width: 600px) {
          .listings-grid { grid-template-columns: 1fr; }
        }
        @media (max-width: 560px) {
          .filters-panel .filter-bar { grid-template-columns: 1fr; }
          .filter-actions { align-items: stretch; flex-direction: column; }
          .filter-actions :global(.btn-base), .saved-link { width: 100%; justify-content: center; }
          .match-upload { padding: var(--sp-3); border-radius: var(--r-md); }
          .match-actions { align-items: stretch; flex-direction: column; }
          .match-actions :global(.btn-base) { width: 100%; white-space: normal; text-align: center; }
          .match-status { font-size: 13px; }
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
