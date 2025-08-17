import useWebSocket, { ReadyState } from 'react-use-websocket';
import { flushSync } from 'react-dom';
import { useEffect, useCallback, useMemo } from 'react';
import type {
  ChatEvent,
  ErrorEvent,
  ReplyEvent,
  SendEvent,
  NewChatAckEvent,
  NewChatEvent,
  InitializeAckEvent,
  UserChat,
} from '@/types';
import { EventType } from '@/types';
import { useStore } from '@/store';
import { useNavigate } from 'react-router';

export default function useChat(chatId?: string) {
  const { model, history, addMessage, clearHistory, setHistory, authToken } = useStore();
  const shouldConnect = useMemo(() => !!authToken, [authToken]);
  const navigate = useNavigate();

  const { sendJsonMessage, lastMessage, readyState } = useWebSocket(
    `/ws/chat?token=${authToken}`,
    {
      onOpen: async () => {
        useStore.setState({ loading: true });
        if (chatId) await loadChat(chatId);
        sendJsonMessage({
          type: EventType.INITIALIZE,
          chatId,
          ts: new Date().toISOString(),
        });
        console.log('ws open');
      },
      shouldReconnect: () => shouldConnect,
    },
    shouldConnect
  );

  useEffect(() => {
    useStore.setState({ connected: readyState === ReadyState.OPEN });
  }, [readyState]);

  const sendMessage = useCallback(
    async (message: string) => {
      flushSync(() => {
        addMessage({ role: 'user', content: message });
      });
      useStore.setState({ sending: true });

      if (chatId) {
        // add placeholder message
        if (chatId) addMessage({ role: 'assistant', content: '' });
        const event: SendEvent = {
          type: EventType.SEND,
          chatId,
          message,
          model: model?.id ?? null,
          ts: new Date().toISOString(),
        };
        sendJsonMessage(event);
      } else {
        const newChat: NewChatEvent = {
          type: EventType.NEW_CHAT,
          message,
          model: model?.id ?? null,
          ts: new Date().toISOString(),
        };
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
    console.log('received event', event.type, event);

    switch (event.type) {
      case EventType.ERROR:
        throw new Error((event as ErrorEvent).detail);

      case EventType.REPLY:
        handleReply(event as ReplyEvent);
        break;

      case EventType.INITIALIZE_ACK: {
        const { models } = event as InitializeAckEvent;
        useStore.getState().setModels(models);
        useStore.setState({ loading: false });
        break;
      }

      case EventType.NEW_CHAT_ACK: {
        const { chatId: newChatId } = event as NewChatAckEvent;
        navigate(`/chats/${newChatId}`);
        break;
      }
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
          },
        ]);
      } else {
        setHistory([...history, { role: 'assistant', content: event.text }]);
      }
    }

    if (event.done) {
      useStore.setState({ sending: false });
    }
  }

  const loadChat = useCallback(
    async (chatId: string) => {
      console.log('load chat', chatId);

      const resp = await fetch(`/api/chats/${chatId}`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      const data: UserChat = await resp.json();
      const messages = data.history ?? [];

      if (!messages?.length && data.curQuery?.prompt) {
        messages.push({
          role: 'user',
          content: data.curQuery.prompt,
        });
        // add placeholder message if assistant message is pending
        if (data.pending) messages.push({ role: 'assistant', content: '' });
      }
      setHistory(messages);
    },
    [setHistory, authToken]
  );

  useEffect(() => {
    useStore.setState({ startNewChat, sendMessage, loadChat });
  }, [startNewChat, sendMessage, loadChat]);
}
