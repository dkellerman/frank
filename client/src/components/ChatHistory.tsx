import { useState } from 'react';
import { History } from 'lucide-react';
import { format } from 'timeago.js';
import { useNavigate, useParams } from 'react-router';
import { useStore } from '@/store';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetDescription,
} from '@/components/ui/sheet';
import type { ChatSummary } from '@/types';

function timeAgo(ts: string) {
  // Server sends UTC but may omit the Z suffix — ensure it's present
  return format(ts.endsWith('Z') ? ts : ts + 'Z');
}

export default function ChatHistoryDrawer() {
  const { authToken } = useStore();
  const navigate = useNavigate();
  const { id: activeChatId } = useParams<{ id: string }>();
  const [chats, setChats] = useState<ChatSummary[]>([]);
  const [loading, setLoading] = useState(false);

  async function fetchChats() {
    setLoading(true);
    try {
      const resp = await fetch('/api/chats', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (resp.ok) {
        setChats(await resp.json());
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Sheet
      onOpenChange={(open) => {
        if (open) {
          (document.activeElement as HTMLElement | null)?.blur();
          fetchChats();
        }
      }}
    >
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn('h-10 w-10 hover:bg-secondary cursor-pointer')}
          title="Chat history"
          aria-label="Open chat history"
          onPointerDown={(e) => (e.currentTarget as HTMLButtonElement).blur()}
        >
          <History className={cn('h-6 w-6')} />
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetDescription className={cn('sr-only')}>Chat history panel</SheetDescription>
        <SheetHeader>
          <SheetTitle>History</SheetTitle>
        </SheetHeader>
        <div className={cn('mt-4 flex flex-col gap-1 overflow-y-auto')}>
          {loading && <p className={cn('text-sm text-muted-foreground px-2')}>Loading...</p>}
          {!loading && chats.length === 0 && (
            <p className={cn('text-sm text-muted-foreground px-2')}>No chats yet</p>
          )}
          {chats.map((chat) => (
            <button
              key={chat.id}
              className={cn(
                'w-full text-left px-3 py-2 rounded-md text-sm',
                'hover:bg-accent hover:text-accent-foreground',
                'transition-colors cursor-pointer',
                chat.id === activeChatId && 'bg-accent text-accent-foreground'
              )}
              onClick={() => navigate(`/chats/${chat.id}`)}
            >
              <span className={cn('text-foreground')}>{chat.title || 'Chat session'}</span>
              {chat.ts && (
                <span className={cn('block text-xs text-muted-foreground')}>
                  {timeAgo(chat.ts)}
                </span>
              )}
            </button>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
