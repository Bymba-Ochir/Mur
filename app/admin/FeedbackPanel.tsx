'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useToast } from '../../components/Toast';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import Icon from '../../components/ui/icons';
import Modal from '../../components/ui/Modal';
import { deleteAdminFeedback, fetchAdminFeedback, type AdminFeedbackItem } from '../../lib/adminService';
import { useLanguage } from '../../lib/i18n';
import { relativeTime } from '../../lib/relativeTime';

export default function FeedbackPanel() {
  const { lang, t } = useLanguage();
  const showToast = useToast();
  const [page, setPage] = useState(0);
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<Awaited<ReturnType<typeof fetchAdminFeedback>> | null>(null);
  const [failed, setFailed] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AdminFeedbackItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteFailed, setDeleteFailed] = useState(false);
  const deleteInFlight = useRef(false);

  const closeDelete = useCallback(() => {
    if (!deleteInFlight.current) setDeleteTarget(null);
  }, []);

  useEffect(() => {
    let active = true;
    fetchAdminFeedback(page).then((response) => {
      if (!active) return;
      if (page > 0 && response.items.length === 0) setPage(page - 1);
      else setResult(response);
    }).catch(() => {
      if (active) setFailed(true);
    });
    return () => { active = false; };
  }, [page, attempt]);

  function goTo(next: number) {
    setResult(null);
    setPage(next);
  }

  async function confirmDelete() {
    if (!deleteTarget || deleteInFlight.current) return;
    deleteInFlight.current = true;
    setDeleting(true);
    setDeleteFailed(false);
    try {
      await deleteAdminFeedback(deleteTarget.id);
      setDeleteTarget(null);
      setResult(null);
      setAttempt((current) => current + 1);
      showToast(t('feedback_admin_deleted'), 'success');
    } catch {
      setDeleteFailed(true);
    } finally {
      deleteInFlight.current = false;
      setDeleting(false);
    }
  }

  if (failed) return (
    <EmptyState icon={<Icon name="alert" size={30} />} title={t('feedback_admin_error')}>
      <Button variant="secondary" onClick={() => { setFailed(false); setAttempt(attempt + 1); }}>{t('admin_retry')}</Button>
    </EmptyState>
  );

  if (!result) return <p role="status">{t('feedback_admin_loading')}</p>;

  return (
    <>
      {result.items.length === 0 && <EmptyState icon={<Icon name="message" size={30} />} title={t('feedback_admin_empty')} />}
      <ul className="feedback-list">
        {result.items.map((item) => (
          <li key={item.id}>
            <div className="feedback-row">
              <div className="feedback-meta">
                <strong>{t(`feedback_${item.category}`)}</strong>
                <code>{item.page}</code>
                <time dateTime={item.created_at}>{relativeTime(item.created_at, lang)}</time>
              </div>
              <Button variant="danger" size="sm" onClick={() => {
                setDeleteFailed(false);
                setDeleteTarget(item);
              }}>
                <Icon name="trash" size={16} aria-hidden="true" />
                {t('admin_delete')}
              </Button>
            </div>
            <p>{item.message}</p>
          </li>
        ))}
      </ul>
      {(page > 0 || result.hasMore) && (
        <div className="feedback-pagination" aria-label={t('feedback_title')}>
          <Button size="sm" variant="secondary" disabled={page === 0} onClick={() => goTo(page - 1)}>{t('feedback_admin_previous')}</Button>
          <span>{page + 1}</span>
          <Button size="sm" variant="secondary" disabled={!result.hasMore} onClick={() => goTo(page + 1)}>{t('feedback_admin_next')}</Button>
        </div>
      )}
      <Modal open={deleteTarget !== null} onClose={closeDelete} title={t('feedback_admin_delete_title')} closeLabel={t('close')} width="sm">
        <div className="feedback-confirmation">
          <p>{t('feedback_admin_delete_desc')}</p>
          {deleteTarget && <blockquote>{deleteTarget.message.length > 160 ? `${deleteTarget.message.slice(0, 160)}…` : deleteTarget.message}</blockquote>}
          {deleteFailed && <p className="feedback-delete-error" role="alert">{t('feedback_admin_delete_error')}</p>}
          <div className="feedback-delete-actions">
            <Button variant="ghost" disabled={deleting} onClick={closeDelete}>{t('admin_cancel')}</Button>
            <Button variant="danger" disabled={deleting} aria-busy={deleting} onClick={() => void confirmDelete()}>
              {t(deleting ? 'admin_deleting' : 'admin_delete')}
            </Button>
          </div>
        </div>
      </Modal>
      <style jsx>{`
        .feedback-list { display: grid; gap: var(--sp-3); padding: 0; list-style: none; }
        .feedback-list li { padding: var(--sp-4); border: 1px solid var(--border-subtle); border-radius: var(--r-lg); background: var(--card); }
        .feedback-row, .feedback-meta { display: flex; flex-wrap: wrap; align-items: center; gap: var(--sp-2) var(--sp-3); }
        .feedback-row { justify-content: space-between; }
        .feedback-meta { color: var(--text-secondary); }
        .feedback-list strong { color: var(--primary); }
        .feedback-list time { font-size: var(--text-xs); }
        .feedback-list p { margin-top: var(--sp-2); white-space: pre-wrap; overflow-wrap: anywhere; }
        .feedback-pagination { display: flex; flex-wrap: wrap; align-items: center; gap: var(--sp-3); margin-top: var(--sp-3); }
        .feedback-confirmation { display: grid; gap: var(--sp-3); color: var(--text-secondary); }
        .feedback-confirmation blockquote { margin: 0; padding: var(--sp-3); border-radius: var(--r-md); background: var(--surface-3); overflow-wrap: anywhere; }
        .feedback-delete-error { color: var(--danger); }
        .feedback-delete-actions { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: var(--sp-2); }
      `}</style>
    </>
  );
}
