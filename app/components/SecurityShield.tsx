'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function SecurityShield() {
  const router = useRouter();
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [selectedText, setSelectedText] = useState('');
  const [copied, setCopied] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let triggered = false;

    // 1. Chuyển hướng trắng mã nguồn nếu phát hiện DevTools đang mở ngầm
    const triggerNoSourceRedirect = () => {
      if (triggered) return;
      if (typeof window === 'undefined') return;
      if (window.location.pathname === '/no-source.html') return;

      triggered = true;
      try {
        sessionStorage.setItem('devora_return_url', window.location.pathname + window.location.search);
      } catch {}

      try {
        console.clear();
      } catch {}

      try {
        document.body.innerHTML = `
          <div style="position:fixed;top:0;left:0;width:100vw;height:100vh;background:#020617;color:#f87171;display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:sans-serif;z-index:2147483647;text-align:center;padding:24px;">
            <h1 style="font-size:28px;font-weight:900;color:#fff;margin-bottom:12px;">🔒 KHÔNG CÓ MÃ NGUỒN</h1>
            <p style="font-size:15px;color:#94a3b8;max-width:500px;">Toàn bộ mã nguồn và DOM đã được ẩn và bảo vệ toàn diện.</p>
          </div>
        `;
      } catch {}

      window.location.replace('/no-source.html');
    };

    // 2. Chặn tuyệt đối F12, Ctrl+Shift+I/J/C/M, Ctrl+U (Xem mã nguồn)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F12') {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
      if (e.ctrlKey && e.shiftKey && ['I', 'i', 'J', 'j', 'C', 'c', 'M', 'm'].includes(e.key)) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
      if (e.ctrlKey && (e.key === 'u' || e.key === 'U' || e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
      if (e.key === 'Escape') {
        setContextMenu(null);
      }
    };

    // 3. Cho phép bấm chuột phải bình thường, nhưng thay thế menu Inspect của trình duyệt
    // bằng Menu tiện ích sang trọng của DEVORA (không có nút Inspect)
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault(); // Chặn menu gốc của trình duyệt (vốn có nút Inspect)
      
      const sel = window.getSelection()?.toString() || '';
      setSelectedText(sel);

      const menuWidth = 220;
      const menuHeight = 240;
      let x = e.clientX;
      let y = e.clientY;

      if (x + menuWidth > window.innerWidth) {
        x = window.innerWidth - menuWidth - 12;
      }
      if (y + menuHeight > window.innerHeight) {
        y = window.innerHeight - menuHeight - 12;
      }

      setContextMenu({ x, y });
    };

    const handleWindowClick = (e: MouseEvent) => {
      if (menuRef.current && menuRef.current.contains(e.target as Node)) {
        return;
      }
      setContextMenu(null);
    };

    const handleWindowScroll = () => {
      setContextMenu(null);
    };

    // 4. Phát hiện DevTools nếu người dùng mở qua menu 3 chấm của Chrome
    const checkDocked = () => {
      const wDiff = window.outerWidth - window.innerWidth;
      const hDiff = window.outerHeight - window.innerHeight;
      if (wDiff > 160 || hDiff > 160) {
        triggerNoSourceRedirect();
        return true;
      }
      return false;
    };

    const checkResponsiveMode = () => {
      const ua = navigator.userAgent || '';
      const isDesktop = /Windows NT|Macintosh|Linux/i.test(ua) && !/Android|iPhone|iPad|iPod/i.test(ua);
      const isEmulated = isDesktop && ('ontouchstart' in window || navigator.maxTouchPoints > 0);
      if (isEmulated) {
        triggerNoSourceRedirect();
        return true;
      }
      return false;
    };

    const checkDebuggerTrap = () => {
      const t0 = performance.now();
      try {
        (new Function('debugger'))();
      } catch {}
      const t1 = performance.now();
      if (t1 - t0 > 80) {
        triggerNoSourceRedirect();
        return true;
      }
      return false;
    };

    window.addEventListener('keydown', handleKeyDown, { capture: true });
    window.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('click', handleWindowClick);
    window.addEventListener('scroll', handleWindowScroll, { passive: true });
    window.addEventListener('resize', () => {
      checkDocked();
      checkResponsiveMode();
    });

    const interval = setInterval(() => {
      if (triggered) return;
      if (checkDocked()) return;
      if (checkResponsiveMode()) return;
      checkDebuggerTrap();
    }, 400);

    checkDocked();
    checkResponsiveMode();

    return () => {
      clearInterval(interval);
      window.removeEventListener('keydown', handleKeyDown, { capture: true } as any);
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('click', handleWindowClick);
      window.removeEventListener('scroll', handleWindowScroll);
    };
  }, []);

  const handleCopy = () => {
    if (selectedText) {
      navigator.clipboard.writeText(selectedText);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
        setContextMenu(null);
      }, 500);
    }
  };

  return (
    <>
      {contextMenu && (
        <div
          ref={menuRef}
          style={{
            position: 'fixed',
            top: `${contextMenu.y}px`,
            left: `${contextMenu.x}px`,
            zIndex: 99999999,
          }}
          className="w-56 rounded-2xl border border-slate-700/80 bg-slate-900/95 p-1.5 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-100 select-none text-slate-200"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-800">
            DEVORA Tiện ích
          </div>

          <div className="py-1 space-y-0.5">
            <button
              type="button"
              onClick={() => {
                setContextMenu(null);
                window.location.reload();
              }}
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition cursor-pointer"
            >
              <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Tải lại trang
            </button>

            <button
              type="button"
              onClick={() => {
                setContextMenu(null);
                router.push('/');
              }}
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition cursor-pointer"
            >
              <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Trang chủ DEVORA
            </button>

            <button
              type="button"
              onClick={() => {
                setContextMenu(null);
                router.push('/customer/cart');
              }}
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition cursor-pointer"
            >
              <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Xem giỏ hàng
            </button>

            {selectedText && (
              <button
                type="button"
                onClick={handleCopy}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-blue-400 hover:bg-blue-950/50 hover:text-blue-300 transition cursor-pointer border-t border-slate-800/80 mt-1"
              >
                <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                {copied ? 'Đã sao chép!' : 'Sao chép văn bản'}
              </button>
            )}
          </div>

          <div className="mt-1 pt-1 border-t border-slate-800 text-[9px] text-slate-500 text-center font-mono">
            DEVORA Protected System
          </div>
        </div>
      )}
    </>
  );
}
