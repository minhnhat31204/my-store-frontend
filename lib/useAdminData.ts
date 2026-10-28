'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchWithCache, getCached, subscribeCache, invalidateCache } from './adminCache';

export type UseAdminDataResult<T> = {
  data: T | undefined;
  loading: boolean;
  error: string;
  reload: (force?: boolean) => Promise<void>;
};

/**
 * Hook dùng cho tất cả admin pages.
 * - Nếu cache có dữ liệu → hiển thị ngay, đồng thời revalidate ngầm
 * - Nếu chưa có cache → fetch và set loading = true
 * - Khi cache được cập nhật (ngầm) → tự động re-render
 */
export function useAdminData<T>(
  key: string,
  fetcher: () => Promise<T>,
): UseAdminDataResult<T> {
  const [data, setData] = useState<T | undefined>(() => getCached<T>(key));
  const [loading, setLoading] = useState<boolean>(() => getCached<T>(key) === undefined);
  const [error, setError] = useState('');
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const load = useCallback(async (force = false) => {
    // Nếu không force và cache có rồi → không show loading spinner
    const hasCached = getCached<T>(key) !== undefined;
    if (!hasCached || force) setLoading(true);
    setError('');
    try {
      const result = await fetchWithCache(key, () => fetcherRef.current(), force);
      setData(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Lỗi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  }, [key]);

  useEffect(() => {
    // Đăng ký listener để nhận cập nhật khi cache thay đổi ngầm
    const unsub = subscribeCache(key, () => {
      const fresh = getCached<T>(key);
      if (fresh !== undefined) {
        setData(fresh);
        setLoading(false);
      }
    });

    // Load dữ liệu (ngay lập tức nếu có cache, hoặc fetch nếu chưa)
    void load(false);

    return unsub;
  }, [key, load]);

  const reload = useCallback(async (force = true) => {
    if (force) invalidateCache(key);
    await load(force);
  }, [key, load]);

  return { data, loading, error, reload };
}
