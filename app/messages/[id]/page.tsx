import MessageThreadClient from './MessageThreadClient';

export default async function MessageThreadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <MessageThreadClient id={id} />;
}
