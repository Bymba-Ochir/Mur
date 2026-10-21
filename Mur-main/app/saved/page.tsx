import type { Metadata } from 'next';
import SavedClient from './SavedClient';

export const metadata: Metadata = {
  title: 'Хадгалсан | МӨР',
  description: 'Хадгалсан зар болон шинэ зарын мэдэгдэл авах хайлтууд.',
  robots: { index: false, follow: false },
};

export default function SavedPage() {
  return <SavedClient />;
}
