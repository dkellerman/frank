import { useEffect, useRef } from 'react';
import { useStore } from '@/store';
import Message from '@/components/Message';
import { cn } from '@/lib/utils';

export default function Messages() {
  const { history, sending } = useStore();
  const historyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    historyRef.current?.scrollTo({ top: historyRef.current.scrollHeight, behavior: 'smooth' });
  }, [history.length, sending]);

  return (
    <div ref={historyRef} className={cn('flex-1 overflow-y-auto flex flex-col gap-5 px-3 pb-3')}>
      {history.map((message, idx) => (
        <Message
          key={idx}
          role={message.role}
          content={message.content}
          showCursor={sending && idx === history.length - 1}
        />
      ))}
    </div>
  );
}
