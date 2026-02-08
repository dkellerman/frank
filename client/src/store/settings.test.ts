import { describe, it, expect, beforeEach } from 'vitest';
import { createSettingsSlice } from './settings';
import type { SettingsState, ChatModel } from '@/types';

function createTestStore(): SettingsState {
  let state: SettingsState = {} as SettingsState;
  const set = (partial: Partial<SettingsState>) => {
    Object.assign(state, partial);
  };
  const get = () => state;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  state = createSettingsSlice(set as any, get as any, {} as any);
  return state;
}

const mockModels: ChatModel[] = [
  { id: 'gpt-4', label: 'GPT-4', isDefault: false },
  { id: 'claude', label: 'Claude', isDefault: true },
  { id: 'gemini', label: 'Gemini', isDefault: false },
];

describe('settings store slice', () => {
  let store: SettingsState;

  beforeEach(() => {
    store = createTestStore();
  });

  it('initializes with empty models and null model', () => {
    expect(store.models).toEqual([]);
    expect(store.model).toBeNull();
  });

  it('initializes with system theme mode', () => {
    expect(store.themeMode).toBe('system');
    expect(store.themeLabel).toBe('System');
  });

  it('setModels sets models and selects the default', () => {
    store.setModels(mockModels);
    expect(store.models).toEqual(mockModels);
    expect(store.model).toEqual({ id: 'claude', label: 'Claude', isDefault: true });
  });

  it('setModels falls back to first model if no default', () => {
    const noDefault = mockModels.map((m) => ({ ...m, isDefault: false }));
    store.setModels(noDefault);
    expect(store.model?.id).toBe('gpt-4');
  });

  it('setModels preserves current model if still valid', () => {
    store.setModels(mockModels);
    store.setModel('gpt-4');
    // Re-set models — should keep gpt-4 since it's still in the list
    store.setModels(mockModels);
    expect(store.model?.id).toBe('gpt-4');
  });

  it('setModels uses new default when user has not explicitly selected a model', () => {
    store.setModels(mockModels);
    expect(store.model?.id).toBe('claude'); // initial default

    // Server sends updated models with a different default
    const newModels = mockModels.map((m) => ({
      ...m,
      isDefault: m.id === 'gemini',
    }));
    store.setModels(newModels);
    expect(store.model?.id).toBe('gemini'); // follows new default
  });

  it('setModel selects a model by id', () => {
    store.setModels(mockModels);
    store.setModel('gemini');
    expect(store.model?.id).toBe('gemini');
    expect(store.model?.label).toBe('Gemini');
  });

  it('setModel marks userSelectedModel as true', () => {
    store.setModels(mockModels);
    expect(store.userSelectedModel).toBe(false);
    store.setModel('gpt-4');
    expect(store.userSelectedModel).toBe(true);
  });

  it('setThemeMode updates mode and label', () => {
    store.setThemeMode('dark');
    expect(store.themeMode).toBe('dark');
    expect(store.themeLabel).toBe('Dark');

    store.setThemeMode('light');
    expect(store.themeMode).toBe('light');
    expect(store.themeLabel).toBe('Light');

    store.setThemeMode('system');
    expect(store.themeMode).toBe('system');
    expect(store.themeLabel).toBe('System');
  });
});
