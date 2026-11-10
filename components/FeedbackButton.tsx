'use client';

import { createContext, useCallback, useContext, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { FEEDBACK_CATEGORIES, FEEDBACK_MAX_LENGTH, FEEDBACK_MIN_LENGTH, feedbackPage, isFeedbackCategory } from '../lib/feedback';
import { useLanguage } from '../lib/i18n';
import { idempotencyHeaders, resolveIdempotencyAttempt, type IdempotencyAttempt } from '../lib/idempotency';
import { useToast } from './Toast';
import Button from './ui/Button';
import { Select, Textarea } from './ui/Input';
import Modal from './ui/Modal';
import Icon from './ui/icons';

const FeedbackContext = createContext<{ open: boolean; show: () => void } | null>(null);

export default function FeedbackButton() {
  const feedback = useContext(FeedbackContext);
  const { t } = useLanguage();
  if (!feedback) throw new Error('FeedbackButton requires FeedbackProvider');

  return (
    <Button variant="ghost" size="sm" aria-haspopup="dialog" aria-expanded={feedback.open} onClick={feedback.show}>
      <Icon name="message" size={16} aria-hidden="true" />
      {t('feedback_title')}
    </Button>
  );
}

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { t } = useLanguage();
  const showToast = useToast();
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<(typeof FEEDBACK_CATEGORIES)[number]>('suggestion');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const pageAtOpen = useRef('/');
  const inFlight = useRef(false);
  const attempt = useRef<IdempotencyAttempt | null>(null);

  const show = useCallback(() => {
    pageAtOpen.current = feedbackPage(pathname);
    setOpen(true);
  }, [pathname]);
  const feedback = useMemo(() => ({ open, show }), [open, show]);

  const close = useCallback(() => {
    if (!inFlight.current) setOpen(false);
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (inFlight.current) return;
    if (message.trim().length < FEEDBACK_MIN_LENGTH) {
      setError(t('feedback_min_length'));
      return;
    }
    inFlight.current = true;
    setSending(true);
    setError('');
    try {
      const body = JSON.stringify({ category, message: message.trim(), page: pageAtOpen.current });
      attempt.current = resolveIdempotencyAttempt(attempt.current, body);
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...idempotencyHeaders(attempt.current.key) },
        body,
        signal: AbortSignal.timeout(15000),
      });
      if (!response.ok) {
        setError(t(response.status === 429 ? 'feedback_limited' : 'feedback_send_error'));
        return;
      }
      attempt.current = null;
      setCategory('suggestion');
      setMessage('');
      setOpen(false);
      showToast(t('feedback_thanks'), 'success');
    } catch {
      setError(t('feedback_send_error'));
    } finally {
      inFlight.current = false;
      setSending(false);
    }
  }

  return (
    <FeedbackContext.Provider value={feedback}>
      {children}
      <Modal open={open} onClose={close} title={t('feedback_title')} closeLabel={t('close')} width="md">
        <form className="feedback-form" onSubmit={submit}>
          <p className="feedback-intro">{t('feedback_intro')}</p>
          <Select id="feedback-category" label={t('feedback_category')} value={category} disabled={sending} onChange={(event) => {
            if (isFeedbackCategory(event.target.value)) setCategory(event.target.value);
          }}>
            {FEEDBACK_CATEGORIES.map((value) => <option key={value} value={value}>{t(`feedback_${value}`)}</option>)}
          </Select>
          <Textarea id="feedback-message" label={t('feedback_message')} hint={t('feedback_privacy_hint')}
            value={message} rows={5} required minLength={FEEDBACK_MIN_LENGTH} maxLength={FEEDBACK_MAX_LENGTH}
            disabled={sending} onChange={(event) => { setMessage(event.target.value); setError(''); }} />
          {error && <p className="feedback-error" role="alert">{error}</p>}
          <Button type="submit" disabled={sending} aria-busy={sending} fullWidth>
            {t(sending ? 'feedback_sending' : 'feedback_send')}
          </Button>
        </form>
      </Modal>
      <style jsx>{`
        .feedback-form { display: grid; gap: var(--sp-3); }
        .feedback-intro { margin: 0; color: var(--text-secondary); font-size: var(--text-sm); line-height: 1.6; }
        .feedback-form .feedback-error { color: var(--danger); }
      `}</style>
    </FeedbackContext.Provider>
  );
}
