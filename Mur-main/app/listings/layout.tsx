import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Алдсан ба олдсон амьтдын жагсаалт — МӨР',
  description: 'Улаанбаатар хотод алдсан болон олдсон нохой, муур, бусад амьтны зарыг дүүрэг, төрөл, зургаар хайх.',
};

export default function ListingsLayout({ children }: { children: ReactNode }) { return children; }
