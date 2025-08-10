import { useActionState, useEffect, useRef } from 'react';
import { Send } from 'lucide-react';
import { useStore } from '@/store';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type Props = { placeholder?: string };

export default function ChatInput({ placeholder = "What can I do you for?" }: Props) {
  const { connected, loading, sending, sendMessage, model, models, setModel } = useStore();
  const [input, sendAction] = useActionState(async (prevState: string, formData: FormData) => {
    const value = formData.get('input') as string;
    if (!value?.trim() || !connected || loading || sending) return prevState;
    await sendMessage(value);
    return '';
  }, '');

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (inputRef.current && input === '') inputRef.current.style.height = 'auto';
  }, [input]);

  useEffect(() => {
    if (!sending && !loading) focusInput();
  }, [loading, sending]);

  function focusInput() {
    setTimeout(() => inputRef.current?.focus(), 100);
  }

  return (
    <form
      ref={formRef}
      action={sendAction}
      className={cn('flex flex-col gap-3 bg-secondary rounded-2xl p-3')}
    >
      <div className={cn('relative')}>
        <Textarea
          ref={inputRef}
          name="input"
          className={cn(
            'flex-1 w-full resize-none min-h-[56px] max-h-[40svh] rounded-2xl',
            'border border-input bg-white px-4 py-3 pr-12 text-lg transition-all'
          )}
          rows={1}
          onChange={(e) => {
            e.target.style.height = 'auto';
            e.target.style.height = `${e.target.scrollHeight}px`;
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              formRef.current?.requestSubmit();
            }
          }}
          placeholder={placeholder}
          style={{ overflow: 'hidden' }}
          disabled={!connected || loading}
        />
      </div>

      <div className={cn('flex items-center justify-between gap-2')}>
        <div className={cn('flex items-center gap-2')}>
          <span className={cn('text-sm text-muted-foreground')}>Base:</span>
          <Select value={model.id} onValueChange={(value) => setModel(value)}>
            <SelectTrigger className={cn('h-9 w-44 text-sm')}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent side="top" position="popper" sideOffset={8} align="start">
              {models.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          type="submit"
          size="icon"
          className={cn('h-9 w-9 rounded-full')}
          disabled={!connected || loading || sending}
          aria-label="Send message"
        >
          <Send className={cn('w-4 h-4')} />
        </Button>
      </div>
    </form>
  );
}
