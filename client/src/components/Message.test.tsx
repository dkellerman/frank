import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Message from './Message';

describe('Message component', () => {
  it('renders user message with correct styling', () => {
    const { container } = render(
      <Message entry={{ role: 'user', content: 'Hello there' }} showCursor={false} />
    );
    const div = container.querySelector('.prose');
    expect(div).toBeInTheDocument();
    expect(div).toHaveClass('self-end');
    expect(div?.innerHTML).toContain('Hello there');
  });

  it('renders assistant message with correct styling', () => {
    const { container } = render(
      <Message entry={{ role: 'assistant', content: 'Hi!' }} showCursor={false} />
    );
    const div = container.querySelector('.prose');
    expect(div).toHaveClass('self-start');
    expect(div?.innerHTML).toContain('Hi!');
  });

  it('renders markdown content', () => {
    const { container } = render(
      <Message entry={{ role: 'assistant', content: '**bold text**' }} showCursor={false} />
    );
    const strong = container.querySelector('strong');
    expect(strong).toBeInTheDocument();
    expect(strong?.textContent).toBe('bold text');
  });

  it('shows cursor when showCursor is true', () => {
    const { container } = render(
      <Message entry={{ role: 'assistant', content: 'thinking...' }} showCursor={true} />
    );
    const pulse = container.querySelector('.animate-pulse');
    expect(pulse).toBeInTheDocument();
  });

  it('does not show cursor when showCursor is false', () => {
    const { container } = render(
      <Message entry={{ role: 'assistant', content: 'done' }} showCursor={false} />
    );
    const pulse = container.querySelector('.animate-pulse');
    expect(pulse).not.toBeInTheDocument();
  });
});
