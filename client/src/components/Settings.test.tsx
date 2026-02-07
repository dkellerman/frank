import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SettingsDrawer from './Settings';
import { renderWithRouter } from '@/test/helpers';

const mockSetModel = vi.fn();
const mockSetThemeMode = vi.fn();

vi.mock('@/store', () => ({
  useStore: () => ({
    model: { id: 'claude', label: 'Claude' },
    models: [
      { id: 'gpt-4', label: 'GPT-4' },
      { id: 'claude', label: 'Claude' },
    ],
    setModel: mockSetModel,
    themeMode: 'system',
    themeLabel: 'System',
    setThemeMode: mockSetThemeMode,
  }),
}));

describe('Settings drawer', () => {
  it('renders the settings trigger button', () => {
    renderWithRouter(<SettingsDrawer />);
    expect(screen.getByRole('button', { name: 'Open settings' })).toBeInTheDocument();
  });

  it('opens drawer when trigger is clicked', async () => {
    const user = userEvent.setup();
    renderWithRouter(<SettingsDrawer />);
    await user.click(screen.getByRole('button', { name: 'Open settings' }));
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('shows theme and base labels', async () => {
    const user = userEvent.setup();
    renderWithRouter(<SettingsDrawer />);
    await user.click(screen.getByRole('button', { name: 'Open settings' }));
    expect(screen.getByText('Theme:')).toBeInTheDocument();
    expect(screen.getByText('Base:')).toBeInTheDocument();
  });

  it('shows close button in drawer', async () => {
    const user = userEvent.setup();
    renderWithRouter(<SettingsDrawer />);
    await user.click(screen.getByRole('button', { name: 'Open settings' }));
    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
  });
});
