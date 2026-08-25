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
          <section className="grid gap-2.5" aria-label="Мэдээлэгдсэн зарууд">
            {reports.map((report) => <article key={report.id} className="flex items-center gap-3.5 rounded-[var(--r-lg)] border border-[var(--border-subtle)] bg-[var(--card)] p-3.5 max-[760px]:flex-wrap max-[760px]:items-start [&>img]:size-[72px] [&>img]:shrink-0 [&>img]:rounded-[var(--r-md)] [&>img]:object-cover max-[480px]:[&>img]:size-14">
              {report.pet?.photoURL && <Image src={report.pet.photoURL} alt="" width={72} height={72} />}
              <div className="grid min-w-0 flex-1 gap-[5px] max-[760px]:min-w-[calc(100%-90px)] max-[480px]:min-w-[calc(100%-72px)] [&_a]:overflow-hidden [&_a]:text-ellipsis [&_a]:whitespace-nowrap [&_a]:font-bold [&_a]:text-[var(--text-primary)] [&_a]:no-underline [&_small]:text-[var(--text-secondary)]">
                <span className="text-xs font-bold text-[var(--danger)]">Мэдээлсэн: {report.reason}</span>
                {report.pet ? <Link href={`/pets/${report.pet.id}`}>{report.pet.status === 'lost' ? 'Алдсан' : 'Олдсон'} · {report.pet.name || report.pet.type}</Link> : <strong>{t('admin_pet_deleted')}</strong>}
                <small>{relativeTime(report.createdAt)}</small>
              </div>
              <div className="flex gap-1.5 max-[760px]:w-full max-[760px]:justify-end max-[760px]:border-t max-[760px]:border-[var(--border-subtle)] max-[760px]:pt-2.5">
                <Button variant="ghost" disabled={busyId === report.id} onClick={() => handleDismiss(report.id)}>{t('admin_dismiss')}</Button>
                {report.pet && <Button variant="ghost" disabled={busyId === report.id} onClick={() => handleDeleteReported(report.id, report.pet!.id)} className="text-[var(--danger)]">{t('admin_delete_pet')}</Button>}
              </div>
            </article>)}
          </section>
        )}

        {tab === 'content' && <section>
          <div className="mb-3.5 flex gap-3 max-[760px]:flex-col">
            <input className="min-h-[50px] flex-1 rounded-[var(--r-md)] border border-[var(--border-subtle)] bg-[var(--surface-2)] px-4 font-[family-name:inherit] text-[var(--text-primary)]" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Нэр, төрөл, байршлаар хайх..." aria-label="Зар хайх" />
            <div className="flex gap-1.5 overflow-x-auto">{([['all', 'Бүгд'], ['pet', 'Алдсан/олдсон'], ['adoption', 'Үрчлүүлэх'], ['sitting', 'Асрах']] as Array<[ContentFilter, string]>).map(([id, label]) => <button key={id} type="button" className={`cursor-pointer whitespace-nowrap rounded-full border px-3.5 font-bold ${filter === id ? 'border-[var(--primary)] bg-[var(--primary)] text-[var(--text-on-accent)]' : 'border-[var(--border-subtle)] bg-transparent text-[var(--text-secondary)]'}`} onClick={() => setFilter(id)}>{label}</button>)}</div>
          </div>
          <p className="mb-3 text-[13px] font-bold text-[var(--text-secondary)]">{visibleContent.length} зар</p>
          {visibleContent.length === 0 ? <EmptyState icon={<Icon name="search" size={30} />} description="Тохирох зар олдсонгүй." /> : <div className="grid gap-2.5">{visibleContent.map((item) => <article key={`${item.kind}-${item.id}`} className="flex items-center gap-3.5 rounded-[var(--r-lg)] border border-[var(--border-subtle)] bg-[var(--card)] p-3.5 max-[760px]:flex-wrap max-[760px]:items-start [&>img]:size-[72px] [&>img]:shrink-0 [&>img]:rounded-[var(--r-md)] [&>img]:object-cover max-[480px]:[&>img]:size-14">
            {item.image ? <Image src={item.image} alt="" width={72} height={72} /> : <span className="grid size-[72px] shrink-0 place-items-center rounded-[var(--r-md)] bg-[var(--surface-3)] text-[var(--primary)] max-[480px]:size-14"><Icon name="paw" size={26} /></span>}
            <div className="grid min-w-0 flex-1 gap-[5px] max-[760px]:min-w-[calc(100%-90px)] max-[480px]:min-w-[calc(100%-72px)] [&_a]:overflow-hidden [&_a]:text-ellipsis [&_a]:whitespace-nowrap [&_a]:font-bold [&_a]:text-[var(--text-primary)] [&_a]:no-underline [&_small]:text-[var(--text-secondary)]"><span className={`w-max rounded-full px-2 py-[3px] text-[10px] font-extrabold ${item.kind === 'adoption' ? 'bg-[color-mix(in_srgb,var(--success)_10%,transparent)] text-[var(--success)]' : item.kind === 'sitting' ? 'bg-[color-mix(in_srgb,var(--secondary)_12%,transparent)] text-[var(--secondary)]' : 'bg-[color-mix(in_srgb,var(--primary)_10%,transparent)] text-[var(--primary)]'}`}>{item.kind === 'pet' ? 'Алдсан/олдсон' : item.kind === 'adoption' ? 'Үрчлүүлэх' : 'Асрах'}</span><Link href={item.href}>{item.title}</Link><small>{item.subtitle} · {relativeTime(item.createdAt)}</small></div>
            <div className="flex gap-1.5 max-[760px]:w-full max-[760px]:justify-end max-[760px]:border-t max-[760px]:border-[var(--border-subtle)] max-[760px]:pt-2.5"><Button as="link" href={item.href} variant="ghost">Үзэх</Button><Button variant="ghost" disabled={busyId === item.id} onClick={() => handleDeleteContent(item)} className="text-[var(--danger)]">Устгах</Button></div>
          </article>)}</div>}
        </section>}

        {tab === 'audit' && (audit.length === 0 ? <div className="rounded-[var(--r-lg)] border border-dashed border-[var(--border-subtle)] bg-[var(--surface-2)] p-6 text-[var(--text-secondary)] [&_strong]:text-[var(--text-primary)]"><strong>Үйлдлийн түүх одоогоор хоосон байна.</strong><p><code>supabase-admin-upgrade.sql</code>-ийг ажиллуулсны дараах admin үйлдлүүд энд хадгалагдана.</p></div> : <div className="grid gap-2">{audit.map((item) => <div className="grid grid-cols-[1fr_1fr_auto] gap-3.5 border-b border-[var(--border-subtle)] px-4 py-3.5 max-[760px]:grid-cols-1 max-[760px]:gap-1 [&_small]:text-[var(--text-secondary)]" key={item.id}><span>{auditLabel(item.action)}</span><strong>{targetLabel(item.targetType)}</strong><small>{relativeTime(item.createdAt)}</small></div>)}</div>)}
      </>}

    </div>
  );
}

function Dashboard({ stats, reports, onOpenReports }: { stats: AdminStats; reports: Report[]; onOpenReports: () => void }) {
  const cards = [
    ['Нийт алдсан/олдсон зар', stats.pets, 'pet'], ['Идэвхтэй хайлт', stats.activePets, 'active'],
    ['Шийдвэрлэгдсэн', stats.resolvedPets, 'resolved'], ['Үрчлүүлэх зар', stats.adoptions, 'adoption'],
    ['Асрах зар', stats.sitting, 'sitting'], ['Хүлээгдэж буй мэдээлэл', stats.reports, 'report'],
  ];
  return <section><div className="grid grid-cols-3 gap-3.5 max-[720px]:grid-cols-2 max-[420px]:grid-cols-1">{cards.map(([label, value, tone]) => <article key={String(label)} className="min-h-[132px] rounded-[var(--r-lg)] border border-[var(--border-subtle)] bg-[var(--card)] p-5 shadow-[var(--shadow-sm)] max-[420px]:min-h-[104px]"><span className="block text-[13px] text-[var(--text-secondary)]">{label}</span><strong className={`mt-4 block font-[family-name:var(--font-display)] text-[2.2rem] max-[420px]:mt-2.5 ${tone === 'report' ? 'text-[var(--danger)]' : tone === 'resolved' ? 'text-[var(--success)]' : 'text-[var(--primary)]'}`}>{value}</strong></article>)}</div>{reports.length > 0 && <button className="mt-4 flex w-full cursor-pointer items-center justify-between rounded-[var(--r-lg)] border border-[color-mix(in_srgb,var(--warning)_38%,var(--border-subtle))] bg-[color-mix(in_srgb,var(--warning)_10%,var(--card))] p-[18px] text-left text-[var(--text-primary)] max-[720px]:flex-col max-[720px]:items-start max-[720px]:gap-1.5" type="button" onClick={onOpenReports}><span className="font-extrabold">Анхаарах шаардлагатай</span><strong className="text-[var(--danger)]">{reports.length} мэдээлэгдсэн зар хүлээгдэж байна →</strong></button>}</section>;
}

function AdminSkeleton() { return <div className="grid grid-cols-3 gap-3.5 max-[720px]:grid-cols-2">{[0, 1, 2, 3, 4, 5].map((item) => <div key={item} className="skel-row h-[132px] rounded-[var(--r-lg)] bg-[var(--surface-2)]" />)}</div>; }
function auditLabel(action: string) { return action === 'delete' ? 'Зар устгасан' : action === 'dismiss_report' ? 'Мэдээллийг үл хэрэгссэн' : action; }
function targetLabel(type: string) { return type === 'pet' ? 'Алдсан/олдсон зар' : type === 'adoption' ? 'Үрчлүүлэх зар' : type === 'sitting' ? 'Асрах зар' : type === 'report' ? 'Мэдээлэл' : type; }
