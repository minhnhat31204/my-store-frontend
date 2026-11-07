'use client';

import { useEffect, useState } from 'react';

export default function SecurityShield() {
  const [warningMessage, setWarningMessage] = useState<string | null>(null);

  useEffect(() => {
    // 1. Vô hiệu hóa và xóa sạch Console của trình duyệt
    const wipeConsole = () => {
      try {
        const noop = () => {};
        const consoleMethods: (keyof Console)[] = [
          'log', 'debug', 'info', 'warn', 'error', 'table', 'trace', 'dir', 'dirxml', 'group', 'groupEnd', 'time', 'timeEnd'
        ];
        consoleMethods.forEach((method) => {
          if (typeof window.console[method] === 'function') {
            (window.console as any)[method] = noop;
          }
        });
        window.console.clear();
      } catch {}
    };

    if (process.env.NODE_ENV === 'production') {
      wipeConsole();
    }

    // 2. Chặn phím tắt F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C, Ctrl+U, Ctrl+S
    const handleKeyDown = (e: KeyboardEvent) => {
      // Phím F12
      if (e.key === 'F12' || e.keyCode === 123) {
        e.preventDefault();
        e.stopPropagation();
        triggerAlert('Phím F12 (Inspect / DevTools) đã bị vô hiệu hóa.');
        return false;
      }

      // Ctrl + Shift + I (Inspect), Ctrl + Shift + J (Console), Ctrl + Shift + C (Element Picker)
      if (e.ctrlKey && e.shiftKey && ['I', 'i', 'J', 'j', 'C', 'c'].includes(e.key)) {
        e.preventDefault();
        e.stopPropagation();
        triggerAlert('Tổ hợp phím kiểm tra mã nguồn (Inspect) đã bị chặn.');
        return false;
      }

      // Ctrl + U (Xem nguồn trang View Source)
      if (e.ctrlKey && ['U', 'u', 'S', 's'].includes(e.key)) {
        e.preventDefault();
        e.stopPropagation();
        triggerAlert('Tính năng xem nguồn trang (View Source) đã bị vô hiệu hóa.');
        return false;
      }

      // Hỗ trợ người dùng MacOS (Cmd + Option + I / J / C / U)
      if (e.metaKey && e.altKey && ['I', 'i', 'J', 'j', 'C', 'c', 'U', 'u'].includes(e.key)) {
        e.preventDefault();
        e.stopPropagation();
        triggerAlert('Chức năng Developer Tools đã bị khóa.');
        return false;
      }
    };

    // 3. Chặn chuột phải (Context Menu)
    const handleContextMenu = (e: MouseEvent) => {
      // Cho phép chuột phải trên các ô nhập liệu input / textarea để paste/copy
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        return;
      }
      e.preventDefault();
      triggerAlert('Nhấp chuột phải để kiểm tra phần tử (Inspect) đã bị chặn.');
    };

    // 4. Phát hiện DevTools mở bằng cách đo chênh lệch kích thước cửa sổ
    let isDevToolsOpen = false;
    const checkDevTools = () => {
      const widthThreshold = window.outerWidth - window.innerWidth > 160;
      const heightThreshold = window.outerHeight - window.innerHeight > 160;
      if (widthThreshold || heightThreshold) {
        if (!isDevToolsOpen) {
          isDevToolsOpen = true;
          wipeConsole();
          triggerAlert('Hệ thống phát hiện công cụ kiểm tra (DevTools) đang mở. Mọi thao tác đều được giám sát.');
        }
      } else {
        isDevToolsOpen = false;
      }
    };

    // 5. Anti-Debugging loop để đóng băng mã nguồn nếu cố tình debug trong F12
    const antiDebugInterval = setInterval(() => {
      if (process.env.NODE_ENV === 'production' && isDevToolsOpen) {
        wipeConsole();
        const startTime = performance.now();
        // eslint-disable-next-line no-debugger
        debugger;
        if (performance.now() - startTime > 100) {
          triggerAlert('Phát hiện hành vi gỡ lỗi (Debugging) trái phép.');
        }
      }
    }, 2000);

    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('contextmenu', handleContextMenu, true);
    window.addEventListener('resize', checkDevTools);

    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('contextmenu', handleContextMenu, true);
      window.removeEventListener('resize', checkDevTools);
      clearInterval(antiDebugInterval);
    };
  }, []);

  function triggerAlert(msg: string) {
    setWarningMessage(msg);
  }

  if (!warningMessage) return null;

  return (
    <div className="fixed inset-0 z-99999 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-3xl border border-red-500/30 bg-slate-900 p-6 text-center text-white shadow-2xl ring-1 ring-red-500/50">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/20 text-red-400 ring-8 ring-red-500/10">
          <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <path d="M12 8v4" />
            <path d="M12 16h.01" />
          </svg>
        </div>

        <h3 className="mt-4 text-lg font-black tracking-tight text-white uppercase">
          Cảnh Báo Bảo Mật Hệ Thống
        </h3>

        <p className="mt-2 text-sm leading-relaxed text-red-200">
          {warningMessage}
        </p>

        <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-xs text-slate-400">
          <p>
            Chức năng <strong>Kiểm tra phần tử (Inspect / F12)</strong> và mã nguồn trang web đã bị khóa để bảo vệ an toàn thông tin và dữ liệu người dùng.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setWarningMessage(null)}
          className="mt-6 w-full rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 py-3 text-sm font-black text-white shadow-lg shadow-red-600/30 transition hover:brightness-110 active:scale-[0.98] cursor-pointer"
        >
          Tôi đã hiểu và quay lại
        </button>
      </div>
    </div>
  );
}
