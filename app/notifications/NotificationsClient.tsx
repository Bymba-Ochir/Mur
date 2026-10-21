'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import LoginModal from '../../components/LoginModal';
import { useToast } from '../../components/Toast';
import Button from '../../components/ui/Button';
import Icon, { type IconName } from '../../components/ui/icons';
import { useLanguage } from '../../lib/i18n';
import { useAuth } from '../../lib/useAuth';
import { fetchNotificationsPage, markAllNotificationsRead, markNotificationRead, notificationCount, subscribeToNotifications, unreadNotificationCount } from '../../lib/workflowService';
import type { AppNotification } from '../../lib/workflowService';
import { getErrorMessage } from '../../lib/utils';

type NotificationFilter = 'all' | 'unread';

function notificationIcon(type: string): IconName {
  if (type.includes('message')) return 'message';
  if (type.includes('vaccine')) return 'vaccine';
  if (type.includes('adoption')) return 'heart';
  if (type.includes('booking') || type.includes('sitting')) return 'calendar';
  if (type.includes('match') || type.includes('search')) return 'search';
  return 'bell';
}

function NotificationSkeleton({ label }: { label: string }) {
  return <div className="notification-skeleton" aria-busy="true" aria-label={label}><span className="sr-only">{label}</span>{[0, 1, 2, 3].map((item) => <div className="skeleton-row" key={item}><span className="skeleton-icon" /><span className="skeleton-copy"><span /><span /><span /></span></div>)}<style jsx>{`
    .notification-skeleton{display:grid;gap:10px}.skeleton-row{display:grid;grid-template-columns:auto 1fr;gap:var(--sp-3);padding:var(--sp-4);background:var(--card);border:1px solid var(--line);border-radius:var(--r-lg)}.skeleton-icon,.skeleton-copy span{background:linear-gradient(90deg,var(--surface-2),var(--surface-3),var(--surface-2));background-size:220% 100%;animation:notification-shimmer 1.4s infinite}.skeleton-icon{width:42px;height:42px;border-radius:50%}.skeleton-copy{display:grid;gap:8px}.skeleton-copy span{width:72%;height:12px;border-radius:var(--r-pill)}.skeleton-copy span:first-child{width:45%;height:16px}.skeleton-copy span:last-child{width:25%;height:10px}@keyframes notification-shimmer{to{background-position:-220% 0}}@media(prefers-reduced-motion:reduce){.skeleton-icon,.skeleton-copy span{animation:none}}
  `}</style></div>;
}

export default function NotificationsClient() {
  const { user } = useAuth();
  return <NotificationsContent key={user?.id ?? 'guest'} />;
}

function NotificationsContent() {
  const { user, loading: authLoading } = useAuth();
  const { t, lang } = useLanguage();
  const router = useRouter();
  const showToast = useToast();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<NotificationFilter>('all');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [unreadTotal, setUnreadTotal] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const [openingId, setOpeningId] = useState('');
  const [showLogin, setShowLogin] = useState(false);
  const dateFormatter = useMemo(() => new Intl.DateTimeFormat(lang === 'mn' ? 'mn-MN' : 'en-US', { dateStyle: 'medium', timeStyle: 'short' }), [lang]);

  const active = useRef(false);
  const requestVersion = useRef(0);
  const mutating = useRef(false);

  const load = useCallback(async (pageToLoad = 0, silent = false) => {
    if (!user?.id || !active.current) return;
    const version = ++requestVersion.current;
    if (pageToLoad === 0 && !silent) setLoading(true);
    if (pageToLoad > 0) setLoadingMore(true);
    setError('');
    try {
      const [result, allCount, unreadCount] = await Promise.all([
        fetchNotificationsPage(pageToLoad, filter === 'unread'),
        notificationCount(),
        unreadNotificationCount(),
      ]);
      if (active.current && version === requestVersion.current) {
        setItems((current) => pageToLoad === 0 ? result.items : [...current, ...result.items]);
        setPage(result.page);
        setHasMore(result.hasMore);
        setTotal(allCount);
        setUnreadTotal(unreadCount);
      }
    } catch (reason) {
      if (active.current && version === requestVersion.current) setError(getErrorMessage(reason));
    } finally {
      if (active.current && version === requestVersion.current) { setLoading(false); setLoadingMore(false); }
    }
  }, [filter, user?.id]);

  useEffect(() => {
    active.current = true;
    let disposed = false;
    const requests = requestVersion;
    void Promise.resolve().then(() => { if (!disposed) void load(0); });
    const unsubscribe = user?.id ? subscribeToNotifications(user.id, () => { void load(0, true); }) : undefined;
    return () => { disposed = true; active.current = false; requests.current++; unsubscribe?.(); };
  }, [user?.id, load]);

  async function openNotification(item: AppNotification) {
    if (mutating.current) return;
    mutating.current = true;
    setOpeningId(item.id);
    try {
      if (!item.readAt) {
        await markNotificationRead(item.id);
        if (!active.current) return;
        await load(0, true);
      }
    } catch {
      if (active.current) showToast(t('notifications_read_error'), 'error');
    } finally {
      mutating.current = false;
      if (active.current) setOpeningId('');
    }
    if (active.current && item.href?.startsWith('/') && !item.href.startsWith('//') && !item.href.includes('\\')) router.push(item.href);
  }

  async function readAll() {
    if (mutating.current) return;
    mutating.current = true;
    setMarkingAll(true);
    try {
      await markAllNotificationsRead();
      if (active.current) await load(0, true);
    } catch (reason) {
      if (active.current) showToast(getErrorMessage(reason), 'error');
    } finally {
      mutating.current = false;
      if (active.current) setMarkingAll(false);
    }
  }

  if (authLoading) return <main className="page-shell page-shell--narrow"><NotificationSkeleton label={t('notifications_loading')} /></main>;
  if (!user) return <main className="page-shell page-shell--narrow"><div className="state-panel"><span className="state-panel__icon"><Icon name="lock" size={28} /></span><h1>{t('notifications_login_title')}</h1><p>{t('notifications_login_desc')}</p><Button variant="primary" onClick={() => setShowLogin(true)}><Icon name="lock" size={17} />{t('notifications_login_action')}</Button></div>{showLogin && <LoginModal onClose={() => setShowLogin(false)} />}</main>;

  const unread = unreadTotal;
  const visibleItems = items;
  return <main className="page-shell page-shell--narrow notification-page">
    <header className="notification-hero">
      <div><p className="eyebrow">{t('notifications_eyebrow')}</p><h1>{t('notifications_title')}</h1><p>{t('notifications_desc')}</p></div>
      <div className={`unread-summary${unread ? ' active' : ''}`} aria-live="polite"><span className="summary-icon"><Icon name={unread ? 'bell' : 'check'} size={22} /></span><strong>{unread}</strong><span>{unread ? t('notifications_unread_summary') : t('notifications_all_read')}</span></div>
    </header>

    <div className="notification-toolbar">
      <div className="filter-group" role="group" aria-label={t('notifications_filter_label')}>
        <button type="button" className={filter === 'all' ? 'active' : ''} aria-pressed={filter === 'all'} onClick={() => setFilter('all')}>{t('notifications_filter_all')}<span>{total}</span></button>
        <button type="button" className={filter === 'unread' ? 'active' : ''} aria-pressed={filter === 'unread'} onClick={() => setFilter('unread')}>{t('notifications_filter_unread')}<span>{unread}</span></button>
      </div>
      {unread > 0 && <Button variant="ghost" size="sm" onClick={() => void readAll()} disabled={markingAll || Boolean(openingId)} aria-busy={markingAll}><Icon name="check" size={16} />{markingAll ? t('notifications_marking_all') : t('notifications_mark_all')}</Button>}
    </div>

    {error ? <div className="error-state" role="alert"><span><Icon name="alert" size={22} /></span><div><strong>{t('notifications_load_error')}</strong><p>{error}</p></div><Button variant="secondary" size="sm" onClick={() => void load(0)}>{t('notifications_retry')}</Button></div>
    : loading ? <NotificationSkeleton label={t('notifications_loading')} />
    : visibleItems.length === 0 ? <div className="empty-state"><span><Icon name={filter === 'unread' ? 'check' : 'bell'} size={28} /></span><h2>{filter === 'unread' ? t('notifications_all_read') : t('notifications_empty_title')}</h2><p>{t('notifications_empty_desc')}</p></div>
    : <><div className="notification-list" aria-label={t('notifications_title')}>{visibleItems.map((item) => {
      const read = Boolean(item.readAt);
      return <button type="button" key={item.id} className={`notification-item${read ? '' : ' unread'}`} onClick={() => void openNotification(item)} disabled={markingAll || Boolean(openingId)} aria-label={`${t('notifications_open_label')}: ${item.title}`}>
        <span className="notification-icon" aria-hidden="true"><Icon name={notificationIcon(item.type)} size={19} /></span>
        <span className="notification-copy"><span className="notification-title"><strong>{item.title}</strong><span className={`read-status${read ? '' : ' unread-status'}`}>{read ? t('notifications_read_label') : t('notifications_unread_label')}</span></span><span className="body">{item.body}</span><time dateTime={item.createdAt}><Icon name="calendar" size={13} />{dateFormatter.format(new Date(item.createdAt))}</time></span>
        {item.href?.startsWith('/') && <Icon name="arrowRight" size={18} className="row-arrow" />}
      </button>;
    })}</div>{hasMore && <div className="load-more-row"><Button variant="ghost" onClick={() => void load(page + 1, true)} disabled={loadingMore} aria-busy={loadingMore}>{loadingMore ? t('loading_more') : t('load_more')}</Button></div>}</>}

    <style jsx>{`
      .notification-page{padding-bottom:var(--sp-8)}.notification-hero{display:grid;grid-template-columns:minmax(0,1fr) minmax(12rem,auto);gap:var(--sp-5);align-items:end;margin-bottom:var(--sp-4);padding:clamp(20px,4vw,34px);background:linear-gradient(135deg,var(--eyebrow-bg),color-mix(in srgb,var(--found) 13%,var(--card)));border:1px solid var(--line);border-radius:var(--r-xl)}.notification-hero .eyebrow{margin-bottom:5px;color:var(--primary);font-size:var(--text-xs);font-weight:750;letter-spacing:.09em;text-transform:uppercase}.notification-hero h1{font-family:var(--font-display);font-size:clamp(30px,5vw,46px);line-height:1.08}.notification-hero>div>p:last-child{max-width:610px;margin-top:8px;color:var(--muted);line-height:1.6}.unread-summary{display:grid;grid-template-columns:auto auto;gap:2px 9px;align-items:center;padding:var(--sp-3);color:var(--muted);background:var(--card);border:1px solid var(--line);border-radius:var(--r-lg);box-shadow:var(--shadow-xs)}.unread-summary.active{color:var(--primary);border-color:var(--primary-light)}.summary-icon{display:grid;grid-row:1/3;width:42px;height:42px;place-items:center;background:var(--surface-3);border-radius:50%}.unread-summary strong{font-size:var(--text-xl);line-height:1}.unread-summary>span:last-child{font-size:var(--text-xs)}.notification-toolbar{display:flex;align-items:center;justify-content:space-between;gap:var(--sp-3);margin-bottom:var(--sp-4);padding:var(--sp-2);background:var(--card);border:1px solid var(--line);border-radius:var(--r-lg)}.filter-group{display:flex;gap:5px}.filter-group button{display:inline-flex;align-items:center;gap:7px;min-height:var(--touch-target);padding:7px 12px;color:var(--muted);background:transparent;border:0;border-radius:var(--r-md);font:650 var(--text-sm) var(--font-body);cursor:pointer}.filter-group button span{display:grid;min-width:21px;height:21px;place-items:center;background:var(--surface-3);border-radius:999px;font-size:10px}.filter-group button.active{color:var(--primary);background:var(--eyebrow-bg)}.filter-group button:focus-visible{outline:2.5px solid var(--border-focus);outline-offset:1px}.notification-list{display:grid;gap:10px}.load-more-row{display:flex;justify-content:center;margin-top:var(--sp-4)}.notification-item{display:grid;width:100%;grid-template-columns:auto minmax(0,1fr) auto;gap:var(--sp-3);align-items:start;padding:var(--sp-4);color:inherit;text-align:left;background:var(--card);border:1px solid var(--line);border-radius:var(--r-lg);box-shadow:var(--shadow-xs);cursor:pointer;transition:transform var(--dur-fast),border-color var(--dur-fast),box-shadow var(--dur-fast)}.notification-item:hover{transform:translateY(-1px);border-color:var(--primary-light);box-shadow:var(--shadow-sm)}.notification-item:focus-visible{outline:2.5px solid var(--border-focus);outline-offset:2px}.notification-item:disabled{opacity:.65;cursor:wait;transform:none}.notification-item.unread{background:linear-gradient(90deg,color-mix(in srgb,var(--accent) 8%,var(--card)),var(--card));border-color:color-mix(in srgb,var(--accent) 42%,var(--line))}.notification-icon{display:grid;width:42px;height:42px;place-items:center;color:var(--primary);background:var(--eyebrow-bg);border-radius:50%}.notification-item.unread .notification-icon{color:var(--accent-deep);background:color-mix(in srgb,var(--accent) 16%,var(--card))}.notification-copy{display:grid;gap:6px;min-width:0}.notification-title{display:flex;align-items:center;gap:8px;flex-wrap:wrap}.notification-title strong{overflow-wrap:anywhere;font-size:var(--text-sm)}.read-status{padding:3px 7px;color:var(--muted);background:var(--surface-3);border-radius:999px;font-size:10px;font-weight:700}.unread-status{color:var(--accent-deep);background:color-mix(in srgb,var(--accent) 15%,var(--card))}.body{color:var(--muted);font-size:var(--text-sm);line-height:1.55;overflow-wrap:anywhere}.notification-copy time{display:flex;align-items:center;gap:5px;color:var(--muted);font-size:var(--text-xs)}.row-arrow{align-self:center;color:var(--muted)}.empty-state{display:grid;justify-items:center;gap:8px;padding:clamp(32px,7vw,60px) var(--sp-4);text-align:center;background:var(--card);border:1px dashed var(--line);border-radius:var(--r-xl)}.empty-state>span{display:grid;width:56px;height:56px;place-items:center;color:var(--primary);background:var(--eyebrow-bg);border-radius:50%}.empty-state h2{font-size:var(--text-xl)}.empty-state p{max-width:480px;color:var(--muted);font-size:var(--text-sm);line-height:1.55}.error-state{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:var(--sp-3);align-items:center;padding:var(--sp-4);color:var(--alert);background:color-mix(in srgb,var(--alert) 8%,var(--card));border:1px solid color-mix(in srgb,var(--alert) 32%,var(--line));border-radius:var(--r-lg)}.error-state>span{display:grid;width:40px;height:40px;place-items:center}.error-state strong{color:var(--text)}.error-state p{margin-top:3px;color:var(--muted);font-size:var(--text-xs)}@media(max-width:680px){.notification-hero{grid-template-columns:1fr;align-items:start;padding:var(--sp-4)}.notification-toolbar{align-items:stretch;flex-direction:column}.filter-group{display:grid;grid-template-columns:1fr 1fr}.filter-group button{justify-content:center}.notification-toolbar :global(.btn-base){width:100%}.notification-item{grid-template-columns:auto minmax(0,1fr);padding:var(--sp-3)}.row-arrow{display:none}.error-state{grid-template-columns:auto minmax(0,1fr)}.error-state :global(.btn-base){grid-column:1/-1;width:100%}}@media(max-width:420px){.notification-icon{width:38px;height:38px}.notification-title{align-items:flex-start;flex-direction:column}}
    `}</style>
  </main>;
}
