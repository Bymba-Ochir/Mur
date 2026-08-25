'use client';
import { useSyncExternalStore, useState } from 'react';
import { useLanguage } from '../lib/i18n';

// Клиент дээр sync render-ээр утгыг тооцно; SSR/hydration-д false (server snapshot).
// useSyncExternalStore нь effect-д setState хийлгүйгээр hydration-аюулгүй байлгана.
const emptySubscribe = (): (() => void) => () => {};
const getServerSnapshot = (): boolean => false;
const getClientSnapshot = (): boolean => typeof navigator !== 'undefined' && 'share' in navigator;

export default function ShareButtons({ url, title }: { url: string; title: string }) {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);
  const hasNativeShare = useSyncExternalStore(emptySubscribe, getClientSnapshot, getServerSnapshot);

  const fbShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;

  async function handleNativeShare() {
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {
        // хэрэглэгч цуцалсан бол алдаа шидэхгүй
      }
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {hasNativeShare && (
        <button onClick={handleNativeShare} className="inline-block cursor-pointer rounded-[var(--r-sm)] border-0 bg-[var(--brand)] px-3.5 py-[9px] text-[13px] font-semibold text-[var(--text-on-accent)] no-underline transition-[transform,box-shadow,filter] duration-200 hover:-translate-y-px hover:brightness-105 hover:shadow-[var(--shadow-sm)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--border-focus)]">
          {t('share_native')}
        </button>
      )}
      <a href={fbShareUrl} target="_blank" rel="noopener noreferrer" className="inline-block rounded-[var(--r-sm)] bg-[#1877F2] px-3.5 py-[9px] text-[13px] font-semibold text-white no-underline transition-[transform,box-shadow,filter] duration-200 hover:-translate-y-px hover:brightness-105 hover:shadow-[var(--shadow-sm)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--border-focus)]">
        {t('share_fb')}
      </a>
      <button onClick={handleCopy} className="inline-block cursor-pointer rounded-[var(--r-sm)] border-0 bg-[var(--eyebrow-bg)] px-3.5 py-[9px] text-[13px] font-semibold text-[var(--primary)] transition-[transform,box-shadow,filter] duration-200 hover:-translate-y-px hover:brightness-105 hover:shadow-[var(--shadow-sm)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--border-focus)]">
        {copied ? t('share_copied') : t('share_copy')}
      </button>
    </div>
  );
}
