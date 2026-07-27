// lib/push.js
// Nearby Alert — тухайн дүүрэгт шинэ алдсан/олдсон амьтан бүртгэгдэхэд push
// мэдэгдэл авах. Browser Push API + Supabase (subscription хадгалах) ашиглана.
'use client';
import { supabase } from './supabase';

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export function isPushSupported() {
  return typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window;
}

/**
 * Тухайн дүүргийн шинэ мэдэгдэлд бүртгүүлнэ (Nearby Alert).
 * @param {string} district
 */
export async function subscribeToNearbyAlerts(district) {
  return subscribePush({ district });
}

/**
 * Өөрийн бүртгэлтэй амьтдын вакцины сануулгад бүртгүүлнэ (нэвтэрсэн байх ёстой).
 */
export async function subscribeToVaccineReminders() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Эхлээд нэвтэрнэ үү');
  return subscribePush({ userId: user.id });
}

async function subscribePush({ district, userId }) {
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
  const { error } = await supabase.from('push_subscriptions').insert({
    district: district || null,
    user_id: userId || null,
    endpoint: json.endpoint,
    keys: json.keys,
  });
  if (error && !error.message.includes('duplicate')) throw error;
}

export async function isSubscribed() {
  if (!isPushSupported()) return false;
  const registration = await navigator.serviceWorker.getRegistration('/sw.js');
  if (!registration) return false;
  const sub = await registration.pushManager.getSubscription();
  return !!sub;
}
