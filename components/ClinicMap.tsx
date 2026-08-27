'use client';
import { useEffect, useRef } from 'react';
import type { VetClinic } from '../lib/types';

const UB_CENTER: [number, number] = [47.9184, 106.9177];

interface ClinicMapProps {
  clinics: VetClinic[];
  selectedId?: string | null;
  userCoords?: [number, number] | null;
  onSelect?: (id: string) => void;
  height?: string;
}

export default function ClinicMap({
  clinics,
  selectedId,
  userCoords,
  onSelect,
  height = 'clamp(200px, 50vw, 280px)',
}: ClinicMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<unknown>(null);
  const LRef = useRef<unknown>(null);
  const layerRef = useRef<unknown>(null);

  // Анхны ачааллалт — газрын зураг үүсгэх
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    let cancelled = false;

    import('leaflet').then((L) => {
      if (cancelled || !containerRef.current) return;
      LRef.current = L;

      // Marker icon URL засвар (LocationMap-ийн адил)
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: new URL('leaflet/dist/images/marker-icon-2x.png', import.meta.url).href,
        iconUrl: new URL('leaflet/dist/images/marker-icon.png', import.meta.url).href,
        shadowUrl: new URL('leaflet/dist/images/marker-shadow.png', import.meta.url).href,
      });

      const center = userCoords || UB_CENTER;
      const zoom = userCoords ? 13 : 11;

      const map = L.map(containerRef.current, {
        center,
        zoom,
        scrollWheelZoom: false,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
        maxZoom: 19,
      }).addTo(map);

      const layer = L.layerGroup().addTo(map);
      layerRef.current = layer;
      mapRef.current = map;

      // Маркерууд нэмэх
      addMarkers(L, layer, clinics, selectedId, onSelect);

      // Хэрэглэгчийн байршил
      if (userCoords) {
        add_user_location(L, map, userCoords);
      }
    });

    return () => {
      cancelled = true;
      // @ts-expect-error — Leaflet map
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Маркерууд шинэчлэх
  useEffect(() => {
    if (!LRef.current || !layerRef.current || !mapRef.current) return;
    const L = LRef.current as typeof import('leaflet');
    const layer = layerRef.current as ReturnType<typeof L.layerGroup>;
    const map = mapRef.current as ReturnType<typeof L.map>;

    layer.clearLayers();
    addMarkers(L, layer, clinics, selectedId, onSelect);

    if (userCoords) {
      add_user_location(L, map, userCoords);
      map.setView(userCoords, 13);
    } else if (clinics.length > 0) {
      const bounds = L.featureGroup(
        clinics.map((c) => L.marker([c.lat, c.lng])),
      ).getBounds();
      map.fitBounds(bounds, { padding: [24, 24] });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clinics.map((c) => c.id).join(',') + selectedId + (userCoords?.[0] ?? '') + (userCoords?.[1] ?? '')]);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height,
        borderRadius: 'var(--r-md)',
        overflow: 'hidden',
        border: '1px solid var(--line)',
      }}
      role="application"
      aria-label="Мал эмнэлгийн газрын зураг"
    />
  );
}

function addMarkers(
  L: typeof import('leaflet'),
  layer: ReturnType<typeof L.layerGroup>,
  clinics: VetClinic[],
  selectedId: string | null | undefined,
  onSelect?: (id: string) => void,
) {
  for (const c of clinics) {
    const marker = L.marker([c.lat, c.lng]);
    const popupContent = `<strong>${c.name}</strong><br/>${c.address}<br/><em>${c.services.join(', ')}</em>`;
    marker.bindPopup(popupContent);
    if (onSelect) {
      marker.on('click', () => onSelect(c.id));
    }
    if (c.id === selectedId) {
      marker.openPopup();
    }
    layer.addLayer(marker);
  }
}

function add_user_location(
  L: typeof import('leaflet'),
  map: ReturnType<typeof L.map>,
  coords: [number, number],
) {
  L.circleMarker(coords, {
    radius: 6,
    color: '#625BF6',
    fillColor: '#625BF6',
    fillOpacity: 0.8,
    weight: 2,
  }).addTo(map).bindPopup('📍 Таны байршил');

  L.circle(coords, {
    radius: 2000,
    color: '#625BF6',
    fillColor: '#625BF6',
    fillOpacity: 0.05,
    weight: 1,
  }).addTo(map);
}
