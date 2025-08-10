import { Card } from '@/components/ui/card';
import NavBar from '@/components/NavBar';
import ChatInput from '@/components/ChatInput';
import useChat from '@/hooks/useChat';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

export default function Home() {
  useChat();

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div className={cn('flex min-h-dvh flex-col')}>
      <NavBar />
      <main
        className={cn(
          'flex-1 p-6 pt-16 pb-[max(1rem,env(safe-area-inset-bottom))]',
          'flex flex-col items-center justify-start md:justify-center gap-4',
          'w-full h-full min-w-[300px] max-w-[700px] m-auto transition-all',
          'duration-300 ease-out',
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
        )}
      >
        <h2 className={cn('text-3xl')}>{`I’m Frank.`}</h2>
        <Card
          className={cn(
            'w-full bg-transparent p-0 border-0 rounded-none shadow-none',
            'sm:bg-secondary sm:p-4 sm:border sm:rounded-xl sm:shadow-lg'
          )}
        >
          <ChatInput placeholder="What can I do you for?" />
        </Card>
      </main>
    </div>
  );
}
