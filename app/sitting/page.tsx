'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '../../lib/i18n';
import { fetchSittingListings } from '../../lib/sittingService';
import SittingCard from '../../components/SittingCard';
import SkeletonCard from '../../components/SkeletonCard';
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

  useEffect(() => {
    const timer = setTimeout(() => load(0), 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [petType, district, search]);

  async function load(p = 0) {
    if (p === 0) setLoading(true); else setLoadingMore(true);
    try {
      const { listings: data, hasMore: more } = await fetchSittingListings({
        petType: petType || undefined, district: district || undefined,
        search: search || undefined, page: p,
      });
      setListings((prev) => (p === 0 ? data : [...prev, ...data]));
      setHasMore(more); setPage(p);
    } catch (err) { console.error(err); }
    finally { setLoading(false); setLoadingMore(false); }
  }

  return (
    <div>
      <div className="page-header">
        <div className="eyebrow">{t('sitting_eyebrow')}</div>
        <h1>{t('sitting_title')}</h1>
        <p>{t('sitting_desc')}</p>
      </div>
      <Link href="/sitting/new" className="btn btn-accent" style={{ marginBottom: 'var(--sp-4)', display: 'inline-flex' }}>
        {t('sitting_new_btn')}
      </Link>
      <div className="filter-bar">
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
        <div className="grid"><SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard /></div>
      ) : listings.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 'var(--sp-6) 0' }}>
          {petType || district || search.trim() ? (
            <>
              <p style={{ fontSize: 18, fontWeight: 600, color: 'var(--primary)', marginBottom: 8 }}>{t('empty_no_results_title')}</p>
              <p style={{ color: 'var(--muted)', marginBottom: 16 }}>{t('empty_no_results_desc')}</p>
            </>
          ) : (
            <>
              <p style={{ fontSize: 18, fontWeight: 600, color: 'var(--primary)', marginBottom: 8 }}>{t('sitting_empty_title')}</p>
              <p style={{ color: 'var(--muted)', marginBottom: 16 }}>{t('sitting_empty_desc')}</p>
            </>
          )}
          <Link href="/sitting/new" className="btn btn-accent">{t('sitting_new_btn')}</Link>
        </div>
      ) : (
        <>
          <div className="grid">
            {listings.map((l) => <SittingCard key={l.id} listing={l} />)}
          </div>
          {hasMore && (
            <button onClick={() => load(page + 1)} disabled={loadingMore} className="btn" style={{ display: 'block', margin: 'var(--sp-5) auto 0' }}>
              {loadingMore ? t('loading_more') : t('load_more')}
            </button>
          )}
        </>
      )}
    </div>
  );
}
