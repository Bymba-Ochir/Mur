'use client';
import { useSyncExternalStore, useState, useRef, useEffect, useId } from 'react';
import { useLanguage } from '../lib/i18n';
import Icon from './ui/icons';

// Клиент дээр sync render-ээр утгыг тооцно; SSR/hydration-д false (server snapshot).
// useSyncExternalStore нь effect-д setState хийлгүйгээр hydration-аюулгүй байлгана.
const emptySubscribe = (): (() => void) => () => {};
const getServerSnapshot = (): boolean => false;
const getClientSnapshot = (): boolean => typeof navigator !== 'undefined' && 'share' in navigator;

export default function ShareButtons({ url, title }: { url: string; title: string }) {
  const { t, lang } = useLanguage();
  const [shareError, setShareError] = useState(false);
  const [busy, setBusy] = useState(false);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fallbackId = useId();
  useEffect(() => () => { if (copyTimer.current) clearTimeout(copyTimer.current); }, []);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'error'>('idle');
  const hasNativeShare = useSyncExternalStore(emptySubscribe, getClientSnapshot, getServerSnapshot);

  const fbShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;

  async function handleNativeShare() {
    if (busy || !url) return;
    setShareError(false); setBusy(true);
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch (error) {
        if (!(error instanceof Error && error.name === 'AbortError')) setShareError(true);
      } finally { setBusy(false); }
    }
  }

  async function handleCopy() {
    if (!url) return;
    if (copyTimer.current) clearTimeout(copyTimer.current);
    try {
      await navigator.clipboard.writeText(url);
      setCopyStatus('copied');
    } catch {
      setCopyStatus('error');
    }
    copyTimer.current = setTimeout(() => setCopyStatus((current) => current === 'copied' ? 'idle' : current), 2400);
  }

  return (
    <div className="share-row">
      {hasNativeShare && (
        <button type="button" disabled={busy || !url} aria-busy={busy} onClick={handleNativeShare} className="share-btn native">
          <Icon name="share" size={16} aria-hidden="true" /> {t('share_native')}
        </button>
      )}
      <a href={fbShareUrl} target="_blank" rel="noopener noreferrer" className="share-btn fb">
        <Icon name="share" size={16} aria-hidden="true" /> {t('share_fb')}
      </a>
      <button type="button" disabled={!url} onClick={handleCopy} className="share-btn copy">
        <Icon name={copyStatus === 'copied' ? 'check' : 'share'} size={16} aria-hidden="true" />
        {copyStatus === 'copied' ? t('share_copied') : copyStatus === 'error' ? t('share_copy_error') : t('share_copy')}
      </button>

      <span className="sr-only" role="status">{copyStatus === 'copied' ? t('share_copied') : ''}</span>
      {(shareError || copyStatus === 'error') && <div className="share-fallback"><p role="alert">{lang === 'mn' ? 'Холбоосыг доороос сонгож гараар хуулна уу.' : 'Select the link below and copy it manually.'}</p><label htmlFor={fallbackId}>{t('share_copy')}</label><input id={fallbackId} readOnly value={url} onFocus={(event) => event.target.select()} /></div>}
      <style jsx>{`
        .share-fallback {flex-basis:100%;min-width:0;display:grid;gap:8px;font-size:var(--text-sm);color:var(--muted)}
        .share-fallback input {width:100%;min-width:0;min-height:44px;padding:8px;color:var(--ink);background:var(--card);border:1px solid var(--line);border-radius:var(--r-sm)}
        .share-btn:disabled {opacity:.55;cursor:not-allowed}

        .share-row { display: flex; gap: var(--sp-2); flex-wrap: wrap; }
        .share-btn {
          min-height:var(--touch-target); display:inline-flex; align-items:center; justify-content:center; gap:var(--sp-2);
          padding: var(--sp-2) var(--sp-3); border-radius: var(--r-md); border: none; cursor: pointer;
          font-family:var(--font-body); font-size: 13px; font-weight: 650; text-decoration: none;
          transition: transform .15s ease, box-shadow .2s ease, filter .2s ease;
        }
        .share-btn:hover { transform: translateY(-1px); box-shadow: var(--shadow-sm); filter: brightness(1.05); }
        .share-btn:focus-visible { outline: 2px solid var(--border-focus); outline-offset: 2px; }
        .native { background: var(--brand); color: var(--text-on-accent); }
        .fb { background: #1877F2; color: #fff; }
        .copy { background: var(--eyebrow-bg); color: var(--primary); }
        @media(max-width:560px){.share-row{display:grid;grid-template-columns:1fr}.share-btn{width:100%}}
        @media(prefers-reduced-motion:reduce){.share-btn{transition:none}}
      `}</style>
    </div>
  );
}
