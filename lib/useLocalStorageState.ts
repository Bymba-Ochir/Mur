'use client';

import { useCallback, useSyncExternalStore } from 'react';

// localStorage-тай синхрончлогдсон reactive state — useSyncExternalStore суурилсан.
//
// Яагаад: useEffect-д `setState(localStorage.getItem(...))` хийх загвар нь
// React 19-ийн `react-hooks/set-state-in-effect` дүрэмд эвдэрдэг, мөн SSR
// hydration-ын дараа давхар render үүсгэдэг. Энэ hook нь:
//  - `getServerSnapshot()` → server/initial hydrate-д `serverValue` буцаана
//    (hydration mismatch ба анивчилтгүй),
//  - mount-ын дараа бодит localStorage утгаар автоматаар sync болно.
//
// Өөр tab-д localStorage өөрчлөгдөхөд (`storage` event) ч шинэчлэгдэнэ.

const listeners = new Map<string, Set<() => void>>();

function subscribe(key: string, callback: () => void): () => void {
  let set = listeners.get(key);
  if (!set) {
    set = new Set();
    listeners.set(key, set);
  }
  set.add(callback);
  return () => {
    set.delete(callback);
  };
}

function read(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null; // приват горим / блоклосон storage — аюулгүй буцаана
  }
}

export function useLocalStorageValue(
  key: string,
  serverValue: string | null = null,
): string | null {
  const getSnapshot = useCallback(() => read(key), [key]);
  const getServerSnapshot = useCallback(() => serverValue, [serverValue]);
  return useSyncExternalStore(
    useCallback((cb) => subscribe(key, cb), [key]),
    getSnapshot,
    getServerSnapshot,
  );
}

export function setLocalStorageValue(key: string, value: string | null): void {
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
  } catch {
    /* приват горим — ignore */
  }
  listeners.get(key)?.forEach((cb) => cb());
}

// Өөр tab-ийн `storage` event-ийг өөрийн listener-тэй холбоно
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (!e.key) return;
    listeners.get(e.key)?.forEach((cb) => cb());
  });
}
