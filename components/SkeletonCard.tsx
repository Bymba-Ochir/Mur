// Жагсаалтын картын loading төлөв — глобал `.skel-row` shimmer системийг ашиглана
// (Admin/MyPets-ийн skeleton-той нэгдсэн).
export default function SkeletonCard() {
  return (
    <div className="skeleton-card">
      <div className="skel-row skeleton-thumb" />
      <div className="skeleton-info">
        <div className="skel-row skeleton-line" style={{ width: '60%' }} />
        <div className="skel-row skeleton-line" style={{ width: '80%' }} />
        <div className="skel-row skeleton-line" style={{ width: '45%' }} />
      </div>

      <style jsx>{`
        .skeleton-card {
          background: var(--card); border: 1px solid var(--line); border-radius: var(--r-lg); overflow: hidden;
        }
        .skeleton-thumb { height: 152px; background: var(--thumb-bg); }
        .skeleton-info { padding: var(--sp-3); display: flex; flex-direction: column; gap: var(--sp-2); }
        .skeleton-line { height: 11px; border-radius: var(--r-sm); background: var(--line); }
      `}</style>
    </div>
  );
}
