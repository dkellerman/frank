import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router';
import Chat from './Chat';

vi.mock('@/hooks/useChat', () => ({
  default: vi.fn(),
}));

vi.mock('@/store', () => {
  const state = {
    connected: true,
    loading: false,
    sending: false,
    sendMessage: vi.fn(),
    startNewChat: vi.fn(),
    history: [
      { role: 'user', content: 'Test question' },
      { role: 'assistant', content: 'Test answer' },
    ],
    model: null,
    models: [],
    setModel: vi.fn(),
    themeMode: 'system',
    themeLabel: 'System',
    setThemeMode: vi.fn(),
    scrollToTop: false,
  };
  return {
    useStore: Object.assign(() => state, {
      getState: () => state,
      setState: vi.fn(),
    }),
  };
});

vi.mock('@tanstack/react-virtual', () => ({
  useVirtualizer: ({ count }: { count: number }) => ({
    getVirtualItems: () =>
      Array.from({ length: count }, (_, i) => ({
        index: i,
        key: i,
        start: i * 75,
        size: 75,
      })),
    getTotalSize: () => count * 75,
    scrollToIndex: vi.fn(),
    measureElement: vi.fn(),
  }),
}));

describe('Chat component', () => {
  function renderChat(chatId = 'chat-123') {
    return render(
      <MemoryRouter initialEntries={[`/chats/${chatId}`]}>
        <Routes>
          <Route path="/chats/:id" element={<Chat />} />
        </Routes>
      </MemoryRouter>
    );
  }

  it('renders the nav bar', () => {
    renderChat();
    expect(screen.getByAltText('Frank')).toBeInTheDocument();
  });

  it('renders the chat input', () => {
    renderChat();
    expect(screen.getByPlaceholderText('What can I do you for?')).toBeInTheDocument();
  });

  it('renders messages', () => {
    const { container } = renderChat();
    expect(container.innerHTML).toContain('Test question');
    expect(container.innerHTML).toContain('Test answer');
  });
});
