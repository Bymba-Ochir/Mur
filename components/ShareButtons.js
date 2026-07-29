'use client';
import { useState } from 'react';
import { useLanguage } from '../lib/i18n';

export default function ShareButtons({ url, title }) {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);

  const fbShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;

  async function handleNativeShare() {
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch (e) {
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
    <div className="share-row">
      {typeof navigator !== 'undefined' && navigator.share && (
        <button onClick={handleNativeShare} className="share-btn native">
          {t('share_native')}
        </button>
      )}
      <a href={fbShareUrl} target="_blank" rel="noopener noreferrer" className="share-btn fb">
        {t('share_fb')}
      </a>
      <button onClick={handleCopy} className="share-btn copy">
        {copied ? t('share_copied') : t('share_copy')}
      </button>

      <style jsx>{`
        .share-row { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 12px; }
        .share-btn {
          padding: 9px 14px; border-radius: 9px; border: none; cursor: pointer;
          font-size: 13px; font-weight: 600; text-decoration: none; display: inline-block;
        }
        .native { background: var(--brand); color: #fff; }
        .fb { background: #1877F2; color: #fff; }
        .copy { background: var(--eyebrow-bg); color: var(--primary); }
      `}</style>
    </div>
  );
}
