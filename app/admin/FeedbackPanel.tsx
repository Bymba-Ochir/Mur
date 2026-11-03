'use client';

import { useEffect, useState } from 'react';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import Icon from '../../components/ui/icons';
import { fetchAdminFeedback } from '../../lib/adminService';
import { useLanguage } from '../../lib/i18n';
import { relativeTime } from '../../lib/relativeTime';

export default function FeedbackPanel() {
  const { lang, t } = useLanguage();
  const [page, setPage] = useState(0);
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<Awaited<ReturnType<typeof fetchAdminFeedback>> | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    fetchAdminFeedback(page).then((response) => {
      if (active) setResult(response);
    }).catch(() => {
      if (active) setFailed(true);
    });
    return () => { active = false; };
  }, [page, attempt]);

  function goTo(next: number) {
    setResult(null);
    setPage(next);
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
            <div>
              <strong>{t(`feedback_${item.category}`)}</strong>
              <code>{item.page}</code>
              <time dateTime={item.created_at}>{relativeTime(item.created_at, lang)}</time>
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
      <style jsx>{`
        .feedback-list { display: grid; gap: var(--sp-3); padding: 0; list-style: none; }
        .feedback-list li { padding: var(--sp-4); border: 1px solid var(--border-subtle); border-radius: var(--r-lg); background: var(--card); }
        .feedback-list li div { display: flex; flex-wrap: wrap; align-items: baseline; gap: var(--sp-2) var(--sp-3); color: var(--text-secondary); }
        .feedback-list strong { color: var(--primary); }
        .feedback-list time { font-size: var(--text-xs); }
        .feedback-list p { margin-top: var(--sp-2); white-space: pre-wrap; overflow-wrap: anywhere; }
        .feedback-pagination { display: flex; flex-wrap: wrap; align-items: center; gap: var(--sp-3); margin-top: var(--sp-3); }
      `}</style>
    </>
  );
}
