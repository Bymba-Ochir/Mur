import { useEffect, useRef } from 'react';
import { useLanguage } from '../lib/i18n';
import { addMapTiles, mapMarkerIcon } from '../lib/leafletMap';

// Улаанбаатар хотын төв (анхдагч байршил)
const UB_CENTER: [number, number] = [47.9184, 106.9177];

interface LocationMapProps {
  /** анхны координат (view горимд заавал) */
  lat?: number | null;
  lng?: number | null;
  /** true бол дарж байршил сонгож болно */
  editable?: boolean;
  /** editable=true үед сонгосон {lat,lng}-г буцаана */
  onPick?: (coords: { lat: number; lng: number }) => void;
  /** screen reader-д газрын зургийн зорилгыг тайлбарлана */
  label?: string;
}

export default function LocationMap({ lat, lng, editable = false, onPick, label }: LocationMapProps) {
  const { t } = useLanguage();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<import('leaflet').Map | null>(null);
  const markerRef = useRef<import('leaflet').Marker | null>(null);
  const LRef = useRef<typeof import('leaflet') | null>(null);

  useEffect(() => {
    let cancelled = false;

    import('leaflet').then((L) => {
      if (cancelled || !containerRef.current || mapRef.current) return;
      LRef.current = L;

      const center: [number, number] = lat != null && lng != null ? [lat, lng] : UB_CENTER;
      const map = L.map(containerRef.current).setView(center, lat != null ? 15 : 11);
      mapRef.current = map;

      addMapTiles(L, map);

      if (lat != null && lng != null) {
        markerRef.current = L.marker([lat, lng], { icon: mapMarkerIcon(L), alt: label || t('detail_last_seen_loc') }).addTo(map);
      }

      if (editable) {
        map.on('click', (e) => {
          const { lat: clickLat, lng: clickLng } = e.latlng;
          if (markerRef.current) {
            markerRef.current.setLatLng([clickLat, clickLng]);
          } else {
            markerRef.current = L.marker([clickLat, clickLng], { icon: mapMarkerIcon(L), alt: label || t('detail_last_seen_loc') }).addTo(map);
          }
          onPick?.({ lat: clickLat, lng: clickLng });
        });
      }

    });

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Гаднаас (жишээ нь geolocation товч) lat/lng өөрчлөгдөхөд газрын зургийг шинэчилнэ
  useEffect(() => {
    if (!mapRef.current || !LRef.current || lat == null || lng == null) return;
    const L = LRef.current;
    mapRef.current.setView([lat, lng], 15);
    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
    } else {
      markerRef.current = L.marker([lat, lng], { icon: mapMarkerIcon(L), alt: label || t('detail_last_seen_loc') }).addTo(mapRef.current);
    }
  }, [lat, lng, label, t]);

  return <>
    <div ref={containerRef} className="location-map" role="region" aria-label={label || t('detail_map_heading')} />
    <style jsx>{`
      .location-map {
        width: 100%; height: clamp(220px, 42vw, 320px); min-height: clamp(220px, 42vw, 320px);
        overflow: hidden; border: 1px solid var(--border-subtle); border-radius: var(--r-md);
      }
      .location-map:focus-within { outline: 2px solid var(--border-focus); outline-offset: 2px; }
      @media (max-width: 480px) { .location-map { height: 240px; min-height: 240px; } }
    `}</style>
  </>;
}
