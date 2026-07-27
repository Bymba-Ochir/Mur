export default function SkeletonCard() {
  return (
    <div className="skeleton-card">
      <div className="skeleton-thumb shimmer" />
      <div className="skeleton-info">
        <div className="skeleton-line shimmer" style={{ width: '60%' }} />
        <div className="skeleton-line shimmer" style={{ width: '80%' }} />
        <div className="skeleton-line shimmer" style={{ width: '45%' }} />
      </div>

      <style jsx>{`
        .skeleton-card {
          background: var(--card); border: 1px solid var(--line); border-radius: 14px; overflow: hidden;
        }
        .skeleton-thumb { height: 150px; background: var(--line); }
        .skeleton-info { padding: 12px 14px; display: flex; flex-direction: column; gap: 8px; }
        .skeleton-line { height: 11px; border-radius: 4px; background: var(--line); }
        .shimmer {
          background: linear-gradient(90deg, var(--line) 25%, var(--card) 37%, var(--line) 63%);
          background-size: 400% 100%;
          animation: shimmer 1.4s ease infinite;
        }
        @keyframes shimmer {
          0% { background-position: 100% 50%; }
          100% { background-position: 0 50%; }
        }
      `}</style>
    </div>
  );
}
