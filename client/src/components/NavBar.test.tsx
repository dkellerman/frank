import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import NavBar from './NavBar';
import { renderWithRouter } from '@/test/helpers';

const mockStartNewChat = vi.fn();

vi.mock('@/store', () => ({
  useStore: () => ({
    startNewChat: mockStartNewChat,
    model: null,
    models: [],
    setModel: vi.fn(),
    themeMode: 'system',
    themeLabel: 'System',
    setThemeMode: vi.fn(),
  }),
}));

describe('NavBar component', () => {
  it('renders brand logo', () => {
    renderWithRouter(<NavBar />);
    const logo = screen.getByAltText('Frank');
    expect(logo).toBeInTheDocument();
    expect(logo).toHaveAttribute('src', '/favicon.png?v=3');
  });

  it('renders new chat button', () => {
    renderWithRouter(<NavBar />);
    expect(screen.getByRole('button', { name: 'New chat' })).toBeInTheDocument();
  });

  it('renders settings button', () => {
    renderWithRouter(<NavBar />);
    expect(screen.getByRole('button', { name: 'Open settings' })).toBeInTheDocument();
  });

  it('brand logo links to home', () => {
    renderWithRouter(<NavBar />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/');
  });
});
