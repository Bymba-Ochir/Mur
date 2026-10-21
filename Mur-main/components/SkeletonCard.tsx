// Жагсаалтын картын loading төлөв — глобал `.skel-row` shimmer системийг ашиглана
// (Admin/MyPets-ийн skeleton-той нэгдсэн).
export default function SkeletonCard() {
  return (
    <div className="skeleton-card">
      <div className="skel-row skeleton-thumb" />
      <div className="skeleton-info">
        <div className="skel-row skeleton-line skeleton-line--title" />
        <div className="skel-row skeleton-line skeleton-line--wide" />
        <div className="skel-row skeleton-line skeleton-line--short" />
        <div className="skel-row skeleton-action" />
      </div>

      <style jsx>{`
        .skeleton-card {
          height: 100%; background: var(--card); border: 1px solid var(--line); border-radius: var(--r-xl); overflow: hidden;
        }
        .skeleton-thumb { height: 200px; background: var(--thumb-bg); }
        .skeleton-info { padding: var(--sp-4); display: flex; flex-direction: column; gap: var(--sp-2); }
        .skeleton-line { height: 11px; border-radius: var(--r-sm); background: var(--line); }
        .skeleton-line--title { width: 60%; height: 16px; }
        .skeleton-line--wide { width: 82%; }
        .skeleton-line--short { width: 48%; }
        .skeleton-action { width: 100%; height: var(--touch-target); margin-top: var(--sp-3); border-radius: var(--r-md); background: var(--line); }
        @media (max-width: 900px) {
          .skeleton-card { border-radius: var(--r-lg); }
          .skeleton-thumb { height: 180px; }
        }
        @media (max-width: 400px) {
          .skeleton-card { border-radius: var(--r-md); }
          .skeleton-thumb { height: 160px; }
          .skeleton-info { padding: var(--sp-3); }
        }
      `}</style>
    </div>
  );
}
