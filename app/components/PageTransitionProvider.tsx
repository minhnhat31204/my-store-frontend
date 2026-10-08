"use client";

import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, type ReactNode } from "react";

const scrollPositions = new Map<string, number>();

function getStorageKey(path: string) {
  return `scroll_pos_${path}`;
}

function saveScrollPosition(path: string, y: number) {
  if (!path) return;
  scrollPositions.set(path, y);
  if (typeof window !== "undefined") {
    try {
      sessionStorage.setItem(getStorageKey(path), String(y));
    } catch {}
  }
}

function getSavedScrollPosition(path: string): number | null {
  if (!path) return null;
  if (scrollPositions.has(path)) {
    return scrollPositions.get(path)!;
  }
  if (typeof window !== "undefined") {
    try {
      const saved = sessionStorage.getItem(getStorageKey(path));
      if (saved !== null) {
        const num = parseFloat(saved);
        if (!isNaN(num)) {
          scrollPositions.set(path, num);
          return num;
        }
      }
    } catch {}
  }
  return null;
}

export default function PageTransitionProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const prevPathRef = useRef(pathname);
  const isPopNavigationRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }

    const handlePopState = () => {
      isPopNavigationRef.current = true;
    };

    let scrollTimeout: NodeJS.Timeout | null = null;
    const handleScroll = () => {
      if (scrollTimeout) return;
      scrollTimeout = setTimeout(() => {
        scrollTimeout = null;
        if (typeof window !== "undefined") {
          saveScrollPosition(window.location.pathname + window.location.search, window.scrollY);
        }
      }, 80);
    };

    const handleClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement)?.closest("a, button, [role='button'], .product-card");
      if (target && typeof window !== "undefined") {
        saveScrollPosition(window.location.pathname + window.location.search, window.scrollY);
      }
    };

    window.addEventListener("popstate", handlePopState);
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("click", handleClick, { capture: true, passive: true });

    return () => {
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("click", handleClick, { capture: true });
      if (scrollTimeout) clearTimeout(scrollTimeout);
    };
  }, []);

  useLayoutEffect(() => {
    if (typeof window === "undefined") return;

    const currentKey = window.location.pathname + window.location.search;
    const isPop = isPopNavigationRef.current;
    isPopNavigationRef.current = false;

    // Lưu lại vị trí scroll của trang trước khi đổi đường dẫn
    if (prevPathRef.current && prevPathRef.current !== currentKey) {
      saveScrollPosition(prevPathRef.current, window.scrollY);
    }

    const oldKey = prevPathRef.current;
    prevPathRef.current = currentKey;

    if (isPop) {
      // Khi quay lại (Back / Forward), khôi phục vị trí cuộn trước đó
      const targetY = getSavedScrollPosition(currentKey);
      if (targetY !== null && targetY >= 0) {
        window.scrollTo({ top: targetY, left: 0, behavior: "instant" });
        requestAnimationFrame(() => {
          window.scrollTo({ top: targetY, left: 0, behavior: "instant" });
        });
        const timer1 = setTimeout(() => {
          window.scrollTo({ top: targetY, left: 0, behavior: "instant" });
        }, 40);
        const timer2 = setTimeout(() => {
          window.scrollTo({ top: targetY, left: 0, behavior: "instant" });
        }, 120);
        return () => {
          clearTimeout(timer1);
          clearTimeout(timer2);
        };
      }
    } else {
      // Khi mở trang mới lần đầu
      if (oldKey !== currentKey) {
        window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      }
    }
  }, [pathname]);

  return (
    <div key={pathname} className="page-transition-wrapper site-content">
      {children}
    </div>
  );
}
