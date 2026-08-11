'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '../../lib/useAuth';
import Link from 'next/link';
import { deleteSavedSearch, fetchFavorites, fetchListingNotifications, fetchSavedSearches, markListingNotificationRead } from '../../lib/listingService';
import type { ListingNotification, SavedSearch } from '../../lib/listingService';
import type { Pet } from '../../lib/types';
import PetCard from '../../components/PetCard';
import Button from '../../components/ui/Button';

export default function SavedPage() {
  const { user, loading } = useAuth();
  const [pets, setPets] = useState<Pet[]>([]);
  const [searches, setSearches] = useState<SavedSearch[]>([]);
  const [notifications, setNotifications] = useState<ListingNotification[]>([]);
  useEffect(() => {
    if (!user) return;
    Promise.all([fetchFavorites(), fetchSavedSearches(), fetchListingNotifications()])
      .then(([p, s, n]) => { setPets(p); setSearches(s); setNotifications(n); });
  }, [user]);
  if (loading) return <p>Ачаалж байна...</p>;
  if (!user) return <p>Хадгалсан зүйлсээ харахын тулд нэвтэрнэ үү.</p>;
  return <div>
    <div className="page-header"><div className="eyebrow">Миний сан</div><h1>Хадгалсан зүйлс</h1></div>
    <h2 style={{ marginBottom: 12 }}>Шинэ тохирол</h2>
    <div style={{ display: 'grid', gap: 8, marginBottom: 28 }}>
      {notifications.length ? notifications.map((item) => <Link
        className="card"
        href={`/pets/${item.petId}`}
        key={item.id}
        onClick={() => { void markListingNotificationRead(item.id); setNotifications((all) => all.map((n) => n.id === item.id ? { ...n, read: true } : n)); }}
        style={{ padding: 14, color: 'inherit', opacity: item.read ? .68 : 1 }}
      >{item.read ? '✓' : '●'} {item.title}</Link>) : <p style={{ color: 'var(--muted)' }}>Одоогоор шинэ тохирол алга.</p>}
    </div>
    <h2 style={{ marginBottom: 12 }}>Хадгалсан хайлт</h2>
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 28 }}>
      {searches.length ? searches.map((search) => <div className="card" key={search.id} style={{ padding: 12, display: 'flex', alignItems: 'center', gap: 10 }}><span>{search.name}{search.notify ? ' · 🔔' : ''}</span><Button variant="ghost" onClick={async () => { await deleteSavedSearch(search.id); setSearches((all) => all.filter((item) => item.id !== search.id)); }}>Устгах</Button></div>) : <p style={{ color: 'var(--muted)' }}>Хадгалсан хайлт алга.</p>}
    </div>
    <h2 style={{ marginBottom: 12 }}>Хадгалсан зар</h2>
    {pets.length ? <div className="grid">{pets.map((pet) => <PetCard key={pet.id} pet={pet} />)}</div> : <p style={{ color: 'var(--muted)' }}>Хадгалсан зар алга.</p>}
  </div>;
}
