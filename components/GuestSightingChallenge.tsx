'use client';

import Script from 'next/script';
import { useEffect, useRef, useState } from 'react';
import { GUEST_SIGHTING_CHALLENGE } from '../lib/guestSightings';
import { useLanguage } from '../lib/i18n';

type TurnstileApi = {
  render(container: HTMLElement, options: {
    sitekey: string;
    action: string;
    language: string;
    callback: (token: string) => void;
    'expired-callback': () => void;
    'error-callback': () => void;
  }): string;
  remove(widgetId: string): void;
};

export default function GuestSightingChallenge({ siteKey, onToken }: {
  siteKey: string;
  onToken: (token: string | null) => void;
}) {
  const { t } = useLanguage();
  const container = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const turnstile = (window as Window & { turnstile?: TurnstileApi }).turnstile;
    if (!ready || !turnstile || !container.current) return;
    const widget = turnstile.render(container.current, {
      sitekey: siteKey,
      action: GUEST_SIGHTING_CHALLENGE,
      language: 'auto',
      callback: token => { setFailed(false); onToken(token); },
      'expired-callback': () => onToken(null),
      'error-callback': () => { setFailed(true); onToken(null); },
    });
    return () => turnstile.remove(widget);
  }, [ready, siteKey, onToken]);

  return <>
    <Script id="guest-sighting-turnstile" src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
      onReady={() => setReady(true)} onError={() => setFailed(true)} />
    <div ref={container} />
    {failed && <p role="alert">{t('guest_sighting_captcha_error')}</p>}
  </>;
}
