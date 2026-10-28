/**
 * adminCache.ts
 * Module-level in-memory cache cho tất cả Admin pages.
 * Vì đây là module singleton, cache tồn tại trong suốt phiên làm việc của browser.
 * Khi user điều hướng giữa các trang admin, dữ liệu được trả về ngay lập tức từ cache
 * trong khi request mới đang chạy ngầm để cập nhật (stale-while-revalidate).
 */

type CacheEntry<T> = {
  data: T;
  timestamp: number;
};

type Subscriber = () => void;

const CACHE_TTL = 5 * 60 * 1000; // 5 phút – dữ liệu còn "tươi"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const cache = new Map<string, CacheEntry<any>>();
const inflightPromises = new Map<string, Promise<unknown>>();
const subscribers = new Map<string, Set<Subscriber>>();

/** Đọc từ cache (trả về undefined nếu chưa có hoặc đã hết hạn) */
export function getCached<T>(key: string): T | undefined {
  const entry = cache.get(key) as CacheEntry<T> | undefined;
  if (!entry) return undefined;
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    cache.delete(key);
    return undefined;
  }
  return entry.data;
}

/** Ghi vào cache và thông báo cho tất cả subscriber */
export function setCached<T>(key: string, data: T): void {
  cache.set(key, { data, timestamp: Date.now() });
  const subs = subscribers.get(key);
  if (subs) subs.forEach((fn) => fn());
}

/** Xoá cache của một key (ví dụ sau khi tạo/cập nhật/xoá) */
export function invalidateCache(key: string): void {
  cache.delete(key);
  inflightPromises.delete(key);
}

/** Đăng ký callback khi cache được cập nhật */
export function subscribeCache(key: string, fn: Subscriber): () => void {
  if (!subscribers.has(key)) subscribers.set(key, new Set());
  subscribers.get(key)!.add(fn);
  return () => subscribers.get(key)?.delete(fn);
}

/**
 * Fetch dữ liệu với chiến lược stale-while-revalidate:
 * 1. Nếu cache còn hợp lệ → trả về ngay lập tức, đồng thời revalidate ngầm
 * 2. Nếu cache đã hết hạn / chưa có → fetch và chờ kết quả
 * 3. Nếu đang có request cùng key → dùng chung promise (deduplicate)
 */
export async function fetchWithCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  forceRefresh = false,
): Promise<T> {
  const cached = getCached<T>(key);

  if (cached !== undefined && !forceRefresh) {
    // Revalidate ngầm (không await) để cập nhật dữ liệu mới nhất
    void revalidate(key, fetcher);
    return cached;
  }

  // Nếu đã có request đang chạy, dùng chung
  if (inflightPromises.has(key)) {
    return inflightPromises.get(key) as Promise<T>;
  }

  const promise = fetcher().then((data) => {
    setCached(key, data);
    inflightPromises.delete(key);
    return data;
  }).catch((err) => {
    inflightPromises.delete(key);
    throw err;
  });

  inflightPromises.set(key, promise);
  return promise;
}

async function revalidate<T>(key: string, fetcher: () => Promise<T>): Promise<void> {
  // Không revalidate nếu đang có request rồi
  if (inflightPromises.has(key)) return;
  try {
    const promise = fetcher().then((data) => {
      setCached(key, data);
      inflightPromises.delete(key);
      return data;
    }).catch(() => {
      inflightPromises.delete(key);
    });
    inflightPromises.set(key, promise);
    await promise;
  } catch {
    // silent
  }
}

/**
 * Prefetch: bắt đầu fetch trước (dùng khi hover sidebar link)
 * Nếu cache còn hợp lệ thì không làm gì.
 */
export function prefetch<T>(key: string, fetcher: () => Promise<T>): void {
  if (getCached<T>(key) !== undefined) return;
  void fetchWithCache(key, fetcher);
}
