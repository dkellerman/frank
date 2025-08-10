import { SquarePen, Settings } from 'lucide-react';
import { useStore } from '@/store';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTheme } from '@/hooks/useTheme';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  DrawerClose,
  DrawerFooter,
  DrawerDescription,
} from '@/components/ui/drawer';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function NavBar() {
  const { startNewChat, model, models, setModel } = useStore();
  const { theme, setTheme } = useTheme();

  const themeLabel = theme === 'light' ? 'Light' : theme === 'dark' ? 'Dark' : 'System';

  return (
    <div
      className={cn(
        'w-full h-14 bg-secondary border-b border-border flex items-center px-4 justify-between'
      )}
    >
      {/* Left: brand icon */}
      <a href="/" className={cn('flex items-center gap-2')}>
        <img
          src="/favicon.png"
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

        <Drawer
          direction="right"
          onOpenChange={(open) => {
            if (open) (document.activeElement as HTMLElement | null)?.blur();
          }}
        >
          <DrawerTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn('h-10 w-10 hover:bg-secondary')}
              title="Settings"
              aria-label="Open settings"
              onPointerDown={(e) => (e.currentTarget as HTMLButtonElement).blur()}
            >
              <Settings className={cn('h-6 w-6')} />
            </Button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerDescription className={cn('sr-only')}>Settings drawer</DrawerDescription>
            <DrawerHeader>
              <DrawerTitle>Settings</DrawerTitle>
            </DrawerHeader>
            <div className={cn('p-4 pt-2 flex flex-col gap-4')}>
              <div className={cn('flex items-center gap-2')}>
                <span className={cn('text-sm text-muted-foreground w-20 shrink-0')}>Theme:</span>
                <Select value={theme} onValueChange={(value) => setTheme(value as any)}>
                  <SelectTrigger className={cn('h-9 w-40 text-sm')}>
                    <SelectValue placeholder={themeLabel} />
                  </SelectTrigger>
                  <SelectContent side="left" align="end" sideOffset={8}>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className={cn('flex items-center gap-2')}>
                <span className={cn('text-sm text-muted-foreground w-20 shrink-0')}>Base:</span>
                <Select value={model.id} onValueChange={(value) => setModel(value)}>
                  <SelectTrigger className={cn('h-9 w-48 text-sm')}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent side="left" align="end" sideOffset={8}>
                    {models.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DrawerFooter>
              <DrawerClose asChild>
                <Button variant="outline">Close</Button>
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      </div>
    </div>
  );
}
