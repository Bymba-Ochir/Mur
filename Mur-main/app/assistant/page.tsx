import { redirect } from 'next/navigation';

export default function AssistantPage() {
  redirect('/messages?tab=assistant');
}
