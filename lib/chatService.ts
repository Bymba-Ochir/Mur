// lib/chatService.ts
// Чат харилцаа, мессежүүдийг Supabase-д бичих, унших, Realtime хүлээн авах функцууд
import { supabase } from './supabase';
import type { Conversation, Message, ConversationPreview, ConversationPetSummary } from './types';
import { hydrateListingPhotos } from './photoRepository';
import { COMPACT_PAGE_SIZE, finalizePage } from './pagination';
import type { ContactListingKind } from './listingContact';

// ─── Маппинг ────────────────────────────────────────────────────────────────

interface ConversationRow {
  id: string;
  pet_id: string | null;
  adoption_id?: string | null;
  sitting_id?: string | null;
  initiator_id: string;
  owner_id: string;
  created_at: string;
  pets?: {
    id: string;
    name: string | null;
    type: string;
    status: string;
    photo_url?: string | null;
    resolved: boolean;
  } | null;
}

export function mapConversationRow(row: ConversationRow): Conversation {
  return {
    id: row.id,
    petId: row.pet_id,
    adoptionId: row.adoption_id ?? null,
    sittingId: row.sitting_id ?? null,
    initiatorId: row.initiator_id,
    ownerId: row.owner_id,
    initiatorName: 'МӨР хэрэглэгч',
    ownerName: 'МӨР хэрэглэгч',
    createdAt: row.created_at,
  };
}

function mapPetSummary(pet: NonNullable<ConversationRow['pets']>): ConversationPetSummary {
  return {
    id: pet.id,
    name: pet.name ?? '',
    type: pet.type as ConversationPetSummary['type'],
    status: pet.status as ConversationPetSummary['status'],
    photoURL: pet.photo_url ?? null,
    resolved: pet.resolved ?? false,
  };
}

interface MessageRow {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  read_at: string | null;
  created_at: string;
}

export function mapMessageRow(row: MessageRow): Message {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    senderId: row.sender_id,
    content: row.content,
    readAt: row.read_at,
    createdAt: row.created_at,
  };
}

/** Хоёр оролцогчийн нэрийг буцаана (өөрийгөө биш) */
export function otherParticipant(conv: Conversation, currentUserId: string): string {
  return conv.initiatorId === currentUserId ? conv.ownerName : conv.initiatorName;
}

async function fetchParticipantNames(userIds: string[]): Promise<Map<string, string>> {
  const ids = [...new Set(userIds.filter(Boolean))];
  if (!ids.length) return new Map();
  const { data, error } = await supabase.from('profiles').select('id,display_name').in('id', ids);
  if (error) throw error;
  return new Map((data ?? []).map((row) => [row.id, row.display_name || 'МӨР хэрэглэгч']));
}

function withParticipantNames(row: ConversationRow, names: Map<string, string>): Conversation {
  return {
    ...mapConversationRow(row),
    initiatorName: names.get(row.initiator_id) || 'МӨР хэрэглэгч',
    ownerName: names.get(row.owner_id) || 'МӨР хэрэглэгч',
  };
}

// ─── CRUD ────────────────────────────────────────────────────────────────────

/**
 * Амьтны эзэнтэй харилцаа үүсгэх эсвэл байгааг нь буцаах
 */
export async function findOrCreateListingConversation(kind: ContactListingKind, listingId: string): Promise<string> {
  const { data, error } = await supabase.rpc('start_listing_conversation', { target_kind: kind, target_id: listingId });
  if (error) {
    if (error.message?.includes('SELF_CHAT')) throw new Error('Өөрийнхөө зарт чат үүсгэх боломжгүй.');
    if (error.message?.includes('INTERACTION_DENIED') || error.code === '42501') throw new Error('Хэрэглэгчийн харилцах тохиргооноос шалтгаалан чат эхлүүлэх боломжгүй.');
    if (error.message?.includes('CHAT_RATE_LIMIT')) throw new Error('Хэт олон шинэ чат эхлүүллээ. Нэг цагийн дараа дахин оролдоно уу.');
    throw error;
  }
  if (!data) throw new Error('Чат эхлүүлж чадсангүй. Дахин оролдоно уу.');
  return data;
}

export async function findOrCreateConversation(petId: string): Promise<string> {
  return findOrCreateListingConversation('pet', petId);
}

/**
 * Харилцааг дэлгэрэнгүй татах (нэмэлт pet мэдээлэлтэй)
 */
export async function fetchConversationById(id: string): Promise<Conversation | null> {
  const { data, error } = await supabase
    .from('conversations')
    .select('*, pets(id, name, type, status, resolved)')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  const names = await fetchParticipantNames([data.initiator_id, data.owner_id]);
  const conv = withParticipantNames(data, names);
  const hydratedPets = data.pets ? await hydrateListingPhotos('pet', [data.pets]) : [];
  return {
    ...conv,
    pet: hydratedPets[0] ? mapPetSummary(hydratedPets[0]) : null,
  };
}

/**
 * Харилцааны мессежүүдийг татах
 */
export async function fetchMessages(conversationId: string): Promise<Message[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (error) {
    if (error.code === '42501') throw new Error('Хэрэглэгчийн харилцах тохиргооноос шалтгаалан мессеж илгээх боломжгүй.');
    throw error;
  }
  return (data as MessageRow[]).map(mapMessageRow);
}

/**
 * Мессеж илгээх
 */
export async function sendMessage(conversationId: string, content: string): Promise<Message> {
  const trimmed = content.trim();
  if (!trimmed) throw new Error('Мессеж хоосон байна');

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Нэвтэрнэ үү');

  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_id: user.id,
      content: trimmed,
    })
    .select()
    .single();

  if (error) throw error;
  return mapMessageRow(data as MessageRow);
}

/**
 * Хэрэглэгчийн харилцааны жагсаалт (сүүлийн мессежтэй)
 */
export async function fetchConversationPage(before?: Pick<Conversation, 'id' | 'createdAt'>) {
  const { data, error } = await supabase.rpc('list_conversation_page', {
    before_created_at: before?.createdAt ?? null, before_id: before?.id ?? null,
  });
  if (error) throw error;
  const page = finalizePage(data as Array<{ conversation: ConversationRow; pet: ConversationRow['pets']; last_message: MessageRow | null; unread_count: number }> | null, 0, COMPACT_PAGE_SIZE);
  const rows = page.items.map(row => ({ ...row.conversation, pets: row.pet }));
  const names = await fetchParticipantNames(rows.flatMap(row => [row.initiator_id, row.owner_id]));
  const hydrated = await hydrateListingPhotos('pet', rows.flatMap(row => row.pets ? [row.pets] : []));
  const petById = new Map(hydrated.map(pet => [pet.id, pet]));
  return { ...page, items: rows.map((row, index): ConversationPreview => ({
    ...withParticipantNames(row, names),
    pet: row.pets ? mapPetSummary(petById.get(row.pets.id) ?? row.pets) : null,
    lastMessage: page.items[index].last_message ? mapMessageRow(page.items[index].last_message!) : null,
    unreadCount: Number(page.items[index].unread_count),
  })) };
}

export async function fetchConversationList(): Promise<ConversationPreview[]> {
  return (await fetchConversationPage()).items;
}

export async function markConversationRead(conversationId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  const now = new Date().toISOString();
  const { error } = await supabase.from('messages').update({ read_at: now }).eq('conversation_id', conversationId).neq('sender_id', user.id).is('read_at', null);
  if (error) throw error;
  await supabase.from('notifications').update({ read_at: now }).eq('href', `/messages/${conversationId}`).is('read_at', null);
}

/**
 * Realtime мессеж хүлээн авах (INSERT events)
 * Буцаах утга: цэвэрлэх функц (unsubscribe)
 */
export function subscribeToMessages(
  conversationId: string,
  onInsert: (msg: Message) => void,
): () => void {
  const channel = supabase
    .channel(`messages:${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => {
        onInsert(mapMessageRow(payload.new as MessageRow));
      },
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
