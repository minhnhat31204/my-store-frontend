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
                  if (window.location.pathname === '/no-source.html') return;
                  var ua = navigator.userAgent || '';
                  var isDesktop = /Windows NT|Macintosh|Linux/i.test(ua) && !/Android|iPhone|iPad|iPod/i.test(ua);
                  var isEmulated = isDesktop && ('ontouchstart' in window || navigator.maxTouchPoints > 0);
                  var wDiff = window.outerWidth - window.innerWidth;
                  var hDiff = window.outerHeight - window.innerHeight;
                  var isDocked = (wDiff > 160 || hDiff > 160);

                  if (isEmulated || isDocked) {
                    try {
                      sessionStorage.setItem('devora_return_url', window.location.pathname + window.location.search);
                    } catch(e){}
                    window.location.replace('/no-source.html');
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
