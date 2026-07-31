'use client';
import { useEffect, useRef } from 'react';

// Улаанбаатар хотын төв (анхдагч байршил)
const UB_CENTER = [47.9184, 106.9177];

/**
 * @param {number} [lat] - анхны координат (view горимд заавал)
 * @param {number} [lng]
 * @param {boolean} [editable] - true бол дарж байршил сонгож болно
 * @param {function} [onPick] - editable=true үед сонгосон {lat,lng}-г буцаана
 */
export default function LocationMap({ lat, lng, editable = false, onPick }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const LRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    import('leaflet').then((L) => {
      if (cancelled || !containerRef.current || mapRef.current) return;
      LRef.current = L;

      const center = lat != null && lng != null ? [lat, lng] : UB_CENTER;
      const map = L.map(containerRef.current).setView(center, lat != null ? 15 : 11);
      mapRef.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
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
      style={{ height: 260, borderRadius: 'var(--r-md)', overflow: 'hidden', border: '1px solid var(--line)' }}
    />
  );
}
