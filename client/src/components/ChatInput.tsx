import { useActionState, useEffect, useRef, useState } from 'react';
import { Send } from 'lucide-react';
import { useStore } from '@/store';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

type Props = { placeholder?: string };

export default function ChatInput({ placeholder = 'What can I do you for?' }: Props) {
  const { connected, loading, sending, sendMessage } = useStore();
  const [text, setText] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const [, /*actionState*/ sendAction] = useActionState(
    async (_prevState: string, formData: FormData) => {
      const value = formData.get('input') as string;
      if (!value?.trim() || !connected || loading || sending) return _prevState;
      await sendMessage(value);
      setText('');
      if (inputRef.current) inputRef.current.style.height = 'auto';
      return '';
    },
    ''
  );

  useEffect(() => {
    if (!sending && !loading) focusInput();
  }, [loading, sending]);

  function focusInput() {
    setTimeout(() => inputRef.current?.focus(), 100);
  }

  // Enable unless input is blank
  const isDisabled = !text.trim();

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
            'flex-1 w-full resize-none max-h-[50vh] rounded-2xl',
            'border border-input bg-white px-4 py-3 pr-16 transition-all',
            'text-base md:text-base'
          )}
          rows={1}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              formRef.current?.requestSubmit();
            }
          }}
          placeholder={placeholder}
          style={{ overflow: 'hidden' }}
          disabled={false}
        />
        <Button
          type="submit"
          size="icon"
          className={cn('h-10 w-10 rounded-full absolute right-2 top-1/2 -translate-y-1/2')}
          disabled={isDisabled}
          aria-label="Send message"
        >
          <Send className={cn('w-5 h-5')} />
        </Button>
      </div>
    </form>
  );
}
