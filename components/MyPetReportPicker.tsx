'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { fetchMyPetById, fetchMyPets } from '../lib/vaccineService';
import { useLanguage } from '../lib/i18n';
import type { MyPet } from '../lib/types';
import Button from './ui/Button';
import Icon from './ui/icons';

const PAGE_SIZE = 6;

export default function MyPetReportPicker({ onSelect }: { onSelect: (pet: MyPet) => void }) {
  const params = useSearchParams();
  const presetId = params.get('myPetId') || null;
  return <PetOptions key={presetId ?? 'all'} presetId={presetId} onSelect={onSelect} />;
}

function PetOptions({ presetId, onSelect }: { presetId: string | null; onSelect: (pet: MyPet) => void }) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(Boolean(presetId));
  const [mode, setMode] = useState<'preset' | 'list'>(presetId ? 'preset' : 'list');
  const [page, setPage] = useState(0);
  const [retry, setRetry] = useState(0);
  const [selected, setSelected] = useState<MyPet | null>(null);
  const [result, setResult] = useState<{ pets: MyPet[]; hasNext: boolean; error: boolean } | null>(null);

  useEffect(() => {
    if (!open) return;
    let active = true;
    const request = mode === 'preset' && presetId
      ? fetchMyPetById(presetId).then(pet => [pet])
      : fetchMyPets({ offset: page * PAGE_SIZE, limit: PAGE_SIZE + 1 });
    request.then(pets => {
      if (active) setResult({ pets: pets.slice(0, PAGE_SIZE), hasNext: pets.length > PAGE_SIZE, error: false });
    }).catch(() => {
      if (active) setResult({ pets: [], hasNext: false, error: true });
    });
    return () => { active = false; };
  }, [open, mode, presetId, page, retry]);

  function toggle() {
    setResult(null);
    if (open) setOpen(false);
    else { setMode('list'); setPage(0); setOpen(true); }
  }

  function changePage(next: number) {
    setResult(null);
    setPage(next);
  }

  return (
    <section className="my-pet-picker" aria-labelledby="my-pet-picker-title">
      <div className="picker-heading">
        <div>
          <h2 id="my-pet-picker-title">{t('form_mypet_title')}</h2>
          {selected && <p role="status"><Icon name="check" size={15} />{t('form_mypet_selected').replace('{name}', selected.name)}</p>}
        </div>
        <Button variant="ghost" size="sm" onClick={toggle} aria-expanded={open} aria-controls="my-pet-options">
          <Icon name="paw" size={16} />{open ? t('close') : t('form_mypet_choose')}
        </Button>
      </div>
      {open && <div id="my-pet-options">
        <p className="picker-hint">{t('form_mypet_hint')}</p>
        {!result ? <p role="status">{t('mypets_loading')}</p> : result.error ? <div role="alert">
          <p>{t('form_mypet_error')}</p>
          <Button variant="secondary" size="sm" onClick={() => { setResult(null); setRetry(value => value + 1); }}>{t('err_retry')}</Button>
        </div> : result.pets.length === 0 ? <p>{t('mypets_none')}</p> : <>
          <ul className="pet-options">
            {result.pets.map(pet => <li key={pet.id}>
              <button type="button" className="pet-option" aria-label={pet.name + ' — ' + t('form_mypet_use')} onClick={() => {
                onSelect(pet);
                setSelected(pet);
                setOpen(false);
                setResult(null);
              }}>
                <span className="option-icon"><Icon name="paw" size={19} /></span>
                <span className="option-copy"><strong>{pet.name}</strong><span>{pet.type === 'Нохой' ? t('type_dog') : pet.type === 'Муур' ? t('type_cat') : t('type_other')}{pet.breed ? ' · ' + pet.breed : ''}</span></span>
                <span className="option-use">{t('form_mypet_use')}<Icon name="arrowRight" size={17} /></span>
              </button>
            </li>)}
          </ul>
          {mode === 'list' && (page > 0 || result.hasNext) && <div className="picker-pages">
            <Button variant="ghost" size="sm" disabled={page === 0} onClick={() => changePage(page - 1)}>{t('form_mypet_previous')}</Button>
            <span>{page + 1}</span>
            <Button variant="ghost" size="sm" disabled={!result.hasNext} onClick={() => changePage(page + 1)}>{t('form_mypet_next')}</Button>
          </div>}
        </>}
        <Button as="link" href="/my-pets" variant="ghost" size="sm">{t('nav_mypets')}<Icon name="arrowRight" size={15} /></Button>
      </div>}
      <style jsx>{`
        .my-pet-picker{margin-bottom:20px;padding-bottom:16px;border-bottom:1px solid var(--border-subtle)}
        .picker-heading{display:flex;align-items:center;justify-content:space-between;gap:12px}
        h2{margin:0;font-size:var(--text-sm);color:var(--ink)}
        p{margin:8px 0;font-size:var(--text-xs);color:var(--text-secondary);line-height:1.5}
        .picker-heading p{display:flex;align-items:center;gap:6px;margin-bottom:0}
        .pet-options{display:grid;gap:8px;list-style:none;margin:12px 0;padding:0}
        .pet-option{display:flex;align-items:center;gap:10px;min-height:var(--touch-target);width:100%;padding:12px;text-align:left;color:var(--ink);background:var(--card);border:1px solid var(--line);border-radius:var(--r-sm);font:inherit;cursor:pointer}
        .pet-option:hover{background:var(--surface-3);border-color:var(--primary)}
        .pet-option:focus-visible{outline:2px solid var(--border-focus);outline-offset:2px}
        .option-icon{display:grid;place-items:center;flex-shrink:0;color:var(--primary)}
        .option-copy{display:flex;flex:1;min-width:0;flex-direction:column;overflow-wrap:anywhere}
        .option-use{display:flex;align-items:center;gap:4px;max-width:8rem;color:var(--primary);font-size:var(--text-xs);font-weight:600}
        .option-copy strong{font-size:var(--text-sm)}
        .option-copy>span{font-size:var(--text-xs);color:var(--muted)}
        .picker-pages{display:flex;align-items:center;justify-content:space-between;gap:8px;font-size:var(--text-xs)}
        [role="alert"] p{color:var(--alert)}
        @media(max-width:520px){.picker-heading{align-items:flex-start;flex-direction:column;gap:8px}}
      `}</style>
    </section>
  );
}
