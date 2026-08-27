'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '../../lib/useAuth';
import {
  adminDeleteContent, adminDeletePet, dismissReport, fetchAdminAudit,
  fetchAdminContent, fetchAdminStats, fetchReports, isAdmin, writeAudit,
  type AdminAuditItem, type AdminContentItem, type AdminContentType, type AdminStats,
} from '../../lib/adminService';
import { useToast } from '../../components/Toast';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import Icon from '../../components/ui/icons';
import { relativeTime } from '../../lib/relativeTime';
import { useLanguage } from '../../lib/i18n';
import type { Report } from '../../lib/types';
import { getErrorMessage } from '../../lib/utils';

type Tab = 'dashboard' | 'reports' | 'content' | 'audit';
type ContentFilter = 'all' | AdminContentType;
const EMPTY_STATS: AdminStats = { pets: 0, activePets: 0, resolvedPets: 0, adoptions: 0, sitting: 0, reports: 0 };

export default function AdminPage() {
  const { user, loading } = useAuth();
  const showToast = useToast();
  const { t } = useLanguage();
  const [checked, setChecked] = useState(false);
  const [admin, setAdmin] = useState(false);
  const [tab, setTab] = useState<Tab>('dashboard');
  const [stats, setStats] = useState<AdminStats>(EMPTY_STATS);
  const [reports, setReports] = useState<Report[]>([]);
  const [content, setContent] = useState<AdminContentItem[]>([]);
  const [audit, setAudit] = useState<AdminAuditItem[]>([]);
  const [filter, setFilter] = useState<ContentFilter>('all');
  const [search, setSearch] = useState('');
  const [dataLoading, setDataLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setDataLoading(true);
    try {
      const [nextStats, nextReports, nextContent, nextAudit] = await Promise.all([
        fetchAdminStats(), fetchReports(), fetchAdminContent(), fetchAdminAudit(),
      ]);
      setStats(nextStats);
      setReports(nextReports);
      setContent(nextContent);
      setAudit(nextAudit);
    } catch (error) {
      showToast('Admin мэдээлэл ачаалахад алдаа гарлаа: ' + getErrorMessage(error), 'error');
    } finally {
      setDataLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (loading) return;
    if (!user) { Promise.resolve().then(() => setChecked(true)); return; }
    isAdmin().then((allowed) => {
      setAdmin(allowed);
      setChecked(true);
      if (allowed) load();
    });
  }, [user, loading, load]);

  const visibleContent = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('mn');
    return content.filter((item) =>
      (filter === 'all' || item.kind === filter)
      && (!query || `${item.title} ${item.subtitle}`.toLocaleLowerCase('mn').includes(query)),
    );
  }, [content, filter, search]);

  async function handleDismiss(reportId: string) {
    setBusyId(reportId);
    try {
      await dismissReport(reportId);
      await writeAudit('dismiss_report', 'report', reportId);
      showToast('Мэдээллийг үл хэрэгслээ', 'success');
      await load();
    } catch (error) { showToast('Алдаа: ' + getErrorMessage(error), 'error'); }
    finally { setBusyId(null); }
  }

  async function handleDeleteReported(reportId: string, petId: string) {
    if (!confirm('Энэ зар болон түүнтэй холбоотой мэдээллийг бүрмөсөн устгах уу?')) return;
    setBusyId(reportId);
    try {
      await adminDeletePet(petId);
      await dismissReport(reportId);
      showToast('Зарыг устгалаа', 'success');
      await load();
    } catch (error) { showToast('Алдаа: ' + getErrorMessage(error), 'error'); }
    finally { setBusyId(null); }
  }

  async function handleDeleteContent(item: AdminContentItem) {
    if (!confirm(`“${item.title}” зарыг бүрмөсөн устгах уу? Энэ үйлдлийг буцаах боломжгүй.`)) return;
    setBusyId(item.id);
    try {
      await adminDeleteContent(item.kind, item.id);
      showToast('Зарыг устгалаа', 'success');
      await load();
    } catch (error) { showToast('Устгахад алдаа гарлаа: ' + getErrorMessage(error), 'error'); }
    finally { setBusyId(null); }
  }

  if (loading || !checked) return <div className="grid min-h-[50vh] place-items-center text-muted">{t('detail_loading')}</div>;
  if (!user) return <div className="grid min-h-[50vh] place-items-center text-muted">{t('admin_login_required')}</div>;
  if (!admin) return <div className="page-shell"><div className="page-header"><div className="eyebrow">{t('admin_restricted_eyebrow')}</div><h1>{t('admin_no_access')}</h1></div></div>;

  return (
    <div className="page-shell pb-24">
      <header className="mb-6 flex items-end justify-between gap-4 max-[760px]:flex-col max-[760px]:items-stretch">
        <div><div className="eyebrow">Удирдлагын хэсэг</div><h1 className="my-2 font-display text-[clamp(1.8rem,5vw,3rem)]">Admin хяналтын самбар</h1><p className="text-muted">Зар, мэдээлэл болон модераторын үйлдлийг нэг газраас хянана.</p></div>
        <Button variant="ghost" onClick={load} disabled={dataLoading}>↻ Шинэчлэх</Button>
      </header>

      <nav className="mb-8 flex gap-1.5 overflow-x-auto rounded-card border border-line bg-panel p-1.5 max-[480px]:-mx-[var(--page-pad)] max-[480px]:rounded-none max-[480px]:border-x-0" aria-label="Admin хэсгүүд">
        {([
          ['dashboard', 'Хянах самбар'], ['reports', `Мэдээлэгдсэн (${stats.reports})`],
          ['content', 'Бүх зар'], ['audit', 'Үйлдлийн түүх'],
        ] as Array<[Tab, string]>).map(([id, label]) => (
          <button key={id} type="button" className={`min-h-11 flex-1 shrink-0 basis-max cursor-pointer rounded-control border-0 px-4.5 font-bold ${tab === id ? 'bg-[var(--card)] text-brand shadow-card' : 'bg-transparent text-muted'}`} onClick={() => setTab(id)}>{label}</button>
        ))}
      </nav>

      {dataLoading ? <AdminSkeleton /> : <>
        {tab === 'dashboard' && <Dashboard stats={stats} reports={reports} onOpenReports={() => setTab('reports')} />}

        {tab === 'reports' && (reports.length === 0 ?
          <EmptyState icon={<Icon name="thumb" size={30} />} description={t('admin_none')} /> :
          <section className="admin-list" aria-label="Мэдээлэгдсэн зарууд">
            {reports.map((report) => <article key={report.id} className="admin-row">
              {report.pet?.photoURL && <Image src={report.pet.photoURL} alt="" width={72} height={72} />}
              <div className="row-copy">
                <span className="danger-label">Мэдээлсэн: {report.reason}</span>
                {report.pet ? <Link href={`/pets/${report.pet.id}`}>{report.pet.status === 'lost' ? 'Алдсан' : 'Олдсон'} · {report.pet.name || report.pet.type}</Link> : <strong>{t('admin_pet_deleted')}</strong>}
                <small>{relativeTime(report.createdAt)}</small>
              </div>
              <div className="row-actions">
                <Button variant="ghost" disabled={busyId === report.id} onClick={() => handleDismiss(report.id)}>{t('admin_dismiss')}</Button>
                {report.pet && <Button variant="ghost" disabled={busyId === report.id} onClick={() => handleDeleteReported(report.id, report.pet!.id)} style={{ color: 'var(--danger)' }}>{t('admin_delete_pet')}</Button>}
              </div>
            </article>)}
          </section>
        )}

        {tab === 'content' && <section>
          <div className="content-tools">
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Нэр, төрөл, байршлаар хайх..." aria-label="Зар хайх" />
            <div className="filter-pills">{([['all', 'Бүгд'], ['pet', 'Алдсан/олдсон'], ['adoption', 'Үрчлүүлэх'], ['sitting', 'Асрах']] as Array<[ContentFilter, string]>).map(([id, label]) => <button key={id} type="button" className={filter === id ? 'active' : ''} onClick={() => setFilter(id)}>{label}</button>)}</div>
          </div>
          <p className="result-count">{visibleContent.length} зар</p>
          {visibleContent.length === 0 ? <EmptyState icon={<Icon name="search" size={30} />} description="Тохирох зар олдсонгүй." /> : <div className="admin-list">{visibleContent.map((item) => <article key={`${item.kind}-${item.id}`} className="admin-row">
            {item.image ? <Image src={item.image} alt="" width={72} height={72} /> : <span className="image-placeholder"><Icon name="paw" size={26} /></span>}
            <div className="row-copy"><span className={`kind kind-${item.kind}`}>{item.kind === 'pet' ? 'Алдсан/олдсон' : item.kind === 'adoption' ? 'Үрчлүүлэх' : 'Асрах'}</span><Link href={item.href}>{item.title}</Link><small>{item.subtitle} · {relativeTime(item.createdAt)}</small></div>
            <div className="row-actions"><Button as="link" href={item.href} variant="ghost">Үзэх</Button><Button variant="ghost" disabled={busyId === item.id} onClick={() => handleDeleteContent(item)} style={{ color: 'var(--danger)' }}>Устгах</Button></div>
          </article>)}</div>}
        </section>}

        {tab === 'audit' && (audit.length === 0 ? <div className="setup-note"><strong>Үйлдлийн түүх одоогоор хоосон байна.</strong><p><code>supabase-admin-upgrade.sql</code>-ийг ажиллуулсны дараах admin үйлдлүүд энд хадгалагдана.</p></div> : <div className="audit-list">{audit.map((item) => <div key={item.id}><span>{auditLabel(item.action)}</span><strong>{targetLabel(item.targetType)}</strong><small>{relativeTime(item.createdAt)}</small></div>)}</div>)}
      </>}

      <style jsx>{`
        .admin-list { display: grid; gap: 10px; }
        .admin-row { display: flex; align-items: center; gap: 14px; padding: 14px; border: 1px solid var(--border-subtle); border-radius: var(--r-lg); background: var(--card); }
        .admin-row :global(img), .image-placeholder { width: 72px; height: 72px; flex: 0 0 72px; border-radius: var(--r-md); object-fit: cover; }
        .image-placeholder { display: grid; place-items: center; color: var(--primary); background: var(--surface-3); }
        .row-copy { display: grid; gap: 5px; flex: 1; min-width: 0; }
        .row-copy :global(a) { color: var(--text-primary); font-weight: 750; text-decoration: none; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .row-copy small { color: var(--text-secondary); }
        .danger-label { color: var(--danger); font-size: 12px; font-weight: 700; }
        .row-actions { display: flex; gap: 6px; }
        .kind { width: max-content; padding: 3px 8px; border-radius: 999px; color: var(--primary); background: color-mix(in srgb, var(--primary) 10%, transparent); font-size: 10px; font-weight: 800; }
        .kind-adoption { color: var(--success); background: color-mix(in srgb, var(--success) 10%, transparent); }
        .kind-sitting { color: var(--secondary); background: color-mix(in srgb, var(--secondary) 12%, transparent); }
        .content-tools { display: flex; gap: 12px; margin-bottom: 14px; }
        .content-tools input { flex: 1; min-height: 50px; padding: 0 16px; color: var(--text-primary); border: 1px solid var(--border-subtle); border-radius: var(--r-md); background: var(--surface-2); font: inherit; }
        .filter-pills { display: flex; gap: 6px; overflow-x: auto; }
        .filter-pills button { padding: 0 14px; border: 1px solid var(--border-subtle); border-radius: 999px; color: var(--text-secondary); background: transparent; font-weight: 700; cursor: pointer; white-space: nowrap; }
        .filter-pills button.active { color: var(--text-on-accent); border-color: var(--primary); background: var(--primary); }
        .result-count { margin: 0 0 12px; color: var(--text-secondary); font-size: 13px; font-weight: 700; }
        .audit-list { display: grid; gap: 8px; }
        .audit-list > div { display: grid; grid-template-columns: 1fr 1fr auto; gap: 14px; padding: 14px 16px; border-bottom: 1px solid var(--border-subtle); }
        .audit-list small { color: var(--text-secondary); }
        .setup-note { padding: 24px; border: 1px dashed var(--border-subtle); border-radius: var(--r-lg); color: var(--text-secondary); background: var(--surface-2); }
        .setup-note strong { color: var(--text-primary); }
        @media (max-width: 760px) { .content-tools { flex-direction: column; } .admin-row { align-items: flex-start; flex-wrap: wrap; } .row-copy { min-width: calc(100% - 90px); } .row-actions { width: 100%; justify-content: flex-end; border-top: 1px solid var(--border-subtle); padding-top: 10px; } .audit-list > div { grid-template-columns: 1fr; gap: 4px; } }
        @media (max-width: 480px) { .admin-row :global(img), .image-placeholder { width: 56px; height: 56px; flex-basis: 56px; } .row-copy { min-width: calc(100% - 72px); } }
      `}</style>
    </div>
  );
}

function Dashboard({ stats, reports, onOpenReports }: { stats: AdminStats; reports: Report[]; onOpenReports: () => void }) {
  const cards = [
    ['Нийт алдсан/олдсон зар', stats.pets, 'pet'], ['Идэвхтэй хайлт', stats.activePets, 'active'],
    ['Шийдвэрлэгдсэн', stats.resolvedPets, 'resolved'], ['Үрчлүүлэх зар', stats.adoptions, 'adoption'],
    ['Асрах зар', stats.sitting, 'sitting'], ['Хүлээгдэж буй мэдээлэл', stats.reports, 'report'],
  ];
  return <section><div className="stats-grid">{cards.map(([label, value, tone]) => <article key={String(label)} className={`stat-card tone-${tone}`}><span>{label}</span><strong>{value}</strong></article>)}</div>{reports.length > 0 && <button className="attention" type="button" onClick={onOpenReports}><span>Анхаарах шаардлагатай</span><strong>{reports.length} мэдээлэгдсэн зар хүлээгдэж байна →</strong></button>}<style jsx>{`.stats-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}.stat-card{min-height:132px;padding:20px;border:1px solid var(--border-subtle);border-radius:var(--r-lg);background:var(--card);box-shadow:var(--shadow-sm)}.stat-card span{display:block;color:var(--text-secondary);font-size:13px}.stat-card strong{display:block;margin-top:16px;color:var(--primary);font-family:var(--font-display);font-size:2.2rem}.tone-report strong{color:var(--danger)}.tone-resolved strong{color:var(--success)}.attention{display:flex;align-items:center;justify-content:space-between;width:100%;margin-top:16px;padding:18px;border:1px solid color-mix(in srgb,var(--warning) 38%,var(--border-subtle));border-radius:var(--r-lg);color:var(--text-primary);background:color-mix(in srgb,var(--warning) 10%,var(--card));cursor:pointer;text-align:left}.attention span{font-weight:800}.attention strong{color:var(--danger)}@media(max-width:720px){.stats-grid{grid-template-columns:1fr 1fr}.attention{align-items:flex-start;flex-direction:column;gap:6px}}@media(max-width:420px){.stats-grid{grid-template-columns:1fr}.stat-card{min-height:104px}.stat-card strong{margin-top:10px}}`}</style></section>;
}

function AdminSkeleton() { return <div className="skeleton-grid">{[0, 1, 2, 3, 4, 5].map((item) => <div key={item} className="skel-row" />)}<style jsx>{`.skeleton-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}.skeleton-grid div{height:132px;border-radius:var(--r-lg);background:var(--surface-2)}@media(max-width:720px){.skeleton-grid{grid-template-columns:1fr 1fr}}`}</style></div>; }
function auditLabel(action: string) { return action === 'delete' ? 'Зар устгасан' : action === 'dismiss_report' ? 'Мэдээллийг үл хэрэгссэн' : action; }
function targetLabel(type: string) { return type === 'pet' ? 'Алдсан/олдсон зар' : type === 'adoption' ? 'Үрчлүүлэх зар' : type === 'sitting' ? 'Асрах зар' : type === 'report' ? 'Мэдээлэл' : type; }
