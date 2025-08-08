import { MessageSquare, Moon, Sun, Monitor } from 'lucide-react';
import { useStore } from '@/store';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useEffect, useMemo, useState } from 'react';

export default function NavBar() {
  const { startNewChat } = useStore();
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(() => {
    const stored = localStorage.getItem('theme');
    return stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system';
  });

  const media = useMemo(() => window.matchMedia('(prefers-color-scheme: dark)'), []);

  useEffect(() => {
    const root = document.documentElement;
    const applyTheme = () => {
      if (theme === 'dark') root.classList.add('dark');
      else if (theme === 'light') root.classList.remove('dark');
      else if (media.matches) root.classList.add('dark');
      else root.classList.remove('dark');
    };
    localStorage.setItem('theme', theme);
    applyTheme();
    if (theme === 'system') {
      const onChange = () => applyTheme();
      if (media.addEventListener) media.addEventListener('change', onChange);
      else media.addListener(onChange);
      return () => {
        if (media.removeEventListener) media.removeEventListener('change', onChange);
        else media.removeListener(onChange);
      };
    }
  }, [theme, media]);

  const cycleTheme = () => {
    if (theme === 'light') setTheme('dark');
    else if (theme === 'dark') setTheme('system');
    else setTheme('light');
  };

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
