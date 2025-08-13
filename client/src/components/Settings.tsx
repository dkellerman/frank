import { Settings } from 'lucide-react';
import { useStore } from '@/store';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
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

export default function SettingsDrawer() {
  const { model, models, setModel, themeMode, themeLabel, setThemeMode } = useStore();

  return (
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
            <Select value={themeMode} onValueChange={setThemeMode}>
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
  );
}
