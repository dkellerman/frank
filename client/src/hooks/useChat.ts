import useWebSocket, { ReadyState } from 'react-use-websocket';
import { flushSync } from 'react-dom';
import { useEffect, useCallback } from 'react';
import type {
  ChatEvent,
  ErrorEvent,
  ReplyEvent,
  SendEvent,
  NewChatAckEvent,
  NewChatEvent,
  InitializeAckEvent,
  Chat,
  ChatMessage,
} from '@/types';
import { EventType } from '@/types';
import { useStore } from '@/store';
import { useNavigate, useParams } from 'react-router';

const wsUrl = '/ws/chat';

export default function useChat() {
  const { model, history, addMessage, clearHistory, setHistory } = useStore();
  const navigate = useNavigate();
  const params = useParams<{ id?: string }>();
  const chatId = params.id;

  const { sendJsonMessage, lastMessage, readyState } = useWebSocket(wsUrl, {
    onOpen: () => {
      useStore.setState({ loading: true });
      sendJsonMessage({ type: EventType.INITIALIZE, chatId });
      console.log('[useChat] ws open');
    },
    shouldReconnect: () => true,
  });

  useEffect(() => {
    useStore.setState({ connected: readyState === ReadyState.OPEN });
  }, [readyState]);

  const sendMessage = useCallback(
    async (message: string) => {
      flushSync(() => {
        addMessage({ role: 'user', content: message, timestamp: Date.now() });
        addMessage({ role: 'assistant', content: '', timestamp: 0 });
      });
      useStore.setState({ sending: true });

      if (chatId) {
        const event: SendEvent = { type: EventType.SEND, chatId, message, model: model?.id };
        sendJsonMessage(event);
      } else {
        const newChat: NewChatEvent = { type: EventType.NEW_CHAT, message, model: model?.id };
        sendJsonMessage(newChat);
      }
    },
    [addMessage, chatId, model?.id, sendJsonMessage]
  );

  const startNewChat = useCallback(() => {
    clearHistory();
    navigate('/');
  }, [clearHistory, navigate]);

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

  async function handleEvent(event: ChatEvent) {
    console.log('received event', event.type);

    if (event.type === EventType.ERROR) {
      throw new Error((event as ErrorEvent).detail);
    } else if (event.type === EventType.REPLY) {
      handleReply(event as ReplyEvent);
    } else if (event.type === EventType.INITIALIZE_ACK) {
      const { models } = event as InitializeAckEvent;
      useStore.getState().setModels(models);
      useStore.setState({ loading: false });
    } else if (event.type === EventType.NEW_CHAT_ACK) {
      const { chatId } = event as NewChatAckEvent;
      navigate(`/chats/${chatId}`);
    }
  }

  async function handleReply(event: ReplyEvent) {
    if (event.text) {
      const lastMsg = history[history.length - 1];
      if (lastMsg && lastMsg.role === 'assistant') {
        setHistory([
          ...history.slice(0, -1),
          {
            ...lastMsg,
            content: lastMsg.content + event.text,
            timestamp: lastMsg.timestamp || Date.now(),
          },
        ]);
      } else {
        setHistory([...history, { role: 'assistant', content: event.text, timestamp: Date.now() }]);
      }
    }
    if (event.done) {
      useStore.setState({ sending: false });
    }
  }

  const loadHistory = useCallback(
    async (chatId: string) => {
      const resp = await fetch(`/api/chats/${chatId}`);
      const data: Chat = await resp.json();
      const messages: ChatMessage[] = (data.history ?? []).map((m) => {
        const parts = (m.parts ?? []).filter((p) =>
          m.kind === 'request' ? p.part_kind === 'user-prompt' : p.part_kind === 'text'
        );
        const ts = parts[0]?.timestamp as string;
        return {
          role: m.kind === 'request' ? 'user' : 'assistant',
          content: parts
            .map((p) => p.content as string)
            .join('')
            .trim(),
          timestamp: ts ? Date.parse(ts) : Date.now(),
        };
      });
      if (!messages?.length && data.curQuery?.prompt) {
        messages.push({ role: 'user', content: data.curQuery.prompt, timestamp: Date.now() });
        if (data.pending) messages.push({ role: 'assistant', content: '', timestamp: 0 });
      }
      setHistory(messages);
    },
    [setHistory]
  );

  useEffect(() => {
    useStore.setState({ startNewChat, sendMessage, loadHistory });
  }, [startNewChat, sendMessage, loadHistory]);
}
