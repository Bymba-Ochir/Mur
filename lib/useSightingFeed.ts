'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchSightingsPage, subscribeToSightings } from './sightingService';
import type { Sighting } from './types';
import { getErrorMessage } from './utils';

/** One paged feed drives both the sightings list and the listing's map. */
export function useSightingFeed(petId?: string) {
  const [sightings, setSightings] = useState<Sighting[]>([]);
  const [loadError, setLoadError] = useState('');

  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const cursor = useRef<Sighting | undefined>(undefined);
  const generation = useRef(0);
  const moreBusy = useRef(false);
  const mounted = useRef(false);

  const load = useCallback(async () => {
    if (!petId) return;
    const request = ++generation.current;
    try {
      const page = await fetchSightingsPage(petId);
      if (!mounted.current || request !== generation.current) return;
      cursor.current = page.items.at(-1);
      setSightings(page.items);
      setHasMore(page.hasMore);
      setLoadError('');
    } catch (reason) {
      if (mounted.current && request === generation.current) setLoadError(getErrorMessage(reason));
    }
  }, [petId]);

  useEffect(() => {
    if (!petId) return;
    mounted.current = true;
    let timeout: ReturnType<typeof setTimeout> | undefined;
    const refresh = () => {
      if (document.visibilityState === 'hidden' || timeout) return;
      timeout = setTimeout(() => { timeout = undefined; void load(); }, 200);
    };
    void Promise.resolve().then(load);
    const unsubscribe = subscribeToSightings(petId, refresh);
    const timer = setInterval(refresh, 30_000);
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      mounted.current = false;
      generation.current += 1;
      if (timeout) clearTimeout(timeout);
      clearInterval(timer);
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', refresh);
      unsubscribe();
    };
  }, [petId, load]);

  async function loadMore() {
    if (!petId || moreBusy.current || !cursor.current) return;
    const request = generation.current;
    moreBusy.current = true;
    setLoadingMore(true);
    try {
      const page = await fetchSightingsPage(petId, cursor.current);
      if (!mounted.current || request !== generation.current) return;
      cursor.current = page.items.at(-1);
      setSightings(current => [...current, ...page.items]);
      setHasMore(page.hasMore);
      setLoadError('');
    } catch (reason) {
      if (mounted.current && request === generation.current) setLoadError(getErrorMessage(reason));
    } finally {
      moreBusy.current = false;
      if (mounted.current) setLoadingMore(false);
    }
  }

  return { sightings, load, loadMore, loadError, hasMore, loadingMore };
}

export type SightingFeed = ReturnType<typeof useSightingFeed>;
