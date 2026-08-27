import type { Metadata } from 'next';
import UserProfileView from '../../../components/UserProfileView';
export const metadata: Metadata = { title: 'Хэрэглэгчийн profile | МӨР' };
export default async function PublicUserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <UserProfileView userId={id} />;
}
