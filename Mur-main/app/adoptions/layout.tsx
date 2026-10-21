import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Үрчлүүлэх амьтад — МӨР',
  description: 'Шинэ гэр бүл хайж буй нохой, муур болон бусад тэжээвэр амьтдын үрчлүүлэлтийн зар.',
};

export default function AdoptionsLayout({ children }: { children: ReactNode }) { return children; }
