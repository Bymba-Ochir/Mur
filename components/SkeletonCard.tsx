// Жагсаалтын картын loading төлөв — глобал `.skel-row` shimmer системийг ашиглана
// (Admin/MyPets-ийн skeleton-той нэгдсэн).
export default function SkeletonCard() {
  return (
    <div className="overflow-hidden rounded-[var(--r-lg)] border border-[var(--line)] bg-[var(--card)]">
      <div className="skel-row h-[152px] bg-[var(--thumb-bg)]" />
      <div className="flex flex-col gap-[var(--sp-2)] p-[var(--sp-3)]">
        <div className="skel-row h-[11px] w-3/5 rounded-[var(--r-sm)] bg-[var(--line)]" />
        <div className="skel-row h-[11px] w-4/5 rounded-[var(--r-sm)] bg-[var(--line)]" />
        <div className="skel-row h-[11px] w-[45%] rounded-[var(--r-sm)] bg-[var(--line)]" />
      </div>
    </div>
  );
}
