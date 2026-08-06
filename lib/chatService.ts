// lib/chatService.ts
// Чат харилцаа, мессежүүдийг Supabase-д бичих, унших, Realtime хүлээн авах функцууд
import { supabase } from './supabase';
import type { Conversation, Message, ConversationPreview, ConversationPetSummary } from './types';

// ─── Маппинг ────────────────────────────────────────────────────────────────

interface ConversationRow {
  id: string;
  pet_id: string;
  initiator_id: string;
  owner_id: string;
  initiator_email: string;
  owner_email: string;
  created_at: string;
  pets?: {
    id: string;
    name: string | null;
    type: string;
    status: string;
    photo_url: string | null;
    resolved: boolean;
  } | null;
}

export function mapConversationRow(row: ConversationRow): Conversation {
  return {
    id: row.id,
    petId: row.pet_id,
    initiatorId: row.initiator_id,
    ownerId: row.owner_id,
    initiatorEmail: row.initiator_email,
    ownerEmail: row.owner_email,
    createdAt: row.created_at,
  };
}

function mapPetSummary(pet: NonNullable<ConversationRow['pets']>): ConversationPetSummary {
  return {
    id: pet.id,
    name: pet.name ?? '',
    type: pet.type as ConversationPetSummary['type'],
    status: pet.status as ConversationPetSummary['status'],
    photoURL: pet.photo_url,
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
  return conv.initiatorId === currentUserId ? conv.ownerEmail : conv.initiatorEmail;
}

// ─── CRUD ────────────────────────────────────────────────────────────────────

/**
 * Амьтны эзэнтэй харилцаа үүсгэх эсвэл байгааг нь буцаах
 */
export async function findOrCreateConversation(petId: string): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Нэвтэрнэ үү');

  // Аль хэдийн байгаа эсэхийг шалгах
  const { data: existing } = await supabase
    .from('conversations')
    .select('id')
    .eq('pet_id', petId)
    .eq('initiator_id', user.id)
    .maybeSingle();

  if (existing) return existing.id;

  // Амьтны эзэнийг олох
  const { data: pet, error: petErr } = await supabase
    .from('pets')
    .select('created_by')
    .eq('id', petId)
    .single();

  if (petErr || !pet?.created_by) throw new Error('Амьтны мэдээлэл олдсонгүй');
  if (pet.created_by === user.id) throw new Error('Өөрийнхөө амьтанд чат үүсгэх боломжгүй');

  // Шинэ харилцаа үүсгэх (имэйл нь trigger-аар нөхөгдөнө)
  const { data: conv, error: convErr } = await supabase
    .from('conversations')
    .insert({
      pet_id: petId,
      initiator_id: user.id,
      owner_id: pet.created_by,
    })
    .select('id')
    .single();

  if (convErr) {
    // Unique constraint зөрсөн бол (race condition) — дахин шалгах
    if (convErr.code === '23505') {
      const { data: retry } = await supabase
        .from('conversations')
        .select('id')
        .eq('pet_id', petId)
        .eq('initiator_id', user.id)
        .maybeSingle();
      if (retry) return retry.id;
    }
    throw convErr;
  }

  return conv.id;
}

/**
 * Харилцааг дэлгэрэнгүй татах (нэмэлт pet мэдээлэлтэй)
 */
export async function fetchConversationById(id: string): Promise<Conversation | null> {
  const { data, error } = await supabase
    .from('conversations')
    .select('*, pets(id, name, type, status, photo_url, resolved)')
    .eq('id', id)
    .maybeSingle();

  if (error || !data) return null;
  const conv = mapConversationRow(data);
  return {
    ...conv,
    pet: data.pets ? mapPetSummary(data.pets) : null,
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

  if (error) throw error;
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
export async function fetchConversationList(): Promise<ConversationPreview[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  // Харилцуудыг татах
  const { data: convs, error: convErr } = await supabase
    .from('conversations')
    .select('*, pets(id, name, type, status, photo_url, resolved)')
    .or(`initiator_id.eq.${user.id},owner_id.eq.${user.id}`)
    .order('created_at', { ascending: false });

  if (convErr || !convs) return [];

  if (convs.length === 0) return [];

  // Сүүлийн мессежүүдийг татах
  const convIds = convs.map((c) => c.id);
  const { data: msgs } = await supabase
    .from('messages')
    .select('*')
    .in('conversation_id', convIds)
    .order('created_at', { ascending: false });

  // Харилцаа бүрийн хувьд сүүлийн мессежийг олох
  const lastMsgMap = new Map<string, MessageRow>();
  if (msgs) {
    for (const m of msgs) {
      if (!lastMsgMap.has(m.conversation_id)) {
        lastMsgMap.set(m.conversation_id, m);
      }
    }
  }

  return convs.map((row) => ({
    ...mapConversationRow(row),
    pet: row.pets ? mapPetSummary(row.pets) : null,
    lastMessage: lastMsgMap.get(row.id) ? mapMessageRow(lastMsgMap.get(row.id)!) : null,
  }));
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
