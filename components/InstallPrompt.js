'use client';
import { useEffect, useState } from 'react';

const DISMISS_KEY = 'mur-install-dismissed';

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [visible, setVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(DISMISS_KEY)) return;

    // Аль хэдийн апп болгож суулгасан эсэхийг шалгах (standalone горим)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      || window.navigator.standalone === true;
    if (isStandalone) return;

    const ua = window.navigator.userAgent;
    const iosDevice = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
    setIsIOS(iosDevice);

    if (iosDevice) {
      // iOS дээр beforeinstallprompt дэмжигддэггүй тул зааврыг шууд харуулна
      setVisible(true);
      return;
    }

    function handleBeforeInstallPrompt(e) {
      e.preventDefault();
      setDeferredPrompt(e);
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
    <div className="install-banner">
      <div className="install-content">
        <span className="install-icon">🐾</span>
        <div>
          <b>МӨР-ийг гэрийн дэлгэц рүү нэмэх</b>
          {isIOS ? (
            <p>Safari-ийн доод "Share" (⬆️) товч → "Add to Home Screen" дарна уу</p>
          ) : (
            <p>Апп шиг хурдан нээж ашиглаарай</p>
          )}
        </div>
      </div>
      <div className="install-actions">
        {!isIOS && <button onClick={handleInstall} className="install-btn primary">Нэмэх</button>}
        <button onClick={dismiss} className="install-btn ghost">Хаах</button>
      </div>

      <style jsx>{`
        .install-banner {
          position: fixed; bottom: 0; left: 0; right: 0; z-index: 200;
          background: var(--brand); color: #fff; padding: 14px 18px;
          display: flex; align-items: center; justify-content: space-between; gap: 12px;
          flex-wrap: wrap; box-shadow: 0 -4px 16px rgba(0,0,0,0.15);
        }
        .install-content { display: flex; align-items: center; gap: 12px; flex: 1; min-width: 200px; }
        .install-icon { font-size: 26px; }
        .install-content p { font-size: 12.5px; color: #C9DCE2; margin-top: 2px; }
        .install-actions { display: flex; gap: 8px; }
        .install-btn { padding: 8px 14px; border-radius: 8px; border: none; font-weight: 600; font-size: 13px; cursor: pointer; }
        .primary { background: var(--accent); color: var(--primary); }
        .ghost { background: transparent; color: #DCE9EC; border: 1px solid rgba(255,255,255,0.3); }
      `}</style>
    </div>
  );
}
