'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import LoginModal from '../../components/LoginModal';
import PetCard from '../../components/PetCard';
import { useToast } from '../../components/Toast';
import Button from '../../components/ui/Button';
import Icon from '../../components/ui/icons';
import { useLanguage } from '../../lib/i18n';
import { deleteSavedSearch, fetchFavoritesPage, fetchSavedSearchesPage } from '../../lib/listingService';
import type { SavedSearch } from '../../lib/listingService';
import type { Pet } from '../../lib/types';
import { useAuth } from '../../lib/useAuth';
import { getErrorMessage } from '../../lib/utils';

function SavedSkeleton({ label }: { label: string }) {
  return <div className="saved-skeleton" aria-live="polite" aria-label={label}>{[0, 1, 2].map((item) => <div className="skeleton-card" key={item}><span /><span /><span /></div>)}<style jsx>{`.saved-skeleton{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:var(--sp-4)}.skeleton-card{display:grid;gap:12px;min-height:250px;padding:var(--sp-4);background:var(--card);border:1px solid var(--line);border-radius:var(--r-lg)}.skeleton-card span{height:18px;background:linear-gradient(90deg,var(--surface-subtle),var(--eyebrow-bg),var(--surface-subtle));background-size:220% 100%;border-radius:8px;animation:shimmer 1.4s infinite}.skeleton-card span:first-child{height:145px}.skeleton-card span:last-child{width:62%}@keyframes shimmer{to{background-position:-220% 0}}@media(max-width:900px){.saved-skeleton{grid-template-columns:repeat(2,minmax(0,1fr))}.skeleton-card:last-child{display:none}}@media(max-width:600px){.saved-skeleton{grid-template-columns:1fr}.skeleton-card:nth-child(2){display:none}}@media(prefers-reduced-motion:reduce){.skeleton-card span{animation:none}}`}</style></div>;
}

export default function SavedClient() {
  const { user } = useAuth();
  return <SavedContent key={user?.id ?? 'guest'} />;
}

function SavedContent() {
  const { user, loading: authLoading } = useAuth();
  const { t, lang } = useLanguage();
  const showToast = useToast();
  const [favorites, setFavorites] = useState<Pet[]>([]);
  const [searches, setSearches] = useState<SavedSearch[]>([]);
  const [favoritePage, setFavoritePage] = useState(0);
  const [searchPage, setSearchPage] = useState(0);
  const [favoritesHasMore, setFavoritesHasMore] = useState(false);
  const [searchesHasMore, setSearchesHasMore] = useState(false);
  const [favoriteTotal, setFavoriteTotal] = useState(0);
  const [searchTotal, setSearchTotal] = useState(0);
  const [loadingMoreFavorites, setLoadingMoreFavorites] = useState(false);
  const [loadingMoreSearches, setLoadingMoreSearches] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState('');
  const [showLogin, setShowLogin] = useState(false);
  const dateFormatter = useMemo(() => new Intl.DateTimeFormat(lang === 'mn' ? 'mn-MN' : 'en-US', { dateStyle: 'medium' }), [lang]);

  const active = useRef(false);
  const requestVersion = useRef(0);
  const deleting = useRef(false);

  const load = useCallback(async () => {
    if (!user?.id || !active.current) return;
    const version = ++requestVersion.current;
    setLoading(true); setError('');
    try {
      const [savedPets, savedSearches] = await Promise.all([fetchFavoritesPage(0), fetchSavedSearchesPage(0)]);
      if (active.current && version === requestVersion.current) {
        setFavorites(savedPets.items);
        setSearches(savedSearches.items);
        setFavoritePage(savedPets.page);
        setSearchPage(savedSearches.page);
        setFavoritesHasMore(savedPets.hasMore);
        setSearchesHasMore(savedSearches.hasMore);
        setFavoriteTotal(savedPets.total ?? savedPets.items.length);
        setSearchTotal(savedSearches.total ?? savedSearches.items.length);
      }
    } catch (reason) {
      if (active.current && version === requestVersion.current) setError(getErrorMessage(reason));
    } finally {
      if (active.current && version === requestVersion.current) setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    active.current = true;
    let disposed = false;
    const requests = requestVersion;
    void Promise.resolve().then(() => { if (!disposed) void load(); });
    return () => { disposed = true; active.current = false; requests.current++; };
  }, [load]);

  async function loadMoreFavorites() {
    if (!active.current || loadingMoreFavorites || !favoritesHasMore) return;
    const nextPage = favoritePage + 1;
    setLoadingMoreFavorites(true);
    try {
      const result = await fetchFavoritesPage(nextPage);
      if (!active.current) return;
      setFavorites((items) => [...items, ...result.items]);
      setFavoritePage(result.page);
      setFavoritesHasMore(result.hasMore);
      setFavoriteTotal(result.total ?? (favorites.length + result.items.length));
    } catch (reason) {
      if (active.current) showToast(getErrorMessage(reason), 'error');
    } finally {
      if (active.current) setLoadingMoreFavorites(false);
    }
  }

  async function loadMoreSearches() {
    if (!active.current || loadingMoreSearches || !searchesHasMore) return;
    const nextPage = searchPage + 1;
    setLoadingMoreSearches(true);
    try {
      const result = await fetchSavedSearchesPage(nextPage);
      if (!active.current) return;
      setSearches((items) => [...items, ...result.items]);
      setSearchPage(result.page);
      setSearchesHasMore(result.hasMore);
      setSearchTotal(result.total ?? (searches.length + result.items.length));
    } catch (reason) {
      if (active.current) showToast(getErrorMessage(reason), 'error');
    } finally {
      if (active.current) setLoadingMoreSearches(false);
    }
  }

  async function removeSearch(id: string) {
    if (deleting.current) return;
    deleting.current = true;
    setDeletingId(id);
    try {
      await deleteSavedSearch(id);
      if (!active.current) return;
      setSearches((items) => items.filter((item) => item.id !== id));
      setSearchTotal((total) => Math.max(0, total - 1));
      showToast(t('saved_deleted'), 'success');
    } catch (reason) {
      if (active.current) showToast(getErrorMessage(reason), 'error');
    } finally {
      deleting.current = false;
      if (active.current) setDeletingId('');
    }
  }

  if (authLoading) return <main className="page-shell page-shell--narrow"><SavedSkeleton label={t('saved_loading')} /></main>;
  if (!user) return <main className="page-shell page-shell--narrow"><div className="state-panel saved-login"><span className="state-panel__icon"><Icon name="lock" size={28} /></span><h1>{t('saved_login_title')}</h1><p>{t('saved_login_desc')}</p><Button variant="primary" onClick={() => setShowLogin(true)}>{t('login_button')}</Button></div>{showLogin && <LoginModal onClose={() => setShowLogin(false)} />}</main>;

  return <main className="page-shell saved-page">
    <header className="saved-hero">
      <div><p className="eyebrow">{t('saved_eyebrow')}</p><h1>{t('saved_title')}</h1><p>{t('saved_desc')}</p></div>
      <div className="summary" aria-label={t('saved_summary')}><div><Icon name="heart" size={20} /><strong>{favoriteTotal}</strong><span>{t('saved_favorites_title')}</span></div><div><Icon name="search" size={20} /><strong>{searchTotal}</strong><span>{t('saved_searches_title')}</span></div></div>
    </header>

    {error && <div className="error-state" role="alert"><span><Icon name="alert" size={22} /></span><div><strong>{t('saved_load_error')}</strong><p>{error}</p></div><Button variant="ghost" size="sm" onClick={() => void load()}>{t('saved_retry')}</Button></div>}
    {error ? null : loading ? <SavedSkeleton label={t('saved_loading')} /> : <>
      <section className="saved-section" aria-labelledby="favorite-title">
        <div className="section-heading"><div><h2 id="favorite-title"><Icon name="heart" size={21} />{t('saved_favorites_title')}</h2><p>{favoriteTotal} {t('saved_listing_count')}</p></div><Link href="/listings"><Icon name="search" size={16} />{t('saved_browse')}</Link></div>
        {favorites.length ? <><div className="favorites-grid">{favorites.map((pet) => <PetCard key={pet.id} pet={pet} />)}</div>{favoritesHasMore && <div className="load-more-row"><Button variant="ghost" onClick={() => void loadMoreFavorites()} disabled={loadingMoreFavorites} aria-busy={loadingMoreFavorites}>{loadingMoreFavorites ? t('loading_more') : t('load_more')}</Button></div>}</> : <div className="empty-state"><span><Icon name="heart" size={28} /></span><h3>{t('saved_favorites_empty')}</h3><p>{t('saved_favorites_empty_desc')}</p><Button as="link" href="/listings" variant="secondary" size="sm">{t('saved_browse')}</Button></div>}
      </section>
      <section className="saved-section" aria-labelledby="search-title">
        <div className="section-heading"><div><h2 id="search-title"><Icon name="search" size={21} />{t('saved_searches_title')}</h2><p>{t('saved_searches_desc')}</p></div><Link href="/listings"><Icon name="plus" size={16} />{t('saved_new_search')}</Link></div>
        {searches.length ? <><div className="search-list">{searches.map((item) => <article className="search-item" key={item.id}>
          <div className="search-icon"><Icon name="search" size={20} /></div>
          <div className="search-copy"><div className="search-title"><h3>{item.name}</h3><span className={item.notify ? 'notify active' : 'notify'}><Icon name="bell" size={13} />{item.notify ? t('saved_notify_on') : t('saved_notify_off')}</span></div><p>{[item.status ? (item.status === 'lost' ? t('listings_badge_lost') : t('listings_badge_found')) : '', item.petType || '', item.district || '', item.searchText || ''].filter(Boolean).join(' · ') || t('saved_searches_title')}</p><small><Icon name="calendar" size={13} />{dateFormatter.format(new Date(item.createdAt))}</small></div>
          <Button variant="ghost" size="sm" onClick={() => void removeSearch(item.id)} disabled={Boolean(deletingId)} aria-busy={deletingId === item.id} aria-label={t('saved_delete_label') + ': ' + item.name}><Icon name="trash" size={16} />{t('saved_delete')}</Button>
        </article>)}</div>{searchesHasMore && <div className="load-more-row"><Button variant="ghost" onClick={() => void loadMoreSearches()} disabled={loadingMoreSearches} aria-busy={loadingMoreSearches}>{loadingMoreSearches ? t('loading_more') : t('load_more')}</Button></div>}</> : <div className="empty-state"><span><Icon name="search" size={28} /></span><h3>{t('saved_searches_empty')}</h3><p>{t('saved_searches_empty_desc')}</p><Button as="link" href="/listings" variant="secondary" size="sm">{t('saved_new_search')}</Button></div>}
      </section>
    </>}
    <style jsx>{`
      .saved-page{padding-bottom:var(--sp-8)}.saved-hero{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:var(--sp-5);align-items:end;margin-bottom:var(--sp-6);padding:clamp(20px,4vw,36px);background:linear-gradient(135deg,var(--eyebrow-bg),color-mix(in srgb,var(--found) 12%,var(--card)));border:1px solid var(--line);border-radius:var(--r-xl)}.saved-hero .eyebrow{margin-bottom:6px;color:var(--primary);font-size:var(--text-xs);font-weight:750;letter-spacing:.1em;text-transform:uppercase}.saved-hero h1{font-family:var(--font-display);font-size:clamp(30px,5vw,48px);line-height:1.05}.saved-hero>div>p:last-child{max-width:650px;margin-top:10px;color:var(--muted);line-height:1.6}.summary{display:grid;grid-template-columns:repeat(2,minmax(110px,1fr));gap:10px}.summary>div{display:grid;grid-template-columns:auto auto;gap:2px 8px;align-items:center;padding:var(--sp-3);color:var(--primary);background:var(--card);border:1px solid var(--line);border-radius:var(--r-md);box-shadow:var(--shadow-xs)}.summary strong{font-size:var(--text-xl)}.summary span{grid-column:1/-1;color:var(--muted);font-size:var(--text-xs)}.saved-section{margin-top:var(--sp-7)}.section-heading{display:flex;align-items:end;justify-content:space-between;gap:16px;margin-bottom:var(--sp-4)}.section-heading h2{display:flex;align-items:center;gap:8px;font-size:clamp(20px,3vw,25px)}.section-heading p{margin-top:4px;color:var(--muted);font-size:var(--text-sm)}.section-heading a{display:inline-flex;align-items:center;gap:7px;color:var(--primary);font-size:var(--text-sm);font-weight:700;text-decoration:none}.section-heading a:hover{text-decoration:underline}.section-heading a:focus-visible{outline:2.5px solid var(--border-focus);outline-offset:4px;border-radius:4px}.favorites-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:var(--sp-4)}.load-more-row{display:flex;justify-content:center;margin-top:var(--sp-4)}.search-list{display:grid;gap:10px}.search-item{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:var(--sp-3);align-items:center;padding:var(--sp-4);background:var(--card);border:1px solid var(--line);border-radius:var(--r-lg);box-shadow:var(--shadow-xs);transition:transform var(--dur-fast),border-color var(--dur-fast),box-shadow var(--dur-fast)}.search-item:hover{transform:translateY(-1px);border-color:var(--primary-light);box-shadow:var(--shadow-sm)}.search-icon{display:grid;width:42px;height:42px;place-items:center;color:var(--primary);background:var(--eyebrow-bg);border-radius:var(--r-md)}.search-copy{display:grid;gap:5px;min-width:0}.search-title{display:flex;align-items:center;gap:8px;flex-wrap:wrap}.search-title h3{overflow-wrap:anywhere;font-size:var(--text-base)}.notify{display:inline-flex;align-items:center;gap:4px;padding:3px 7px;color:var(--muted);background:var(--surface-subtle);border:1px solid var(--line);border-radius:999px;font-size:11px;font-weight:650}.notify.active{color:var(--primary);background:var(--eyebrow-bg);border-color:var(--primary-light)}.search-copy p,.search-copy small{color:var(--muted);font-size:var(--text-xs);overflow-wrap:anywhere}.search-copy small{display:flex;align-items:center;gap:5px}.empty-state{display:grid;justify-items:center;gap:8px;padding:clamp(28px,6vw,52px) var(--sp-4);text-align:center;background:var(--card);border:1px dashed var(--line);border-radius:var(--r-xl)}.empty-state>span{display:grid;width:54px;height:54px;place-items:center;color:var(--primary);background:var(--eyebrow-bg);border-radius:999px}.empty-state h3{font-size:var(--text-lg)}.empty-state p{max-width:480px;margin-bottom:4px;color:var(--muted);font-size:var(--text-sm);line-height:1.55}.error-state{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:var(--sp-3);align-items:center;padding:var(--sp-4);color:var(--alert);background:color-mix(in srgb,var(--alert) 8%,var(--card));border:1px solid color-mix(in srgb,var(--alert) 32%,var(--line));border-radius:var(--r-lg)}.error-state>span{display:grid;width:40px;height:40px;place-items:center}.error-state strong{color:var(--text)}.error-state p{margin-top:3px;color:var(--muted);font-size:var(--text-xs)}:global(.saved-login){margin-top:var(--sp-7)}@media(max-width:960px){.saved-hero{grid-template-columns:1fr;align-items:start}.summary{width:100%}.favorites-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:640px){.saved-hero{padding:var(--sp-5)}.summary{grid-template-columns:1fr 1fr}.section-heading{align-items:flex-start;flex-direction:column}.favorites-grid{grid-template-columns:1fr}.search-item{grid-template-columns:auto minmax(0,1fr)}.search-item :global(.btn-base){grid-column:1/-1;width:100%}.error-state{grid-template-columns:auto minmax(0,1fr)}.error-state :global(.btn-base){grid-column:1/-1;width:100%}}
    `}</style>
  </main>;
}
