'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function VerificationBadge({ userId }: { userId?: string | null }) {
  const [labels, setLabels] = useState<string[]>([]);
  useEffect(() => { if (!userId) return; supabase.from('user_verifications').select('*').eq('user_id', userId).maybeSingle().then(({ data }) => { if (!data) return; setLabels([data.email_verified && 'Имэйл', data.phone_verified && 'Утас', data.volunteer_verified && 'Сайн дурын ажилтан', data.clinic_verified && 'Мал эмнэлэг'].filter(Boolean) as string[]); }); }, [userId]);
  if (!labels.length) return null;
  return <p style={{ color: 'var(--success)', fontSize: 12, fontWeight: 700, marginBottom: 8 }}>✓ Баталгаажсан: {labels.join(', ')}</p>;
}
