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
    <div className="fixed inset-x-0 bottom-0 z-[140] flex flex-wrap items-center justify-between gap-3 bg-[var(--brand)] px-[18px] py-3.5 text-[var(--text-on-accent)] shadow-[0_-4px_16px_rgba(0,0,0,0.15)] max-sm:bottom-[58px]" role="region" aria-label="Аппыг суулгах санал">
      <div className="flex min-w-[200px] flex-1 items-center gap-3">
        <span className="text-[26px]" aria-hidden="true">🐾</span>
        <div>
          <b>МӨР-ийг гэрийн дэлгэц рүү нэмэх</b>
          {isIOS ? (
            <p className="mt-0.5 text-[12.5px] text-[color-mix(in_srgb,var(--text-on-accent)_82%,transparent)]">Safari-ийн доод &quot;Share&quot; (⬆️) товч → &quot;Add to Home Screen&quot; дарна уу</p>
          ) : (
            <p className="mt-0.5 text-[12.5px] text-[color-mix(in_srgb,var(--text-on-accent)_82%,transparent)]">Апп шиг хурдан нээж ашиглаарай</p>
          )}
        </div>
      </div>
      <div className="flex gap-2">
        {!isIOS && <button onClick={handleInstall} className="cursor-pointer rounded-[var(--r-pill)] border-0 bg-[image:var(--grad-accent)] px-4 py-2 text-[13px] font-semibold text-[var(--accent-ink)] transition-[transform,box-shadow,filter] duration-200 hover:-translate-y-px hover:saturate-[1.08] hover:shadow-[var(--shadow-sm)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--text-on-accent)]">Нэмэх</button>}
        <button onClick={dismiss} className="cursor-pointer rounded-[var(--r-pill)] border border-[color-mix(in_srgb,var(--text-on-accent)_35%,transparent)] bg-transparent px-4 py-2 text-[13px] font-semibold text-[var(--text-on-accent)] transition-colors hover:bg-[color-mix(in_srgb,var(--text-on-accent)_12%,transparent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--text-on-accent)]" aria-label="Аппыг суулгах саналыг хаах">Хаах</button>
      </div>
    </div>
  );
}
