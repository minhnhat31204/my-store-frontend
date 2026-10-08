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

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const checkVisibility = () => {
      if (!el || typeof window === "undefined") return false;
      const rect = el.getBoundingClientRect();
      // If it's within viewport or above viewport
      const inOrAbove = rect.top < window.innerHeight + 80;
      if (inOrAbove) {
        setIsVisible(true);
        return true;
      }
      return false;
    };

    if (checkVisibility()) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.02,
        rootMargin: "0px 0px 80px 0px",
      }
    );

    observer.observe(el);

    const handleRecheck = () => {
      checkVisibility();
    };

    window.addEventListener("store-scroll-restored", handleRecheck, { passive: true });
    window.addEventListener("scroll", handleRecheck, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener("store-scroll-restored", handleRecheck);
      window.removeEventListener("scroll", handleRecheck);
    };
  }, []);

  const colIndex = index % 4;
  const computedDelay = delay !== undefined ? delay : colIndex * 75;

  return (
    <div
      ref={ref}
      style={{
        transitionDelay: isVisible ? `${computedDelay}ms` : "0ms",
      }}
      className={`product-card-reveal ${isVisible ? "is-visible" : ""} ${className}`}
    >
      {children}
    </div>
  );
}
