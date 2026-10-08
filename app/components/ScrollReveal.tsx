"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  index?: number;
}

export default function ScrollReveal({
  children,
  className = "",
  delay,
  index = 0,
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Check if element is already inside or above the viewport on initial mount
    const rect = el.getBoundingClientRect();
    const isInViewport = rect.top < window.innerHeight && rect.bottom > 0;
    const isAboveViewport = rect.bottom <= 0;

    if (isInViewport || isAboveViewport) {
      setIsVisible(true);
      setHasAnimated(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            setHasAnimated(true);
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.05,
        rootMargin: "0px 0px -30px 0px",
      }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Compute staggered delay based on 4-column desktop / 2-column mobile layout
  // 0ms, 80ms, 160ms, 240ms cascade
  const colIndex = index % 4;
  const computedDelay = delay !== undefined ? delay : colIndex * 85;

  return (
    <div
      ref={ref}
      style={{
        transitionDelay: isVisible && !hasAnimated ? `${computedDelay}ms` : isVisible ? `${computedDelay}ms` : "0ms",
      }}
      className={`product-card-reveal ${isVisible ? "is-visible" : ""} ${className}`}
    >
      {children}
    </div>
  );
}
