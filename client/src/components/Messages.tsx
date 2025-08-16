import { useEffect, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useStore } from '@/store';
import Message from '@/components/Message';
import { cn } from '@/lib/utils';

export default function Messages() {
  const { history, sending } = useStore();
  const containerRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: history.length,
    getScrollElement: () => containerRef.current,
    estimateSize: () => 75,
    overscan: 10,
  });

  const items = virtualizer.getVirtualItems();

  // Track the last message content to detect streaming updates
  const lastMessageContent = history[history.length - 1]?.content || '';

  useEffect(() => {
    if (history.length > 0) {
      setTimeout(() => {
        virtualizer.scrollToIndex(history.length - 1, {
          align: 'end',
          behavior: 'auto',
        });
      }, 0);
    }
  }, [history.length, lastMessageContent, virtualizer]);

  return (
    <div ref={containerRef} className={cn('flex-1 overflow-y-auto')}>
      <div className="relative w-full" style={{ height: virtualizer.getTotalSize() }}>
        <div
          className="absolute inset-x-0 top-0"
          style={{
            transform: `translateY(${items[0]?.start ?? 0}px)`,
          }}
        >
          {items.map((virtualItem) => {
            const message = history[virtualItem.index];
            return (
              <div
                key={virtualItem.key}
                ref={virtualizer.measureElement}
                data-index={virtualItem.index}
                className="px-3 pb-5 flex flex-col"
              >
                <Message
                  entry={message}
                  showCursor={sending && virtualItem.index === history.length - 1}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
