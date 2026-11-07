'use client';

import { useEffect, useState } from 'react';

export default function SecurityShield() {
  const [isDevToolsOpen, setIsDevToolsOpen] = useState(false);

  useEffect(() => {
    // 1. Dọn dẹp và ghi đè Console để không thể đọc log hoặc biến nội bộ
    const setupConsoleShield = () => {
      try {
        const noop = () => {};
        const methods: (keyof Console)[] = [
          'debug', 'info', 'dir', 'dirxml', 'table', 'trace', 'group', 'groupEnd'
        ];
        methods.forEach((m) => {
          if (typeof window.console[m] === 'function') {
            (window.console as any)[m] = noop;
          }
        });
      } catch {}
    };

    setupConsoleShield();

    // 2. In thông báo "KHÔNG CÓ MÃ NGUỒN" liên tục vào Console khi Inspect mở
    const printConsoleProtection = () => {
      try {
        console.clear();
        console.log(
          '%c🔒 KHÔNG CÓ MÃ NGUỒN%c\n\n' +
          'Mã nguồn trang web đã được mã hóa và bảo vệ bản quyền toàn diện.\n' +
          'Toàn bộ cấu trúc DOM, dữ liệu biến và mã nguồn đã bị ẩn khỏi công cụ Kiểm tra (Inspect).\n\n' +
          'Vui lòng đóng cửa sổ Inspect / DevTools để tiếp tục sử dụng website bình thường.',
          'font-size: 26px; font-weight: 900; color: #ef4444; text-shadow: 0 2px 4px rgba(0,0,0,0.2);',
          'font-size: 14px; font-weight: 600; color: #64748b; line-height: 1.6;'
        );
      } catch {}
    };

    // 3. Cơ chế phát hiện DevTools đang mở (Đa tầng: Kích thước cửa sổ & Getter Trigger)
    let devToolsActive = false;

    const setDevToolsState = (active: boolean) => {
      if (active !== devToolsActive) {
        devToolsActive = active;
        setIsDevToolsOpen(active);
        if (active) {
          printConsoleProtection();
        }
      }
    };

    // Cách 1: Phát hiện chênh lệch kích thước cửa sổ khi Inspect gắn vào cạnh
    const checkWindowDiff = () => {
      const widthThreshold = window.outerWidth - window.innerWidth > 160;
      const heightThreshold = window.outerHeight - window.innerHeight > 160;
      if (widthThreshold || heightThreshold) {
        setDevToolsState(true);
      } else {
        setDevToolsState(false);
      }
    };

    // Cách 2: Phát hiện bằng đối tượng Console Getter (hoạt động kể cả khi Inspect tách rời cửa sổ riêng)
    const element = new Image();
    Object.defineProperty(element, 'id', {
      get: function () {
        setDevToolsState(true);
        printConsoleProtection();
        return 'protected-source';
      },
    });

    const heartbeat = setInterval(() => {
      checkWindowDiff();
      if (devToolsActive) {
        printConsoleProtection();
      } else {
        // Kích hoạt getter id nếu DevTools đang mở để xem console
        console.log(element);
        console.clear();
      }
    }, 800);

    window.addEventListener('resize', checkWindowDiff);

    return () => {
      clearInterval(heartbeat);
      window.removeEventListener('resize', checkWindowDiff);
    };
  }, []);

  if (!isDevToolsOpen) return null;

  return (
    <div
      id="devora-protected-shield"
      className="fixed inset-0 z-999999 flex flex-col items-center justify-center bg-slate-950 p-6 text-center select-none animate-in fade-in duration-150"
    >
      <div className="relative mx-auto flex h-24 w-24 items-center justify-center rounded-3xl bg-red-500/10 text-red-500 ring-1 ring-red-500/30">
        <svg className="h-12 w-12 animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      </div>

      <h1 className="mt-6 text-2xl sm:text-3xl font-black tracking-tight text-white uppercase">
        Không Có Mã Nguồn
      </h1>

      <p className="mt-3 max-w-lg text-sm sm:text-base leading-relaxed text-slate-400">
        Mã nguồn trang web đã được mã hóa bảo vệ toàn diện. Toàn bộ nội dung và cấu trúc DOM đã được ẩn đi để chống trích xuất và can thiệp trái phép.
      </p>

      <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/90 px-6 py-4 text-xs font-mono text-red-400 shadow-xl">
        <code>[STATUS: ENCRYPTED & BLOCKED] · Vui lòng đóng cửa sổ Inspect để tiếp tục xem trang web</code>
      </div>

      <p className="mt-8 text-xs text-slate-600">
        DEVORA Security System · Chế độ bảo vệ an toàn thông tin
      </p>
    </div>
  );
}
