import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useStore } from '@/store';

export default function Logout() {
  const navigate = useNavigate();

  useEffect(() => {
    const run = async () => {
      const { authToken } = useStore.getState();
      if (authToken) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${authToken}` },
        });
      }
      console.debug('auth: logout');
      localStorage.removeItem('frank-store');
      useStore.setState({ authToken: null, user: null });
      navigate('/');
    };

    void run();
  }, [navigate]);

  return null;
}
