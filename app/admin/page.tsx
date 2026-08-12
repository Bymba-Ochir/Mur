'use client';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '../../lib/useAuth';
import { isAdmin, fetchReports, dismissReport, adminDeletePet } from '../../lib/adminService';
import { useToast } from '../../components/Toast';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import Icon from '../../components/ui/icons';
import { relativeTime } from '../../lib/relativeTime';
import { useLanguage } from '../../lib/i18n';
import type { Report } from '../../lib/types';
import { getErrorMessage } from '../../lib/utils';

export default function AdminPage() {
  const { user, loading } = useAuth();
  const showToast = useToast();
  const { t } = useLanguage();
  const [checked, setChecked] = useState(false);
  const [admin, setAdmin] = useState(false);
  const [reports, setReports] = useState<Report[]>([]);
  const [reportsLoading, setReportsLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setReportsLoading(true);
    try {
      setReports(await fetchReports());
    } catch (err) {
      showToast('Алдаа: ' + getErrorMessage(err), 'error');
    } finally {
      setReportsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      Promise.resolve().then(() => setChecked(true));
      return;
    }
    isAdmin().then((ok) => {
      setAdmin(ok);
      setChecked(true);
      if (ok) load();
    });
  }, [user, loading, load]);

  async function handleDismiss(reportId: string) {
    setBusyId(reportId);
    try {
      await dismissReport(reportId);
      showToast('Мэдээлэл хаагдлаа', 'success');
      await load();
    } catch (err) {
      showToast('Алдаа: ' + getErrorMessage(err), 'error');
    } finally {
      setBusyId(null);
    }
  }

  async function handleDeletePet(reportId: string, petId: string) {
    if (!confirm('Энэ бичлэгийг бүрмөсөн устгах уу?')) return;
    setBusyId(reportId);
    try {
      await adminDeletePet(petId);
      await dismissReport(reportId);
      showToast('Бичлэг устгагдлаа', 'success');
      await load();
    } catch (err) {
      showToast('Алдаа: ' + getErrorMessage(err), 'error');
    } finally {
      setBusyId(null);
    }
  }

  if (loading || !checked) return <p style={{ color: 'var(--muted)' }}>{t('detail_loading')}</p>;

  if (!user) {
    return <p style={{ color: 'var(--muted)' }}>{t('admin_login_required')}</p>;
  }

  if (!admin) {
    return (
      <div>
        <div className="page-header">
          <div className="eyebrow">{t('admin_restricted_eyebrow')}</div>
          <h1>{t('admin_no_access')}</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell page-shell--narrow">
      <div className="page-header">
        <div className="eyebrow">{t('admin_eyebrow')}</div>
        <h1>{t('admin_title')}</h1>
      </div>

      {reportsLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
          {[0, 1, 2].map((i) => (
            <div key={i} className="skel-row" style={{
              background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 'var(--r-md)', height: 78,
            }} />
          ))}
        </div>
      ) : reports.length === 0 ? (
        <EmptyState icon={<Icon name="thumb" size={30} />} description={t('admin_none')} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
          {reports.map((r) => {
            const pet = r.pet;
            return (
              <div key={r.id} className="card" style={{
                padding: 'var(--sp-4)', display: 'flex', gap: 'var(--sp-3)', alignItems: 'flex-start', flexWrap: 'wrap',
              }}>
                {pet?.photoURL && (
                  <Image src={pet.photoURL} alt="" width={64} height={64} style={{ borderRadius: 'var(--r-sm)', objectFit: 'cover' }} />
                )}
                <div style={{ flex: 1, minWidth: 180 }}>
                  <p style={{ fontWeight: 600, color: 'var(--primary)', fontFamily: 'var(--font-display)', fontSize: 14.5 }}>
                    🚩 {r.reason}
                  </p>
                  {pet ? (
                    <p style={{ fontSize: 13, color: 'var(--muted)' }}>
                      <Link href={`/pets/${pet.id}`} style={{ color: 'var(--primary)', textDecoration: 'underline' }}>
                        {pet.status === 'lost' ? t('nav_lost') : t('nav_found')} {pet.type}{pet.name ? ' — ' + pet.name : ''}
                      </Link>
                      {' '}· {pet.district}
                    </p>
                  ) : (
                    <p style={{ fontSize: 13, color: 'var(--muted)' }}>{t('admin_pet_deleted')}</p>
                  )}
                  <p style={{ fontSize: 12, color: 'var(--muted)' }}>{relativeTime(r.createdAt)}</p>
                </div>
                <div style={{ display: 'flex', gap: 'var(--sp-2)' }}>
                  <Button
                    onClick={() => handleDismiss(r.id)}
                    disabled={busyId === r.id}
                    variant="ghost"
                    style={{ fontSize: 12.5 }}
                  >
                    {t('admin_dismiss')}
                  </Button>
                  {pet && (
                    <Button
                      onClick={() => handleDeletePet(r.id, pet.id)}
                      disabled={busyId === r.id}
                      variant="ghost"
                      style={{ background: 'var(--card)', color: 'var(--alert)', border: '1.5px solid var(--alert)', fontSize: 12.5 }}
                    >
                      {t('admin_delete_pet')}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
