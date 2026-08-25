'use client';

/**
 * Гарын үсэг элемент: "Мөр" (зам/мөр/трак) гэдэг нэрний утгад суурилсан
 * мөрний трал — зөвхөн жинхэнэ дараалалтай контентод (алхмууд) ашиглана
 * (Нүүр хуудасны "Яаж ажилладаг вэ", мэдэгдэх формын 4 алхам).
 */
export default function PawTrail({ labels, current }: { labels: string[]; current: number }) {
  return (
    <div className="flex w-full items-start" role="list" aria-label="Алхмууд">
      {labels.map((label, i) => {
        const state = i < current ? 'done' : i === current ? 'active' : 'upcoming';
        return (
          <div key={label} className="flex min-w-0 flex-1 flex-col items-center gap-1.5" role="listitem" aria-current={state === 'active' ? 'step' : undefined}>
            <div className={`flex w-full items-center ${i === 0 ? 'justify-center' : ''}`}>
              {i > 0 && <span className={`mr-px h-0.5 flex-1 transition-colors duration-250 ${i <= current ? 'bg-[var(--accent)]' : 'bg-[var(--line)]'}`} aria-hidden="true" />}
              <span className={`flex size-7 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-250 ${state === 'active' ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-ink)] shadow-[0_0_0_4px_color-mix(in_srgb,var(--accent)_20%,transparent)]' : state === 'done' ? 'border-[var(--primary)] bg-[var(--primary)] text-[var(--text-on-accent)]' : 'border-[var(--line)] bg-[var(--card)] text-[var(--line)]'}`} aria-hidden="true">
                <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor">
                  <ellipse cx="12" cy="15.2" rx="5.4" ry="4.6" />
                  <ellipse cx="5.6" cy="8.6" rx="2.1" ry="2.6" transform="rotate(-18 5.6 8.6)" />
                  <ellipse cx="10.2" cy="5.4" rx="2.1" ry="2.7" transform="rotate(-6 10.2 5.4)" />
                  <ellipse cx="14.6" cy="5.2" rx="2.1" ry="2.7" transform="rotate(6 14.6 5.2)" />
                  <ellipse cx="18.6" cy="8.3" rx="2.1" ry="2.6" transform="rotate(18 18.6 8.3)" />
                </svg>
              </span>
            </div>
            <span className={`text-center font-[family-name:var(--font-body)] text-[10.5px] font-semibold ${state === 'active' ? 'text-[var(--primary)]' : 'text-[var(--muted)]'}`}>{label}</span>
          </div>
        );
      })}
    </div>
  );
}
