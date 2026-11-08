'use client';
import { useEffect, useEffectEvent, useRef } from 'react';
import type { MappedVetClinic } from '../lib/types';
import { addMapTiles, mapMarkerIcon } from '../lib/leafletMap';

const UB_CENTER: [number, number] = [47.9184, 106.9177];

export default function ClinicMap({ clinics, selectedId, userCoords, onSelect, label, userLocationLabel }: { clinics: MappedVetClinic[]; selectedId?: string | null; userCoords?: [number, number] | null; onSelect?: (id: string) => void; label?: string; userLocationLabel?: string; }) {
  const containerRef = useRef<HTMLDivElement>(null); const mapRef = useRef<ReturnType<typeof import('leaflet').map> | null>(null); const leafletRef = useRef<typeof import('leaflet') | null>(null); const layerRef = useRef<ReturnType<typeof import('leaflet').layerGroup> | null>(null);

  const syncMap = useEffectEvent(() => {
    const leaflet = leafletRef.current;
    const layer = layerRef.current;
    const map = mapRef.current;
    if (!leaflet || !layer || !map) return;

    const selected = clinics.find((clinic) => clinic.id === selectedId);
    if (selected) {
      map.setView([selected.location.lat, selected.location.lng], Math.max(map.getZoom(), 13), { animate: false });
    } else {
      const points = clinics.map(({ location }): [number, number] => [location.lat, location.lng]);
      if (userCoords) points.push(userCoords);
      if (points.length) map.fitBounds(points, { padding: [24, 24], maxZoom: 14, animate: false });
    }

    layer.clearLayers();
    renderMarkers(leaflet, layer, clinics, selectedId, onSelect, userCoords, userLocationLabel);
  });

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return; let cancelled = false;
    import('leaflet').then((leaflet) => {
      if (cancelled || !containerRef.current) return; leafletRef.current = leaflet;
      const map = leaflet.map(containerRef.current, { center: UB_CENTER, zoom: 11, scrollWheelZoom: false, zoomControl: true });
      addMapTiles(leaflet, map);
      const layer = leaflet.layerGroup().addTo(map); layerRef.current = layer; mapRef.current = map;
      syncMap();
    });
    return () => { cancelled = true; mapRef.current?.remove(); mapRef.current = null; layerRef.current = null; leafletRef.current = null; };
  }, []);

  useEffect(() => {
    syncMap();
  }, [clinics, onSelect, selectedId, userCoords, userLocationLabel]);

  return <div ref={containerRef} className="clinic-map" role="application" aria-label={label || 'Veterinary clinic map'}><style jsx>{`.clinic-map{width:100%;height:clamp(17rem,42vw,32rem);overflow:hidden;border:1px solid var(--line);border-radius:var(--r-lg);background:var(--surface-2)}@media(max-width:640px){.clinic-map{height:20rem;border-radius:var(--r-md)}}`}</style></div>;
}

function renderMarkers(leaflet: typeof import('leaflet'), layer: ReturnType<typeof import('leaflet').layerGroup>, clinics: MappedVetClinic[], selectedId: string | null | undefined, onSelect: ((id: string) => void) | undefined, userCoords: [number, number] | null | undefined, userLocationLabel = 'Your location') {
  for (const clinic of clinics) {
    const marker = leaflet.marker([clinic.location.lat, clinic.location.lng], { icon: mapMarkerIcon(leaflet), alt: clinic.name }); const popup = document.createElement('div');
    const title = document.createElement('strong'); title.textContent = clinic.name; const address = document.createElement('p'); address.textContent = clinic.address; const services = document.createElement('small'); services.textContent = clinic.services.join(', ');
    popup.append(title, address, services); marker.bindPopup(popup); if (onSelect) marker.on('click', () => onSelect(clinic.id)); marker.addTo(layer); if (clinic.id === selectedId) marker.openPopup();
  }
  if (userCoords) {
    leaflet.circleMarker(userCoords, { radius: 7, color: '#625BF6', fillColor: '#625BF6', fillOpacity: .82, weight: 2 }).addTo(layer).bindPopup(userLocationLabel);
    leaflet.circle(userCoords, { radius: 2000, color: '#625BF6', fillColor: '#625BF6', fillOpacity: .05, weight: 1 }).addTo(layer);
  }
}
