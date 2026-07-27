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
          background: #fff; border: 1px solid #E1E4DF; border-radius: 14px; overflow: hidden;
        }
        .skeleton-thumb { height: 150px; background: #E1E4DF; }
        .skeleton-info { padding: 12px 14px; display: flex; flex-direction: column; gap: 8px; }
        .skeleton-line { height: 11px; border-radius: 4px; background: #E1E4DF; }
        .shimmer {
          background: linear-gradient(90deg, #E1E4DF 25%, #EEF0EC 37%, #E1E4DF 63%);
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
