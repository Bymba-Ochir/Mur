import type { Map } from 'leaflet';

/** Browser requests use the provider's cache headers and the site's Referer. */
export function addMapTiles(leaflet: typeof import('leaflet'), map: Map) {
  return leaflet.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
    updateWhenIdle: true,
    keepBuffer: 1,
  }).addTo(map);
}

/** An explicit first-party icon avoids Leaflet's CSS image-path detection. */
export function mapMarkerIcon(leaflet: typeof import('leaflet')) {
  return leaflet.icon({
    iconUrl: '/map-marker.svg',
    iconSize: [32, 40],
    iconAnchor: [16, 40],
    popupAnchor: [0, -36],
  });
}
