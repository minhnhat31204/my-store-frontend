"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState, useRef, type ReactNode } from "react";

export default function PageTransitionProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [progress, setProgress] = useState(0);
  const [isNavigating, setIsNavigating] = useState(false);
  const prevPathRef = useRef(pathname);

  useEffect(() => {
    if (prevPathRef.current !== pathname) {
      prevPathRef.current = pathname;
      
      // Kích hoạt thanh tiến trình mượt mà ở trên cùng khi đổi trang
      setIsNavigating(true);
      setProgress(45);

      const t1 = window.setTimeout(() => setProgress(85), 60);
      const t2 = window.setTimeout(() => {
        setProgress(100);
        const t3 = window.setTimeout(() => {
          setIsNavigating(false);
          setProgress(0);
        }, 220);
        return () => window.clearTimeout(t3);
      }, 160);

      window.scrollTo({ top: 0, left: 0, behavior: "instant" });

      return () => {
        window.clearTimeout(t1);
        window.clearTimeout(t2);
      };
    }
  }, [pathname]);

  // Bắt sự kiện click vào các liên kết nội bộ để hiển thị hiệu ứng chuyển trang ngay lập tức
  useEffect(() => {
    const handleLinkClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement)?.closest("a");
      if (!target) return;
      const href = target.getAttribute("href");
      if (
        href &&
        href.startsWith("/") &&
        !href.startsWith("//") &&
        !target.getAttribute("target") &&
        !e.ctrlKey &&
        !e.metaKey &&
        !e.shiftKey &&
        !e.altKey
      ) {
        if (href !== pathname) {
          setIsNavigating(true);
          setProgress(25);
        }
      }
    };

    document.addEventListener("click", handleLinkClick, { passive: true });
    return () => document.removeEventListener("click", handleLinkClick);
  }, [pathname]);

  return (
    <>
      {/* Thanh tiến trình chuyển trang ở đỉnh màn hình */}
      {isNavigating && (
        <div
          className="fixed top-0 left-0 right-0 h-[3px] z-[999999] pointer-events-none"
          aria-hidden="true"
        >
          <div
            className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-400 shadow-[0_0_12px_rgba(59,130,246,0.8)] transition-all duration-200 ease-out"
            style={{
              width: `${progress}%`,
              opacity: progress === 100 ? 0 : 1,
            }}
          />
        </div>
      )}

      {/* Nội dung trang với hiệu ứng chuyển động mượt mà */}
      <div key={pathname} className="page-transition-wrapper site-content">
        {children}
      </div>
    </>
  );
}
