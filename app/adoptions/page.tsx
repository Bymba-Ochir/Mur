'use client';
import { useEffect, useRef, useState } from 'react';
import { useListingFilters } from '../../lib/useListingFilters';
import { fetchAdoptions } from '../../lib/adoptionService';
import AdoptionCard from '../../components/AdoptionCard';
import SkeletonCard from '../../components/SkeletonCard';
import Button from '../../components/ui/Button';
import { useLanguage } from '../../lib/i18n';
import { DISTRICTS as DISTRICT_VALUES } from '../../lib/districts';
import type { District } from '../../lib/districts';
import type { Adoption, AdoptionGender, PetType } from '../../lib/types';
import EmptyState from '../../components/ui/EmptyState';
import Icon from '../../components/ui/icons';
import { getErrorMessage } from '../../lib/utils';

const TYPE_VALUES: PetType[] = ['Нохой', 'Муур', 'Бусад'];

export default function AdoptionsPage() {
  const { t } = useLanguage();
  const { type, setType, gender, setGender, district, setDistrict, search, setSearch, query } = useListingFilters();
  const [adoptions, setAdoptions] = useState<Adoption[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loadError, setLoadError] = useState('');
  const requestVersion = useRef(0);
  const restoreScroll = useRef<number | null>(null);
  useEffect(() => {
    if (loading || loadError || restoreScroll.current == null) return;
    const y = restoreScroll.current;
    restoreScroll.current = null;
    const frame = requestAnimationFrame(() => window.scrollTo(0, y));
    return () => cancelAnimationFrame(frame);
  }, [loading, loadError]);
  function rememberPosition() {
    try { sessionStorage.setItem('mur-adoptions:' + query, JSON.stringify({ page, scroll: window.scrollY, time: Date.now() })); } catch { /* optional navigation memory */ }
  }
  const hasFilters = Boolean(search || type || gender || district);

  useEffect(() => {
    const timer = setTimeout(() => void load(0), 400);
    return () => { clearTimeout(timer); requestVersion.current += 1; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, gender, district, search]);

  async function load(pageToLoad = 0) {
    const version = ++requestVersion.current;
    if (pageToLoad === 0) setLoading(true);
    else setLoadingMore(true);
    setLoadError('');
    try {
      const filters = {
        type: type || undefined,
        gender: gender || undefined,
        district: district || undefined,
        search: search.trim() || undefined,
      };
      let lastPage = pageToLoad;
      let savedPage = pageToLoad;
      if (pageToLoad === 0) {
        try {
          const raw = sessionStorage.getItem('mur-adoptions:' + query);
          const saved = raw ? JSON.parse(raw) : null;
          if (saved && Date.now() - saved.time < 1800000 && Number.isInteger(saved.page) && saved.page >= 0 && saved.page <= 100 && Number.isFinite(saved.scroll) && saved.scroll >= 0) {
            savedPage = saved.page; restoreScroll.current = saved.scroll;
          }
        } catch { /* ignore invalid navigation memory */ }
      }
      const first = await fetchAdoptions({ ...filters, page: pageToLoad });
      const data = [...first.adoptions]; let more = first.hasMore;
      while (lastPage < savedPage && more && version === requestVersion.current) {
        const next = await fetchAdoptions({ ...filters, page: ++lastPage });
        data.push(...next.adoptions); more = next.hasMore;
      }
      if (version !== requestVersion.current) return;
      setAdoptions((current) => (pageToLoad === 0 ? data : [...current, ...data]));
      setHasMore(more);
      setPage(lastPage);
    } catch (error) {
      if (version !== requestVersion.current) return;
      setLoadError(getErrorMessage(error));
    } finally {
      if (version === requestVersion.current) { setLoading(false); setLoadingMore(false); }
    }
  }

  function resetFilters() {
    setSearch('');
    setType('');
    setGender('');
    setDistrict('');
  }

  return (
    <div className="page-shell">
      <header className="page-header adoption-header">
        <p className="eyebrow">{t('adoptions_eyebrow')}</p>
        <h1>{t('adoptions_title')}</h1>
        <p>{t('adoptions_desc')}</p>
        <Button as="link" href="/adoptions/new" variant="accent" className="header-action"><Icon name="plus" size={18} />{t('adoptions_new_btn_plain')}</Button>
      </header>

      <section className="filters-panel" aria-labelledby="adoption-filters-title">
        <div className="filters-heading">
          <div><p className="filter-kicker">{t('adoptions_filter_kicker')}</p><h2 id="adoption-filters-title">{t('adoptions_filters_title')}</h2></div>
          {hasFilters && <button type="button" className="reset-filters" onClick={resetFilters}>{t('adoptions_clear_filters')}</button>}
        </div>
        <div className="filter-grid">
          <label className="search-field" htmlFor="adoption-search">
            <span>{t('adoptions_search_label')}</span>
            <span className="input-wrap"><Icon name="search" size={18} /><input id="adoption-search" type="search" placeholder={t('adoptions_search_placeholder')} value={search} onChange={(event) => setSearch(event.target.value)} /></span>
          </label>
          <label htmlFor="adoption-type"><span>{t('listings_type_label')}</span><select id="adoption-type" value={type} onChange={(event) => setType(event.target.value as PetType | '')}><option value="">{t('filter_all_types')}</option>{TYPE_VALUES.map((value) => <option key={value} value={value}>{t(`type_${value === 'Нохой' ? 'dog' : value === 'Муур' ? 'cat' : 'other'}`)}</option>)}</select></label>
          <label htmlFor="adoption-gender"><span>{t('adoption_gender_label')}</span><select id="adoption-gender" value={gender} onChange={(event) => setGender(event.target.value as AdoptionGender | '')}><option value="">{t('filter_all_genders')}</option><option value="Эрэгтэй">{t('gender_male')}</option><option value="Эмэгтэй">{t('gender_female')}</option><option value="Тодорхойгүй">{t('gender_unknown')}</option></select></label>
          <label htmlFor="adoption-district"><span>{t('listings_district_label')}</span><select id="adoption-district" value={district} onChange={(event) => setDistrict(event.target.value as District | '')}><option value="">{t('filter_all_districts')}</option>{DISTRICT_VALUES.map((value) => <option key={value}>{value}</option>)}</select></label>
        </div>
      </section>

      {loadError ? (
        <div className="state-panel state-panel--error" role="alert">
          <span className="state-panel__icon"><Icon name="alert" size={28} /></span>
          <h2>{t('adoptions_load_error_title')}</h2><p>{loadError}</p>
          <Button variant="secondary" onClick={() => void load(0)}>{t('err_retry')}</Button>
        </div>
      ) : loading ? (
        <div className="adoption-grid" aria-busy="true" aria-label={t('adoptions_loading_label')}>{Array.from({ length: 6 }, (_, index) => <SkeletonCard key={index} />)}</div>
      ) : adoptions.length === 0 ? (
        <EmptyState icon={<Icon name="heart" size={30} />} title={hasFilters ? t('empty_no_results_title') : t('adoptions_empty_title')} description={hasFilters ? t('empty_no_results_desc') : t('adoptions_empty_desc')}>
          {hasFilters ? <Button variant="ghost" onClick={resetFilters}>{t('adoptions_clear_filters')}</Button> : <Button as="link" href="/adoptions/new" variant="accent">{t('adoptions_new_btn')}</Button>}
        </EmptyState>
      ) : (
        <section aria-labelledby="adoption-results-title">
          <div className="results-heading"><h2 id="adoption-results-title">{t('adoptions_results_title')}</h2><p className="result-count" aria-live="polite">{adoptions.length} {t('results_count')}</p></div>
          <div className="adoption-grid" onClickCapture={rememberPosition}>{adoptions.map((adoption) => <AdoptionCard key={adoption.id} adoption={adoption} />)}</div>
          {hasMore && <div className="load-more-row"><Button onClick={() => void load(page + 1)} disabled={loadingMore} variant="ghost" aria-busy={loadingMore}>{loadingMore ? t('loading_more') : t('load_more')}</Button></div>}
        </section>
      )}

      <style jsx>{`
        .adoption-header { position: relative; padding-right: 14rem; }
        .header-action { position: absolute; top: var(--sp-2); right: 0; }
        .filters-panel { margin-bottom: var(--sp-7); padding: var(--sp-5); background: var(--card); border: 1px solid var(--line); border-radius: var(--r-xl); box-shadow: var(--shadow-sm); }
        .filters-heading, .results-heading { display: flex; align-items: flex-end; justify-content: space-between; gap: var(--sp-4); margin-bottom: var(--sp-4); }
        .filter-kicker { margin: 0 0 var(--sp-1); color: var(--accent-deep); font-family: var(--font-mono); font-size: var(--text-xs); font-weight: 800; text-transform: uppercase; letter-spacing: .06em; }
        h2 { margin: 0; color: var(--ink); font-family: var(--font-heading); font-size: var(--text-xl); }
        .reset-filters { min-height: var(--touch-target); padding: var(--sp-2) var(--sp-3); color: var(--primary); background: transparent; border: 0; border-radius: var(--r-sm); font: inherit; font-size: var(--text-sm); font-weight: 700; cursor: pointer; }
        .reset-filters:hover { background: var(--eyebrow-bg); }
        .reset-filters:focus-visible { outline: 2px solid var(--border-focus); outline-offset: 2px; }
        .filter-grid { display: grid; grid-template-columns: minmax(15rem, 1.5fr) repeat(3, minmax(9rem, 1fr)); gap: var(--sp-3); }
        label { display: flex; flex-direction: column; gap: var(--sp-2); min-width: 0; color: var(--primary); font-size: var(--text-xs); font-weight: 700; }
        input, select { width: 100%; min-height: var(--touch-target); padding: var(--sp-2) var(--sp-3); color: var(--ink); background: var(--surface-2); border: 1px solid var(--line); border-radius: var(--r-sm); font: inherit; font-size: var(--text-sm); }
        input:focus-visible, select:focus-visible { outline: 2px solid var(--border-focus); outline-offset: 1px; border-color: var(--primary-light); }
        .input-wrap { position: relative; display: flex; align-items: center; }
        .input-wrap :global(svg) { position: absolute; left: var(--sp-3); color: var(--muted); pointer-events: none; }
        .input-wrap input { padding-left: var(--sp-8); }
        .results-heading { align-items: center; margin-bottom: var(--sp-4); }
        .result-count { margin: 0; color: var(--muted); font-size: var(--text-sm); }
        .adoption-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: var(--sp-5); }
        .load-more-row { display: flex; justify-content: center; margin-top: var(--sp-6); }
        @media (max-width: 1000px) { .filter-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } .adoption-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
        @media (max-width: 700px) { .adoption-header { padding-right: 0; } .header-action { position: static; margin-top: var(--sp-4); } .filters-panel { padding: var(--sp-4); border-radius: var(--r-lg); } }
        @media (max-width: 560px) { .filter-grid, .adoption-grid { grid-template-columns: 1fr; } .filters-heading { align-items: flex-start; } .results-heading { align-items: flex-start; flex-direction: column; gap: var(--sp-1); } }
      `}</style>
    </div>
  );
}
