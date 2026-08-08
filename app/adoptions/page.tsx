'use client';
import { useEffect, useState } from 'react';
import { fetchAdoptions } from '../../lib/adoptionService';
import AdoptionCard from '../../components/AdoptionCard';
import SkeletonCard from '../../components/SkeletonCard';
import Button from '../../components/ui/Button';
import Link from 'next/link';
import { useLanguage } from '../../lib/i18n';
import { DISTRICTS as DISTRICT_VALUES } from '../../lib/districts';
import type { District } from '../../lib/districts';
import type { Adoption, AdoptionGender, PetType } from '../../lib/types';

const DISTRICTS: (District | '')[] = ['', ...DISTRICT_VALUES];
const TYPE_VALUES: (PetType | '')[] = ['', 'Нохой', 'Муур', 'Бусад'];
const GENDER_VALUES: (AdoptionGender | '')[] = ['', 'Эрэгтэй', 'Эмэгтэй', 'Тодорхойгүй'];

export default function AdoptionsPage() {
  const { t } = useLanguage();
  const [type, setType] = useState<PetType | ''>('');
  const [gender, setGender] = useState<AdoptionGender | ''>('');
  const [district, setDistrict] = useState<District | ''>('');
  const [search, setSearch] = useState('');
  const [adoptions, setAdoptions] = useState<Adoption[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => load(0), 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, gender, district, search]);

  async function load(pageToLoad = 0) {
    if (pageToLoad === 0) setLoading(true);
    else setLoadingMore(true);
    try {
      const { adoptions: data, hasMore: more } = await fetchAdoptions({
        type: type || undefined,
        gender: gender || undefined,
        district: district || undefined,
        search: search || undefined,
        page: pageToLoad,
      });
      setAdoptions((prev) => (pageToLoad === 0 ? data : [...prev, ...data]));
      setHasMore(more);
      setPage(pageToLoad);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <div className="eyebrow">{t('adoptions_eyebrow')}</div>
        <h1>{t('adoptions_title')}</h1>
        <p>{t('adoptions_desc')}</p>
      </div>

      <Button as="link" href="/adoptions/new" variant="accent" style={{ marginBottom: 'var(--sp-4)' }}>
        {t('adoptions_new_btn')}
      </Button>

      <div className="filter-bar">
        <input
          type="search"
          className="filter"
          placeholder={t('adoptions_search_placeholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label={t('search_placeholder')}
        />
        <select className="filter" value={type} onChange={(e) => setType(e.target.value as PetType | '')} aria-label={t('filter_all_types')}>
          <option value="">{t('filter_all_types')}</option>
          {TYPE_VALUES.filter(Boolean).map((v) => <option key={v} value={v}>{t(`type_${v === 'Нохой' ? 'dog' : v === 'Муур' ? 'cat' : 'other'}`)}</option>)}
        </select>
        <select className="filter" value={gender} onChange={(e) => setGender(e.target.value as AdoptionGender | '')} aria-label={t('filter_all_genders')}>
          <option value="">{t('filter_all_genders')}</option>
          <option value="Эрэгтэй">{t('gender_male')}</option>
          <option value="Эмэгтэй">{t('gender_female')}</option>
          <option value="Тодорхойгүй">{t('gender_unknown')}</option>
        </select>
        <select className="filter" value={district} onChange={(e) => setDistrict(e.target.value as District | '')} aria-label={t('filter_all_districts')}>
          <option value="">{t('filter_all_districts')}</option>
          {DISTRICT_VALUES.map((d) => <option key={d}>{d}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="grid"><SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard /></div>
      ) : adoptions.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 'var(--sp-6) 0' }}>
          <p style={{ fontSize: 18, fontWeight: 600, color: 'var(--primary)', marginBottom: 8 }}>
            {search || type || gender || district ? t('empty_no_results_title') : t('adoptions_empty_title')}
          </p>
          <p style={{ color: 'var(--muted)', marginBottom: 16 }}>
            {search || type || gender || district ? t('empty_no_results_desc') : t('adoptions_empty_desc')}
          </p>
          <Button as="link" href="/adoptions/new" variant="accent">{t('adoptions_new_btn')}</Button>
        </div>
      ) : (
        <>
          <p className="result-count">{adoptions.length} {t('results_count')}</p>
          <div className="grid">
            {adoptions.map((a) => <AdoptionCard key={a.id} adoption={a} />)}
          </div>
          {hasMore && (
            <Button onClick={() => load(page + 1)} disabled={loadingMore} variant="ghost" style={{ display: 'block', margin: 'var(--sp-5) auto 0' }}>
              {loadingMore ? t('loading_more') : t('load_more')}
            </Button>
          )}
        </>
      )}
    </div>
  );
}
