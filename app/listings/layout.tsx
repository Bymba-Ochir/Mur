import type { ReactNode } from 'react';
import { pageMetadata } from '../../lib/siteMetadata';

export const metadata = pageMetadata({
  path: '/listings',
  title: 'Алдсан, олдсон нохой муурын зарууд | МӨР',
  description: 'Улаанбаатарт алдсан, олдсон нохой муурын зарыг дүүрэг, төрөл, байршил, зургаар хайж, эзэнтэй нь холбогдоорой.',
});

export default function ListingsLayout({ children }: { children: ReactNode }) { return children; }
