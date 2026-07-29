'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../lib/useAuth';
import { isAdmin, fetchReports, dismissReport, adminDeletePet } from '../../lib/adminService';
import { useToast } from '../../components/Toast';
import { relativeTime } from '../../lib/relativeTime';
import { useLanguage } from '../../lib/i18n';

export default function AdminPage() {
  const { user, loading } = useAuth();
  const showToast = useToast();
  const { t } = useLanguage();
  const [checked, setChecked] = useState(false);
  const [admin, setAdmin] = useState(false);
  const [reports, setReports] = useState([]);
  const [busyId, setBusyId] = useState(null);

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
    try {
      setReports(await fetchReports());
    } catch (err) {
      showToast('Алдаа: ' + err.message, 'error');
    }
  }

  async function handleDismiss(reportId) {
    setBusyId(reportId);
    try {
      await dismissReport(reportId);
      showToast('Мэдээлэл хаагдлаа', 'success');
      await load();
    } catch (err) {
      showToast('Алдаа: ' + err.message, 'error');
    } finally {
      setBusyId(null);
    }
  }

  async function handleDeletePet(reportId, petId) {
    if (!confirm('Энэ бичлэгийг бүрмөсөн устгах уу?')) return;
    setBusyId(reportId);
    try {
      await adminDeletePet(petId);
      await dismissReport(reportId);
      showToast('Бичлэг устгагдлаа', 'success');
      await load();
    } catch (err) {
      showToast('Алдаа: ' + err.message, 'error');
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
        <div className="eyebrow">{t('admin_restricted_eyebrow')}</div>
        <h1 style={{ fontSize: 22 }}>{t('admin_no_access')}</h1>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 640 }}>
      <div className="eyebrow">{t('admin_eyebrow')}</div>
      <h1 style={{ fontSize: 24, marginBottom: 16 }}>{t('admin_title')}</h1>

      {reports.length === 0 ? (
        <p style={{ color: 'var(--muted)' }}>{t('admin_none')}</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {reports.map((r) => (
            <div key={r.id} style={{
              background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 14, padding: 16,
              display: 'flex', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap',
            }}>
              {r.pet?.photoURL && (
                <img src={r.pet.photoURL} alt="" style={{ width: 64, height: 64, borderRadius: 10, objectFit: 'cover' }} />
              )}
              <div style={{ flex: 1, minWidth: 180 }}>
                <p style={{ fontWeight: 600, color: 'var(--primary)' }}>
                  🚩 {r.reason}
                </p>
                {r.pet ? (
                  <p style={{ fontSize: 13, color: 'var(--muted)' }}>
                    <Link href={`/pets/${r.pet.id}`} style={{ color: 'var(--primary)', textDecoration: 'underline' }}>
                      {r.pet.status === 'lost' ? t('nav_lost') : t('nav_found')} {r.pet.type}{r.pet.name ? ' — ' + r.pet.name : ''}
                    </Link>
                    {' '}· {r.pet.district}
                  </p>
                ) : (
                  <p style={{ fontSize: 13, color: 'var(--muted)' }}>{t('admin_pet_deleted')}</p>
                )}
                <p style={{ fontSize: 12, color: 'var(--muted)' }}>{relativeTime(r.createdAt)}</p>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => handleDismiss(r.id)}
                  disabled={busyId === r.id}
                  className="btn"
                  style={{ background: 'var(--eyebrow-bg)', color: 'var(--primary)', fontSize: 12.5 }}
                >
                  {t('admin_dismiss')}
                </button>
                {r.pet && (
                  <button
                    onClick={() => handleDeletePet(r.id, r.pet.id)}
                    disabled={busyId === r.id}
                    className="btn"
                    style={{ background: 'var(--alert)', color: '#fff', fontSize: 12.5 }}
                  >
                    {t('admin_delete_pet')}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
