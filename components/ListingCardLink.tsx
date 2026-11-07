import Link from 'next/link';

/** Native card navigation: one keyboard stop, modifier-click and new-tab support. */
export default function ListingCardLink({ href, label, children }: { href?: string; label: string; children: string }) {
  return href ? (
    <Link href={href} prefetch={false} className="listing-card-link" aria-label={`${label}: ${children}`}>
      {children}
    </Link>
  ) : <>{children}</>;
}
