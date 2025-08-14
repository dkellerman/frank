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

  useEffect(() => {
    if (history.length > 0) {
      virtualizer.scrollToIndex(history.length - 1, { behavior: 'smooth' });
    }
  }, [history.length, virtualizer]);

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
                  role={message.role}
                  content={message.content}
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
