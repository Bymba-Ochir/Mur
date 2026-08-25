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
    <h2 className="mb-3">Шинэ тохирол</h2>
    <div className="mb-7 grid gap-2">
      {notifications.length ? notifications.map((item) => <Link
        href={`/pets/${item.petId}`}
        key={item.id}
        onClick={() => { void markListingNotificationRead(item.id); setNotifications((all) => all.map((n) => n.id === item.id ? { ...n, read: true } : n)); }}
                  className={`card p-3.5 text-inherit ${item.read ? 'opacity-[0.68]' : 'opacity-100'}`}
      >{item.read ? '✓' : '●'} {item.title}</Link>) : <p className="text-[var(--muted)]">Одоогоор шинэ тохирол алга.</p>}
    </div>
    <h2 className="mb-3">Хадгалсан хайлт</h2>
    <div className="mb-7 flex flex-wrap gap-2">
      {searches.length ? searches.map((search) => <div className="card flex items-center gap-2.5 p-3" key={search.id}><span>{search.name}{search.notify ? ' · 🔔' : ''}</span><Button variant="ghost" onClick={async () => { await deleteSavedSearch(search.id); setSearches((all) => all.filter((item) => item.id !== search.id)); }}>Устгах</Button></div>) : <p className="text-[var(--muted)]">Хадгалсан хайлт алга.</p>}
    </div>
    <h2 className="mb-3">Хадгалсан зар</h2>
    {pets.length ? <div className="listing-grid">{pets.map((pet) => <PetCard key={pet.id} pet={pet} />)}</div> : <p className="text-[var(--muted)]">Хадгалсан зар алга.</p>}
  </div>;
}
