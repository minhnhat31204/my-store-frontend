import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getStoredUser } from '@/lib/api';

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
  }, [router]);
}
