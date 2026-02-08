import { useNavigate } from 'react-router';
import { LogOut, Settings } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function SettingsDrawer() {
  const { model, models, setModel, themeMode, themeLabel, setThemeMode, authToken } = useStore();
  const navigate = useNavigate();

  return (
    <Sheet
      onOpenChange={(open) => {
        if (open) (document.activeElement as HTMLElement | null)?.blur();
      }}
    >
      <SheetTrigger asChild>
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
      </SheetTrigger>
      <SheetContent>
        <SheetDescription className={cn('sr-only')}>Settings panel</SheetDescription>
        <SheetHeader>
          <SheetTitle>Settings</SheetTitle>
        </SheetHeader>
        <div className={cn('mt-6 flex flex-col gap-4')}>
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
            <Select value={model?.id} onValueChange={(value) => setModel(value)}>
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

          {authToken && (
            <div className={cn('mt-6 border-t pt-4')}>
              <Button
                variant="ghost"
                size="sm"
                className={cn('text-sm text-muted-foreground')}
                onClick={() => navigate('/logout')}
              >
                <LogOut className={cn('mr-2 h-4 w-4')} />
                Log out
              </Button>
            </div>
          )}
      </SheetContent>
    </Sheet>
  );
}
