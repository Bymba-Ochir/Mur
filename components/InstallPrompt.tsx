'use client';
import { useEffect, useState } from 'react';

const DISMISS_KEY = 'mur-install-dismissed';

// beforeinstallprompt нь TS-ийн DOM lib-д байхгүй тул шаардлагатай хэсгийг нь зарлана
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(DISMISS_KEY)) return;

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
        setIsIOS(true);
        setVisible(true);
      });
      return;
    }

    function handleBeforeInstallPrompt(e: Event) {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setVisible(true);
    }
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  async function handleInstall() {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
    }
    dismiss();
  }

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, '1');
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="install-banner" role="region" aria-label="Аппыг суулгах санал">
      <div className="install-content">
        <span className="install-icon" aria-hidden="true">🐾</span>
        <div>
          <b>МӨР-ийг гэрийн дэлгэц рүү нэмэх</b>
          {isIOS ? (
            <p>Safari-ийн доод &quot;Share&quot; (⬆️) товч → &quot;Add to Home Screen&quot; дарна уу</p>
          ) : (
            <p>Апп шиг хурдан нээж ашиглаарай</p>
          )}
        </div>
      </div>
      <div className="install-actions">
        {!isIOS && <button onClick={handleInstall} className="install-btn primary">Нэмэх</button>}
        <button onClick={dismiss} className="install-btn ghost" aria-label="Аппыг суулгах саналыг хаах">Хаах</button>
      </div>

      <style jsx>{`
        .install-banner {
          position: fixed; bottom: 0; left: 0; right: 0; z-index: 140;
          background: var(--brand); color: #fff; padding: 14px 18px;
          display: flex; align-items: center; justify-content: space-between; gap: 12px;
          flex-wrap: wrap; box-shadow: 0 -4px 16px rgba(0,0,0,0.15);
        }
        @media (max-width: 640px) {
          .install-banner { bottom: 58px; }
        }
        .install-content { display: flex; align-items: center; gap: 12px; flex: 1; min-width: 200px; }
        .install-icon { font-size: 26px; }
        .install-content p { font-size: 12.5px; color: rgba(255,255,255,0.82); margin-top: 2px; }
        .install-actions { display: flex; gap: 8px; }
        .install-btn { padding: 8px 16px; border-radius: var(--r-pill); border: none; font-weight: 600; font-size: 13px; cursor: pointer; transition: transform .15s ease, box-shadow .2s ease, filter .2s ease; }
        .primary { background: var(--grad-accent); color: #fff; }
        .primary:hover { filter: saturate(1.08); transform: translateY(-1px); box-shadow: var(--shadow-sm); }
        .ghost { background: transparent; color: #fff; border: 1px solid rgba(255,255,255,0.35); }
        .ghost:hover { background: rgba(255,255,255,0.12); }
        .install-btn:focus-visible { outline: 2px solid #fff; outline-offset: 2px; }
      `}</style>
    </div>
  );
}
