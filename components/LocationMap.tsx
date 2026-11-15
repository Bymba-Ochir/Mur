import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { ReactNode } from 'react';
import type { Marker, Popup, PopupEvent } from 'leaflet';
import { useLanguage } from '../lib/i18n';
import { addMapTiles, createMapPinPopup, mapMarkerIcon } from '../lib/leafletMap';
import type { MapPopupDetails } from '../lib/leafletMap';
import { isRecentSighting } from '../lib/sightingPresentation';
import type { SightingMapTimeLabel } from '../lib/sightingPresentation';

export type LocationMapPin = {
  id: string; lat: number; lng: number; title: string; details: MapPopupDetails[];
  timeLabel?: SightingMapTimeLabel;
  createdAt?: string;
};
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
  renderPrivatePhoto?: (id: string, defer: boolean, update: () => void) => ReactNode;
}

export default function LocationMap({ lat, lng, initialCenter, editable = false, markerVariant = 'default', onPick, label, pins = NO_PINS, focus, renderPrivatePhoto }: LocationMapProps) {
  const { t } = useLanguage();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<import('leaflet').Map | null>(null);
  const markerRef = useRef<import('leaflet').Marker | null>(null);
  const LRef = useRef<typeof import('leaflet') | null>(null);
  const overlays = useRef(new Map<string, { marker: Marker; snapshot: string }>());
  const highlightTimers = useRef(new Map<Marker, ReturnType<typeof setTimeout>>());
  const [ready, setReady] = useState(false);
  const [photoSlots, setPhotoSlots] = useState<{ elements: HTMLElement[]; update: () => void } | null>(null);

  const highlight = useCallback((marker: Marker) => {
    const element = marker.getElement();
    if (!element) return;
    const timers = highlightTimers.current;
    clearTimeout(timers.get(marker));
    element.classList.remove('sighting-marker-arrival');
    // Restart the short highlight when the owner deliberately selects a pin.
    void element.offsetWidth;
    element.classList.add('sighting-marker-arrival');
    timers.set(marker, setTimeout(() => {
      element.classList.remove('sighting-marker-arrival');
      timers.delete(marker);
    }, 4800));
  }, []);

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
    const timers = highlightTimers.current;
    return () => {
      cancelled = true;
      overlayMarkers.clear();
      for (const timer of timers.values()) clearTimeout(timer);
      timers.clear();
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
        clearTimeout(highlightTimers.current.get(marker));
        highlightTimers.current.delete(marker);
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
      const applyTimeLabel = (marker: Marker) => {
        marker.getElement()?.setAttribute('alt', pin.timeLabel ? `${pin.title} — ${pin.timeLabel.title}` : pin.title);
        if (!pin.timeLabel) {
          if (marker.getTooltip()) marker.unbindTooltip();
          return;
        }
        const label = document.createElement('span');
        label.textContent = pin.timeLabel.text;
        label.title = pin.timeLabel.title;
        if (marker.getTooltip()) marker.setTooltipContent(label);
        else marker.bindTooltip(label, {
          permanent: true, direction: 'top', offset: [0, -42], opacity: 1,
          className: 'sighting-time-label',
        });
      };
      if (current) {
        if (!current.marker.getLatLng().equals([pin.lat, pin.lng], 0)) {
          current.marker.setLatLng([pin.lat, pin.lng]);
          positionsChanged = true;
        }
        applyTimeLabel(current.marker);
        current.marker.setPopupContent(content);
        const previous = JSON.parse(current.snapshot) as LocationMapPin;
        if (pin.createdAt !== previous.createdAt && isRecentSighting(pin.createdAt)) highlight(current.marker);
        current.snapshot = snapshot;
      } else {
        const marker = L.marker([pin.lat, pin.lng], {
          icon: mapMarkerIcon(L, 'sighting'), alt: pin.title, zIndexOffset: 1000,
        }).bindPopup(content, { maxWidth: 260, maxHeight: Math.max(80, map.getSize().y - 120) }).addTo(map);
        applyTimeLabel(marker);
        if (isRecentSighting(pin.createdAt)) highlight(marker);
        markers.set(pin.id, { marker, snapshot });
        positionsChanged = true;
      }
    }

    // Realtime refreshes with the same pins leave the user's viewport and popup alone.
    if (positionsChanged) {
      const bounds = L.latLngBounds(pins.map(pin => L.latLng(pin.lat, pin.lng)));
      if (lat != null && lng != null) bounds.extend([lat, lng]);
      map.fitBounds(bounds, { paddingTopLeft: [42, 80], paddingBottomRight: [42, 36], maxZoom: 15, animate: false });
    }
  }, [ready, pins, lat, lng, highlight]);

  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map || !renderPrivatePhoto) return;
    let active: Popup | undefined;
    let lastContent: unknown;
    function syncPhotoSlots() {
      const popup = active;
      const content = popup?.getContent();
      if (content === lastContent) return;
      lastContent = content;
      const elements = content instanceof HTMLElement
        ? Array.from(content.querySelectorAll<HTMLElement>('[data-private-photo-id]')) : [];
      setPhotoSlots(popup && elements.length ? { elements, update: () => popup.update() } : null);
    }
    function close({ popup }: PopupEvent) {
      if (popup !== active) return;
      popup.off('contentupdate', syncPhotoSlots);
      active = undefined;
      lastContent = undefined;
      setPhotoSlots(null);
    }
    function open({ popup }: PopupEvent) {
      active?.off('contentupdate', syncPhotoSlots);
      active = popup;
      popup.on('contentupdate', syncPhotoSlots);
      syncPhotoSlots();
    }
    map.on('popupopen', open).on('popupclose', close);
    return () => {
      active?.off('contentupdate', syncPhotoSlots);
      map.off('popupopen', open).off('popupclose', close);
    };
  }, [ready, renderPrivatePhoto]);

  useEffect(() => {
    if (!ready || !focus) return;
    const map = mapRef.current;
    const marker = overlays.current.get(focus.pinId)?.marker;
    if (!map || !marker) return;
    containerRef.current?.scrollIntoView({ block: 'center' });
    map.panTo(marker.getLatLng(), { animate: false });
    marker.getElement()?.focus({ preventScroll: true });
    marker.openPopup();
    highlight(marker);
  }, [ready, focus, highlight]);

  return <>
    {renderPrivatePhoto && photoSlots?.elements.map(element => {
      const id = element.dataset.privatePhotoId!;
      return createPortal(renderPrivatePhoto(id, photoSlots.elements.length > 1, photoSlots.update), element, id);
    })}
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
      .location-map :global(.sighting-time-label) {
        background:#fff3e6; color:#783b0d; border:1px solid #e9c39b;
        border-radius:9px; padding:5px 9px; box-shadow:0 2px 7px #24170b12;
        font:650 12px/1.3 var(--font-body, sans-serif); white-space:nowrap; max-width:210px;
      }
      .location-map :global(.sighting-time-label::before) { border-top-color:#e9c39b; }
      .location-map :global(.sighting-marker-arrival) { animation:sighting-arrival 1600ms ease-out 3; }
      @keyframes sighting-arrival {
        0%, 100% { filter:drop-shadow(0 0 0 #d5640c00); }
        45% { filter:drop-shadow(0 0 9px #d5640cbb) drop-shadow(0 0 15px #d5640c55); }
      }
      :global([data-theme="dark"]) .location-map :global(.sighting-time-label) {
        background:#38291e; color:#ffd3a1; border-color:#89623d;
      }
      :global([data-theme="dark"]) .location-map :global(.sighting-time-label::before) { border-top-color:#89623d; }
      @media (prefers-reduced-motion: reduce) {
        .location-map :global(.sighting-marker-arrival) { animation:none; }
      }
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
