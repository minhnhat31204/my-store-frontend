import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { clearStoredToken, getStoredToken, getStoredUser } from '@/lib/api';

export function useAdminGuard() {
  const router = useRouter();
  useEffect(() => {
    const user = getStoredUser();
    if (!user) {
      router.replace('/login');
      return;
    }
    if (String(user.Role || '').toLowerCase() !== 'admin') {
      router.replace('/');
      return;
    }
    if (!getStoredToken()) {
      localStorage.removeItem('user');
      sessionStorage.removeItem('user');
      clearStoredToken();
      window.dispatchEvent(new Event('user-updated'));
      router.replace('/login?session=expired');
    }
  }, [router]);
}
