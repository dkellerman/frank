import { SquarePen } from 'lucide-react';
import { useStore } from '@/store';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import SettingsDrawer from '@/components/Settings';

export default function NavBar() {
  const { startNewChat } = useStore();

  return (
    <div
      className={cn(
        'w-full h-14 bg-secondary border-b border-border flex items-center px-4 justify-between'
      )}
    >
      {/* Left: brand icon */}
      <a href="/" className={cn('flex items-center gap-2')}>
        <img
          src="/favicon.png?v=3"
          alt="Frank"
          className={cn('h-9 w-9 rounded-md object-contain dark:opacity-90')}
        />
      </a>

      {/* Right: new chat + settings */}
      <div className={cn('flex items-center gap-2')}>
        <Button
          variant="ghost"
          size="icon"
          className={cn('h-10 w-10 hover:bg-secondary')}
          onClick={startNewChat}
          title="New chat"
          aria-label="New chat"
        >
          <SquarePen className={cn('h-6 w-6')} />
        </Button>

        <SettingsDrawer />
      </div>
    </div>
  );
}
