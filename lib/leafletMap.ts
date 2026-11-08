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
export function mapMarkerIcon(leaflet: typeof import('leaflet'), variant: 'default' | 'sighting' = 'default') {
  return leaflet.icon({
    iconUrl: variant === 'sighting' ? '/sighting-map-marker.svg' : '/map-marker.svg',
    iconSize: [32, 40],
    iconAnchor: [16, 40],
    popupAnchor: [0, -36],
  });
}

export type MapPopupDetails = {
  message: string;
  lines: readonly string[];
  photo?: { src: string; alt: string };
  privatePhotoId?: string;
};

export function createMapPinPopup(title: string, details: readonly MapPopupDetails[]) {
  const popup = document.createElement('div');
  popup.className = 'location-pin-popup';
  const heading = document.createElement('strong');
  heading.textContent = title;
  popup.append(heading);
  for (const detail of details) {
    const entry = document.createElement('article');
    const message = document.createElement('p');
    message.textContent = detail.message;
    entry.append(message);
    for (const line of detail.lines) {
      const meta = document.createElement('small');
      meta.textContent = line;
      entry.append(meta);
    }
    if (detail.photo) {
      const link = document.createElement('a');
      link.href = detail.photo.src;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      const image = document.createElement('img');
      image.src = detail.photo.src;
      image.alt = detail.photo.alt;
      image.loading = 'lazy';
      link.append(image);
      entry.append(link);
    }
    if (detail.privatePhotoId) {
      const slot = document.createElement('div');
      slot.dataset.privatePhotoId = detail.privatePhotoId;
      entry.append(slot);
    }
    popup.append(entry);
  }
  return popup;
}
