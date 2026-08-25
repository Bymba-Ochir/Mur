'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Search } from 'lucide-react';
import { useLanguage } from '../lib/i18n';
import { getBreedLabel, getPetBreeds } from '../lib/petBreeds';
import type { PetType } from '../lib/types';

export default function BreedSelect({
  id,
  name = 'breed',
  type,
  value,
  onChange,
  className,
}: {
  id: string;
  name?: string;
  type: PetType;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  const { lang, t } = useLanguage();
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const breeds = getPetBreeds(type);
  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    if (!normalized) return breeds;
    return breeds.filter((breed) =>
      breed.mn.toLocaleLowerCase().includes(normalized) ||
      breed.en.toLocaleLowerCase().includes(normalized)
    );
  }, [breeds, query]);

  useEffect(() => {
    if (!open) return;
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', closeOnOutsideClick);
    searchRef.current?.focus();
    return () => document.removeEventListener('mousedown', closeOnOutsideClick);
  }, [open]);

  function choose(nextValue: string) {
    onChange(nextValue);
    setOpen(false);
    setQuery('');
  }

  return (
    <div className={`relative w-full ${open ? 'z-35' : 'z-1'}`} ref={rootRef} onKeyDown={(event) => {
      if (event.key === 'Escape') { setOpen(false); setQuery(''); }
    }}>
      <input type="hidden" name={name} value={value} />
      <button
        id={id}
        type="button"
        className={`flex min-h-[var(--touch-target)] w-full cursor-pointer items-center justify-between gap-3 rounded-[var(--r-sm)] border-[1.5px] border-[var(--line)] bg-[var(--card)] px-3.5 py-[11px] text-left font-[family-name:inherit] text-base text-[var(--ink)] transition-[border-color,box-shadow] duration-150 hover:border-[var(--muted)] focus-visible:border-[var(--accent)] focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_color-mix(in_srgb,var(--accent)_15%,transparent)] aria-expanded:border-[var(--accent)] aria-expanded:shadow-[0_0_0_3px_color-mix(in_srgb,var(--accent)_15%,transparent)]${className ? ` ${className}` : ''}`}
        onClick={() => { setOpen((current) => !current); setQuery(''); }}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${id}-listbox`}
      >
        <span className={value ? '' : 'text-[var(--muted)]'}>{value ? getBreedLabel(value, lang) : t('breed_choose')}</span>
        <ChevronDown size={18} aria-hidden="true" className={`shrink-0 text-[var(--muted)] transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute inset-x-0 top-[calc(100%+7px)] overflow-hidden rounded-[var(--r-md)] border border-[var(--border-strong)] bg-[var(--surface-2)] p-2 shadow-[var(--shadow-lg)] max-[480px]:fixed max-[480px]:inset-x-3 max-[480px]:top-auto max-[480px]:bottom-3 max-[480px]:rounded-[var(--r-lg)] max-[480px]:p-2.5">
          <div className="flex min-h-[42px] items-center gap-[9px] rounded-[var(--r-sm)] border border-[var(--border-subtle)] bg-[var(--surface-3)] px-[11px] text-[var(--muted)]">
            <Search size={17} aria-hidden="true" />
            <input
              ref={searchRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t('breed_search')}
              aria-label={t('breed_search')}
              className="m-0 min-h-10 min-w-0 w-full rounded-none border-0 bg-transparent p-0 font-[family-name:inherit] text-[15px] text-[var(--ink)] shadow-none outline-none"
            />
          </div>
          <div id={`${id}-listbox`} className="max-h-[min(270px,42vh)] overflow-y-auto overscroll-contain px-0.5 pt-1.5 pb-0.5 max-[480px]:max-h-[min(360px,55vh)]" role="listbox" aria-label={t('breed_label')}>
            <button type="button" role="option" aria-selected={!value} className="flex min-h-10 w-full cursor-pointer items-center justify-between gap-2.5 rounded-[var(--r-sm)] border-0 bg-transparent px-[11px] py-[9px] text-left font-[family-name:inherit] text-sm text-[var(--text-secondary)] hover:bg-[var(--surface-3)] hover:text-[var(--ink)] focus-visible:bg-[var(--surface-3)] focus-visible:text-[var(--ink)] focus-visible:outline-none max-[480px]:min-h-11 max-[480px]:text-[15px]" onClick={() => choose('')}>
              <span>{t('breed_choose')}</span>
              {!value && <Check size={16} aria-hidden="true" />}
            </button>
            {filtered.map((breed) => (
              <button
                type="button"
                role="option"
                aria-selected={value === breed.value}
                className={`flex min-h-10 w-full cursor-pointer items-center justify-between gap-2.5 rounded-[var(--r-sm)] border-0 px-[11px] py-[9px] text-left font-[family-name:inherit] text-sm hover:bg-[var(--surface-3)] hover:text-[var(--ink)] focus-visible:bg-[var(--surface-3)] focus-visible:text-[var(--ink)] focus-visible:outline-none max-[480px]:min-h-11 max-[480px]:text-[15px] ${value === breed.value ? 'bg-[color-mix(in_srgb,var(--primary)_12%,transparent)] font-semibold text-[var(--primary-light)]' : 'bg-transparent text-[var(--text-secondary)]'}`}
                key={breed.value}
                onClick={() => choose(breed.value)}
              >
                <span>{breed[lang]}</span>
                {value === breed.value && <Check size={16} aria-hidden="true" />}
              </button>
            ))}
            {filtered.length === 0 && <p className="px-3 py-[18px] text-center text-[13px] text-[var(--muted)]">{t('breed_no_results')}</p>}
          </div>
        </div>
      )}

    </div>
  );
}
