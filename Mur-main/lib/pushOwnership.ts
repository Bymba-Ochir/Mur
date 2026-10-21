export function canUpdatePushSubscription(
  existing: { user_id: string | null; keys: unknown },
  userId: string | null,
  keys: { p256dh?: unknown; auth?: unknown },
): boolean {
  if (existing.user_id && existing.user_id !== userId) return false;
  const previous = existing.keys as { p256dh?: unknown; auth?: unknown } | null;
  return typeof keys.p256dh === 'string' && keys.p256dh.length > 0 &&
    typeof keys.auth === 'string' && keys.auth.length > 0 &&
    previous?.p256dh === keys.p256dh && previous?.auth === keys.auth;
}
