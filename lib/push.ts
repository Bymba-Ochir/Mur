// lib/push.ts
// Nearby Alert — тухайн дүүрэгт шинэ алдсан/олдсон амьтан бүртгэгдэхэд push
// мэдэгдэл авах. Browser Push API + Supabase (subscription хадгалах) ашиглана.
'use client';
import { supabase } from './supabase';
import type { District } from './districts';

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
export const PUSH_SUBSCRIPTION_EVENT = 'mur:push-subscription-changed';

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const bytes = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    bytes[i] = rawData.charCodeAt(i);
  }
  return bytes;
}

export function isPushSupported(): boolean {
  return typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

/**
 * Тухайн дүүргийн шинэ мэдэгдэлд бүртгүүлнэ (Nearby Alert).
 */
export async function subscribeToNearbyAlerts(district: District): Promise<void> {
  return subscribePush({ district });
}

/**
 * Өөрийн бүртгэлтэй амьтдын вакцины сануулгад бүртгүүлнэ (нэвтэрсэн байх ёстой).
 */
export async function subscribeToVaccineReminders(): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Эхлээд нэвтэрнэ үү');
  return subscribePush({ userId: user.id });
}

async function subscribePush({ district, userId }: { district?: District | null; userId?: string | null }): Promise<void> {
  if (!isPushSupported()) throw new Error('Энэ browser push мэдэгдэл дэмждэггүй');
  if (!VAPID_PUBLIC_KEY) throw new Error('VAPID түлхүүр тохируулагдаагүй байна');

  const registration = await navigator.serviceWorker.register('/sw.js');
  await navigator.serviceWorker.ready;

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') throw new Error('Мэдэгдлийн зөвшөөрөл өгөгдөөгүй');

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
  });

  const json = subscription.toJSON();
  const { data: { session } } = await supabase.auth.getSession();
  const response = await fetch('/api/push-subscriptions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}) },
    body: JSON.stringify({ endpoint: json.endpoint, keys: json.keys, district: district || null, vaccine: Boolean(userId) }),
  });
  if (!response.ok) { const payload = await response.json().catch(() => null) as { error?: string } | null; throw new Error(payload?.error || 'Push бүртгэл хадгалахад алдаа гарлаа.'); }
  window.dispatchEvent(new Event(PUSH_SUBSCRIPTION_EVENT));
}

interface PushStatus { subscribed: boolean; vaccine: boolean; }

async function readPushStatus(district?: District): Promise<PushStatus> {
  const inactive = { subscribed: false, vaccine: false };
  if (!isPushSupported() || Notification.permission !== 'granted') return inactive;
  const registration = await navigator.serviceWorker.getRegistration('/sw.js');
  const subscription = await registration?.pushManager.getSubscription();
  if (!subscription) return inactive;
  const identity = subscription.toJSON();
  const { data: { session } } = await supabase.auth.getSession();
  const response = await fetch('/api/push-subscriptions/status', {
    method: 'POST', cache: 'no-store',
    headers: { 'Content-Type': 'application/json', ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}) },
    body: JSON.stringify({ endpoint: identity.endpoint, keys: identity.keys, ...(district ? { district } : {}) }),
  });
  if (!response.ok) throw new Error('Push status unavailable');
  const result = await response.json() as Partial<PushStatus>;
  if (typeof result.subscribed !== 'boolean' || typeof result.vaccine !== 'boolean') throw new Error('Invalid push status');
  return { subscribed: result.subscribed, vaccine: result.vaccine };
}

export async function isSubscribed(district: District): Promise<boolean> {
  return (await readPushStatus(district)).subscribed;
}

export async function isVaccineSubscribed(): Promise<boolean> {
  return (await readPushStatus()).vaccine;
}
