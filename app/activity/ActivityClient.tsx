'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import LoginModal from '../../components/LoginModal';
import Button from '../../components/ui/Button';
import Icon from '../../components/ui/icons';
import { useLanguage } from '../../lib/i18n';
import type { TranslationKey } from '../../lib/i18n';
import { useAuth } from '../../lib/useAuth';
import { getErrorMessage } from '../../lib/utils';
import { fetchMyAdoptionApplicationsPage, fetchMySittingBookingsPage } from '../../lib/workflowService';
import type { AdoptionApplication, SittingBooking, WorkflowStatus } from '../../lib/workflowService';

const STATUS_KEY: Record<WorkflowStatus, TranslationKey> = { pending: 'workflow_pending', accepted: 'workflow_accepted', rejected: 'workflow_rejected', completed: 'workflow_completed', cancelled: 'workflow_cancelled' };

function ActivitySkeleton({ label }: { label: string }) {
  return <div className="activity-skeleton" aria-busy="true" aria-label={label}><span className="sr-only">{label}</span>{[0, 1].map((group) => <div className="skeleton-group" key={group}><span className="skeleton-heading" />{[0, 1, 2].map((item) => <span className="skeleton-row" key={item} />)}</div>)}<style jsx>{`
    .activity-skeleton{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:var(--sp-4)}.skeleton-group{display:grid;gap:10px;padding:var(--sp-5);background:var(--card);border:1px solid var(--line);border-radius:var(--r-xl)}.skeleton-heading,.skeleton-row{display:block;background:linear-gradient(90deg,var(--surface-2),var(--surface-3),var(--surface-2));background-size:220% 100%;border-radius:var(--r-md);animation:activity-shimmer 1.4s infinite}.skeleton-heading{width:55%;height:24px}.skeleton-row{height:92px}@keyframes activity-shimmer{to{background-position:-220% 0}}@media(max-width:760px){.activity-skeleton{grid-template-columns:1fr}.skeleton-group:last-child{display:none}}@media(prefers-reduced-motion:reduce){.skeleton-heading,.skeleton-row{animation:none}}
  `}</style></div>;
}

export default function ActivityClient() {
  const { user, loading: authLoading } = useAuth();
  const { t, lang } = useLanguage();
  const [applications, setApplications] = useState<AdoptionApplication[]>([]);
  const [bookings, setBookings] = useState<SittingBooking[]>([]);
  const [applicationPage, setApplicationPage] = useState(0);
  const [bookingPage, setBookingPage] = useState(0);
  const [applicationsHasMore, setApplicationsHasMore] = useState(false);
  const [bookingsHasMore, setBookingsHasMore] = useState(false);
  const [loadingMoreApplications, setLoadingMoreApplications] = useState(false);
  const [loadingMoreBookings, setLoadingMoreBookings] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showLogin, setShowLogin] = useState(false);
  const locale = lang === 'mn' ? 'mn-MN' : 'en-US';
  const dateFormatter = useMemo(() => new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }), [locale]);
  const priceFormatter = useMemo(() => new Intl.NumberFormat(locale), [locale]);
  const mounted = useRef(false);
  const requestVersion = useRef(0);

  const load = useCallback(async () => {
    if (!user || !mounted.current) { setLoading(false); return; }
    const version = ++requestVersion.current;
    setLoading(true); setError('');
    try {
      const [apps, stays] = await Promise.all([fetchMyAdoptionApplicationsPage(0), fetchMySittingBookingsPage(0)]);
      if (!mounted.current || version !== requestVersion.current) return;
      setApplications(apps.items);
      setBookings(stays.items);
      setApplicationPage(apps.page);
      setBookingPage(stays.page);
      setApplicationsHasMore(apps.hasMore);
      setBookingsHasMore(stays.hasMore);
    } catch (reason) {
      if (mounted.current && version === requestVersion.current) setError(getErrorMessage(reason));
    } finally {
      if (mounted.current && version === requestVersion.current) setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    mounted.current = true;
    void Promise.resolve().then(load);
    return () => { mounted.current = false; requestVersion.current += 1; };
  }, [load]);

  async function loadMoreApplications() {
    if (!mounted.current || loadingMoreApplications || !applicationsHasMore) return;
    setLoadingMoreApplications(true);
    try {
      const result = await fetchMyAdoptionApplicationsPage(applicationPage + 1);
      if (!mounted.current) return;
      setApplications((items) => [...items, ...result.items]);
      setApplicationPage(result.page);
      setApplicationsHasMore(result.hasMore);
    } catch (reason) {
      if (mounted.current) setError(getErrorMessage(reason));
    } finally {
      if (mounted.current) setLoadingMoreApplications(false);
    }
  }

  async function loadMoreBookings() {
    if (!mounted.current || loadingMoreBookings || !bookingsHasMore) return;
    setLoadingMoreBookings(true);
    try {
      const result = await fetchMySittingBookingsPage(bookingPage + 1);
      if (!mounted.current) return;
      setBookings((items) => [...items, ...result.items]);
      setBookingPage(result.page);
      setBookingsHasMore(result.hasMore);
    } catch (reason) {
      if (mounted.current) setError(getErrorMessage(reason));
    } finally {
      if (mounted.current) setLoadingMoreBookings(false);
    }
  }

  if (authLoading) return <main className="page-shell page-shell--detail"><ActivitySkeleton label={t('activity_loading')} /></main>;
  if (!user) return <main className="page-shell page-shell--narrow"><div className="state-panel"><span className="state-panel__icon"><Icon name="lock" size={28} /></span><h1>{t('activity_login_title')}</h1><p>{t('activity_login_desc')}</p><Button variant="primary" onClick={() => setShowLogin(true)}><Icon name="lock" size={17} />{t('notifications_login_action')}</Button></div>{showLogin && <LoginModal onClose={() => setShowLogin(false)} />}</main>;

  const allItems = [...applications, ...bookings];
  const pending = allItems.filter((item) => item.status === 'pending').length;
  const active = allItems.filter((item) => item.status === 'accepted').length;

  return <main className="page-shell page-shell--detail activity-page">
    <header className="activity-hero">
      <div><p className="eyebrow">{t('activity_eyebrow')}</p><h1>{t('activity_title')}</h1><p>{t('activity_desc')}</p></div>
      <div className="activity-summary" aria-label={t('activity_summary')}><div><Icon name="calendar" size={19} /><strong>{allItems.length}</strong><span>{t('activity_total')}</span></div><div><Icon name="bell" size={19} /><strong>{pending}</strong><span>{t('activity_pending')}</span></div><div><Icon name="check" size={19} /><strong>{active}</strong><span>{t('activity_active')}</span></div></div>
    </header>

    {error ? <div className="error-state" role="alert"><span><Icon name="alert" size={22} /></span><div><strong>{t('activity_load_error')}</strong><p>{error}</p></div><Button variant="secondary" size="sm" onClick={() => void load()}>{t('activity_retry')}</Button></div>
    : loading ? <ActivitySkeleton label={t('activity_loading')} />
    : <div className="activity-grid">
      <section className="activity-section" aria-labelledby="adoption-activity-title">
        <header className="section-header"><span className="section-icon"><Icon name="heart" size={21} /></span><div><h2 id="adoption-activity-title">{t('activity_adoption_title')}</h2><p>{applications.length} {t('activity_total').toLocaleLowerCase()}</p></div></header>
        {applications.length === 0 ? <div className="section-empty"><Icon name="heart" size={26} /><h3>{t('activity_adoption_empty')}</h3><Button as="link" href="/adoptions" variant="ghost" size="sm">{t('activity_browse_adoptions')}</Button></div> : <><div className="activity-list">{applications.map((item) => <ApplicationRow key={item.id} item={item} own={item.applicantId === user.id} dateFormatter={dateFormatter} t={t} />)}</div>{applicationsHasMore && <div className="load-more-row"><Button variant="ghost" size="sm" onClick={() => void loadMoreApplications()} disabled={loadingMoreApplications} aria-busy={loadingMoreApplications}>{loadingMoreApplications ? t('loading_more') : t('load_more')}</Button></div>}</>}
      </section>
      <section className="activity-section" aria-labelledby="sitting-activity-title">
        <header className="section-header"><span className="section-icon sitting"><Icon name="calendar" size={21} /></span><div><h2 id="sitting-activity-title">{t('activity_sitting_title')}</h2><p>{bookings.length} {t('activity_total').toLocaleLowerCase()}</p></div></header>
        {bookings.length === 0 ? <div className="section-empty"><Icon name="calendar" size={26} /><h3>{t('activity_sitting_empty')}</h3><Button as="link" href="/sitting" variant="ghost" size="sm">{t('activity_browse_sitting')}</Button></div> : <><div className="activity-list">{bookings.map((item) => <BookingRow key={item.id} item={item} own={item.customerId === user.id} dateFormatter={dateFormatter} priceFormatter={priceFormatter} t={t} />)}</div>{bookingsHasMore && <div className="load-more-row"><Button variant="ghost" size="sm" onClick={() => void loadMoreBookings()} disabled={loadingMoreBookings} aria-busy={loadingMoreBookings}>{loadingMoreBookings ? t('loading_more') : t('load_more')}</Button></div>}</>}
      </section>
    </div>}

    <style jsx>{`
      .activity-page{padding-bottom:var(--sp-8)}.activity-hero{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:var(--sp-5);align-items:end;margin-bottom:var(--sp-5);padding:clamp(20px,4vw,34px);background:linear-gradient(135deg,var(--eyebrow-bg),color-mix(in srgb,var(--accent) 10%,var(--card)));border:1px solid var(--line);border-radius:var(--r-xl)}.activity-hero .eyebrow{margin-bottom:5px;color:var(--primary);font-size:var(--text-xs);font-weight:750;letter-spacing:.09em;text-transform:uppercase}.activity-hero h1{font-family:var(--font-display);font-size:clamp(30px,5vw,46px);line-height:1.08}.activity-hero>div>p:last-child{max-width:640px;margin-top:8px;color:var(--muted);line-height:1.6}.activity-summary{display:grid;grid-template-columns:repeat(3,minmax(95px,1fr));gap:8px}.activity-summary>div{display:grid;grid-template-columns:auto auto;gap:2px 7px;align-items:center;padding:var(--sp-3);color:var(--primary);background:var(--card);border:1px solid var(--line);border-radius:var(--r-md);box-shadow:var(--shadow-xs)}.activity-summary strong{font-size:var(--text-lg)}.activity-summary span{grid-column:1/-1;color:var(--muted);font-size:10px}.activity-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:var(--sp-4);align-items:start}.activity-section{overflow:hidden;background:var(--card);border:1px solid var(--line);border-radius:var(--r-xl);box-shadow:var(--shadow-xs)}.section-header{display:flex;align-items:center;gap:var(--sp-3);padding:var(--sp-4);background:var(--surface-2);border-bottom:1px solid var(--line)}.section-icon{display:grid;width:44px;height:44px;place-items:center;color:var(--primary);background:var(--eyebrow-bg);border-radius:var(--r-md)}.section-icon.sitting{color:var(--found-deep);background:color-mix(in srgb,var(--found) 17%,var(--card))}.section-header h2{font-size:var(--text-lg)}.section-header p{margin-top:2px;color:var(--muted);font-size:var(--text-xs)}.activity-list{display:grid;padding:var(--sp-2)}.load-more-row{display:flex;justify-content:center;padding:0 var(--sp-4) var(--sp-4)}.section-empty{display:grid;justify-items:center;gap:9px;padding:clamp(30px,6vw,52px) var(--sp-4);color:var(--muted);text-align:center}.section-empty h3{max-width:330px;color:var(--text);font-size:var(--text-sm);font-weight:650}.error-state{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:var(--sp-3);align-items:center;padding:var(--sp-4);color:var(--alert);background:color-mix(in srgb,var(--alert) 8%,var(--card));border:1px solid color-mix(in srgb,var(--alert) 32%,var(--line));border-radius:var(--r-lg)}.error-state>span{display:grid;width:40px;height:40px;place-items:center}.error-state strong{color:var(--text)}.error-state p{margin-top:3px;color:var(--muted);font-size:var(--text-xs)}
      :global(.activity-row){position:relative;display:grid;gap:8px;padding:var(--sp-4);color:inherit;text-decoration:none;border-radius:var(--r-md);transition:background var(--dur-fast),transform var(--dur-fast)}:global(.activity-row+.activity-row){border-top:1px solid var(--line)}:global(.activity-row:hover){background:var(--surface-2);transform:translateX(2px)}:global(.activity-row:focus-visible){outline:2.5px solid var(--border-focus);outline-offset:-1px}:global(.row-top){display:flex;align-items:flex-start;justify-content:space-between;gap:var(--sp-3);padding-right:22px}:global(.row-top strong){font-size:var(--text-sm);overflow-wrap:anywhere}:global(.row-top em){flex:0 0 auto;padding:4px 8px;color:var(--accent-deep);background:color-mix(in srgb,var(--accent) 13%,var(--card));border-radius:999px;font-size:10px;font-style:normal;font-weight:750}:global(.row-top em[data-status=accepted]){color:var(--primary);background:var(--eyebrow-bg)}:global(.row-top em[data-status=rejected]),:global(.row-top em[data-status=cancelled]){color:var(--alert);background:var(--alert-bg)}:global(.row-top em[data-status=completed]){color:var(--success-text);background:var(--success-bg)}:global(.row-message){display:-webkit-box;overflow:hidden;color:var(--muted);font-size:var(--text-xs);line-height:1.5;overflow-wrap:anywhere;-webkit-box-orient:vertical;-webkit-line-clamp:2}:global(.activity-row time),:global(.row-meta){display:flex;align-items:center;gap:5px;color:var(--muted);font-size:10px}:global(.row-meta){align-items:flex-start;flex-direction:column}:global(.row-meta span){display:flex;align-items:center;gap:5px}:global(.activity-arrow){position:absolute;top:var(--sp-4);right:var(--sp-3);color:var(--muted)}
      @media(max-width:980px){.activity-hero{grid-template-columns:1fr}.activity-summary{width:100%}.activity-grid{grid-template-columns:1fr}}@media(max-width:620px){.activity-hero{padding:var(--sp-4)}.activity-summary{grid-template-columns:repeat(3,minmax(0,1fr))}.activity-summary>div{grid-template-columns:1fr;justify-items:center;padding:10px 6px;text-align:center}.activity-summary>div :global(svg){display:none}.activity-summary span{grid-column:auto;font-size:9px;overflow-wrap:anywhere}.error-state{grid-template-columns:auto minmax(0,1fr)}.error-state :global(.btn-base){grid-column:1/-1;width:100%}}@media(max-width:480px){:global(.row-top){align-items:flex-start;flex-direction:column}:global(.row-top em){order:-1}:global(.activity-row:hover){transform:none}}
    `}</style>
  </main>;
}

type Translate = (key: TranslationKey) => string;

function ApplicationRow({ item, own, dateFormatter, t }: { item: AdoptionApplication; own: boolean; dateFormatter: Intl.DateTimeFormat; t: Translate }) {
  return <Link href={`/adoptions/${item.adoptionId}`} className="activity-row" aria-label={`${t('activity_open_detail')}: ${own ? t('activity_sent_request') : t('activity_received_request')}`}>
    <span className="row-top"><strong>{own ? t('activity_sent_request') : t('activity_received_request')}</strong><em data-status={item.status}>{t(STATUS_KEY[item.status])}</em></span>
    <span className="row-message">{item.message}</span>
    <time dateTime={item.createdAt}><Icon name="calendar" size={13} />{t('activity_created')}: {dateFormatter.format(new Date(item.createdAt))}</time>
    <Icon name="arrowRight" size={17} className="activity-arrow" />
  </Link>;
}

function BookingRow({ item, own, dateFormatter, priceFormatter, t }: { item: SittingBooking; own: boolean; dateFormatter: Intl.DateTimeFormat; priceFormatter: Intl.NumberFormat; t: Translate }) {
  return <Link href={`/sitting/${item.listingId}`} className="activity-row" aria-label={`${t('activity_open_detail')}: ${own ? t('activity_my_booking') : t('activity_service_booking')}`}>
    <span className="row-top"><strong>{own ? t('activity_my_booking') : t('activity_service_booking')}</strong><em data-status={item.status}>{t(STATUS_KEY[item.status])}</em></span>
    {item.note && <span className="row-message">{item.note}</span>}
    <span className="row-meta"><span><Icon name="calendar" size={13} />{t('activity_period')}: {dateFormatter.format(new Date(item.startDate))} – {dateFormatter.format(new Date(item.endDate))}</span>{item.totalPrice != null && <span><Icon name="info" size={13} />{t('activity_price')}: {priceFormatter.format(item.totalPrice)}₮</span>}</span>
    <Icon name="arrowRight" size={17} className="activity-arrow" />
  </Link>;
}
