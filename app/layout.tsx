import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import CustomerNav from './components/CustomerNav';
import Footer from './components/Footer';
import SupportWidget from './components/SupportWidget';
import CartNotificationToast from './components/CartNotificationToast';
import SecurityShield from './components/SecurityShield';
import { FavoritesProvider } from './components/FavoritesProvider';
import PageTransitionProvider from './components/PageTransitionProvider';
import './globals.css';

export const metadata: Metadata = {
  title: 'DEVORA - Innovation Through Technology',
  description: 'Hệ thống bán lẻ Laptop, Máy tính & Thiết bị Công nghệ Chính hãng DEVORA',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.png', type: 'image/png' },
      { url: '/devora-icon.png', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: '/icon.png',
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="vi" className="antialiased">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var wDiff = window.outerWidth - window.innerWidth;
                  var hDiff = window.outerHeight - window.innerHeight;
                  if (wDiff > 160 || hDiff > 160) {
                    document.write('<style>html,body{margin:0;padding:0;background:#020617;color:#f87171;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;height:100vh;overflow:hidden;display:flex;align-items:center;justify-content:center;text-align:center;}</style><div style="padding:24px;max-width:600px;"><div style="font-size:56px;margin-bottom:16px;">🔒</div><h1 style="font-size:32px;font-weight:900;color:#ef4444;margin:0 0 12px 0;">KHÔNG CÓ MÃ NGUỒN</h1><p style="font-size:16px;color:#94a3b8;line-height:1.6;margin:0 0 20px 0;">Mã nguồn trang web đã được mã hóa và bảo vệ toàn diện.<br/>Toàn bộ cấu trúc DOM, mã nguồn và dữ liệu đã bị xóa khỏi công cụ Kiểm tra (Inspect).</p><div style="display:inline-block;padding:10px 20px;background:#0f172a;border:1px solid #1e293b;border-radius:12px;font-family:monospace;font-size:13px;color:#38bdf8;">[TRẠNG THÁI: MÃ HÓA &amp; BẢO VỆ] · Đóng Inspect và tải lại trang</div></div>');
                    if (window.stop) window.stop();
                  }
                } catch(e){}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-screen flex flex-col bg-[#f6f8fb] text-slate-900">
        <SecurityShield />
        <CustomerNav />
        <FavoritesProvider>
          <PageTransitionProvider>
            {children}
          </PageTransitionProvider>
        </FavoritesProvider>
        <Footer />
        <SupportWidget />
        <CartNotificationToast />
      </body>
    </html>
  );
}
