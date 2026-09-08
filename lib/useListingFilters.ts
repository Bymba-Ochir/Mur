'use client';
import { useSyncExternalStore } from 'react';
import { DISTRICTS } from './districts';
import type { District } from './districts';
import type { PetStatus, PetType } from './types';
const EVENT = 'mur:listing-filters';
function subscribe(callback: () => void) {
  window.addEventListener('popstate', callback);
  window.addEventListener(EVENT, callback);
  return () => { window.removeEventListener('popstate', callback); window.removeEventListener(EVENT, callback); };
}
export function parseListingFilters(query: string) {
  const params = new URLSearchParams(query);
  const status = params.get('status') ?? '';
  const type = params.get('type') ?? '';
  const district = params.get('district') ?? '';
  return {
    status: (['lost', 'found'].includes(status) ? status : '') as PetStatus | '',
    type: (['Нохой', 'Муур', 'Бусад'].includes(type) ? type : '') as PetType | '',
    district: (DISTRICTS.includes(district as District) ? district : '') as District | '',
    search: (params.get('q') ?? '').slice(0, 100),
  };
}
export function useListingFilters() {
  const query = useSyncExternalStore(subscribe, () => window.location.search, () => '');
  function update(key: string, value: string) {
    const params = new URLSearchParams(window.location.search);
    if (value) params.set(key, value); else params.delete(key);
    const search = params.toString();
    window.history.replaceState(window.history.state, '', `${window.location.pathname}${search ? '?' + search : ''}`);
    window.dispatchEvent(new Event(EVENT));
  }
  return { ...parseListingFilters(query), query,
    setStatus: (value: string) => update('status', value),
    setType: (value: string) => update('type', value),
    setDistrict: (value: string) => update('district', value),
    setSearch: (value: string) => update('q', value.slice(0, 100)),
  };
}
