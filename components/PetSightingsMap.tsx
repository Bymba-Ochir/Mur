'use client';

import { useCallback, useMemo } from 'react';
import GuestSightingPhoto from './GuestSightingPhoto';
import type { GuestSightingDetails } from '../lib/guestSightings';
import { useLanguage } from '../lib/i18n';
import { guestSightingMapPinId, sightingMapPinId } from '../lib/sightingPresentation';
import { dateTimeFormat } from '../lib/dateTime';
import type { Sighting } from '../lib/types';
import LocationMap, { type LocationMapPin, type LocationMapFocus } from './LocationMap';

export default function PetSightingsMap({ lat, lng, sightings, focus, ownerPetId, privateSighting }: {
  lat?: number | null;
  lng?: number | null;
  sightings: readonly Sighting[];
  focus: LocationMapFocus | null;
  ownerPetId?: string;
  privateSighting?: GuestSightingDetails | null;
}) {
  const { t, lang } = useLanguage();
  const renderPrivatePhoto = useCallback((id: string, defer: boolean, update: () => void) => (
    ownerPetId ? <GuestSightingPhoto petId={ownerPetId} reportId={id} defer={defer} onLoad={update} /> : null
  ), [ownerPetId]);
  const pins = useMemo(() => {
    const formatter = dateTimeFormat(lang);
    const groups = new Map<string, LocationMapPin>();
    const ownerReport = ownerPetId ? privateSighting : null;
    for (const sighting of sightings) {
      if (sighting.id === ownerReport?.id) continue;
      const id = sightingMapPinId(sighting);
      if (id == null || sighting.lat == null || sighting.lng == null) continue;
      let group = groups.get(id);
      if (!group) {
        group = { id, lat: sighting.lat, lng: sighting.lng, title: t('sightings_title'), details: [] };
        groups.set(id, group);
      }
      group.details.push({
        message: sighting.guestReport ? t('guest_sighting_approximate') : sighting.message,
        photo: sighting.photoUrl ? { src: sighting.photoUrl, alt: t('sightings_photo_alt') } : undefined,
        privatePhotoId: ownerPetId && sighting.guestReport && !sighting.photoUrl ? sighting.id : undefined,
        lines: [
          ...(sighting.place ? [`${t('sightings_place_label')}: ${sighting.place}`] : []),
          ...(sighting.sightedAt ? [`${t('sightings_time_seen')} ${formatter.format(new Date(sighting.sightedAt))}`] : []),
          `${t('sightings_time_posted')} ${formatter.format(new Date(sighting.createdAt))}`,
        ],
      });
    }
    if (ownerReport?.lat != null && ownerReport.lng != null) {
      const id = guestSightingMapPinId(ownerReport.id);
      groups.set(id, {
        id, lat: ownerReport.lat, lng: ownerReport.lng, title: t('guest_sighting_exact'),
        details: [{
          message: ownerReport.message,
          privatePhotoId: ownerReport.hasPhoto ? ownerReport.id : undefined,
          lines: [
            ...(ownerReport.place ? [`${t('sightings_place_label')}: ${ownerReport.place}`] : []),
            ...(ownerReport.sighted_at ? [`${t('sightings_time_seen')} ${formatter.format(new Date(ownerReport.sighted_at))}`] : []),
          ],
        }],
      });
    }
    return [...groups.values()];
  }, [sightings, ownerPetId, privateSighting, t, lang]);

  const hasOrigin = lat != null && lng != null;

  return <>
    <LocationMap lat={lat} lng={lng} pins={pins} focus={focus} renderPrivatePhoto={ownerPetId ? renderPrivatePhoto : undefined}
      label={t(hasOrigin ? 'detail_last_seen_loc' : 'sightings_map_locations')} />
    {pins.length > 0 && <ul className="map-legend">
      {hasOrigin && <li><span className="origin-dot" aria-hidden="true" />{t('detail_last_seen_loc')}</li>}
      <li><span className="sighting-dot" aria-hidden="true" />{t('sightings_title')}</li>
    </ul>}
    <style jsx>{`
      .map-legend { display:flex; flex-wrap:wrap; gap:var(--sp-2) var(--sp-4); padding:0; margin:var(--sp-2) 0 0; list-style:none; color:var(--text-secondary); font-size:var(--text-xs); }
      .map-legend li { display:inline-flex; gap:var(--sp-1); align-items:center; }
      .map-legend span { width:10px; height:10px; border-radius:50%; flex:none; }
      .origin-dot { background:#625bf6; }
      .sighting-dot { background:#d5640c; }
    `}</style>
  </>;
}
