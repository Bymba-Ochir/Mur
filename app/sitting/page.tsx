'use client';
import { useEffect, useState } from 'react';
import { useLanguage } from '../../lib/i18n';
import { fetchSittingListings } from '../../lib/sittingService';
import SittingCard from '../../components/SittingCard';
import SkeletonCard from '../../components/SkeletonCard';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import Icon from '../../components/ui/icons';
import { DISTRICTS } from '../../lib/districts';
import { getErrorMessage } from '../../lib/utils';
import type { SittingListing, SittingPetType } from '../../lib/types';
import type { District } from '../../lib/districts';

const TYPE_VALUES: SittingPetType[] = ['Нохой', 'Муур', 'Бусад', 'Бүгд'];

export default function SittingPage() {
  const { t } = useLanguage();
  const [petType, setPetType] = useState<SittingPetType | ''>('');
  const [district, setDistrict] = useState<District | ''>('');
  const [search, setSearch] = useState('');
  const [listings, setListings] = useState<SittingListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loadError, setLoadError] = useState('');
  const hasFilters = Boolean(search || petType || district);

  useEffect(() => {
    const timer = setTimeout(() => void load(0), 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [petType, district, search]);

  async function load(pageToLoad = 0) {
    if (pageToLoad === 0) setLoading(true); else setLoadingMore(true);
    setLoadError('');
    try {
      const result = await fetchSittingListings({ petType: petType || undefined, district: district || undefined, search: search.trim() || undefined, page: pageToLoad });
      setListings((current) => pageToLoad === 0 ? result.listings : [...current, ...result.listings]);
      setHasMore(result.hasMore); setPage(pageToLoad);
    } catch (error) { setLoadError(getErrorMessage(error)); }
    finally { setLoading(false); setLoadingMore(false); }
  }

  function resetFilters() { setSearch(''); setPetType(''); setDistrict(''); }
  function typeLabel(value: SittingPetType) {
    return value === 'Нохой' ? t('type_dog') : value === 'Муур' ? t('type_cat') : value === 'Бусад' ? t('type_other') : t('sitting_pet_type_all');
  }

  return (
    <div className="page-shell">
      <header className="page-header sitting-header">
        <p className="eyebrow">{t('sitting_eyebrow')}</p><h1>{t('sitting_title')}</h1><p>{t('sitting_desc')}</p>
        <Button as="link" href="/sitting/new" variant="accent" className="header-action"><Icon name="plus" size={18} />{t('sitting_new_btn_plain')}</Button>
      </header>

      <section className="filters-panel" aria-labelledby="sitting-filters-title">
        <div className="filters-heading"><div><p className="filter-kicker">{t('sitting_filter_kicker')}</p><h2 id="sitting-filters-title">{t('sitting_filters_title')}</h2></div>{hasFilters && <button type="button" className="reset-filters" onClick={resetFilters}>{t('sitting_clear_filters')}</button>}</div>
        <div className="filter-grid">
          <label htmlFor="sitting-search"><span>{t('sitting_search_label')}</span><span className="input-wrap"><Icon name="search" size={18} /><input id="sitting-search" type="search" placeholder={t('sitting_search_placeholder')} value={search} onChange={(event) => setSearch(event.target.value)} /></span></label>
          <label htmlFor="sitting-type"><span>{t('listings_type_label')}</span><select id="sitting-type" value={petType} onChange={(event) => setPetType(event.target.value as SittingPetType | '')}><option value="">{t('filter_all_types')}</option>{TYPE_VALUES.map((value) => <option key={value} value={value}>{typeLabel(value)}</option>)}</select></label>
          <label htmlFor="sitting-district"><span>{t('listings_district_label')}</span><select id="sitting-district" value={district} onChange={(event) => setDistrict(event.target.value as District | '')}><option value="">{t('filter_all_districts')}</option>{DISTRICTS.map((value) => <option key={value}>{value}</option>)}</select></label>
        </div>
      </section>

      {loadError ? <div className="state-panel state-panel--error" role="alert"><span className="state-panel__icon"><Icon name="alert" size={28} /></span><h2>{t('sitting_load_error_title')}</h2><p>{loadError}</p><Button variant="secondary" onClick={() => void load(0)}>{t('err_retry')}</Button></div>
        : loading ? <div className="sitting-grid" aria-busy="true" aria-label={t('sitting_loading_label')}>{Array.from({ length: 6 }, (_, index) => <SkeletonCard key={index} />)}</div>
        : listings.length === 0 ? <EmptyState icon={<Icon name="home" size={30} />} title={hasFilters ? t('empty_no_results_title') : t('sitting_empty_title')} description={hasFilters ? t('empty_no_results_desc') : t('sitting_empty_desc')}>{hasFilters ? <Button variant="ghost" onClick={resetFilters}>{t('sitting_clear_filters')}</Button> : <Button as="link" href="/sitting/new" variant="accent">{t('sitting_new_btn')}</Button>}</EmptyState>
        : <section aria-labelledby="sitting-results-title"><div className="results-heading"><h2 id="sitting-results-title">{t('sitting_results_title')}</h2><p className="result-count" aria-live="polite">{listings.length} {t('results_count')}</p></div><div className="sitting-grid">{listings.map((listing) => <SittingCard key={listing.id} listing={listing} />)}</div>{hasMore && <div className="load-more-row"><Button onClick={() => void load(page + 1)} disabled={loadingMore} variant="ghost" aria-busy={loadingMore}>{loadingMore ? t('loading_more') : t('load_more')}</Button></div>}</section>}

      <style jsx>{`
        .sitting-header{position:relative;padding-right:14rem}.header-action{position:absolute;top:var(--sp-2);right:0}.filters-panel{margin-bottom:var(--sp-7);padding:var(--sp-5);background:var(--card);border:1px solid var(--line);border-radius:var(--r-xl);box-shadow:var(--shadow-sm)}
        .filters-heading,.results-heading{display:flex;align-items:flex-end;justify-content:space-between;gap:var(--sp-4);margin-bottom:var(--sp-4)}.filter-kicker{margin:0 0 var(--sp-1);color:var(--accent-deep);font-family:var(--font-mono);font-size:var(--text-xs);font-weight:800;text-transform:uppercase;letter-spacing:.06em}h2{margin:0;color:var(--ink);font-family:var(--font-heading);font-size:var(--text-xl)}
        .reset-filters{min-height:var(--touch-target);padding:var(--sp-2) var(--sp-3);color:var(--primary);background:transparent;border:0;border-radius:var(--r-sm);font:inherit;font-size:var(--text-sm);font-weight:700;cursor:pointer}.reset-filters:hover{background:var(--eyebrow-bg)}.reset-filters:focus-visible{outline:2px solid var(--border-focus);outline-offset:2px}
        .filter-grid{display:grid;grid-template-columns:minmax(15rem,1.5fr) repeat(2,minmax(10rem,1fr));gap:var(--sp-3)}label{display:flex;flex-direction:column;gap:var(--sp-2);min-width:0;color:var(--primary);font-size:var(--text-xs);font-weight:700}input,select{width:100%;min-height:var(--touch-target);padding:var(--sp-2) var(--sp-3);color:var(--ink);background:var(--surface-2);border:1px solid var(--line);border-radius:var(--r-sm);font:inherit;font-size:var(--text-sm)}input:focus-visible,select:focus-visible{outline:2px solid var(--border-focus);outline-offset:1px;border-color:var(--primary-light)}.input-wrap{position:relative;display:flex;align-items:center}.input-wrap :global(svg){position:absolute;left:var(--sp-3);color:var(--muted);pointer-events:none}.input-wrap input{padding-left:var(--sp-8)}
        .results-heading{align-items:center}.result-count{margin:0;color:var(--muted);font-size:var(--text-sm)}.sitting-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:var(--sp-5)}.load-more-row{display:flex;justify-content:center;margin-top:var(--sp-6)}
        @media(max-width:1000px){.filter-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.filter-grid label:first-child{grid-column:1/-1}.sitting-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
        @media(max-width:700px){.sitting-header{padding-right:0}.header-action{position:static;margin-top:var(--sp-4)}.filters-panel{padding:var(--sp-4);border-radius:var(--r-lg)}}
        @media(max-width:560px){.filter-grid,.sitting-grid{grid-template-columns:1fr}.filter-grid label:first-child{grid-column:auto}.filters-heading{align-items:flex-start}.results-heading{align-items:flex-start;flex-direction:column;gap:var(--sp-1)}}
      `}</style>
    </div>
  );
}
