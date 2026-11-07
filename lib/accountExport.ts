import type { SupabaseClient, User } from '@supabase/supabase-js';
import { fetchServerPhotoRecords } from './serverPhotoRepository';
import { readKeysetPages, type ExportRow } from './serverPagination';

type OwnedTable = { table: string; columns?: string; owner?: string; participants?: string[]; key?: string };
const ownedTables: Record<string, OwnedTable> = {
  pets: { table: 'pets', columns: 'id,status,name,type,breed,color,place,district,resolved,created_at', owner: 'created_by' },
  adoptions: { table: 'adoptions', columns: 'id,name,type,age,gender,breed,description,district,place,created_at', owner: 'created_by' },
  sittingListings: { table: 'sitting_listings', columns: 'id,pet_type,description,district,place,experience,availability,available_from,is_beginner,price,created_at' },
  myPets: { table: 'my_pets' },
  appointments: { table: 'appointments' },
  adoptionApplications: { table: 'adoption_applications', participants: ['applicant_id', 'owner_id'] },
  sittingBookings: { table: 'sitting_bookings', participants: ['customer_id', 'sitter_id'] },
  sittingReviews: { table: 'sitting_reviews', participants: ['reviewer_id', 'sitter_id'] },
  notifications: { table: 'notifications' },
  sightings: { table: 'sightings', columns: 'id,pet_id,message,place,lat,lng,sighted_at,photo_path,created_at', owner: 'reporter_id' },
  reports: { table: 'reports', columns: 'id,pet_id,reason,status,created_at', owner: 'reporter_id' },
  pushSubscriptions: { table: 'push_subscriptions', columns: 'id,district,endpoint,created_at' },
  petFavorites: { table: 'pet_favorites', columns: 'pet_id,created_at', key: 'pet_id' },
  savedSearches: { table: 'saved_searches' },
  conversations: { table: 'conversations', participants: ['initiator_id', 'owner_id'] },
};

/** The caller supplies only a server-verified user, never an ID from the request. */
export function accountExportPages(admin: SupabaseClient, userId: string, signal: AbortSignal) {
  const owned = (definition: OwnedTable, size = 100) => readKeysetPages((after, limit) => {
    const key = definition.key ?? 'id';
    let query = admin.from(definition.table).select(definition.columns ?? '*');
    query = definition.participants
      ? query.or(definition.participants.map(column => `${column}.eq.${userId}`).join(','))
      : query.eq(definition.owner ?? 'user_id', userId);
    query = query.order(key, { ascending: true }).limit(limit).abortSignal(signal);
    return (after ? query.gt(key, after) : query).overrideTypes<ExportRow[], { merge: false }>();
  }, definition.key, size);

  async function* photos(kind: 'pet' | 'adoption') {
    // Unique positions 0..3 guarantee <=80 child rows per 20-parent batch.
    const definition = { ...ownedTables[kind === 'pet' ? 'pets' : 'adoptions'], columns: 'id' };
    for await (const parents of owned(definition, 20)) {
      signal.throwIfAborted();
      yield await fetchServerPhotoRecords(admin, kind, parents.map(row => String(row.id)));
    }
  }
  async function* messages() {
    // Page the parent IDs too, rather than building an unbounded IN filter.
    for await (const conversations of owned({ ...ownedTables.conversations, columns: 'id' })) {
      const ids = conversations.map(row => String(row.id));
      yield* readKeysetPages((after, size) => {
        let query = admin.from('messages').select('*').in('conversation_id', ids).order('id', { ascending: true }).limit(size).abortSignal(signal);
        if (after) query = query.gt('id', after);
        return query;
      });
    }
  }
  return {
    ...Object.fromEntries(Object.entries(ownedTables).map(([name, definition]) => [name, owned(definition)])),
    petPhotos: photos('pet'), adoptionPhotos: photos('adoption'), messages: messages(),
  };
}

/** JSON chunks are produced on demand; only a single bounded DB page is retained. */
export async function* encodeAccountExport(user: User, profile: unknown, pages: Record<string, AsyncIterable<ExportRow[]>>) {
  yield JSON.stringify({ exportedAt: new Date().toISOString(), account: { id: user.id, email: user.email, createdAt: user.created_at }, profile }).slice(0, -1);
  for (const [name, rows] of Object.entries(pages)) {
    yield `,${JSON.stringify(name)}:[`;
    let first = true;
    for await (const page of rows) {
      if (!page.length) continue;
      yield (first ? '' : ',') + JSON.stringify(page).slice(1, -1);
      first = false;
    }
    yield ']';
  }
  yield '}';
}
