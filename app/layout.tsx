import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import CustomerNav from './components/CustomerNav';
import Footer from './components/Footer';
import SupportWidget from './components/SupportWidget';
import CartNotificationToast from './components/CartNotificationToast';
import SecurityShield from './components/SecurityShield';
import { FavoritesProvider } from './components/FavoritesProvider';
import PageTransitionProvider from './components/PageTransitionProvider';
import AnimateUIProvider from './components/AnimateUIProvider';
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
                // Chặn F12 và các phím tắt Inspect, View Source ngay từ cấp độ tài liệu
                window.addEventListener('keydown', function(e) {
                  if (
                    e.key === 'F12' ||
                    (e.ctrlKey && e.shiftKey && ['I','i','J','j','C','c','M','m'].indexOf(e.key) !== -1) ||
                    (e.ctrlKey && (e.key === 'u' || e.key === 'U' || e.key === 's' || e.key === 'S'))
                  ) {
                    e.preventDefault();
                    e.stopPropagation();
                    return false;
                  }
                }, true);
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
            <AnimateUIProvider>
              {children}
            </AnimateUIProvider>
          </PageTransitionProvider>
        </FavoritesProvider>
        <Footer />
        <SupportWidget />
        <CartNotificationToast />
      </body>
    </html>
  );
}
