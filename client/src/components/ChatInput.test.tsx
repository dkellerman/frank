import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ChatInput from './ChatInput';

const mockSendMessage = vi.fn();

vi.mock('@/store', () => ({
  useStore: () => ({
    connected: true,
    loading: false,
    sending: false,
    sendMessage: mockSendMessage,
  }),
}));

describe('ChatInput component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders textarea with placeholder', () => {
    render(<ChatInput placeholder="Type here..." />);
    expect(screen.getByPlaceholderText('Type here...')).toBeInTheDocument();
  });

  it('renders with default placeholder', () => {
    render(<ChatInput />);
    expect(screen.getByPlaceholderText('What can I do you for?')).toBeInTheDocument();
  });

  it('renders send button', () => {
    render(<ChatInput />);
    expect(screen.getByRole('button', { name: 'Send message' })).toBeInTheDocument();
  });

  it('send button is disabled when input is empty', () => {
    render(<ChatInput />);
    expect(screen.getByRole('button', { name: 'Send message' })).toBeDisabled();
  });

  it('send button is enabled when input has text', async () => {
    const user = userEvent.setup();
    render(<ChatInput />);
    const textarea = screen.getByPlaceholderText('What can I do you for?');
    await user.type(textarea, 'hello');
    expect(screen.getByRole('button', { name: 'Send message' })).toBeEnabled();
  });

  it('updates text value on typing', async () => {
    const user = userEvent.setup();
    render(<ChatInput />);
    const textarea = screen.getByPlaceholderText('What can I do you for?');
    await user.type(textarea, 'test message');
    expect(textarea).toHaveValue('test message');
  });
});
