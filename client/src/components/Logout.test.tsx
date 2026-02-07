import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import Logout from './Logout';

const mockNavigate = vi.fn();

vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('@/store', () => {
  const setState = vi.fn();
  const getState = vi.fn(() => ({ authToken: 'test-token' }));
  return {
    useStore: Object.assign(vi.fn(), { getState, setState }),
  };
});

describe('Logout component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(Storage.prototype, 'removeItem');
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: true } as Response);
  });

  it('calls logout API', async () => {
    render(
      <MemoryRouter>
        <Logout />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalledWith('/api/auth/logout', {
        method: 'POST',
        headers: { Authorization: 'Bearer test-token' },
      });
    });
  });

  it('clears localStorage', async () => {
    render(
      <MemoryRouter>
        <Logout />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(localStorage.removeItem).toHaveBeenCalledWith('frank-store');
    });
  });

  it('navigates to home', async () => {
    render(
      <MemoryRouter>
        <Logout />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  it('renders nothing', () => {
    const { container } = render(
      <MemoryRouter>
        <Logout />
      </MemoryRouter>
    );
    expect(container.innerHTML).toBe('');
  });
});
