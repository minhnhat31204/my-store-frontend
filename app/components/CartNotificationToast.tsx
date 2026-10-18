'use client';

import { useEffect, useRef, useState } from 'react';

type CartToast = {
  id: number;
  message: string;
  productName?: string;
  isLeaving?: boolean;
};

const MAX_VISIBLE_TOASTS = 3;
const TOAST_LIFETIME_MS = 2000;
const TOAST_EXIT_MS = 260;
const TOAST_HEIGHT_PX = 72;
const TOAST_GAP_PX = 10;

export default function CartNotificationToast() {
  const [toasts, setToasts] = useState<CartToast[]>([]);
  const nextId = useRef(0);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  useEffect(() => {
    const handleCartItemAdded = (event: Event) => {
      const customEvent = event as CustomEvent<{ productName?: string }>;
      const id = ++nextId.current;
      const toast: CartToast = {
        id,
        message: 'Đã thêm sản phẩm vào giỏ hàng',
        productName: customEvent.detail?.productName,
      };

      setToasts((current) => [toast, ...current.filter((item) => !item.isLeaving)].slice(0, MAX_VISIBLE_TOASTS));

      const timer = setTimeout(() => {
        setToasts((current) => current.map((item) => item.id === id ? { ...item, isLeaving: true } : item));
        const exitTimer = setTimeout(() => {
          setToasts((current) => current.filter((item) => item.id !== id));
          timers.current.delete(id);
        }, TOAST_EXIT_MS);
        timers.current.set(id, exitTimer);
      }, TOAST_LIFETIME_MS);
      timers.current.set(id, timer);
    };

    window.addEventListener('cart-item-added', handleCartItemAdded);
    return () => {
      window.removeEventListener('cart-item-added', handleCartItemAdded);
      timers.current.forEach((timer) => clearTimeout(timer));
      timers.current.clear();
    };
  }, []);

  if (toasts.length === 0) return null;

  const stackHeight = toasts.length * TOAST_HEIGHT_PX + (toasts.length - 1) * TOAST_GAP_PX;

  return (
    <div
      aria-live="polite"
      aria-relevant="additions text"
      className="cart-notification-stack pointer-events-none fixed right-3 z-[100] w-[min(24rem,calc(100vw-1.5rem))] md:right-6"
      style={{ height: `${stackHeight}px` }}
    >
      {toasts.map((toast, index) => (
        <div
          key={toast.id}
          role="status"
          className={`cart-toast-stack-item ${toast.isLeaving ? 'is-leaving' : ''}`}
          style={{ transform: `translateY(-${index * (TOAST_HEIGHT_PX + TOAST_GAP_PX)}px)`, zIndex: toasts.length - index }}
        >
          <div className="cart-toast-card flex h-[72px] w-full items-center gap-3.5 rounded-2xl border border-emerald-200 bg-white p-4 shadow-2xl backdrop-blur-md">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-md shadow-emerald-500/20">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-black tracking-wide text-slate-900">{toast.message}</p>
              {toast.productName && (
                <p className="mt-0.5 truncate text-[11px] font-semibold text-slate-500">
                  {toast.productName}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                const timer = timers.current.get(toast.id);
                if (timer) clearTimeout(timer);
                setToasts((current) => current.map((item) => item.id === toast.id ? { ...item, isLeaving: true } : item));
                const exitTimer = setTimeout(() => {
                  setToasts((current) => current.filter((item) => item.id !== toast.id));
                  timers.current.delete(toast.id);
                }, TOAST_EXIT_MS);
                timers.current.set(toast.id, exitTimer);
              }}
              className="pointer-events-auto cursor-pointer rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              aria-label="Đóng thông báo"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
