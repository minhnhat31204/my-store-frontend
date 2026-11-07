'use client';

import { useEffect } from 'react';

export default function SecurityShield() {
  useEffect(() => {
    let wiped = false;

    const wipeDOMAndLock = () => {
      if (wiped) return;
      wiped = true;

      // 1. Ghi đè toàn bộ DOM trong bộ nhớ và trên trình duyệt
      // Khi dòng này thực thi, tab Elements trong DevTools sẽ mất sạch toàn bộ thẻ của website
      // và chỉ còn duy nhất thẻ thông báo "KHÔNG CÓ MÃ NGUỒN"
      document.body.innerHTML = `
        <div id="no-source-shield" style="position:fixed;top:0;left:0;width:100vw;height:100vh;background:#020617;color:#f87171;display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;z-index:2147483647;padding:24px;box-sizing:border-box;text-align:center;">
          <div style="width:88px;height:88px;border-radius:28px;background:rgba(239,68,68,0.12);display:flex;align-items:center;justify-content:center;margin-bottom:24px;border:1px solid rgba(239,68,68,0.3);box-shadow:0 0 40px rgba(239,68,68,0.2);">
            <svg style="width:44px;height:44px;color:#ef4444;" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
          </div>
          <h1 style="font-size:32px;font-weight:900;color:#ffffff;letter-spacing:-0.5px;margin:0 0 12px 0;text-transform:uppercase;">
            KHÔNG CÓ MÃ NGUỒN
          </h1>
          <p style="font-size:16px;color:#94a3b8;max-width:540px;line-height:1.6;margin:0 0 24px 0;">
            Mã nguồn trang web đã được mã hóa và bảo vệ toàn diện.<br/>
            Toàn bộ cấu trúc DOM, mã nguồn và dữ liệu đã được xóa hoàn toàn khỏi công cụ Kiểm tra (Inspect).
          </p>
          <div style="background:#0f172a;border:1px solid #1e293b;border-radius:14px;padding:12px 24px;font-family:monospace;font-size:13px;color:#38bdf8;box-shadow:0 4px 20px rgba(0,0,0,0.5);">
            [TRẠNG THÁI: ĐÃ BẢO VỆ &amp; XÓA DOM] · Đóng Inspect và tải lại trang để tiếp tục
          </div>
          <p style="margin-top:32px;font-size:12px;color:#475569;">
            DEVORA Security Shield v3.0 · Toàn bộ mã nguồn &amp; biến đã được ẩn
          </p>
        </div>
      `;

      // 2. Xóa sạch Console và in thông báo bảo vệ lớn
      try {
        console.clear();
        console.log(
          '%c🔒 KHÔNG CÓ MÃ NGUỒN%c\n\n' +
          'Mã nguồn trang web đã được bảo vệ và mã hóa toàn diện.\n' +
          'Toàn bộ DOM và biến nội bộ đã bị xóa khỏi DevTools.\n\n' +
          'Vui lòng đóng Inspect và F5 lại trang để tiếp tục.',
          'font-size: 26px; font-weight: 900; color: #ef4444;',
          'font-size: 14px; font-weight: 600; color: #94a3b8; line-height: 1.6;'
        );
      } catch {}
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

    // Kiểm tra chênh lệch kích thước cửa sổ (DevTools gắn lề phải / dưới / chế độ Responsive)
    const checkSize = () => {
      const threshold = 160;
      const widthDiff = window.outerWidth - window.innerWidth;
      const heightDiff = window.outerHeight - window.innerHeight;
      if (widthDiff > threshold || heightDiff > threshold) {
        wipeDOMAndLock();
      }
    };

    // Kiểm tra khi DevTools mở tách cửa sổ độc lập (Console getter)
    const element = new Image();
    Object.defineProperty(element, 'id', {
      get: function () {
        wipeDOMAndLock();
        return 'protected';
      },
    });

    // Bắt phím mở DevTools (F12, Ctrl+Shift+I/J/C) -> Cho mở Inspect nhưng xóa sạch DOM
    const handleKey = (e: KeyboardEvent) => {
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j' || e.key === 'C' || e.key === 'c'))
      ) {
        setTimeout(wipeDOMAndLock, 50);
      }
    };

    window.addEventListener('resize', checkSize);
    window.addEventListener('keydown', handleKey);

    const interval = setInterval(() => {
      checkSize();
      if (wiped) {
        try {
          console.clear();
          console.log('%c🔒 KHÔNG CÓ MÃ NGUỒN', 'font-size: 26px; font-weight: 900; color: #ef4444;');
        } catch {}
      } else {
        console.log(element);
        console.clear();
      }
    }, 400);

    // Kiểm tra ngay khi mount
    checkSize();

    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', checkSize);
      window.removeEventListener('keydown', handleKey);
    };
  }, []);

  return null;
}
