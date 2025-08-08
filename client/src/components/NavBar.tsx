import { MessageSquare, Moon, Sun, Monitor } from 'lucide-react';
import { useStore } from '@/store';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTheme } from '@/hooks/useTheme';

export default function NavBar() {
  const { startNewChat } = useStore();
  const { theme, cycleTheme } = useTheme();

  return (
    <div
      className={cn(
        'w-full h-14 bg-secondary border-b border-border flex items-center px-4 justify-between'
      )}
    >
      <Button
        variant="ghost"
        size="icon"
        className={cn('h-10 w-10 hover:bg-secondary')}
        onClick={startNewChat}
        title="New chat"
        aria-label="New chat"
      >
        <MessageSquare className={cn('h-6 w-6')} />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className={cn('h-10 w-10 hover:bg-secondary')}
        onClick={cycleTheme}
        title={
          theme === 'light'
            ? 'Switch to dark'
            : theme === 'dark'
              ? 'Follow system'
              : 'Switch to light'
        }
        aria-label="Toggle theme"
      >
        {theme === 'light' ? (
          <Sun className={cn('h-6 w-6')} />
        ) : theme === 'dark' ? (
          <Moon className={cn('h-6 w-6')} />
        ) : (
          <Monitor className={cn('h-6 w-6')} />
        )}
      </Button>
    </div>
  );
}
