import { useState, useEffect, useRef } from 'react';
import useWebSocket, { ReadyState } from 'react-use-websocket';
import type { ChatEvent, ChatMessage, ErrorEvent, ReplyEvent, SendEvent } from '@/types';
import clsx from 'clsx';
import { BrowserRouter, Routes, Route } from 'react-router';
import { Marked } from 'marked';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Drawer, DrawerContent, DrawerTrigger } from '@/components/ui/drawer';
import { Settings, MessageSquare } from 'lucide-react';
import { flushSync } from 'react-dom';

const marked = new Marked({ breaks: true });
const wsUrl = import.meta.env.DEV ? '/ws/chat' : 'wss://dkellerman--frank-serve.modal.run/ws/chat';

const MODELS = [
  { id: 'google-gla:gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
  { id: 'anthropic:claude-sonnet-4-20250514', label: 'Claude Sonnet 4' },
  { id: 'groq:meta-llama/llama-4-scout-17b-16e-instruct', label: 'Llama 4 Scout' },
  { id: 'openai:gpt-4o', label: 'GPT-4o' },
  { id: 'grok:grok-4', label: 'Grok 4' },
] as const;

function Home() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [model, setModel] = useState('google-gla:gemini-2.5-flash');
  const [direct, setDirect] = useState(false);

  const messagesRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { sendJsonMessage, lastMessage, readyState } = useWebSocket(wsUrl, {
    onOpen: () => {
      console.log('WebSocket connected');
      setLoading(true);

      // send hello with session id
      const sessionId = sessionStorage.getItem('frank.sessionId') ?? createNewSessionId();
      sendJsonMessage({ type: 'hello', sessionId });
    },
    onClose: () => {
      console.log('WebSocket disconnected');
    },
    onError: (error) => {
      console.error('WebSocket error:', error);
    },
    shouldReconnect: () => true,
  });

  const connected = readyState === ReadyState.OPEN;

  useEffect(() => {
    if (!lastMessage) return;
    try {
      handleEvent(JSON.parse(lastMessage.data) as ChatEvent);
    } catch (e) {
      console.error('Failed to parse WebSocket message:', lastMessage.data);
    }
  }, [lastMessage]);

  useEffect(() => {
    if (inputRef.current && input === '') {
      inputRef.current.style.height = 'auto';
    }
  }, [input]);

  useEffect(() => {
    focusInput();
  }, [inputRef]);

  async function handleEvent(event: ChatEvent) {
    console.log('Event received:', event);
    if (event.type === 'error') {
      throw new Error((event as ErrorEvent).detail);
    } else if (event.type === 'reply') {
      handleReply(event as ReplyEvent);
    } else if (event.type === 'hello') {
      console.log('👋');
      setLoading(false);
    }
  }

  async function handleReply(event: ReplyEvent) {
    if (event.text) {
      const curMsg = messages[messages.length - 1];

      setMessages((prev) =>
        prev.map((msg, idx) =>
          idx === messages.length - 1
            ? {
                ...msg,
                content: curMsg.content + event.text,
                timestamp: curMsg.timestamp || Date.now(),
              }
            : msg
        )
      );
      scrollToBottom();
    }

    if (event.done) {
      setLoading(false);
      focusInput();
    }
  }

  async function sendMessage(message: string) {
    setLoading(true);
    flushSync(() => {
      setMessages((prev) => [
        ...prev,
        { role: 'user', content: message, timestamp: Date.now() },
        { role: 'assistant', content: '', timestamp: 0 },
      ]);
    });
    setInput('');
    scrollToBottom();
    const event: SendEvent = { type: 'send', message, model, direct };
    sendJsonMessage(event);
  }

  function focusInput() {
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  }

  function scrollToBottom() {
    messagesRef.current?.scrollTo({ top: messagesRef.current.scrollHeight, behavior: 'smooth' });
  }

  function createNewSessionId() {
    const sessionId = crypto.randomUUID();
    sessionStorage.setItem('frank.sessionId', sessionId);
    return sessionId;
  }

  function startNewChat() {
    setMessages([]);
    setInput('');
    const newSessionId = createNewSessionId();
    if (connected) {
      sendJsonMessage({ type: 'hello', sessionId: newSessionId });
    }
  }

  return (
    <div className="flex h-screen">
      <div className="w-16 bg-zinc-100 border-r border-zinc-200 flex flex-col items-center py-4 space-y-4">
        <Button
          variant="ghost"
          size="icon"
          className="h-12 w-12 hover:bg-zinc-200 transition-colors"
          onClick={startNewChat}
          title="New chat"
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
            >
              <Settings className="h-6 w-6" />
            </Button>
          </DrawerTrigger>
          <DrawerContent className="h-full w-80">
            <div className="p-6 space-y-6">
              <div className="space-y-3">
                <label className="text-sm font-medium text-zinc-700">Model</label>
                <Select value={model} onValueChange={(value) => setModel(value)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MODELS.map((model) => (
                      <SelectItem key={model.id} value={model.id}>
                        {model.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-3">
                <Checkbox
                  id="direct"
                  checked={direct}
                  onCheckedChange={(checked) => setDirect(checked as boolean)}
                />
                <label
                  htmlFor="direct"
                  className="text-sm font-medium text-zinc-600 leading-none
                  peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Direct mode
                </label>
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

        <Card className={clsx('w-full h-[80dvh] bg-zinc-50 p-4 flex flex-col')}>
          <div ref={messagesRef} className="flex-1 overflow-y-auto flex flex-col gap-2">
            {messages.map((message, idx: number) => (
              <div
                key={idx}
                className={clsx(
                  'prose prose-md p-4 rounded-md',
                  message.role === 'user' ? 'bg-blue-200' : 'bg-stone-100'
                )}
                dangerouslySetInnerHTML={{
                  __html:
                    marked.parse(message.content) +
                    (loading && idx === messages.length - 1
                      ? '<span class="mr-1"></span>' +
                        '<span class="inline-block w-2 h-5 bg-gray-800 animate-pulse" ' +
                        '  style="animation-duration: 0.6s;"></span>'
                      : ''),
                }}
              />
            ))}
          </div>

          <div className="flex flex-row gap-2">
            <Textarea
              ref={inputRef}
              className="flex-1 resize-none min-h-[40px] max-h-[200px] rounded border
               border-zinc-300 px-3 py-2 text-base transition-all"
              rows={1}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = `${e.target.scrollHeight}px`;
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  if (input.trim() && !loading && connected) {
                    sendMessage(input);
                  }
                }
              }}
              placeholder="Type your message..."
              style={{ overflow: 'hidden' }}
              disabled={!connected || loading}
            />
            <Button
              onClick={() => {
                if (input.trim() && !loading && connected) sendMessage(input);
              }}
              disabled={!connected}
            >
              Frank me
            </Button>
          </div>
        </Card>
      </main>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
