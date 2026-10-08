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
      sessionStorage.setItem(getStorageKey(path), String(Math.round(y)));
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
  const prevPathRef = useRef<string>("");
  const isPopNavigationRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }

    const handlePopState = () => {
      isPopNavigationRef.current = true;
      try {
        sessionStorage.setItem("last_nav_action", "back");
      } catch {}
    };

    let scrollTimeout: NodeJS.Timeout | null = null;
    const handleScroll = () => {
      if (scrollTimeout) return;
      scrollTimeout = setTimeout(() => {
        scrollTimeout = null;
        if (typeof window !== "undefined") {
          const currentKey = window.location.pathname + window.location.search;
          saveScrollPosition(currentKey, window.scrollY);
        }
      }, 50);
    };

    const handleClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement)?.closest("a, button, [role='button'], .product-card");
      if (target && typeof window !== "undefined") {
        const currentKey = window.location.pathname + window.location.search;
        saveScrollPosition(currentKey, window.scrollY);

        const anchor = (e.target as HTMLElement)?.closest("a");
        if (anchor && anchor.href && !anchor.href.startsWith("#") && !anchor.target) {
          try {
            sessionStorage.setItem("last_nav_action", "forward");
          } catch {}
        }
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
    let isBack = isPopNavigationRef.current;
    isPopNavigationRef.current = false;

    let lastNavAction = "";
    try {
      lastNavAction = sessionStorage.getItem("last_nav_action") || "";
    } catch {}

    if (lastNavAction === "back") {
      isBack = true;
    }

    // Lưu lại vị trí cuộn trang trước
    if (prevPathRef.current && prevPathRef.current !== currentKey) {
      saveScrollPosition(prevPathRef.current, window.scrollY);
    }

    const oldKey = prevPathRef.current;
    prevPathRef.current = currentKey;

    if (isBack) {
      try {
        sessionStorage.removeItem("last_nav_action");
      } catch {}

      const targetY = getSavedScrollPosition(currentKey);
      if (targetY !== null && targetY >= 0) {
        window.scrollTo({ top: targetY, left: 0, behavior: "instant" });

        requestAnimationFrame(() => {
          window.scrollTo({ top: targetY, left: 0, behavior: "instant" });
          window.dispatchEvent(new Event("store-scroll-restored"));
        });

        const timer1 = setTimeout(() => {
          window.scrollTo({ top: targetY, left: 0, behavior: "instant" });
          window.dispatchEvent(new Event("store-scroll-restored"));
        }, 40);

        const timer2 = setTimeout(() => {
          window.scrollTo({ top: targetY, left: 0, behavior: "instant" });
          window.dispatchEvent(new Event("store-scroll-restored"));
        }, 120);

        const timer3 = setTimeout(() => {
          window.scrollTo({ top: targetY, left: 0, behavior: "instant" });
        }, 250);

        return () => {
          clearTimeout(timer1);
          clearTimeout(timer2);
          clearTimeout(timer3);
        };
      }
    } else {
      try {
        sessionStorage.removeItem("last_nav_action");
      } catch {}

      if (oldKey && oldKey !== currentKey) {
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
