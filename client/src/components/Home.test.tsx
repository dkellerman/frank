import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import Home from './Home';
import { renderWithRouter } from '@/test/helpers';

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
    model: null,
    models: [],
    setModel: vi.fn(),
    themeMode: 'system',
    themeLabel: 'System',
    setThemeMode: vi.fn(),
  }),
}));

describe('Home component', () => {
  it('renders the greeting heading', () => {
    renderWithRouter(<Home />);
    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading).toBeInTheDocument();
    expect(heading.textContent).toContain('Frank');
  });

  it('renders the chat input', () => {
    renderWithRouter(<Home />);
    expect(screen.getByPlaceholderText('What can I do you for?')).toBeInTheDocument();
  });

  it('renders the nav bar', () => {
    renderWithRouter(<Home />);
    expect(screen.getByAltText('Frank')).toBeInTheDocument();
  });
});
