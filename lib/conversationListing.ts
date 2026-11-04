import type { Conversation } from './types';

export function conversationListingHref(conversation: Conversation): string | null {
  if (conversation.adoptionId) return `/adoptions/${conversation.adoptionId}`;
  if (conversation.sittingId) return `/sitting/${conversation.sittingId}`;
  return conversation.pet ? `/pets/${conversation.petId}` : null;
}
