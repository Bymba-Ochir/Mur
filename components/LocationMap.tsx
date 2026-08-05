import { useEffect, useRef } from 'react';

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
}

export default function LocationMap({ lat, lng, editable = false, onPick }: LocationMapProps) {
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

      // CartoDB — OSM-ээс найдвартай, CORS/rate-limit асуудалгүй
      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap &copy; CARTO',
        maxZoom: 19,
      }).addTo(map);

      if (lat != null && lng != null) {
        markerRef.current = L.marker([lat, lng]).addTo(map);
      }

      if (editable) {
        map.on('click', (e) => {
          const { lat: clickLat, lng: clickLng } = e.latlng;
          if (markerRef.current) {
            markerRef.current.setLatLng([clickLat, clickLng]);
          } else {
            markerRef.current = L.marker([clickLat, clickLng]).addTo(map);
          }
          onPick?.({ lat: clickLat, lng: clickLng });
        });
      }

      // Leaflet-ийн marker icon URL асуудлыг засах (build-time import)
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: new URL('leaflet/dist/images/marker-icon-2x.png', import.meta.url).href,
        iconUrl: new URL('leaflet/dist/images/marker-icon.png', import.meta.url).href,
        shadowUrl: new URL('leaflet/dist/images/marker-shadow.png', import.meta.url).href,
      });
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
      markerRef.current = L.marker([lat, lng]).addTo(mapRef.current);
    }
  }, [lat, lng]);

  return (
    <div
      ref={containerRef}
      style={{
        height: 260,
        width: '100%',
        borderRadius: 'var(--r-md)',
        overflow: 'hidden',
        border: '1px solid var(--line)',
        // Force layout so leaflet can measure correctly
        minHeight: 260,
      }}
    />
  );
}
