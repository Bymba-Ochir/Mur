'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '../../lib/useAuth';
import { isAdmin, fetchReports, dismissReport, adminDeletePet } from '../../lib/adminService';
import { useToast } from '../../components/Toast';
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

  useEffect(() => {
    if (loading) return;
    if (!user) { setChecked(true); return; }
    isAdmin().then((ok) => {
      setAdmin(ok);
      setChecked(true);
      if (ok) load();
    });
  }, [user, loading]);

  async function load() {
    setReportsLoading(true);
    try {
      setReports(await fetchReports());
    } catch (err) {
      showToast('Алдаа: ' + getErrorMessage(err), 'error');
    } finally {
      setReportsLoading(false);
    }
  }

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
    <div style={{ maxWidth: 640 }}>
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
        <div style={{
          textAlign: 'center', padding: 'var(--sp-6) var(--sp-4)', background: 'var(--card)',
          border: '1px dashed var(--line)', borderRadius: 'var(--r-lg)',
        }}>
          <div style={{ fontSize: 36, marginBottom: 'var(--sp-2)' }}>👍</div>
          <p style={{ color: 'var(--muted)', fontSize: 13.5 }}>{t('admin_none')}</p>
        </div>
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
                  <button
                    onClick={() => handleDismiss(r.id)}
                    disabled={busyId === r.id}
                    className="btn btn-ghost"
                    style={{ fontSize: 12.5 }}
                  >
                    {t('admin_dismiss')}
                  </button>
                  {pet && (
                    <button
                      onClick={() => handleDeletePet(r.id, pet.id)}
                      disabled={busyId === r.id}
                      className="btn"
                      style={{ background: 'var(--card)', color: 'var(--alert)', border: '1.5px solid var(--alert)', fontSize: 12.5 }}
                    >
                      {t('admin_delete_pet')}
                    </button>
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
