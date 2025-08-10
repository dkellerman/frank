import { useActionState, useEffect, useRef, useState } from 'react';
import { Send } from 'lucide-react';
import { useStore } from '@/store';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

type Props = { placeholder?: string };

export default function ChatInput({ placeholder = 'Type your message...' }: Props) {
  const { connected, loading, sending, sendMessage } = useStore();
  const [input, sendAction] = useActionState(async (prevState: string, formData: FormData) => {
    const value = formData.get('input') as string;
    if (!value?.trim() || !connected || loading || sending) return prevState;
    await sendMessage(value);
    return '';
  }, '');

  const [text, setText] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (input === '') setText('');
    if (inputRef.current && input === '') inputRef.current.style.height = 'auto';
  }, [input]);

  useEffect(() => {
    if (!sending && !loading) focusInput();
  }, [loading, sending]);

  function focusInput() {
    setTimeout(() => inputRef.current?.focus(), 100);
  }

  const isDisabled = !connected || loading || sending || !text.trim();

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
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            e.target.style.height = 'auto';
            e.target.style.height = `${e.target.scrollHeight}px`;
          }}
          className={cn(
            'flex-1 w-full resize-none min-h-[96px] max-h-[50vh] rounded-2xl',
            'border border-input bg-white px-4 py-3 pr-12 text-lg transition-all'
          )}
          rows={3}
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
        <Button
          type="submit"
          size="icon"
          className={cn('h-9 w-9 rounded-full absolute right-2 bottom-2')}
          disabled={isDisabled}
          aria-label="Send message"
        >
          <Send className={cn('w-4 h-4')} />
        </Button>
      </div>
    </form>
  );
}
