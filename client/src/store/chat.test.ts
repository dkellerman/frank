import { describe, it, expect, beforeEach } from 'vitest';
import { create } from 'zustand';
import { createChatSlice } from './chat';
import type { ChatState } from '@/types';

function createTestStore() {
  return create<ChatState>()((...args) => createChatSlice(...args));
}

describe('chat store slice', () => {
  let store: ReturnType<typeof createTestStore>;

  beforeEach(() => {
    store = createTestStore();
  });

  it('initializes with empty history', () => {
    expect(store.getState().history).toEqual([]);
  });

  it('initializes with loading/sending/connected as false', () => {
    const state = store.getState();
    expect(state.loading).toBe(false);
    expect(state.sending).toBe(false);
    expect(state.connected).toBe(false);
  });

  it('setHistory replaces history', () => {
    const messages = [
      { role: 'user' as const, content: 'hello' },
      { role: 'assistant' as const, content: 'hi' },
    ];
    store.getState().setHistory(messages);
    expect(store.getState().history).toEqual(messages);
  });

  it('clearHistory resets to empty', () => {
    store.getState().setHistory([{ role: 'user', content: 'hello' }]);
    store.getState().clearHistory();
    expect(store.getState().history).toEqual([]);
  });

  it('addMessage appends to history', () => {
    store.getState().addMessage({ role: 'user', content: 'hello' });
    expect(store.getState().history).toEqual([{ role: 'user', content: 'hello' }]);
  });

  it('addMessage appends multiple messages', () => {
    store.getState().addMessage({ role: 'user', content: 'hello' });
    store.getState().addMessage({ role: 'assistant', content: 'hi' });
    expect(store.getState().history).toHaveLength(2);
    expect(store.getState().history[0]).toEqual({ role: 'user', content: 'hello' });
    expect(store.getState().history[1]).toEqual({ role: 'assistant', content: 'hi' });
  });
});
