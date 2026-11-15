import type { ReactNode } from 'react';
import { pageMetadata } from '../../lib/siteMetadata';

export const metadata = pageMetadata({
  path: '/report-lost',
  title: 'Нохой, муураа алдсан бол зар оруулах | МӨР',
  description: 'Нохойгоо эсвэл муураа алдсан уу? Зураг, сүүлд харсан газраа оруулж зараа хуваалцаарай. Харсан хүн бүртгэлгүйгээр мэдээлэл үлдээж болно.',
});

export default function ReportLostLayout({ children }: { children: ReactNode }) { return children; }
