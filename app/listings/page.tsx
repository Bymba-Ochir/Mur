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
  const [matchSource, setMatchSource] = useState<'database' | 'browser' | null>(null);
  const matchAbortRef = useRef<AbortController | null>(null);

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

  return (
    <div className="page-shell">
      <div className="page-header">
        <div className="eyebrow">{t('listings_eyebrow')}</div>
        <h1>{t('listings_title')}</h1>
      </div>

      <div className="filter-bar content-panel">
        <input
          type="text"
          placeholder={t('search_placeholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label={t('search_placeholder')}
          className="filter min-w-[180px] flex-[1_1_220px]"
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

      <div className="mb-[var(--sp-5)] flex flex-wrap items-center gap-[var(--sp-2)] max-sm:mb-[var(--sp-4)]">
        <input
          type="file" id="match-file" accept="image/*"
          onChange={handleMatchUpload} disabled={!!matching} className="absolute size-px overflow-hidden opacity-0 focus-visible:[&+label]:outline-[2.5px] focus-visible:[&+label]:outline-offset-2 focus-visible:[&+label]:outline-[var(--accent)] disabled:[&+label]:cursor-not-allowed disabled:[&+label]:opacity-60"
          aria-label="Төстэй байдлаар эрэмбэлэх зураг сонгох"
        />
        <Button as="label" htmlFor="match-file" variant="ghost">{t('match_label')}</Button>
        {matching && <span className="text-xs leading-[1.5] text-[var(--muted)] max-[480px]:mt-[var(--sp-1)] max-[480px]:w-full max-[480px]:text-[13px] max-[480px]:leading-[1.6]"> — {typeof matching === 'string' ? matching : 'AI шинжилж байна (эхний удаа 10-30 сек)...'}</span>}
        {matching && <Button variant="ghost" onClick={cancelMatching}>{t('match_cancel')}</Button>}
        {matchFile && !matching && !matchError && matchedCount === 0 && (
          <span className="text-xs leading-[1.5] text-[var(--alert)] max-[480px]:mt-[var(--sp-1)] max-[480px]:w-full max-[480px]:text-[13px] max-[480px]:leading-[1.6]">
            — Харьцуулах боломжтой бичлэг олдсонгүй (хуучин бичлэгүүд өөр
            embedding-тэй байж болзошгүй — шинээр бүртгэсэн 2 бичлэгээр туршина уу).
          </span>
        )}
        {matchFile && !matching && !matchError && matchedCount != null && matchedCount > 0 && (
          <span className="text-xs leading-[1.5] text-[var(--muted)] max-[480px]:mt-[var(--sp-1)] max-[480px]:w-full max-[480px]:text-[13px] max-[480px]:leading-[1.6]"> — {matchedCount} {t('match_results')} · {matchSource === 'database' ? t('match_all_database') : t('match_browser_fallback')}</span>
        )}
        {matchError && <span className="text-xs leading-[1.5] text-[var(--alert)] max-[480px]:mt-[var(--sp-1)] max-[480px]:w-full max-[480px]:text-[13px] max-[480px]:leading-[1.6]"> — {matchError}</span>}
      </div>

      {loading ? (
        <div className="grid">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : pets.length === 0 ? (
        <div className="relative mt-[var(--sp-2)] overflow-hidden rounded-[var(--r-xl)] border border-[var(--line)] bg-[var(--card)] px-6 py-[52px] text-center shadow-[var(--shadow-sm)] before:pointer-events-none before:absolute before:inset-x-[-20%] before:top-[-40%] before:h-[80%] before:bg-[radial-gradient(60%_60%_at_50%_0%,color-mix(in_srgb,var(--accent)_8%,transparent),transparent_70%)] max-sm:mt-[var(--sp-3)] max-sm:rounded-[var(--r-lg)] max-sm:px-5 max-sm:py-10 max-[480px]:px-4 max-[480px]:py-8">
          <div className="relative mx-auto mb-[var(--sp-3)] flex size-[72px] items-center justify-center rounded-full border border-[var(--glass-border)] bg-[var(--eyebrow-bg)] text-[var(--primary)] max-[480px]:mb-[var(--sp-4)] max-[480px]:size-[76px]" aria-hidden="true">
            <svg width="34" height="34" viewBox="0 0 48 48" fill="currentColor" focusable="false">
              <ellipse cx="24" cy="30" rx="11" ry="9" /><circle cx="10" cy="18" r="5.5" /><circle cx="38" cy="18" r="5.5" /><circle cx="17" cy="8" r="5" /><circle cx="31" cy="8" r="5" />
            </svg>
          </div>
          <p className="relative mb-[var(--sp-2)] text-base font-bold text-[var(--primary)] max-[480px]:text-[17px]">
            {search || district || status || type ? t('empty_no_results_title') : t('empty_no_posts_title')}
          </p>
          <p className="relative mb-[var(--sp-4)] text-[13.5px] text-[var(--muted)] max-[480px]:mb-[var(--sp-5)] max-[480px]:text-sm max-[480px]:leading-[1.6]">
            {search || district || status || type ? t('empty_no_results_desc') : t('empty_no_posts_desc')}
          </p>
          <div className="flex flex-wrap justify-center gap-[var(--sp-3)] max-[480px]:flex-col max-[480px]:gap-[var(--sp-2)] max-[480px]:[&_.btn-base]:w-full max-[480px]:[&_.btn-base]:justify-center">
            <Button as="link" href="/report-lost" variant="accent">{t('hero_btn_lost')}</Button>
            <Button as="link" href="/report-found" variant="ghost">{t('hero_btn_found')}</Button>
          </div>
        </div>
      ) : (
        <>
          <p className="result-count">{pets.length} {t('results_count')}</p>
          <div className="grid">
            {pets.map((p) => <PetCard key={p.id} pet={p} />)}
          </div>
          {hasMore && !matchFile && (
            <div className="mt-[var(--sp-6)] text-center max-sm:mt-[var(--sp-5)]">
              <Button onClick={handleLoadMore} disabled={loadingMore} variant="ghost">
                {loadingMore ? t('loading_more') : t('load_more')}
              </Button>
            </div>
          )}
        </>
      )}

    </div>
  );
}
