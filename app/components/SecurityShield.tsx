'use client';

import { useEffect } from 'react';

export default function SecurityShield() {
  useEffect(() => {
    let triggered = false;

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

    // Vô hiệu hóa log console nội bộ
    try {
      const noop = () => {};
      ['debug', 'info', 'dir', 'dirxml', 'table', 'trace', 'group', 'groupEnd'].forEach((m) => {
        if (typeof (window.console as any)[m] === 'function') {
          (window.console as any)[m] = noop;
        }
      });
    } catch {}

    // Dấu hiệu 1: DevTools Docked
    const checkDocked = () => {
      const wDiff = window.outerWidth - window.innerWidth;
      const hDiff = window.outerHeight - window.innerHeight;
      if (wDiff > 160 || hDiff > 160) {
        triggerNoSourceRedirect();
        return true;
      }
      return false;
    };

    // Dấu hiệu 2: DevTools Responsive Device Emulation (Mở giả lập điện thoại trên máy tính)
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

    // Dấu hiệu 3: Debugger Trap (Dùng new Function để Next.js/SWC không thể xóa khi build production)
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

    // Dấu hiệu 4: Bắt các phím mở DevTools (F12, Ctrl+Shift+I/J/C/M)
    const handleKey = (e: KeyboardEvent) => {
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && ['I', 'i', 'J', 'j', 'C', 'c', 'M', 'm'].includes(e.key))
      ) {
        triggerNoSourceRedirect();
      }
    };

    // Dấu hiệu 5: Getter trigger khi Console được mở
    const detectorObj = {};
    Object.defineProperty(detectorObj, 'checkDevTools', {
      get: function () {
        triggerNoSourceRedirect();
        return '';
      },
    });

    window.addEventListener('resize', () => {
      checkDocked();
      checkResponsiveMode();
    });
    window.addEventListener('keydown', handleKey);

    const interval = setInterval(() => {
      if (triggered) return;
      if (checkDocked()) return;
      if (checkResponsiveMode()) return;
      if (checkDebuggerTrap()) return;
      try {
        console.dir(detectorObj);
        console.clear();
      } catch {}
    }, 300);

    // Kiểm tra ngay khi tải trang
    checkDocked();
    checkResponsiveMode();
    checkDebuggerTrap();

    return () => {
      clearInterval(interval);
      window.removeEventListener('keydown', handleKey);
    };
  }, []);

  return null;
}
