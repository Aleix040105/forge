import { notFound } from 'next/navigation';
import { getConversation, getMessages } from '@/lib/queries/messages';
import { ChatView } from '@/components/messages/ChatView';

interface PageProps {
  params: { id: string };
}

export default async function ChatPage({ params }: PageProps) {
  const [conversation, messages] = await Promise.all([
    getConversation(params.id),
    getMessages(params.id),
  ]);

  if (!conversation) notFound();

  return (
    <ChatView
      conversation={conversation}
      initialMessages={messages}
    />
  );
}
