import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import Messages from './Messages';

vi.mock('@/store', () => ({
  useStore: () => ({
    history: [
      { role: 'user', content: 'Hello' },
      { role: 'assistant', content: 'Hi there!' },
    ],
    sending: false,
  }),
}));

// Mock react-virtual since it needs real DOM measurements
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

describe('Messages component', () => {
  it('renders messages from history', () => {
    const { container } = render(<Messages />);
    expect(container.innerHTML).toContain('Hello');
    expect(container.innerHTML).toContain('Hi there!');
  });

  it('renders correct number of messages', () => {
    const { container } = render(<Messages />);
    const messageElements = container.querySelectorAll('[data-index]');
    expect(messageElements).toHaveLength(2);
  });
});
