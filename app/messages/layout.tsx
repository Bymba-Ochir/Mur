import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Мессеж ба AI туслах — МӨР',
  description: 'Зар нийтэлсэн хэрэглэгчтэй холбогдох болон тэжээвэр амьтны ерөнхий зөвлөгөө авах хэсэг.',
};

export default function MessagesLayout({ children }: { children: ReactNode }) { return children; }
