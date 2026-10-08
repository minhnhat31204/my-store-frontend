"use client";

import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, type ReactNode } from "react";

// Lưu vị trí cuộn cho từng URL path
const scrollPositions = new Map<string, number>();

function getStorageKey(path: string) {
  return `scroll_pos_${path}`;
}

function saveScrollPosition(path?: string, y?: number) {
  if (typeof window === "undefined") return;
  const currentPath = path || (window.location.pathname + window.location.search);
  const scrollY = y !== undefined ? y : window.scrollY;
  if (!currentPath) return;

  scrollPositions.set(currentPath, scrollY);
  try {
    sessionStorage.setItem(getStorageKey(currentPath), String(Math.round(scrollY)));
  } catch {}
}

function getSavedScrollPosition(path?: string): number {
  if (typeof window === "undefined") return 0;
  const currentPath = path || (window.location.pathname + window.location.search);
  if (!currentPath) return 0;

  if (scrollPositions.has(currentPath)) {
    return scrollPositions.get(currentPath)!;
  }
  try {
    const saved = sessionStorage.getItem(getStorageKey(currentPath));
    if (saved !== null) {
      const num = parseFloat(saved);
      if (!isNaN(num)) {
        scrollPositions.set(currentPath, num);
        return num;
      }
    }
  } catch {}
  return 0;
}

export default function PageTransitionProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isPopNavigationRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Thiết lập scrollRestoration manual để tự kiểm soát vị trí chính xác
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }

    const handlePopState = () => {
      isPopNavigationRef.current = true;
      try {
        sessionStorage.setItem("is_pop_nav", "1");
      } catch {}
    };

    let scrollTimeout: NodeJS.Timeout | null = null;
    const handleScroll = () => {
      if (scrollTimeout) return;
      scrollTimeout = setTimeout(() => {
        scrollTimeout = null;
        if (typeof window !== "undefined") {
          saveScrollPosition();
        }
      }, 40);
    };

    const handleClick = () => {
      // Khi bấm vào bất kỳ link, nút hoặc thẻ nào, lưu ngay vị trí cuộn của trang hiện tại
      if (typeof window !== "undefined") {
        saveScrollPosition();
      }
    };

    window.addEventListener("popstate", handlePopState);
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("click", handleClick, { capture: true, passive: true });
    window.addEventListener("beforeunload", () => saveScrollPosition());

    return () => {
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("click", handleClick, { capture: true });
      if (scrollTimeout) clearTimeout(scrollTimeout);
    };
  }, []);

  useLayoutEffect(() => {
    if (typeof window === "undefined") return;

    let isBack = isPopNavigationRef.current;
    isPopNavigationRef.current = false;

    try {
      if (sessionStorage.getItem("is_pop_nav") === "1") {
        isBack = true;
        sessionStorage.removeItem("is_pop_nav");
      }
    } catch {}

    const currentKey = window.location.pathname + window.location.search;

    if (isBack) {
      const targetY = getSavedScrollPosition(currentKey);
      if (targetY > 0) {
        const doScroll = () => {
          window.scrollTo({ top: targetY, left: 0, behavior: "instant" });
          window.dispatchEvent(new Event("store-scroll-restored"));
        };

        doScroll();
        requestAnimationFrame(doScroll);

        const t1 = setTimeout(doScroll, 30);
        const t2 = setTimeout(doScroll, 80);
        const t3 = setTimeout(doScroll, 160);
        const t4 = setTimeout(doScroll, 300);

        return () => {
          clearTimeout(t1);
          clearTimeout(t2);
          clearTimeout(t3);
          clearTimeout(t4);
        };
      }
    } else {
      // Nếu là điều hướng tới trang mới bình thường (không phải back)
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    }
  }, [pathname]);

  return (
    <div key={pathname} className="page-transition-wrapper site-content">
      {children}
    </div>
  );
}
