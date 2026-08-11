'use client';
import { useEffect, useRef } from 'react';
import type { Pet } from '../lib/types';

export default function PetResultsMap({ pets }: { pets: Pet[] }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let map: import('leaflet').Map | null = null;
    import('leaflet').then((L) => {
      if (!ref.current) return;
      map = L.map(ref.current).setView([47.9184, 106.9177], 11);
      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', { attribution: '&copy; OSM &copy; CARTO', maxZoom: 19 }).addTo(map);
      const points: [number, number][] = [];
      pets.forEach((pet) => {
        if (pet.lat == null || pet.lng == null) return;
        points.push([pet.lat, pet.lng]);
        const popup = document.createElement('div');
        const title = document.createElement('strong');
        const place = document.createElement('div');
        title.textContent = `${pet.status === 'lost' ? 'Алдсан' : 'Олдсон'} ${pet.type}`;
        place.textContent = [pet.district, pet.place].filter(Boolean).join(' — ');
        popup.append(title, place);
        L.circleMarker([pet.lat, pet.lng], {
          radius: 8,
          color: pet.status === 'lost' ? '#FF6B6B' : '#56C7E8',
          fillOpacity: .85,
        }).bindPopup(popup).on('click', () => {
          window.location.href = `/pets/${pet.id}`;
        }).addTo(map!);
      });
      if (points.length) map.fitBounds(points, { padding: [30, 30], maxZoom: 14 });
    });
    return () => { map?.remove(); };
  }, [pets]);
  return <div ref={ref} style={{ height: 'min(62vh, 520px)', borderRadius: 'var(--r-lg)', border: '1px solid var(--line)', overflow: 'hidden' }} />;
}
