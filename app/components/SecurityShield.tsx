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

      // Xóa ngay DOM hiện tại phòng trường hợp redirect có độ trễ
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

    // Vô hiệu hóa console
    try {
      const noop = () => {};
      ['debug', 'info', 'dir', 'dirxml', 'table', 'trace', 'group', 'groupEnd'].forEach((m) => {
        if (typeof (window.console as any)[m] === 'function') {
          (window.console as any)[m] = noop;
        }
      });
    } catch {}

    // Dấu hiệu 1: DevTools Docked (Chênh lệch outer - inner > 160)
    const checkDocked = () => {
      const threshold = 160;
      const wDiff = window.outerWidth - window.innerWidth;
      const hDiff = window.outerHeight - window.innerHeight;
      if (wDiff > threshold || hDiff > threshold) {
        triggerNoSourceRedirect();
        return true;
      }
      return false;
    };

    // Dấu hiệu 2: DevTools Responsive Mode (Chế độ giả lập kích thước thiết bị trên máy tính)
    // Trên desktop, outerHeight === innerHeight và outerWidth === innerWidth CHỈ XẢY RA khi mở DevTools Responsive Mode!
    const checkResponsiveMode = () => {
      const isDesktop = /Windows|Macintosh|Linux/i.test(navigator.userAgent);
      const isNotFullscreen = !document.fullscreenElement;
      if (isDesktop && isNotFullscreen) {
        if (
          window.outerWidth === window.innerWidth &&
          window.outerHeight === window.innerHeight &&
          window.innerWidth < screen.availWidth - 50
        ) {
          triggerNoSourceRedirect();
          return true;
        }
      }
      return false;
    };

    // Dấu hiệu 3: Debugger timing (Hoạt động 100% khi DevTools mở ở bất kỳ tab nào)
    const checkDebugger = () => {
      const t0 = performance.now();
      // eslint-disable-next-line no-debugger
      debugger;
      const t1 = performance.now();
      if (t1 - t0 > 100) {
        triggerNoSourceRedirect();
      }
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

    // Dấu hiệu 5: Getter trigger khi Console render
    const detector = /./;
    detector.toString = function () {
      triggerNoSourceRedirect();
      return '';
    };

    window.addEventListener('resize', () => {
      checkDocked();
      checkResponsiveMode();
    });
    window.addEventListener('keydown', handleKey);

    const interval = setInterval(() => {
      if (triggered) return;
      if (checkDocked()) return;
      if (checkResponsiveMode()) return;
      checkDebugger();
      try {
        console.log('%c', detector);
        console.clear();
      } catch {}
    }, 350);

    checkDocked();
    checkResponsiveMode();

    return () => {
      clearInterval(interval);
      window.removeEventListener('keydown', handleKey);
    };
  }, []);

  return null;
}
