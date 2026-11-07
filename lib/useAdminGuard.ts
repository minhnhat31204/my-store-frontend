import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { clearStoredToken, getStoredToken, getStoredUser, api } from '@/lib/api';

export function useAdminGuard() {
  const router = useRouter();
  useEffect(() => {
    const user = getStoredUser();
    const token = getStoredToken();
    if (!user || !token) {
      clearStoredToken();
      router.replace('/login');
      return;
    }

    if (String(user.Role || '').toLowerCase() !== 'admin') {
      router.replace('/');
      return;
    }

    // Xác thực thực tế với máy chủ bằng Token để triệt hạ hành vi sửa đổi localStorage trên trình duyệt
    api.getMe()
      .then((res) => {
        const liveUser = (res as any)?.user || res;
        if (!liveUser || String(liveUser.Role || '').toLowerCase() !== 'admin') {
          router.replace('/');
        }
      })
      .catch(() => {
        clearStoredToken();
        router.replace('/login?session=expired');
      });
  }, [router]);
}
