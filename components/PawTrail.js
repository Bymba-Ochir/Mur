'use client';

/**
 * Гарын үсэг элемент: "Мөр" (зам/мөр/трак) гэдэг нэрний утгад суурилсан
 * мөрний трал — зөвхөн жинхэнэ дараалалтай контентод (алхмууд) ашиглана
 * (Нүүр хуудасны "Яаж ажилладаг вэ", мэдэгдэх формын 4 алхам).
 *
 * @param {string[]} labels - алхам бүрийн нэр
 * @param {number} current - идэвхтэй алхмын индекс (0-based)
 */
export default function PawTrail({ labels, current }) {
  return (
    <div className="paw-trail" role="list" aria-label="Алхмууд">
      {labels.map((label, i) => {
        const state = i < current ? 'done' : i === current ? 'active' : 'upcoming';
        return (
          <div key={label} className="trail-step" role="listitem" aria-current={state === 'active' ? 'step' : undefined}>
            <div className="trail-node-row">
              {i > 0 && <span className={`trail-line ${i <= current ? 'filled' : ''}`} aria-hidden="true" />}
              <span className={`paw ${state}`} aria-hidden="true">
                <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor">
                  <ellipse cx="12" cy="15.2" rx="5.4" ry="4.6" />
                  <ellipse cx="5.6" cy="8.6" rx="2.1" ry="2.6" transform="rotate(-18 5.6 8.6)" />
                  <ellipse cx="10.2" cy="5.4" rx="2.1" ry="2.7" transform="rotate(-6 10.2 5.4)" />
                  <ellipse cx="14.6" cy="5.2" rx="2.1" ry="2.7" transform="rotate(6 14.6 5.2)" />
                  <ellipse cx="18.6" cy="8.3" rx="2.1" ry="2.6" transform="rotate(18 18.6 8.3)" />
                </svg>
              </span>
            </div>
            <span className="trail-label">{label}</span>
          </div>
        );
      })}

      <style jsx>{`
        .paw-trail { display: flex; align-items: flex-start; width: 100%; }
        .trail-step { display: flex; flex-direction: column; align-items: center; flex: 1; gap: 6px; min-width: 0; }
        .trail-node-row { display: flex; align-items: center; width: 100%; }
        .trail-line {
          flex: 1; height: 2px; background: var(--line); margin-right: -1px;
          transition: background 0.25s ease;
        }
        .trail-step:first-child .trail-node-row { justify-content: center; }
        .trail-line.filled { background: var(--accent); }
        .paw {
          flex-shrink: 0; width: 28px; height: 28px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          background: var(--card); border: 2px solid var(--line); color: var(--line);
          transition: all 0.25s ease;
        }
        .paw.active { background: var(--accent); border-color: var(--accent); color: #fff; box-shadow: 0 0 0 4px color-mix(in srgb, var(--accent) 20%, transparent); }
        .paw.done { background: var(--primary); border-color: var(--primary); color: #fff; }
        .trail-label {
          font-size: 10.5px; font-weight: 600; color: var(--muted); text-align: center;
          font-family: var(--font-body);
        }
        .trail-step:has(.paw.active) .trail-label { color: var(--primary); }
      `}</style>
    </div>
  );
}
