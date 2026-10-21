import type { Metadata } from 'next';
import UserProfileView from '../../components/UserProfileView';
export const metadata: Metadata = { title: 'Миний profile | МӨР' };
export default function ProfilePage() { return <UserProfileView own />; }
