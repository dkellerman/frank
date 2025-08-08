import { useActionState, useEffect, useRef } from 'react';
import { Settings, MessageSquare, Send } from 'lucide-react';
import { Marked } from 'marked';
import { useStore } from '@/store';
import { cn } from '@/lib/utils';
import useChat from '@/hooks/useChat';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Drawer, DrawerContent, DrawerTrigger } from '@/components/ui/drawer';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const marked = new Marked({ breaks: true });

const CURSOR_HTML = `
  <span class="mr-1" />
  <span class="inline-block w-2 h-5 bg-gray-800 animate-pulse" style="animation-duration: 0.6s;" />
`;

export default function Chat() {
  const { model, models, setModel, history } = useStore();

  const { loading, sending, connected, startNewChat, sendMessage } = useChat({
    onReply: () => {
      scrollToBottom();
      focusInput();
    },
    onUserMessage: () => {
      scrollToBottom();
    },
    onInitialized: () => {
      scrollToBottom();
    },
  });

  const [input, sendAction] = useActionState(async (prevState: string, formData: FormData) => {
    const input = formData.get('input') as string;
    if (!input?.trim() || !connected || loading || sending) return prevState;
    await sendMessage(input);
    return '';
  }, '');

  const historyRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (inputRef.current && input === '') {
      inputRef.current.style.height = 'auto';
    }
  }, [input]);

  useEffect(() => {
    focusInput();
  }, [inputRef]);

  function focusInput() {
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  }

  function scrollToBottom() {
    historyRef.current?.scrollTo({ top: historyRef.current.scrollHeight, behavior: 'smooth' });
  }

  return (
    <div className="flex h-screen">
      <div
        className="w-16 bg-zinc-100 border-r border-zinc-200 flex flex-col
      items-center py-4 space-y-4"
      >
        <Button
          variant="ghost"
          size="icon"
          className="h-12 w-12 hover:bg-zinc-200 transition-colors"
          onClick={startNewChat}
          title="New chat"
          aria-label="New chat"
        >
          <MessageSquare className="h-6 w-6" />
        </Button>

        <Drawer direction="left">
          <DrawerTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-12 w-12 hover:bg-zinc-200 transition-colors"
              title="Settings"
              aria-label="Settings"
            >
              <Settings className="h-6 w-6" />
            </Button>
          </DrawerTrigger>
          <DrawerContent className="h-full w-80">
            <div className="p-6 space-y-6">
              <div className="space-y-3">
                <label className="text-sm font-medium text-zinc-700">Base Model</label>
                <Select value={model.id} onValueChange={(value) => setModel(value)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {models.map((model) => (
                      <SelectItem key={model.id} value={model.id}>
                        {model.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </DrawerContent>
        </Drawer>
      </div>

      <main
        className="flex-1 p-4 flex flex-col items-center justify-center gap-4
        w-full h-full min-w-[300px] max-w-[700px] m-auto"
      >
        <h2 className="text-3xl">{`I’m Frank.`}</h2>

        <Card className={cn('w-full h-[80dvh] bg-zinc-50 p-4 flex flex-col')}>
          <div ref={historyRef} className="flex-1 overflow-y-auto flex flex-col gap-2">
            {history.map((message, idx: number) => (
              <div
                key={idx}
                className={cn(
                  'prose prose-lg p-4 rounded-md',
                  message.role === 'user' ? 'bg-blue-200' : 'bg-stone-100'
                )}
                dangerouslySetInnerHTML={{
                  __html:
                    marked.parse(message.content) +
                    (sending && idx === history.length - 1 ? CURSOR_HTML : ''),
                }}
              />
            ))}
          </div>

          <form ref={formRef} action={sendAction} className="flex flex-row gap-2">
            <Textarea
              ref={inputRef}
              name="input"
              className="flex-1 resize-none min-h-[40px] max-h-[200px] rounded border
               border-zinc-300 px-3 py-2 text-base transition-all"
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
              placeholder="Type your message..."
              style={{ overflow: 'hidden' }}
              disabled={!connected || loading}
            />
            <Button
              type="submit"
              disabled={!connected || loading || sending}
              aria-label="Send message"
            >
              <Send className="w-5 h-5" />
            </Button>
          </form>
        </Card>
      </main>
    </div>
  );
}
