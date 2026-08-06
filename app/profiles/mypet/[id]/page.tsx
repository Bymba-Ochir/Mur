import type { Metadata } from 'next';
import MyPetProfileClient from './MyPetProfileClient';

export const metadata: Metadata = {
  title: 'Миний амьтан — МӨР',
  description: 'Миний амьтны хувийн профайл',
};

export default async function MyPetProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <MyPetProfileClient id={id} />;
}
