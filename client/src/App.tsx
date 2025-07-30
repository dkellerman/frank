import { BrowserRouter, Routes, Route } from 'react-router';
import { flushSync } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useState, useRef, useEffect } from 'react';
import { Marked } from 'marked';

function Home() {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const marked = new Marked();

  useEffect(() => {
    connectWebSocket();
  }, []);

  function connectWebSocket() {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    const wsUrl = import.meta.env.DEV
      ? '/ws/chat'
      : 'wss://dkellerman--frank-serve.modal.run/ws/chat';
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket connected');
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.text) {
          flushSync(() => {
            setText((prev) => prev + data.text);
          });
        }
        if (data.done) {
          setLoading(false);
        }
      } catch (e) {
        console.log('Failed to parse WebSocket message:', event.data);
      }
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }

  async function test() {
    setLoading(true);
    setText('');

    const message = {
      message:
        'Write a long essay about something important to you, highlighting ' +
        'various types of formatting and markdown you can do.',
      direct: true,
    };

    wsRef.current?.send(JSON.stringify(message));
  }

  return (
    <main className="flex flex-col items-center justify-center p-4 w-full h-full gap-6">
      <h2 className="text-3xl">I'm Frank.</h2>

      <Card className="w-full min-w-[300px] max-w-[700px] h-[80dvh] bg-zinc-50 p-4">
        <div
          className="prose prose-md overflow-y-auto w-full h-full"
          dangerouslySetInnerHTML={{
            __html:
              marked.parse(text) +
              (loading
                ? '<span class="inline-block w-2 h-5 bg-gray-800 animate-pulse ml-1"></span>'
                : ''),
          }}
        />

        <Button onClick={() => test()}>Frank me</Button>
      </Card>
    </main>
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
