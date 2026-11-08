'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useLanguage } from '../lib/i18n';
import { fetchGuestSightingPhoto } from '../lib/sightingService';
import Button from './ui/Button';

export default function GuestSightingPhoto({ petId, reportId, defer = false, onLoad }: {
  petId: string;
  reportId: string;
  defer?: boolean;
  onLoad?: () => void;
}) {
  const { t } = useLanguage();
  const [requested, setRequested] = useState(!defer);
  const [url, setUrl] = useState<string | null>();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!requested) return;
    const controller = new AbortController();
    let objectUrl: string | undefined;
    fetchGuestSightingPhoto(petId, reportId, controller.signal).then(blob => {
      if (controller.signal.aborted) return;
      objectUrl = blob ? URL.createObjectURL(blob) : undefined;
      setUrl(objectUrl ?? null);
    }).catch(() => { if (!controller.signal.aborted) setFailed(true); });
    return () => {
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [petId, reportId, requested]);

  if (!requested) return <Button size="sm" variant="ghost" onClick={() => setRequested(true)}>{t('guest_sighting_photo_show')}</Button>;
  if (failed) return <p role="status">{t('guest_sighting_photo_error')}</p>;
  if (url === null) return <p role="status">{t('guest_sighting_photo_none')}</p>;
  if (!url) return <p role="status">{t('detail_loading')}</p>;
  return <Image src={url} alt={t('sightings_photo_alt')} width={240} height={160}
    style={{ width: 'auto', height: 'auto', maxWidth: '100%', maxHeight: onLoad ? 108 : 180, objectFit: 'contain', borderRadius: 'var(--r-sm)' }}
    unoptimized onLoad={onLoad} />;
}
