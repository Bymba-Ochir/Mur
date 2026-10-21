import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Олдсон амьтан мэдээлэх — МӨР',
  description: 'Олдсон нохой, муур болон бусад амьтны зураг, байршил, холбоо барих мэдээллийг нийтлэх.',
};

export default function ReportFoundLayout({ children }: { children: ReactNode }) { return children; }
