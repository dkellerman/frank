import useWebSocket, { ReadyState } from 'react-use-websocket';
import { flushSync } from 'react-dom';
import { useState, useEffect } from 'react';
import type {
  ChatEvent,
  ErrorEvent,
  ReplyEvent,
  SendEvent,
  NewChatAckEvent,
  NewChatEvent,
} from '@/types';
import { EventType } from '@/types';
import { useStore } from '@/store';
import { useNavigate, useParams } from 'react-router';

const wsUrl = import.meta.env.DEV ? '/ws/chat' : 'wss://dkellerman--frank-serve.modal.run/ws/chat';

type UseChatProps = {
  onReply?: (event: ReplyEvent) => void;
  onUserMessage?: (message: string) => void;
  onInitialized?: () => void;
};

export default function useChat({ onReply, onUserMessage, onInitialized }: UseChatProps) {
  const [loading, setLoading] = useState(false); // page loading
  const [sending, setSending] = useState(false); // sending message and awaiting response
  const { model, history, addMessage, clearHistory, setHistory } = useStore();
  const navigate = useNavigate();
  const params = useParams<{ id?: string }>();
  const chatId = params.id;

  const { sendJsonMessage, lastMessage, readyState } = useWebSocket(wsUrl, {
    onOpen: () => {
      console.log('WebSocket connected');
      setLoading(true);

      // send initialize: include chatId if on /chats/:id
      sendJsonMessage({ type: EventType.INITIALIZE, chatId });
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

  // handle incoming websocket events
  useEffect(() => {
    if (!lastMessage) return;
    try {
      const ev = JSON.parse(lastMessage.data) as ChatEvent;
      handleEvent(ev);
    } catch {
      console.error('Failed to parse WebSocket message:', lastMessage.data);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastMessage]);

  // handle incoming websocket events
  async function handleEvent(event: ChatEvent) {
    console.log('Event received:', event.type, event);
    if (event.type === EventType.ERROR) {
      throw new Error((event as ErrorEvent).detail);
    } else if (event.type === EventType.REPLY) {
      handleReply(event as ReplyEvent);
    } else if (event.type === EventType.INITIALIZE) {
      console.log('👋');
      setLoading(false);
      onInitialized?.();
    } else if (event.type === EventType.NEW_CHAT_ACK) {
      const { chatId } = event as NewChatAckEvent;
      navigate(`/chats/${chatId}`);
    }
  }

  // handle incoming reply events
  async function handleReply(event: ReplyEvent) {
    if (event.text) {
      const curMsg = history[history.length - 1];
      setHistory([
        ...history.slice(0, -1),
        {
          ...curMsg,
          content: curMsg.content + event.text,
          timestamp: curMsg.timestamp || Date.now(),
        },
      ]);
    }

    if (event.done) {
      setSending(false);
      onReply?.(event);
    }
  }

  // send message to server
  async function sendMessage(message: string) {
    flushSync(() => {
      addMessage({ role: 'user', content: message, timestamp: Date.now() });
      addMessage({ role: 'assistant', content: '', timestamp: 0 });
    });

    setSending(true);
    onUserMessage?.(message);

    if (chatId) {
      const event: SendEvent = { type: EventType.SEND, chatId, message, model: model.id };
      sendJsonMessage(event);
    } else {
      const newChat: NewChatEvent = { type: EventType.NEW_CHAT, message, model: model.id };
      sendJsonMessage(newChat);
    }
  }

  function startNewChat() {
    clearHistory();
    navigate('/');
  }

  return { loading, sending, connected, startNewChat, sendMessage };
}
