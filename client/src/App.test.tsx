import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';

vi.mock('@/hooks/useChat', () => ({
  default: vi.fn(),
}));

vi.mock('@/store', () => ({
  useStore: () => ({
    connected: true,
    loading: false,
    sending: false,
    sendMessage: vi.fn(),
    startNewChat: vi.fn(),
    history: [],
    model: null,
    models: [],
    setModel: vi.fn(),
    themeMode: 'system',
    themeLabel: 'System',
    setThemeMode: vi.fn(),
  }),
}));

describe('App', () => {
  it('renders the home page by default', () => {
    render(<App />);
    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading).toBeInTheDocument();
    expect(heading.textContent).toContain('Frank');
  });

  it('renders the chat input on home page', () => {
    render(<App />);
    expect(screen.getByPlaceholderText('What can I do you for?')).toBeInTheDocument();
  });
});
