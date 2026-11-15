import type { ReactNode } from 'react';
import { pageMetadata } from '../../lib/siteMetadata';

export const metadata = pageMetadata({
  path: '/report-found',
  title: 'Нохой, муур олдсон тухай мэдээлэх | МӨР',
  description: 'Нохой эсвэл муур олсон бол зураг, олсон газраа оруулж эзнийг нь хайх зар нийтлээрэй. Олдсон амьтны мэдээллийг холбоосоор хуваалцаж болно.',
});

export default function ReportFoundLayout({ children }: { children: ReactNode }) { return children; }
