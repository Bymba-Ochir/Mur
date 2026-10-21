import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Алдсан амьтан мэдээлэх — МӨР',
  description: 'Алдсан нохой, муур болон бусад амьтны зураг, байршил, холбоо барих мэдээллийг нийтлэх.',
};

export default function ReportLostLayout({ children }: { children: ReactNode }) { return children; }
