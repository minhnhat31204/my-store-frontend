"use client";

import { useEffect } from "react";

export default function ClickFeedbackProvider() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handlePointerDown = (e: PointerEvent) => {
      // Chỉ kích hoạt hiệu ứng khi nhấn chuột trái hoặc chạm màn hình
      if (e.button !== 0 && e.pointerType === "mouse") return;

      // Tìm phần tử tương tác gần nhất được click để kích hoạt hiệu ứng nhún nảy xúc giác
      const target = e.target as HTMLElement | null;
      if (!target) return;

      const interactive = target.closest<HTMLElement>(
        'button, a, [role="button"], input[type="submit"], input[type="button"], input[type="checkbox"], input[type="radio"], select, .product-card, .nav-bubble-link, .mobile-nav-item, .clickable'
      );

      if (interactive) {
        interactive.classList.remove("tap-pressed-feedback");
        // Trigger reflow to restart animation if clicked repeatedly
        void interactive.offsetWidth;
        interactive.classList.add("tap-pressed-feedback");

        window.setTimeout(() => {
          interactive.classList.remove("tap-pressed-feedback");
        }, 220);
      }
    };

    window.addEventListener("pointerdown", handlePointerDown, { passive: true, capture: true });

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown, { capture: true });
    };
  }, []);

  return null;
}
