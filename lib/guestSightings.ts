export const GUEST_SIGHTING_CHALLENGE = 'guest_sighting';

export type GuestSightingAction = 'view' | 'useful' | 'publish' | 'hide';

export interface GuestSightingSummary {
  id: string;
  state: 'pending' | 'published' | 'hidden';
  created_at: string;
  first_viewed_at: string | null;
  useful_at: string | null;
}

export interface GuestSightingDetails extends GuestSightingSummary {
  message: string;
  place: string | null;
  lat: number | null;
  lng: number | null;
  sighted_at: string | null;
}
