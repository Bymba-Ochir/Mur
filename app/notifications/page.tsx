import type { Metadata } from 'next';
import NotificationsClient from './NotificationsClient';

export const metadata: Metadata = { title: 'Мэдэгдэл | МӨР', description: 'МӨР дэх хүсэлт, захиалга болон үйл ажиллагааны мэдэгдлүүд.' };
export default function NotificationsPage() { return <NotificationsClient />; }
