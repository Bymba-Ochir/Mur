import type { Metadata } from 'next';
import ActivityClient from './ActivityClient';

export const metadata: Metadata = { title: 'Миний хүсэлтүүд | МӨР', description: 'Үрчлүүлэх хүсэлт болон асрах захиалгын төлөв.' };
export default function ActivityPage() { return <ActivityClient />; }
