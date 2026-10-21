import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Мал эмнэлгүүд — МӨР',
  description: 'Улаанбаатар хотын мал эмнэлэг, холбоо барих мэдээлэл болон байршлыг хайх.',
};

export default function ClinicsLayout({ children }: { children: ReactNode }) { return children; }
