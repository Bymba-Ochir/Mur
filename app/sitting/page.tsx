'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '../../lib/i18n';
import { fetchSittingListings } from '../../lib/sittingService';
import SittingCard from '../../components/SittingCard';
import SkeletonCard from '../../components/SkeletonCard';
import LoadError from '../../components/LoadError';
import Button from '../../components/ui/Button';
import { DISTRICTS } from '../../lib/districts';
import type { SittingListing, SittingPetType } from '../../lib/types';
import type { District } from '../../lib/districts';

const TYPE_VALUES: (SittingPetType | '')[] = ['', 'Нохой', 'Муур', 'Бусад', 'Бүгд'];

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
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => load(0), 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [petType, district, search]);

  async function load(p = 0) {
    if (p === 0) setLoading(true); else setLoadingMore(true);
    setLoadError(false);
    try {
      const { listings: data, hasMore: more } = await fetchSittingListings({
        petType: petType || undefined, district: district || undefined,
        search: search || undefined, page: p,
      });
      setListings((prev) => (p === 0 ? data : [...prev, ...data]));
      setHasMore(more); setPage(p);
    } catch (err) { console.error(err); setLoadError(true); }
    finally { setLoading(false); setLoadingMore(false); }
  }

  return (
    <div className="page-shell">
      <div className="page-header">
        <div className="eyebrow">{t('sitting_eyebrow')}</div>
        <h1>{t('sitting_title')}</h1>
        <p>{t('sitting_desc')}</p>
      </div>
      <div className="page-toolbar"><Button as="link" href="/sitting/new" variant="accent">{t('sitting_new_btn')}</Button></div>
      <div className="filter-bar content-panel">
        <input type="search" className="filter" placeholder={t('sitting_search_placeholder')} aria-label={t('sitting_search_placeholder')} value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className="filter" aria-label={t('filter_all_types')} value={petType} onChange={(e) => setPetType(e.target.value as SittingPetType | '')}>
          <option value="">{t('filter_all_types')}</option>
          <option value="Нохой">{t('type_dog')}</option>
          <option value="Муур">{t('type_cat')}</option>
          <option value="Бусад">{t('type_other')}</option>
          <option value="Бүгд">{t('sitting_pet_type_all')}</option>
        </select>
        <select className="filter" aria-label={t('filter_all_districts')} value={district} onChange={(e) => setDistrict(e.target.value as District | '')}>
          <option value="">{t('filter_all_districts')}</option>
          {DISTRICTS.map((d) => <option key={d}>{d}</option>)}
        </select>
      </div>
      {loading ? (
        <div className="listing-grid"><SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard /></div>
      ) : loadError ? (
        <LoadError onRetry={() => load(0)} />
      ) : listings.length === 0 ? (
        <div className="py-[var(--sp-6)] text-center">
          {petType || district || search.trim() ? (
            <>
              <p className="mb-2 text-lg font-semibold text-[var(--primary)]">{t('empty_no_results_title')}</p>
              <p className="mb-4 text-[var(--muted)]">{t('empty_no_results_desc')}</p>
            </>
          ) : (
            <>
              <p className="mb-2 text-lg font-semibold text-[var(--primary)]">{t('sitting_empty_title')}</p>
              <p className="mb-4 text-[var(--muted)]">{t('sitting_empty_desc')}</p>
            </>
          )}
          <Button as="link" href="/sitting/new" variant="accent">{t('sitting_new_btn')}</Button>
        </div>
      ) : (
        <>
          <p className="result-count">{listings.length} {t('results_count')}</p>
          <div className="listing-grid">
            {listings.map((l) => <SittingCard key={l.id} listing={l} />)}
          </div>
          {hasMore && (
            <Button onClick={() => load(page + 1)} disabled={loadingMore} variant="ghost" className="mx-auto mt-[var(--sp-5)] flex">
              {loadingMore ? t('loading_more') : t('load_more')}
            </Button>
          )}
        </>
      )}
    </div>
  );
}
