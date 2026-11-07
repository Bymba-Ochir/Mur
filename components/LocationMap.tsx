import { useEffect, useRef, useState } from 'react';
import type { Marker } from 'leaflet';
import { useLanguage } from '../lib/i18n';
import { addMapTiles, createMapPinPopup, mapMarkerIcon } from '../lib/leafletMap';
import type { MapPopupDetails } from '../lib/leafletMap';

export type LocationMapPin = { id: string; lat: number; lng: number; title: string; details: MapPopupDetails[] };
export type LocationMapFocus = { pinId: string };
const NO_PINS: readonly LocationMapPin[] = [];

// Улаанбаатар хотын төв (анхдагч байршил)
const UB_CENTER: [number, number] = [47.9184, 106.9177];

interface LocationMapProps {
  /** анхны координат (view горимд заавал) */
  lat?: number | null;
  lng?: number | null;
  /** Сонгосон цэг байхгүй үед ашиглах төв; marker үүсгэхгүй. */
  initialCenter?: { lat: number; lng: number } | null;
  /** true бол дарж байршил сонгож болно */
  editable?: boolean;
  markerVariant?: 'default' | 'sighting';
  /** editable=true үед сонгосон {lat,lng}-г буцаана */
  onPick?: (coords: { lat: number; lng: number }) => void;
  /** screen reader-д газрын зургийн зорилгыг тайлбарлана */
  label?: string;
  pins?: readonly LocationMapPin[];
  focus?: LocationMapFocus | null;
}

export default function LocationMap({ lat, lng, initialCenter, editable = false, markerVariant = 'default', onPick, label, pins = NO_PINS, focus }: LocationMapProps) {
  const { t } = useLanguage();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<import('leaflet').Map | null>(null);
  const markerRef = useRef<import('leaflet').Marker | null>(null);
  const LRef = useRef<typeof import('leaflet') | null>(null);
  const overlays = useRef(new Map<string, { marker: Marker; snapshot: string }>());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    import('leaflet').then((L) => {
      if (cancelled || !containerRef.current || mapRef.current) return;
      LRef.current = L;

      const center: [number, number] = lat != null && lng != null
        ? [lat, lng]
        : initialCenter ? [initialCenter.lat, initialCenter.lng] : UB_CENTER;
      const map = L.map(containerRef.current).setView(center, lat != null || initialCenter ? 15 : 11);
      mapRef.current = map;

      addMapTiles(L, map);
      setReady(true);

      if (lat != null && lng != null) {
        markerRef.current = L.marker([lat, lng], { icon: mapMarkerIcon(L, markerVariant), alt: label || t('detail_last_seen_loc') }).addTo(map);
      }

      if (editable) {
        map.on('click', (e) => {
          const { lat: clickLat, lng: clickLng } = map.wrapLatLng(e.latlng);
          if (markerRef.current) {
            markerRef.current.setLatLng([clickLat, clickLng]);
          } else {
            markerRef.current = L.marker([clickLat, clickLng], { icon: mapMarkerIcon(L, markerVariant), alt: label || t('detail_last_seen_loc') }).addTo(map);
          }
          onPick?.({ lat: clickLat, lng: clickLng });
        });
      }

    });

    const overlayMarkers = overlays.current;
    return () => {
      cancelled = true;
      overlayMarkers.clear();
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Гаднаас (жишээ нь geolocation товч) lat/lng өөрчлөгдөхөд газрын зургийг шинэчилнэ
  useEffect(() => {
    if (!mapRef.current || !LRef.current) return;
    if (lat == null || lng == null) {
      markerRef.current?.remove();
      markerRef.current = null;
      return;
    }
    const L = LRef.current;
    mapRef.current.setView([lat, lng], 15);
    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
      markerRef.current.setIcon(mapMarkerIcon(L, markerVariant));
    } else {
      markerRef.current = L.marker([lat, lng], { icon: mapMarkerIcon(L, markerVariant), alt: label || t('detail_last_seen_loc') }).addTo(mapRef.current);
    }
  }, [lat, lng, label, markerVariant, t]);

  useEffect(() => {
    const map = mapRef.current;
    const L = LRef.current;
    if (!ready || !map || !L) return;

    const markers = overlays.current;
    const ids = new Set(pins.map(pin => pin.id));
    for (const [id, { marker }] of markers) {
      if (!ids.has(id)) {
        marker.remove();
        markers.delete(id);
      }
    }

    let positionsChanged = false;
    for (const pin of pins) {
      const snapshot = JSON.stringify(pin);
      const current = markers.get(pin.id);
      if (current?.snapshot === snapshot) continue;
      const content = createMapPinPopup(pin.title, pin.details);
      if (current) {
        if (!current.marker.getLatLng().equals([pin.lat, pin.lng], 0)) {
          current.marker.setLatLng([pin.lat, pin.lng]);
          positionsChanged = true;
        }
        current.marker.getElement()?.setAttribute('alt', pin.title);
        current.marker.setPopupContent(content);
        current.snapshot = snapshot;
      } else {
        const marker = L.marker([pin.lat, pin.lng], {
          icon: mapMarkerIcon(L, 'sighting'), alt: pin.title, zIndexOffset: 1000,
        }).bindPopup(content, { maxWidth: 260, maxHeight: Math.max(80, map.getSize().y - 120) }).addTo(map);
        markers.set(pin.id, { marker, snapshot });
        positionsChanged = true;
      }
    }

    // Realtime refreshes with the same pins leave the user's viewport and popup alone.
    if (positionsChanged) {
      const bounds = L.latLngBounds(pins.map(pin => L.latLng(pin.lat, pin.lng)));
      if (lat != null && lng != null) bounds.extend([lat, lng]);
      map.fitBounds(bounds, { padding: [34, 38], maxZoom: 15, animate: false });
    }
  }, [ready, pins, lat, lng]);

  useEffect(() => {
    if (!ready || !focus) return;
    const map = mapRef.current;
    const marker = overlays.current.get(focus.pinId)?.marker;
    if (!map || !marker) return;
    containerRef.current?.scrollIntoView({ block: 'center' });
    map.panTo(marker.getLatLng(), { animate: false });
    marker.getElement()?.focus({ preventScroll: true });
    marker.openPopup();
  }, [ready, focus]);

  return <>
    <div ref={containerRef} className="location-map" role="region" aria-label={label || t('detail_map_heading')} />
    <style jsx>{`
      .location-map {
        position: relative; isolation: isolate; z-index: 0;
        width: 100%; height: clamp(220px, 42vw, 320px); min-height: clamp(220px, 42vw, 320px);
        overflow: hidden; border: 1px solid var(--border-subtle); border-radius: var(--r-md);
      }
      .location-map :global(.leaflet-popup-content-wrapper),
      .location-map :global(.leaflet-popup-tip) { background:var(--card); color:var(--ink); }
      .location-map :global(.leaflet-popup-close-button) { color:var(--muted); }
      .location-map :global(.leaflet-bar a),
      .location-map :global(.leaflet-control-attribution) { background:var(--card); color:var(--ink); }
      .location-map :global(.location-pin-popup) { overflow-wrap: anywhere; }
      .location-map :global(.location-pin-popup article) { margin-top: 8px; padding-top: 6px; border-top: 1px solid var(--border-subtle); }
      .location-map :global(.location-pin-popup p) { margin: 0 0 5px; white-space: pre-wrap; }
      .location-map :global(.location-pin-popup small) { display: block; margin-top: 3px; }
      .location-map :global(.location-pin-popup img) {
        display: block; width: 160px; max-width: 100%; height: 92px; margin-top: 6px;
        object-fit: contain; border-radius: 6px;
      }
      .location-map:focus-within { outline: 2px solid var(--border-focus); outline-offset: 2px; }
      @media (max-width: 480px) { .location-map { height: 240px; min-height: 240px; } }
    `}</style>
  </>;
}
