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

      // Xóa sạch console trước khi chuyển trang
      try {
        console.clear();
        console.log(
          '%c🔒 KHÔNG CÓ MÃ NGUỒN%c\n\n' +
          'Mã nguồn trang web đã được bảo vệ và ẩn hoàn toàn khỏi DevTools.',
          'font-size: 26px; font-weight: 900; color: #ef4444;',
          'font-size: 14px; font-weight: 600; color: #94a3b8;'
        );
      } catch {}

      // Chuyển hướng ngay lập tức sang trang tĩnh không chứa bất kỳ file mã nguồn JS nào
      // Trình duyệt sẽ loại bỏ toàn bộ cây mã nguồn JS khỏi tab Sources
      window.location.replace('/no-source.html');
    };

    // Vô hiệu hóa các hàm log nội bộ
    try {
      const noop = () => {};
      ['debug', 'info', 'dir', 'dirxml', 'table', 'trace', 'group', 'groupEnd'].forEach((m) => {
        if (typeof (window.console as any)[m] === 'function') {
          (window.console as any)[m] = noop;
        }
      });
    } catch {}

    // 1. Kiểm tra kích thước cửa sổ khi Inspect mở (gắn lề phải / dưới / chế độ Responsive)
    const checkSize = () => {
      const threshold = 160;
      const widthDiff = window.outerWidth - window.innerWidth;
      const heightDiff = window.outerHeight - window.innerHeight;
      if (widthDiff > threshold || heightDiff > threshold) {
        triggerNoSourceRedirect();
      }
    };

    // 2. Kiểm tra khi Inspect mở ở cửa sổ riêng biệt (Console getter)
    const element = new Image();
    Object.defineProperty(element, 'id', {
      get: function () {
        triggerNoSourceRedirect();
        return 'protected';
      },
    });

    // 3. Bắt phím mở Inspect (F12, Ctrl+Shift+I/J/C) -> Không chặn để Inspect mở, nhưng chuyển ngay sang trang không mã nguồn
    const handleKey = (e: KeyboardEvent) => {
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j' || e.key === 'C' || e.key === 'c'))
      ) {
        triggerNoSourceRedirect();
      }
    };

    window.addEventListener('resize', checkSize);
    window.addEventListener('keydown', handleKey);

    const interval = setInterval(() => {
      checkSize();
      if (!triggered) {
        console.log(element);
        console.clear();
      }
    }, 400);

    // Kiểm tra ngay khi tải
    checkSize();

    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', checkSize);
      window.removeEventListener('keydown', handleKey);
    };
  }, []);

  return null;
}
