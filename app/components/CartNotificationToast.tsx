'use client';

import { useEffect, useState } from 'react';

export default function CartNotificationToast() {
  const [toast, setToast] = useState<{ id: number; message: string; productName?: string } | null>(null);

  useEffect(() => {
    const handleCartItemAdded = (event: Event) => {
      const customEvent = event as CustomEvent<{ productName?: string }>;
      const productName = customEvent.detail?.productName;
      const message = 'Đã thêm sản phẩm vào giỏ hàng';
      setToast({
        id: Date.now(),
        message,
        productName,
      });
    };

    window.addEventListener('cart-item-added', handleCartItemAdded);
    return () => window.removeEventListener('cart-item-added', handleCartItemAdded);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      setToast(null);
    }, 3200);
    return () => clearTimeout(timer);
  }, [toast]);

  if (!toast) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-6 right-6 z-100 flex max-w-sm items-center gap-3.5 rounded-2xl border border-emerald-200 bg-white p-4 shadow-2xl backdrop-blur-md transition-all duration-300 animate-in fade-in slide-in-from-bottom-5"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-md shadow-emerald-500/20">
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-black tracking-wide text-slate-900">{toast.message}</p>
        {toast.productName && (
          <p className="mt-0.5 truncate text-[11px] font-semibold text-slate-500">
            {toast.productName}
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={() => setToast(null)}
        className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
        aria-label="Đóng thông báo"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
