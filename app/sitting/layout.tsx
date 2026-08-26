import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Амьтан асрах үйлчилгээ — МӨР',
  description: 'Улаанбаатар хотод нохой, муур болон бусад тэжээвэр амьтан асрах үйлчилгээ хайх, зар нийтлэх.',
};

export default function SittingLayout({ children }: { children: ReactNode }) { return children; }
