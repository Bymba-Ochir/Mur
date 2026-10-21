'use client';
import { useEffect, useState } from 'react';
import { useLanguage } from '../lib/i18n';
import Icon from './ui/icons';
import { setLocalStorageValue, useLocalStorageValue } from '../lib/useLocalStorageState';

const DISMISS_KEY = 'mur-install-dismissed';

// beforeinstallprompt нь TS-ийн DOM lib-д байхгүй тул шаардлагатай хэсгийг нь зарлана
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export default function InstallPrompt() {
  const { t } = useLanguage();
  const dismissed = useLocalStorageValue(DISMISS_KEY, '1');
  const [installing, setInstalling] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    if (dismissed) return;
    let active = true;

    // Аль хэдийн апп болгож суулгасан эсэхийг шалгах (standalone горим)
    const standalone = (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || standalone;
    if (isStandalone) return;

    const ua = window.navigator.userAgent;
    const iosDevice = /iPad|iPhone|iPod/.test(ua) && !('MSStream' in window);

    if (iosDevice) {
      // iOS дээр beforeinstallprompt дэмжигддэггүй тул зааврыг шууд харуулна.
      // setState-г effect-ийн биед синхрон хийхгүй — microtask-аар (React 19 дүрэм)
      Promise.resolve().then(() => {
        if (!active) return;
        setIsIOS(true);
        setVisible(true);
      });
      return () => { active = false; };
    }

    function handleBeforeInstallPrompt(e: Event) {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setVisible(true);
    }
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => { active = false; window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt); };
  }, [dismissed]);

  async function handleInstall() {
    if (!deferredPrompt || installing) return;
    setInstalling(true);
    try {
      await deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      dismiss();
    } catch { dismiss(); }
    finally { setInstalling(false); }
  }

  function dismiss() {
    setLocalStorageValue(DISMISS_KEY, '1');
    setVisible(false);
  }

  if (!visible || dismissed) return null;

  return (
    <div className="install-banner" data-floating-notice="install" role="region" aria-label={t('install_region_label')}>
      <div className="install-content">
        <span className="install-icon" aria-hidden="true"><Icon name="paw" size={23} /></span>
        <div>
          <b>{t('install_title')}</b>
          {isIOS ? (
            <p>{t('install_ios_hint')}</p>
          ) : (
            <p>{t('install_hint')}</p>
          )}
        </div>
      </div>
      <div className="install-actions">
        {!isIOS && <button type="button" onClick={handleInstall} disabled={installing} aria-busy={installing} className="install-btn primary">{t('install_action')}</button>}
        <button type="button" onClick={dismiss} className="install-btn ghost" aria-label={t('install_close_label')}>{t('install_close')}</button>
      </div>

      <style jsx>{`
        .install-banner {
          position: fixed; bottom: calc(var(--sp-3) + var(--safe-bottom)); left: 50%; z-index: 140;
          width: min(680px, calc(100vw - 32px)); transform: translateX(-50%);
          background: var(--brand); color: var(--text-on-accent); padding: 12px 14px;
          display: flex; align-items: center; justify-content: space-between; gap: 12px;
          border: 1px solid color-mix(in srgb, var(--text-on-accent) 20%, transparent);
          border-radius: var(--r-lg); box-shadow: var(--shadow-lift);
        }
        @media (max-width: 640px) {
          .install-banner {
            bottom:calc(var(--sp-2) + var(--safe-bottom));
            width:calc(100vw - 16px);
            align-items:center;
            padding:10px;
            border-radius:var(--r-md);
          }
          .install-content{gap:8px;min-width:0}
          .install-icon{width:34px;height:34px;flex-basis:34px}
          .install-content b{font-size:12px}
          .install-content p{display:-webkit-box;overflow:hidden;font-size:11px;-webkit-box-orient:vertical;-webkit-line-clamp:2}
          .install-actions{flex:0 0 auto;gap:4px}
          .install-btn{min-height:36px;padding:6px 9px;font-size:11px}
        }
        .install-content { display: flex; align-items: center; gap: 12px; flex: 1; min-width: 200px; }
        .install-icon { display:grid; place-items:center; width:40px; height:40px; flex:0 0 40px; background:color-mix(in srgb,var(--text-on-accent) 14%,transparent); border-radius:var(--r-md); }
        .install-content p { font-size: 12.5px; line-height:1.45; color: color-mix(in srgb, var(--text-on-accent) 82%, transparent); margin-top: 2px; }
        .install-actions { display: flex; gap: 8px; }
        .install-btn { min-height:var(--touch-target-sm); padding: 8px 16px; border-radius: var(--r-pill); border: none; font-weight: 600; font-size: 13px; cursor: pointer; transition: transform .15s ease, box-shadow .2s ease, filter .2s ease; }
        .primary { background: var(--grad-accent); color: var(--accent-ink); }
        .primary:hover { filter: saturate(1.08); transform: translateY(-1px); box-shadow: var(--shadow-sm); }
        .ghost { background: transparent; color: var(--text-on-accent); border: 1px solid color-mix(in srgb, var(--text-on-accent) 35%, transparent); }
        .ghost:hover { background: color-mix(in srgb, var(--text-on-accent) 12%, transparent); }
        .install-btn:focus-visible { outline: 2px solid var(--text-on-accent); outline-offset: 2px; }
        @media (max-width: 380px) {
          .install-banner{align-items:stretch;flex-direction:column}
          .install-actions .install-btn{flex:1}
        }
      `}</style>
    </div>
  );
}
