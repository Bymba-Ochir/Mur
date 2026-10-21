'use client';
import { useSyncExternalStore } from 'react';
import { DISTRICTS } from './districts';
import type { District } from './districts';
import type { AdoptionGender, PetStatus, PetType } from './types';
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
    gender: (['Эрэгтэй', 'Эмэгтэй', 'Тодорхойгүй'].includes(params.get('gender') ?? '') ? params.get('gender') : '') as AdoptionGender | '',
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
    setGender: (value: string) => update('gender', value),
    setStatus: (value: string) => update('status', value),
    setType: (value: string) => update('type', value),
    setDistrict: (value: string) => update('district', value),
    setSearch: (value: string) => update('q', value.slice(0, 100)),
  };
}

export function listingReturnPath(query: string, route: '/listings' | '/adoptions') {
  const candidate = new URLSearchParams(query).get('returnTo');
  if (!candidate || (candidate !== route && !candidate.startsWith(route + '?'))) return route;
  const parsed = parseListingFilters(candidate.slice(route.length));
  const params = new URLSearchParams();
  if (parsed.status && route === '/listings') params.set('status', parsed.status);
  if (parsed.type) params.set('type', parsed.type);
  if (parsed.district) params.set('district', parsed.district);
  if (parsed.gender && route === '/adoptions') params.set('gender', parsed.gender);
  if (parsed.search) params.set('q', parsed.search);
  return route + (params.size ? '?' + params.toString() : '');
}
export function useListingReturnPath(route: '/listings' | '/adoptions') {
  const query = useSyncExternalStore(subscribe, () => window.location.search, () => '');
  return listingReturnPath(query, route);
}
