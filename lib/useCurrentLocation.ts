'use client';

import { useSyncExternalStore } from 'react';

function subscribe(callback: () => void) {
  window.addEventListener('popstate', callback);
  window.addEventListener('hashchange', callback);
  return () => {
    window.removeEventListener('popstate', callback);
    window.removeEventListener('hashchange', callback);
  };
}

const getClientSnapshot = () => window.location.href;
const getServerSnapshot = () => '';

export function useCurrentLocation(): string {
  return useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);
}
