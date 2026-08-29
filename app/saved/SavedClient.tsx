'use client';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../lib/useAuth';
import { deleteSavedSearch, fetchFavorites, fetchSavedSearches } from '../../lib/listingService';
import type { SavedSearch } from '../../lib/listingService';
import type { Pet } from '../../lib/types';
import { getErrorMessage } from '../../lib/utils';
import PetCard from '../../components/PetCard';
import Button from '../../components/ui/Button';
import Icon from '../../components/ui/icons';
import { useToast } from '../../components/Toast';

const date = new Intl.DateTimeFormat('mn-MN', { dateStyle: 'medium' });

export default function SavedClient() {
  const { user, loading: authLoading } = useAuth();
  const showToast = useToast();
  const [favorites, setFavorites] = useState<Pet[]>([]);
  const [searches, setSearches] = useState<SavedSearch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true); setError('');
    try {
      const [savedPets, savedSearches] = await Promise.all([fetchFavorites(), fetchSavedSearches()]);
      setFavorites(savedPets); setSearches(savedSearches);
    } catch (reason) { setError(getErrorMessage(reason)); }
    finally { setLoading(false); }
  }, [user]);

  useEffect(() => { void Promise.resolve().then(load); }, [load]);

  async function removeSearch(id: string) {
    try {
      await deleteSavedSearch(id);
      setSearches((items) => items.filter((item) => item.id !== id));
      showToast('Хадгалсан хайлтыг устгалаа.', 'success');
    } catch (reason) { showToast(getErrorMessage(reason), 'error'); }
  }

  if (authLoading) return <p className="page-shell">Уншиж байна...</p>;
  if (!user) return <main className="page-shell page-shell--narrow"><h1>Хадгалсан</h1><p>Хадгалсан зар, хайлтаа харахын тулд эхлээд нэвтэрнэ үү.</p></main>;

  return <main className="page-shell saved-page">
    <div className="page-header"><div className="eyebrow">Account</div><h1>Хадгалсан</h1><p>Сонирхсон зар болон шинэ зарын мэдэгдэл авах хайлтууд.</p></div>
    {error && <div className="error-state" role="alert"><p>{error}</p><Button variant="secondary" onClick={load}>Дахин оролдох</Button></div>}
    {loading ? <p>Хадгалсан мэдээлэл ачаалж байна...</p> : <>
      <section className="saved-section" aria-labelledby="favorite-title">
        <div className="section-heading"><div><h2 id="favorite-title"><Icon name="heart" size={21} /> Хадгалсан зар</h2><p>{favorites.length} зар</p></div><Link href="/listings">Заруудаас хайх</Link></div>
        {favorites.length ? <div className="grid">{favorites.map((pet) => <PetCard key={pet.id} pet={pet} />)}</div> : <div className="card empty"><Icon name="heart" size={28} /><h3>Хадгалсан зар алга</h3><p>Зарын дэлгэрэнгүйгээс “Хадгалах” товч дарж энд цуглуулна.</p></div>}
      </section>
      <section className="saved-section" aria-labelledby="search-title">
        <div className="section-heading"><div><h2 id="search-title"><Icon name="search" size={21} /> Хадгалсан хайлт</h2><p>Тохирох шинэ зар гарахад Мэдэгдэл хэсэгт ирнэ.</p></div><Link href="/listings">Шинэ хайлт</Link></div>
        {searches.length ? <div className="search-list">{searches.map((item) => <article className="card search-item" key={item.id}><div><strong>{item.name}</strong><small>{date.format(new Date(item.createdAt))} · {item.notify ? 'Мэдэгдэл идэвхтэй' : 'Мэдэгдэл унтраалттай'}</small></div><Button variant="ghost" onClick={() => void removeSearch(item.id)} aria-label={`${item.name} хайлтыг устгах`}><Icon name="trash" size={16} /> Устгах</Button></article>)}</div> : <div className="card empty"><Icon name="search" size={28} /><h3>Хадгалсан хайлт алга</h3><p>Жагсаалтын шүүлтүүрээ сонгоод “Хайлтыг хадгалах” товчийг дарна.</p></div>}
      </section>
    </>}
    <style jsx>{`.saved-page{padding-bottom:var(--sp-8)}.saved-section{margin-top:var(--sp-6)}.section-heading{display:flex;align-items:end;justify-content:space-between;gap:16px;margin-bottom:var(--sp-3)}.section-heading h2{display:flex;align-items:center;gap:8px;font-size:20px}.section-heading p,.search-item small,.empty p{color:var(--muted)}.section-heading a{color:var(--primary);font-weight:650;text-decoration:none}.search-list{display:grid;gap:10px}.search-item{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:16px}.search-item>div{display:grid;gap:5px}.empty{display:grid;justify-items:center;gap:8px;text-align:center;padding:32px}.error-state{display:grid;justify-items:start;gap:12px;padding:16px;border:1px solid var(--alert);border-radius:var(--r-md)}@media(max-width:600px){.section-heading{align-items:start;flex-direction:column}.search-item{align-items:start;flex-direction:column}}`}</style>
  </main>;
}
