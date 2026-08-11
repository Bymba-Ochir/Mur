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
    <div className="breed-select" ref={rootRef} onKeyDown={(event) => {
      if (event.key === 'Escape') { setOpen(false); setQuery(''); }
    }}>
      <input type="hidden" name={name} value={value} />
      <button
        id={id}
        type="button"
        className={`breed-trigger${className ? ` ${className}` : ''}`}
        onClick={() => { setOpen((current) => !current); setQuery(''); }}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${id}-listbox`}
      >
        <span className={value ? '' : 'placeholder'}>{value ? getBreedLabel(value, lang) : t('breed_choose')}</span>
        <ChevronDown size={18} aria-hidden="true" className={open ? 'chevron open' : 'chevron'} />
      </button>

      {open && (
        <div className="breed-popover">
          <div className="search-wrap">
            <Search size={17} aria-hidden="true" />
            <input
              ref={searchRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t('breed_search')}
              aria-label={t('breed_search')}
            />
          </div>
          <div id={`${id}-listbox`} className="breed-list" role="listbox" aria-label={t('breed_label')}>
            <button type="button" role="option" aria-selected={!value} className="breed-option" onClick={() => choose('')}>
              <span>{t('breed_choose')}</span>
              {!value && <Check size={16} aria-hidden="true" />}
            </button>
            {filtered.map((breed) => (
              <button
                type="button"
                role="option"
                aria-selected={value === breed.value}
                className={`breed-option${value === breed.value ? ' selected' : ''}`}
                key={breed.value}
                onClick={() => choose(breed.value)}
              >
                <span>{breed[lang]}</span>
                {value === breed.value && <Check size={16} aria-hidden="true" />}
              </button>
            ))}
            {filtered.length === 0 && <p className="empty">{t('breed_no_results')}</p>}
          </div>
        </div>
      )}

      <style jsx>{`
        .breed-select { position: relative; width: 100%; z-index: ${open ? 35 : 1}; }
        .breed-trigger {
          width: 100%; min-height: var(--touch-target); padding: 11px 14px;
          display: flex; align-items: center; justify-content: space-between; gap: 12px;
          color: var(--ink); background: var(--card); border: 1.5px solid var(--line);
          border-radius: var(--r-sm); font: inherit; font-size: 16px; text-align: left;
          cursor: pointer; transition: border-color .15s ease, box-shadow .15s ease;
        }
        .breed-trigger:hover { border-color: var(--muted); }
        .breed-trigger:focus-visible, .breed-trigger[aria-expanded='true'] {
          outline: none; border-color: var(--accent);
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 15%, transparent);
        }
        .placeholder { color: var(--muted); }
        .chevron { flex: 0 0 auto; color: var(--muted); transition: transform .18s ease; }
        .chevron.open { transform: rotate(180deg); }
        .breed-popover {
          position: absolute; top: calc(100% + 7px); left: 0; right: 0;
          padding: 8px; background: var(--surface-2); border: 1px solid var(--border-strong);
          border-radius: var(--r-md); box-shadow: var(--shadow-lg); overflow: hidden;
          animation: popover-in .16s var(--ease-out);
        }
        @keyframes popover-in { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }
        .search-wrap {
          min-height: 42px; padding: 0 11px; display: flex; align-items: center; gap: 9px;
          color: var(--muted); background: var(--surface-3); border: 1px solid var(--border-subtle);
          border-radius: var(--r-sm);
        }
        .search-wrap input {
          min-width: 0; width: 100%; min-height: 40px; padding: 0; margin: 0;
          color: var(--ink); background: transparent; border: 0; border-radius: 0;
          box-shadow: none; outline: none; font: inherit; font-size: 15px;
        }
        .breed-list { max-height: min(270px, 42vh); overflow-y: auto; padding: 6px 2px 1px; overscroll-behavior: contain; }
        .breed-option {
          width: 100%; min-height: 40px; padding: 9px 11px; display: flex;
          align-items: center; justify-content: space-between; gap: 10px; color: var(--text-secondary);
          background: transparent; border: 0; border-radius: var(--r-sm); font: inherit;
          font-size: 14px; text-align: left; cursor: pointer;
        }
        .breed-option:hover, .breed-option:focus-visible { color: var(--ink); background: var(--surface-3); outline: none; }
        .breed-option.selected { color: var(--primary-light); background: color-mix(in srgb, var(--primary) 12%, transparent); font-weight: 600; }
        .empty { padding: 18px 12px; color: var(--muted); font-size: 13px; text-align: center; }
        @media (max-width: 480px) {
          .breed-popover { position: fixed; top: auto; left: 12px; right: 12px; bottom: 12px; border-radius: var(--r-lg); padding: 10px; }
          .breed-list { max-height: min(360px, 55vh); }
          .breed-option { min-height: 44px; font-size: 15px; }
        }
      `}</style>
    </div>
  );
}
