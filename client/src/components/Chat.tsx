import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import NavBar from '@/components/NavBar';
import Messages from '@/components/Messages';
import ChatInput from '@/components/ChatInput';
import useChat from '@/hooks/useChat';
import { useParams } from 'react-router';
import { useEffect, useState } from 'react';

export default function Chat() {
  const [mounted, setMounted] = useState(false);
  const { id } = useParams<{ id: string }>();
  useChat(id);

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div className={cn('flex h-dvh flex-col overflow-hidden')}>
      <NavBar />
      <main
        className={cn(
          'flex-1 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(0.5rem,env(safe-area-inset-top))] flex flex-col items-center gap-4 w-full h-full overflow-hidden min-h-0',
          'min-w-[280px] max-w-[700px] mx-auto min-h-0 transition-all duration-300 ease-out',
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
        )}
      >
        <Card
          className={cn(
            // Full-bleed on mobile
            'w-full h-full bg-transparent !p-0 !py-0 border-0 rounded-none shadow-none',
            // Restore card look on larger screens
            'sm:bg-card sm:!p-4 sm:border sm:rounded-xl sm:shadow-lg',
            'sm:pb-[max(1rem,env(safe-area-inset-bottom))]',
            'flex flex-col min-h-0 overflow-hidden'
          )}
        >
          <Messages />
          <ChatInput placeholder="What can I do you for?" />
        </Card>
      </main>
    </div>
  );
}
