'use client';

import { useCallback, useEffect, useMemo, useState, type KeyboardEvent } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  adminDeleteContent, adminDeletePet, dismissReport, fetchAdminAudit, fetchAdminContent,
  fetchAdminStats, fetchAdminSystemHealth, fetchReports, fetchUserReports, isAdmin,
  resolveUserReport, writeAudit, type AdminAuditItem, type AdminContentItem,
  type AdminContentType, type AdminStats, type AdminSystemHealth, type AdminUserReport,
} from '../../lib/adminService';
import { useAuth } from '../../lib/useAuth';
import { useLanguage } from '../../lib/i18n';
import { relativeTime } from '../../lib/relativeTime';
import type { Report } from '../../lib/types';
import { getErrorMessage } from '../../lib/utils';
import { useToast } from '../../components/Toast';
import LoginModal from '../../components/LoginModal';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import Icon, { type IconName } from '../../components/ui/icons';
import Modal from '../../components/ui/Modal';

type Tab = 'dashboard' | 'reports' | 'user-reports' | 'content' | 'health' | 'audit';
type ContentFilter = 'all' | AdminContentType;
type DeleteTarget =
  | { type: 'reported-pet'; reportId: string; petId: string; title: string }
  | { type: 'content'; item: AdminContentItem };

const EMPTY_STATS: AdminStats = { pets: 0, activePets: 0, resolvedPets: 0, adoptions: 0, sitting: 0, reports: 0 };
const TAB_ORDER: Tab[] = ['dashboard', 'reports', 'user-reports', 'content', 'health', 'audit'];

export default function AdminPage() {
  const { user, loading } = useAuth();
  const { lang, t } = useLanguage();
  const showToast = useToast();
  const [checked, setChecked] = useState(false);
  const [admin, setAdmin] = useState(false);
  const [tab, setTab] = useState<Tab>('dashboard');
  const [stats, setStats] = useState<AdminStats>(EMPTY_STATS);
  const [reports, setReports] = useState<Report[]>([]);
  const [content, setContent] = useState<AdminContentItem[]>([]);
  const [audit, setAudit] = useState<AdminAuditItem[]>([]);
  const [userReports, setUserReports] = useState<AdminUserReport[]>([]);
  const [health, setHealth] = useState<AdminSystemHealth | null>(null);
  const [filter, setFilter] = useState<ContentFilter>('all');
  const [search, setSearch] = useState('');
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [showLogin, setShowLogin] = useState(false);

  const load = useCallback(async () => {
    setDataLoading(true);
    setDataError(null);
    try {
      const result = await Promise.all([
        fetchAdminStats(), fetchReports(), fetchAdminContent(), fetchAdminAudit(),
        fetchUserReports(), fetchAdminSystemHealth(),
      ]);
      setStats(result[0]); setReports(result[1]); setContent(result[2]);
      setAudit(result[3]); setUserReports(result[4]); setHealth(result[5]);
    } catch (error) {
      const message = getErrorMessage(error);
      setDataError(message);
      showToast(`${t('admin_load_error')}: ${message}`, 'error');
    } finally { setDataLoading(false); }
  }, [showToast, t]);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      Promise.resolve().then(() => {
        setChecked(true);
        setAdmin(false);
        setDataLoading(false);
      });
      return;
    }
    let active = true;
    isAdmin().then((allowed) => {
      if (!active) return;
      setAdmin(allowed); setChecked(true);
      if (allowed) void load(); else setDataLoading(false);
    });
    return () => { active = false; };
  }, [user, loading, load]);

  const visibleContent = useMemo(() => {
    const locale = lang === 'mn' ? 'mn' : 'en';
    const query = search.trim().toLocaleLowerCase(locale);
    return content.filter((item) => (filter === 'all' || item.kind === filter)
      && (!query || `${item.title} ${item.subtitle}`.toLocaleLowerCase(locale).includes(query)));
  }, [content, filter, search, lang]);

  const dateFormatter = useMemo(() => new Intl.DateTimeFormat(lang === 'mn' ? 'mn-MN' : 'en-US', {
    dateStyle: 'medium', timeStyle: 'short',
  }), [lang]);

  const tabs: Array<{ id: Tab; label: string; count?: number; icon: IconName }> = [
    { id: 'dashboard', label: t('admin_tab_dashboard'), icon: 'home' },
    { id: 'reports', label: t('admin_tab_reports'), count: stats.reports, icon: 'flag' },
    { id: 'user-reports', label: t('admin_tab_users'), count: userReports.length, icon: 'shield' },
    { id: 'content', label: t('admin_tab_content'), icon: 'paw' },
    { id: 'health', label: t('admin_tab_health'), icon: 'cross' },
    { id: 'audit', label: t('admin_tab_audit'), icon: 'calendar' },
  ];

  const statCards: Array<{ label: string; value: number; tone: string; icon: IconName }> = [
    { label: t('admin_stat_pets'), value: stats.pets, tone: 'primary', icon: 'paw' },
    { label: t('admin_stat_active'), value: stats.activePets, tone: 'sky', icon: 'search' },
    { label: t('admin_stat_resolved'), value: stats.resolvedPets, tone: 'success', icon: 'check' },
    { label: t('admin_stat_adoptions'), value: stats.adoptions, tone: 'coral', icon: 'heart' },
    { label: t('admin_stat_sitting'), value: stats.sitting, tone: 'violet', icon: 'home' },
    { label: t('admin_stat_reports'), value: stats.reports, tone: 'danger', icon: 'flag' },
  ];

  function handleTabKeyDown(event: KeyboardEvent<HTMLButtonElement>, current: Tab) {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const index = TAB_ORDER.indexOf(current);
    const nextIndex = event.key === 'Home' ? 0 : event.key === 'End' ? TAB_ORDER.length - 1
      : (index + (event.key === 'ArrowRight' ? 1 : -1) + TAB_ORDER.length) % TAB_ORDER.length;
    const next = TAB_ORDER[nextIndex];
    setTab(next);
    document.getElementById(`admin-tab-${next}`)?.focus();
  }

  async function dismissPostReport(id: string) {
    const key = `report:${id}`; setBusyKey(key);
    try { await dismissReport(id); await writeAudit('dismiss_report', 'report', id); showToast(t('admin_dismissed'), 'success'); await load(); }
    catch (error) { showToast(`${t('admin_action_error')}: ${getErrorMessage(error)}`, 'error'); }
    finally { setBusyKey(null); }
  }

  async function updateUserReport(id: string, status: 'reviewed' | 'dismissed') {
    const key = `user-report:${id}`; setBusyKey(key);
    try { await resolveUserReport(id, status); showToast(status === 'reviewed' ? t('admin_user_reviewed') : t('admin_user_dismissed'), 'success'); await load(); }
    catch (error) { showToast(`${t('admin_action_error')}: ${getErrorMessage(error)}`, 'error'); }
    finally { setBusyKey(null); }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    const key = deleteTarget.type === 'reported-pet' ? `report:${deleteTarget.reportId}` : `content:${deleteTarget.item.kind}:${deleteTarget.item.id}`;
    setBusyKey(key);
    try {
      if (deleteTarget.type === 'reported-pet') { await adminDeletePet(deleteTarget.petId); await dismissReport(deleteTarget.reportId); }
      else await adminDeleteContent(deleteTarget.item.kind, deleteTarget.item.id);
      setDeleteTarget(null); showToast(t('admin_deleted'), 'success'); await load();
    } catch (error) { showToast(`${t('admin_action_error')}: ${getErrorMessage(error)}`, 'error'); }
    finally { setBusyKey(null); }
  }

  function kindLabel(kind: AdminContentType) {
    return kind === 'pet' ? t('admin_filter_pet') : kind === 'adoption' ? t('admin_filter_adoption') : t('admin_filter_sitting');
  }
  function auditLabel(action: string) {
    return action === 'delete' ? t('admin_audit_delete') : action === 'dismiss_report' ? t('admin_audit_dismiss_report')
      : action === 'review_user_report' ? t('admin_audit_review_user') : action === 'dismiss_user_report' ? t('admin_audit_dismiss_user') : action;
  }
  function targetLabel(type: string) {
    return type === 'pet' ? t('admin_target_pet') : type === 'adoption' ? t('admin_target_adoption')
      : type === 'sitting' ? t('admin_target_sitting') : type === 'report' ? t('admin_target_report')
        : type === 'user_report' ? t('admin_target_user_report') : type;
  }

  if (loading || !checked) return <main className="page-shell admin-state" aria-busy="true"><span className="state-panel__icon"><Icon name="shield" size={28} /></span><p>{t('admin_loading')}</p></main>;
  if (!user) return <main className="page-shell admin-state"><span className="state-panel__icon"><Icon name="lock" size={28} /></span><p className="eyebrow">{t('admin_restricted_eyebrow')}</p><h1>{t('admin_login_title')}</h1><p>{t('admin_login_desc')}</p><Button onClick={() => setShowLogin(true)}><Icon name="lock" size={18} />{t('admin_login_action')}</Button>{showLogin && <LoginModal onClose={() => setShowLogin(false)} />}</main>;
  if (!admin) return <main className="page-shell admin-state"><span className="state-panel__icon"><Icon name="shield" size={28} /></span><p className="eyebrow">{t('admin_restricted_eyebrow')}</p><h1>{t('admin_no_access')}</h1></main>;

  const deleteTitle = deleteTarget?.type === 'reported-pet' ? deleteTarget.title : deleteTarget?.item.title;
  const deleteBusy = Boolean(deleteTarget && busyKey === (deleteTarget.type === 'reported-pet' ? `report:${deleteTarget.reportId}` : `content:${deleteTarget.item.kind}:${deleteTarget.item.id}`));

  return (
    <main className="page-shell admin-page">
      <header className="admin-hero">
        <div><p className="eyebrow">{t('admin_dashboard_eyebrow')}</p><h1>{t('admin_dashboard_title')}</h1><p>{t('admin_dashboard_desc')}</p><span className="admin-account"><Icon name="shield" size={16} />{user.email}</span></div>
        <div className="hero-status"><span className={`health-badge ${health?.status === 'ok' ? 'is-ok' : 'is-warning'}`}><i />{health?.status === 'ok' ? t('admin_health_ok') : t('admin_health_degraded')}</span><Button variant="ghost" onClick={() => void load()} disabled={dataLoading} aria-busy={dataLoading}><Icon name="arrowRight" size={17} />{dataLoading ? t('admin_refreshing') : t('admin_refresh')}</Button></div>
      </header>

      <nav className="admin-tabs" role="tablist" aria-label={t('admin_tabs_label')}>
        {tabs.map(({ id, label, count, icon }) => <button key={id} id={`admin-tab-${id}`} type="button" role="tab" aria-selected={tab === id} aria-controls={`admin-panel-${id}`} tabIndex={tab === id ? 0 : -1} className={tab === id ? 'is-active' : ''} onClick={() => setTab(id)} onKeyDown={(event) => handleTabKeyDown(event, id)}><Icon name={icon} size={17} /><span>{label}</span>{count !== undefined && <strong>{count}</strong>}</button>)}
      </nav>

      {dataLoading ? <AdminSkeleton /> : dataError ? <section className="state-panel state-panel--error" role="alert"><span className="state-panel__icon"><Icon name="alert" size={28} /></span><h2>{t('admin_load_error')}</h2><p>{dataError}</p><Button variant="ghost" onClick={() => void load()}><Icon name="arrowRight" size={17} />{t('admin_retry')}</Button></section> : <>
        <section id="admin-panel-dashboard" role="tabpanel" aria-labelledby="admin-tab-dashboard" hidden={tab !== 'dashboard'}>
          <div className="stats-grid">{statCards.map((card) => <article key={card.label} className={`stat-card tone-${card.tone}`}><span><Icon name={card.icon} size={20} /></span><p>{card.label}</p><strong>{card.value}</strong></article>)}</div>
          {(reports.length > 0 || userReports.length > 0) && <section className="attention-panel" aria-labelledby="attention-title"><div><span><Icon name="alert" size={22} /></span><div><h2 id="attention-title">{t('admin_attention_title')}</h2><p>{t('admin_reports_desc')}</p></div></div><div className="attention-actions">{reports.length > 0 && <Button variant="ghost" onClick={() => setTab('reports')}><strong>{reports.length}</strong> {t('admin_attention_reports')}<Icon name="arrowRight" size={16} /></Button>}{userReports.length > 0 && <Button variant="ghost" onClick={() => setTab('user-reports')}><strong>{userReports.length}</strong> {t('admin_attention_users')}<Icon name="arrowRight" size={16} /></Button>}</div></section>}
        </section>

        <section id="admin-panel-reports" role="tabpanel" aria-labelledby="admin-tab-reports" hidden={tab !== 'reports'}>
          <SectionHeading title={t('admin_reports_title')} description={t('admin_reports_desc')} count={reports.length} />
          {reports.length === 0 ? <EmptyState icon={<Icon name="thumb" size={30} />} title={t('admin_report_empty_title')} description={t('admin_report_empty_desc')} /> : <div className="admin-list">{reports.map((report) => {
            const key = `report:${report.id}`;
            const title = report.pet ? `${report.pet.status === 'lost' ? (lang === 'mn' ? 'Алдсан' : 'Lost') : (lang === 'mn' ? 'Олдсон' : 'Found')} · ${report.pet.name || report.pet.type}` : t('admin_pet_deleted');
            return <article key={report.id} className="admin-row">{report.pet?.photoURL ? <Image src={report.pet.photoURL} alt={title} width={84} height={84} /> : <span className="image-placeholder"><Icon name="flag" size={25} /></span>}<div className="row-copy"><span className="danger-label">{t('admin_report_reason')}: {report.reason}</span>{report.pet ? <Link href={`/pets/${report.pet.id}`}>{title}</Link> : <strong>{title}</strong>}<small><Icon name="calendar" size={14} />{relativeTime(report.createdAt, lang)}</small></div><div className="row-actions">{report.pet && <Button as="link" href={`/pets/${report.pet.id}`} variant="ghost" size="sm"><Icon name="eye" size={16} />{t('admin_report_open')}</Button>}<Button variant="ghost" size="sm" disabled={busyKey === key} onClick={() => void dismissPostReport(report.id)}>{t('admin_dismiss')}</Button>{report.pet && <Button variant="danger" size="sm" disabled={busyKey === key} onClick={() => setDeleteTarget({ type: 'reported-pet', reportId: report.id, petId: report.pet!.id, title })}><Icon name="trash" size={16} />{t('admin_delete_pet')}</Button>}</div></article>;
          })}</div>}
        </section>

        <section id="admin-panel-user-reports" role="tabpanel" aria-labelledby="admin-tab-user-reports" hidden={tab !== 'user-reports'}>
          <SectionHeading title={t('admin_users_title')} description={t('admin_users_desc')} count={userReports.length} />
          {userReports.length === 0 ? <EmptyState icon={<Icon name="shield" size={30} />} title={t('admin_user_empty_title')} description={t('admin_user_empty_desc')} /> : <div className="admin-list">{userReports.map((report) => <article key={report.id} className="admin-row"><span className="image-placeholder"><Icon name="flag" size={25} /></span><div className="row-copy"><span className="danger-label">{t('admin_report_reason')}: {report.reason}</span><Link href={`/users/${report.reportedId}`}>{report.reportedName}</Link><small><Icon name="calendar" size={14} />{relativeTime(report.createdAt, lang)}</small></div><div className="row-actions"><Button as="link" href={`/users/${report.reportedId}`} variant="ghost" size="sm"><Icon name="eye" size={16} />{t('admin_user_open')}</Button><Button variant="ghost" size="sm" disabled={busyKey === `user-report:${report.id}`} onClick={() => void updateUserReport(report.id, 'dismissed')}>{t('admin_dismiss')}</Button><Button variant="secondary" size="sm" disabled={busyKey === `user-report:${report.id}`} onClick={() => void updateUserReport(report.id, 'reviewed')}><Icon name="check" size={16} />{t('admin_user_reviewed')}</Button></div></article>)}</div>}
        </section>

        <section id="admin-panel-content" role="tabpanel" aria-labelledby="admin-tab-content" hidden={tab !== 'content'}>
          <SectionHeading title={t('admin_content_title')} description={t('admin_content_desc')} count={visibleContent.length} />
          <div className="content-tools"><label className="search-field" htmlFor="admin-content-search"><span>{t('admin_search_label')}</span><span className="search-control"><Icon name="search" size={18} /><input id="admin-content-search" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t('admin_search_placeholder')} /></span></label><fieldset className="filter-pills"><legend>{t('admin_filters_label')}</legend>{([['all', t('admin_filter_all')], ['pet', t('admin_filter_pet')], ['adoption', t('admin_filter_adoption')], ['sitting', t('admin_filter_sitting')]] as Array<[ContentFilter, string]>).map(([id, label]) => <button key={id} type="button" aria-pressed={filter === id} className={filter === id ? 'is-active' : ''} onClick={() => setFilter(id)}>{label}</button>)}</fieldset></div>
          <p className="result-count" role="status">{visibleContent.length} {t('admin_result_suffix')}</p>
          {visibleContent.length === 0 ? <EmptyState icon={<Icon name="search" size={30} />} title={t('admin_content_empty_title')} description={t('admin_content_empty_desc')} /> : <div className="admin-list">{visibleContent.map((item) => <article key={`${item.kind}-${item.id}`} className="admin-row">{item.image ? <Image src={item.image} alt={item.title} width={84} height={84} /> : <span className="image-placeholder"><Icon name="paw" size={26} /></span>}<div className="row-copy"><span className={`kind kind-${item.kind}`}>{kindLabel(item.kind)}</span><Link href={item.href}>{item.title}</Link><small>{item.subtitle}</small><small><Icon name="calendar" size={14} />{relativeTime(item.createdAt, lang)}</small></div><div className="row-actions"><Button as="link" href={item.href} variant="ghost" size="sm"><Icon name="eye" size={16} />{t('admin_view')}</Button><Button variant="danger" size="sm" disabled={busyKey === `content:${item.kind}:${item.id}`} onClick={() => setDeleteTarget({ type: 'content', item })}><Icon name="trash" size={16} />{t('admin_delete')}</Button></div></article>)}</div>}
        </section>

        <section id="admin-panel-health" role="tabpanel" aria-labelledby="admin-tab-health" hidden={tab !== 'health'}>
          <SectionHeading title={t('admin_health_title')} description={t('admin_health_desc')} />
          {health && <div className="health-grid"><article className={`health-summary ${health.status === 'ok' ? 'is-ok' : 'is-warning'}`}><span><Icon name={health.status === 'ok' ? 'check' : 'alert'} size={30} /></span><div><p>{health.status === 'ok' ? t('admin_health_ok') : t('admin_health_degraded')}</p><strong>{health.status.toUpperCase()}</strong></div></article><HealthCheck icon="lock" label={t('admin_health_configuration')} ok={health.checks.configuration} okText={t('admin_health_passed')} failText={t('admin_health_failed')} /><HealthCheck icon="cross" label={t('admin_health_database')} ok={health.checks.database} okText={t('admin_health_passed')} failText={t('admin_health_failed')} /><article className="health-meta"><span>{t('admin_health_version')}</span><strong>{health.version}</strong></article><article className="health-meta"><span>{t('admin_health_checked')}</span><strong>{dateFormatter.format(new Date(health.timestamp))}</strong></article></div>}
        </section>

        <section id="admin-panel-audit" role="tabpanel" aria-labelledby="admin-tab-audit" hidden={tab !== 'audit'}>
          <SectionHeading title={t('admin_audit_title')} description={t('admin_audit_desc')} count={audit.length} />
          {audit.length === 0 ? <EmptyState icon={<Icon name="calendar" size={30} />} title={t('admin_audit_empty_title')} description={t('admin_audit_empty_desc')}><p className="setup-note"><Icon name="info" size={16} />{t('admin_audit_setup')}</p></EmptyState> : <div className="audit-table" role="table" aria-label={t('admin_audit_title')}><div className="audit-head" role="row"><span role="columnheader">{t('admin_audit_action')}</span><span role="columnheader">{t('admin_audit_target')}</span><span role="columnheader">{t('admin_audit_time')}</span></div>{audit.map((item) => <div className="audit-row" role="row" key={item.id}><strong role="cell">{auditLabel(item.action)}</strong><span role="cell">{targetLabel(item.targetType)}</span><time role="cell" dateTime={item.createdAt}>{relativeTime(item.createdAt, lang)}</time></div>)}</div>}
        </section>
      </>}

      <Modal open={Boolean(deleteTarget)} onClose={() => { if (!deleteBusy) setDeleteTarget(null); }} title={t('admin_delete_modal_title')} closeLabel={t('close')} width="sm"><div className="delete-modal-copy"><span className="delete-modal-icon"><Icon name="trash" size={26} /></span><p>{t('admin_delete_modal_desc')}</p>{deleteTitle && <p className="delete-name"><strong>{t('admin_delete_named_prefix')}</strong> {deleteTitle}</p>}<div className="delete-actions"><Button variant="ghost" onClick={() => setDeleteTarget(null)} disabled={deleteBusy}>{t('admin_cancel')}</Button><Button variant="danger" onClick={() => void confirmDelete()} disabled={deleteBusy} aria-busy={deleteBusy}><Icon name="trash" size={17} />{deleteBusy ? t('admin_deleting') : t('admin_delete')}</Button></div></div></Modal>

      <style jsx>{`
        .admin-page{padding-bottom:96px}.admin-hero{display:flex;align-items:flex-end;justify-content:space-between;gap:var(--sp-5);margin-bottom:var(--sp-5);padding:clamp(20px,4vw,34px);border:1px solid var(--glass-border);border-radius:var(--r-xl);background:linear-gradient(135deg,color-mix(in srgb,var(--primary) 9%,var(--card)),color-mix(in srgb,var(--found) 8%,var(--card)));box-shadow:var(--shadow-sm)}.admin-hero h1{margin:var(--sp-2) 0;font-size:clamp(1.8rem,4vw,3rem)}.admin-hero>div:first-child>p:not(.eyebrow){max-width:650px;color:var(--text-secondary);line-height:1.6}.admin-account{display:inline-flex;align-items:center;gap:7px;margin-top:var(--sp-3);color:var(--text-tertiary);font-size:var(--text-xs);overflow-wrap:anywhere}.hero-status{display:grid;justify-items:end;gap:var(--sp-3);flex:0 0 auto}.health-badge{display:inline-flex;align-items:center;gap:8px;padding:7px 11px;border:1px solid var(--border-subtle);border-radius:999px;color:var(--text-secondary);background:var(--card);font-size:var(--text-xs);font-weight:750}.health-badge i{width:8px;height:8px;border-radius:50%;background:var(--warning)}.health-badge.is-ok i{background:var(--success)}
        .admin-tabs{position:sticky;top:calc(var(--navbar-height,72px) + 8px);z-index:12;display:flex;gap:6px;margin-bottom:var(--sp-6);padding:6px;overflow-x:auto;border:1px solid var(--border-subtle);border-radius:var(--r-lg);background:color-mix(in srgb,var(--surface-1) 90%,transparent);box-shadow:var(--shadow-xs);backdrop-filter:blur(16px)}.admin-tabs button{display:inline-flex;align-items:center;justify-content:center;gap:7px;min-height:44px;flex:1 0 max-content;padding:8px 13px;border:0;border-radius:var(--r-md);color:var(--text-secondary);background:transparent;font:inherit;font-size:var(--text-sm);font-weight:750;cursor:pointer}.admin-tabs button:hover,.admin-tabs button.is-active{color:var(--primary);background:var(--card);box-shadow:var(--shadow-sm)}.admin-tabs button:focus-visible{outline:2.5px solid var(--border-focus);outline-offset:-2px}.admin-tabs strong{display:grid;place-items:center;min-width:21px;height:21px;padding:0 5px;border-radius:999px;color:var(--text-on-accent);background:var(--primary);font-size:11px}[role=tabpanel][hidden]{display:none}
        .stats-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:var(--sp-3)}.stat-card{--stat-color:var(--primary);position:relative;min-height:148px;padding:var(--sp-4);overflow:hidden;border:1px solid var(--border-subtle);border-radius:var(--r-lg);background:var(--card);box-shadow:var(--shadow-xs)}.stat-card>span{display:grid;place-items:center;width:38px;height:38px;margin-bottom:var(--sp-3);border-radius:var(--r-md);color:var(--stat-color);background:color-mix(in srgb,var(--stat-color) 10%,transparent)}.stat-card p{max-width:20ch;color:var(--text-secondary);font-size:var(--text-sm)}.stat-card>strong{display:block;margin-top:var(--sp-3);color:var(--stat-color);font-family:var(--font-display);font-size:2.25rem}.tone-sky{--stat-color:var(--found-deep)}.tone-success{--stat-color:var(--success)}.tone-coral{--stat-color:var(--alert)}.tone-violet{--stat-color:var(--primary-light)}.tone-danger{--stat-color:var(--danger)}.attention-panel{display:grid;gap:var(--sp-4);margin-top:var(--sp-4);padding:var(--sp-4);border:1px solid color-mix(in srgb,var(--warning) 34%,var(--border-subtle));border-radius:var(--r-lg);background:color-mix(in srgb,var(--warning) 8%,var(--card))}.attention-panel>div:first-child{display:flex;gap:var(--sp-3)}.attention-panel>div:first-child>span{display:grid;place-items:center;width:44px;height:44px;flex:0 0 44px;border-radius:50%;color:var(--danger);background:color-mix(in srgb,var(--warning) 20%,var(--card))}.attention-panel h2{margin-bottom:4px;font-size:var(--text-lg)}.attention-panel p{color:var(--text-secondary);font-size:var(--text-sm)}.attention-actions{display:flex;gap:var(--sp-2);flex-wrap:wrap}.attention-actions :global(.btn-base){white-space:normal}
        .admin-list{display:grid;gap:10px}.admin-row{display:flex;align-items:center;gap:var(--sp-3);padding:var(--sp-3);border:1px solid var(--border-subtle);border-radius:var(--r-lg);background:var(--card);box-shadow:var(--shadow-xs)}.admin-row:hover{border-color:var(--primary-light);box-shadow:var(--shadow-sm)}.admin-row :global(img),.image-placeholder{width:84px;height:84px;flex:0 0 84px;border-radius:var(--r-md);object-fit:cover}.image-placeholder{display:grid;place-items:center;color:var(--primary);background:var(--surface-3)}.row-copy{display:grid;gap:5px;flex:1;min-width:0}.row-copy :global(a){width:max-content;max-width:100%;overflow:hidden;color:var(--text-primary);font-weight:800;text-decoration:none;text-overflow:ellipsis;white-space:nowrap}.row-copy :global(a:hover){color:var(--primary);text-decoration:underline}.row-copy small{display:flex;align-items:center;gap:6px;color:var(--text-secondary);font-size:var(--text-xs)}.danger-label{width:max-content;max-width:100%;padding:4px 8px;border-radius:999px;color:var(--danger);background:color-mix(in srgb,var(--danger) 9%,transparent);font-size:11px;font-weight:750;overflow-wrap:anywhere}.row-actions{display:flex;justify-content:flex-end;gap:6px;flex-wrap:wrap;max-width:390px}.kind{width:max-content;padding:4px 8px;border-radius:999px;color:var(--primary);background:color-mix(in srgb,var(--primary) 10%,transparent);font-size:10px;font-weight:800}.kind-adoption{color:var(--success);background:color-mix(in srgb,var(--success) 10%,transparent)}.kind-sitting{color:var(--found-deep);background:color-mix(in srgb,var(--found) 14%,transparent)}
        .content-tools{display:grid;grid-template-columns:minmax(260px,1fr) auto;align-items:end;gap:var(--sp-3);margin-bottom:var(--sp-3)}.search-field{display:grid;gap:7px;color:var(--text-secondary);font-size:var(--text-xs);font-weight:750}.search-control{display:flex;align-items:center;gap:9px;min-height:48px;padding:0 14px;border:1px solid var(--border-subtle);border-radius:var(--r-md);color:var(--text-tertiary);background:var(--surface-2)}.search-control:focus-within{border-color:var(--border-focus);box-shadow:0 0 0 3px color-mix(in srgb,var(--border-focus) 18%,transparent)}.search-control input{width:100%;border:0;outline:0;color:var(--text-primary);background:transparent;font:inherit}.filter-pills{display:grid;grid-template-columns:repeat(4,max-content);gap:6px;margin:0;padding:0;border:0}.filter-pills legend{position:absolute;width:1px;height:1px;margin:-1px;overflow:hidden;clip:rect(0,0,0,0)}.filter-pills button{min-height:44px;padding:0 13px;border:1px solid var(--border-subtle);border-radius:999px;color:var(--text-secondary);background:transparent;font:inherit;font-size:var(--text-xs);font-weight:750;cursor:pointer}.filter-pills button.is-active{color:var(--text-on-accent);border-color:var(--primary);background:var(--primary)}.filter-pills button:focus-visible{outline:2.5px solid var(--border-focus);outline-offset:2px}.result-count{margin:0 0 var(--sp-3);color:var(--text-secondary);font-size:var(--text-xs);font-weight:750}
        .health-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:var(--sp-3)}.health-summary{grid-column:1/-1;display:flex;align-items:center;gap:var(--sp-4);padding:var(--sp-5);border:1px solid var(--border-subtle);border-radius:var(--r-lg);background:var(--card)}.health-summary.is-ok{border-color:color-mix(in srgb,var(--success) 35%,var(--border-subtle));background:color-mix(in srgb,var(--success) 7%,var(--card))}.health-summary>span{display:grid;place-items:center;width:58px;height:58px;flex:0 0 58px;border-radius:50%;color:var(--success);background:color-mix(in srgb,var(--success) 12%,var(--card))}.health-summary.is-warning>span{color:var(--danger);background:color-mix(in srgb,var(--warning) 16%,var(--card))}.health-summary p{color:var(--text-secondary);font-size:var(--text-sm)}.health-summary strong{font-size:var(--text-xl)}.health-meta{display:flex;align-items:center;justify-content:space-between;gap:var(--sp-3);min-height:86px;padding:var(--sp-4);border:1px solid var(--border-subtle);border-radius:var(--r-lg);background:var(--card)}.health-meta span{color:var(--text-secondary);font-size:var(--text-sm)}.health-meta strong{font-size:var(--text-sm);text-align:right}
        .audit-table{overflow:hidden;border:1px solid var(--border-subtle);border-radius:var(--r-lg);background:var(--card)}.audit-head,.audit-row{display:grid;grid-template-columns:minmax(0,1.4fr) minmax(0,1fr) minmax(150px,.7fr);gap:var(--sp-3);align-items:center;padding:13px var(--sp-4)}.audit-head{color:var(--text-secondary);background:var(--surface-3);font-size:var(--text-xs);font-weight:800}.audit-row+.audit-row{border-top:1px solid var(--border-subtle)}.audit-row strong{font-size:var(--text-sm)}.audit-row span,.audit-row time{color:var(--text-secondary);font-size:var(--text-xs)}.setup-note{display:flex;align-items:flex-start;justify-content:center;gap:7px;max-width:620px;margin-inline:auto;color:var(--text-secondary);font-size:var(--text-xs)}
        .delete-modal-copy{display:grid;gap:var(--sp-3)}.delete-modal-icon{display:grid;place-items:center;width:54px;height:54px;border-radius:50%;color:var(--danger);background:color-mix(in srgb,var(--danger) 10%,var(--surface-2))}.delete-modal-copy>p{color:var(--text-secondary);line-height:1.6}.delete-name{padding:var(--sp-3);border-radius:var(--r-md);background:var(--surface-3)}.delete-actions{display:flex;justify-content:flex-end;gap:var(--sp-2)}.admin-state{display:grid;justify-items:center;align-content:center;gap:var(--sp-3);min-height:55vh;text-align:center}.admin-state h1{max-width:680px}.admin-state>p:not(.eyebrow){max-width:540px;color:var(--text-secondary)}.admin-state .state-panel__icon{margin:0}
        @media(max-width:960px){.stats-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.content-tools{grid-template-columns:1fr}.filter-pills{overflow-x:auto}.admin-row{align-items:flex-start;flex-wrap:wrap}.row-copy{min-width:calc(100% - 104px)}.row-actions{width:100%;max-width:none;padding-top:var(--sp-2);border-top:1px solid var(--border-subtle)}.health-grid{grid-template-columns:1fr}.health-summary{grid-column:auto}}
        @media(max-width:700px){.admin-hero{align-items:stretch;flex-direction:column}.hero-status{display:flex;align-items:center;justify-content:space-between}.admin-tabs{top:8px;margin-inline:calc(var(--page-pad) * -1);border-radius:0;border-inline:0}.audit-head{display:none}.audit-row{grid-template-columns:1fr;gap:5px}.health-meta{align-items:flex-start;flex-direction:column}.health-meta strong{text-align:left}}
        @media(max-width:520px){.admin-hero{margin-inline:calc(var(--page-pad) * -1);padding:var(--sp-4) var(--page-pad);border-inline:0;border-radius:0}.hero-status{align-items:stretch;flex-direction:column}.stats-grid{grid-template-columns:1fr}.stat-card{min-height:118px}.admin-row :global(img),.image-placeholder{width:62px;height:62px;flex-basis:62px}.row-copy{min-width:calc(100% - 78px)}.row-actions{display:grid;grid-template-columns:1fr 1fr}.row-actions :global(.btn-base){width:100%;white-space:normal}.delete-actions{display:grid;grid-template-columns:1fr}.delete-actions :global(.btn-base){width:100%}}
      `}</style>
    </main>
  );
}

function SectionHeading({ title, description, count }: { title: string; description: string; count?: number }) {
  return <div className="section-heading-local"><div><h2>{title}</h2><p>{description}</p></div>{count !== undefined && <span aria-label={`${count}`}>{count}</span>}<style jsx>{`.section-heading-local{display:flex;align-items:flex-end;justify-content:space-between;gap:var(--sp-4);margin-bottom:var(--sp-4);padding-bottom:var(--sp-4);border-bottom:1px solid var(--border-subtle)}h2{margin:0 0 6px;font-size:clamp(1.35rem,3vw,1.8rem)}p{max-width:680px;color:var(--text-secondary);line-height:1.55}.section-heading-local>span{display:grid;place-items:center;min-width:42px;height:42px;padding:0 10px;border-radius:999px;color:var(--primary);background:var(--eyebrow-bg);font-weight:800}@media(max-width:700px){.section-heading-local{align-items:flex-start;flex-direction:column}}`}</style></div>;
}

function HealthCheck({ icon, label, ok, okText, failText }: { icon: IconName; label: string; ok: boolean; okText: string; failText: string }) {
  return <article className="health-check"><span><Icon name={icon} size={19} />{label}</span><strong className={ok ? 'is-ok' : 'is-failed'}>{ok ? okText : failText}</strong><style jsx>{`.health-check{display:flex;align-items:center;justify-content:space-between;gap:var(--sp-3);min-height:86px;padding:var(--sp-4);border:1px solid var(--border-subtle);border-radius:var(--r-lg);background:var(--card)}.health-check>span{display:flex;align-items:center;gap:9px;font-weight:750}.health-check strong{font-size:var(--text-sm);text-align:right}.is-ok{color:var(--success)}.is-failed{color:var(--danger)}@media(max-width:700px){.health-check{align-items:flex-start;flex-direction:column}.health-check strong{text-align:left}}`}</style></article>;
}

function AdminSkeleton() {
  return <div className="admin-skeleton" aria-hidden="true">{[0, 1, 2, 3, 4, 5].map((item) => <span key={item} />)}<style jsx>{`.admin-skeleton{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:var(--sp-3)}.admin-skeleton span{height:148px;border-radius:var(--r-lg);background:linear-gradient(90deg,var(--surface-2),var(--surface-3),var(--surface-2));background-size:220% 100%;animation:admin-shimmer 1.4s infinite}@keyframes admin-shimmer{to{background-position:-220% 0}}@media(max-width:960px){.admin-skeleton{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:520px){.admin-skeleton{grid-template-columns:1fr}}@media(prefers-reduced-motion:reduce){.admin-skeleton span{animation:none}}`}</style></div>;
}
