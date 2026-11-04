import { supabase } from './supabase';
import { requireMongolianPhone } from './inputValidation';

export type ContactListingKind = 'pet' | 'adoption' | 'sitting';
export interface ContactListing { kind: ContactListingKind; id: string; ownerId: string | null; }

/** An optional hidden number is kept only by the database's private contact trigger. */
export function listingPhone(phone: string, hidden = false): string {
  return hidden && !/^(?:976)?[0-9]{8}$/.test(phone.replace(/\D/g, '')) ? '' : requireMongolianPhone(phone);
}

/** Only call when the owner opens edit; public reads never load private contacts. */
export async function getOwnListingPhone(kind: ContactListingKind, id: string): Promise<string> {
  const { data, error } = await supabase.rpc('get_own_listing_phone', { target_kind: kind, target_id: id });
  if (error) throw error;
  return data ?? '';
}
