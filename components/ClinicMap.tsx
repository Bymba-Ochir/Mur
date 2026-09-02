'use client';
import { useEffect, useRef } from 'react';
import type { VetClinic } from '../lib/types';

const UB_CENTER: [number, number] = [47.9184, 106.9177];

export default function ClinicMap({ clinics, selectedId, userCoords, onSelect, label, userLocationLabel }: { clinics: VetClinic[]; selectedId?: string | null; userCoords?: [number, number] | null; onSelect?: (id: string) => void; label?: string; userLocationLabel?: string; }) {
  const containerRef = useRef<HTMLDivElement>(null); const mapRef = useRef<ReturnType<typeof import('leaflet').map> | null>(null); const leafletRef = useRef<typeof import('leaflet') | null>(null); const layerRef = useRef<ReturnType<typeof import('leaflet').layerGroup> | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return; let cancelled = false;
    import('leaflet').then((leaflet) => {
      if (cancelled || !containerRef.current) return; leafletRef.current = leaflet;
      leaflet.Icon.Default.mergeOptions({ iconRetinaUrl: new URL('leaflet/dist/images/marker-icon-2x.png', import.meta.url).href, iconUrl: new URL('leaflet/dist/images/marker-icon.png', import.meta.url).href, shadowUrl: new URL('leaflet/dist/images/marker-shadow.png', import.meta.url).href });
      const map = leaflet.map(containerRef.current, { center: userCoords || UB_CENTER, zoom: userCoords ? 13 : 11, scrollWheelZoom: false, zoomControl: true });
      leaflet.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', { attribution: '&copy; <a href="https://carto.com/">CARTO</a>', maxZoom: 19 }).addTo(map);
      const layer = leaflet.layerGroup().addTo(map); layerRef.current = layer; mapRef.current = map;
      renderMarkers(leaflet, layer, clinics, selectedId, onSelect, userCoords, userLocationLabel);
    });
    return () => { cancelled = true; mapRef.current?.remove(); mapRef.current = null; layerRef.current = null; leafletRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const leaflet = leafletRef.current; const layer = layerRef.current; const map = mapRef.current; if (!leaflet || !layer || !map) return;
    layer.clearLayers(); renderMarkers(leaflet, layer, clinics, selectedId, onSelect, userCoords, userLocationLabel);
    if (userCoords) map.setView(userCoords, 13);
    else if (clinics.length > 0) map.fitBounds(leaflet.featureGroup(clinics.map((clinic) => leaflet.marker([clinic.lat, clinic.lng]))).getBounds(), { padding: [24, 24], maxZoom: 14 });
  }, [clinics, onSelect, selectedId, userCoords, userLocationLabel]);

  return <div ref={containerRef} className="clinic-map" role="application" aria-label={label || 'Veterinary clinic map'}><style jsx>{`.clinic-map{width:100%;height:clamp(17rem,42vw,32rem);overflow:hidden;border:1px solid var(--line);border-radius:var(--r-lg);background:var(--surface-2)}@media(max-width:640px){.clinic-map{height:20rem;border-radius:var(--r-md)}}`}</style></div>;
}

function renderMarkers(leaflet: typeof import('leaflet'), layer: ReturnType<typeof import('leaflet').layerGroup>, clinics: VetClinic[], selectedId: string | null | undefined, onSelect: ((id: string) => void) | undefined, userCoords: [number, number] | null | undefined, userLocationLabel = 'Your location') {
  for (const clinic of clinics) {
    const marker = leaflet.marker([clinic.lat, clinic.lng]); const popup = document.createElement('div');
    const title = document.createElement('strong'); title.textContent = clinic.name; const address = document.createElement('p'); address.textContent = clinic.address; const services = document.createElement('small'); services.textContent = clinic.services.join(', ');
    popup.append(title, address, services); marker.bindPopup(popup); if (onSelect) marker.on('click', () => onSelect(clinic.id)); marker.addTo(layer); if (clinic.id === selectedId) marker.openPopup();
  }
  if (userCoords) {
    leaflet.circleMarker(userCoords, { radius: 7, color: '#625BF6', fillColor: '#625BF6', fillOpacity: .82, weight: 2 }).addTo(layer).bindPopup(userLocationLabel);
    leaflet.circle(userCoords, { radius: 2000, color: '#625BF6', fillColor: '#625BF6', fillOpacity: .05, weight: 1 }).addTo(layer);
  }
}
