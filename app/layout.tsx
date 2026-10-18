import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import CustomerNav from './components/CustomerNav';
import Footer from './components/Footer';
import SupportWidget from './components/SupportWidget';
import CartNotificationToast from './components/CartNotificationToast';
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
      <body className="min-h-screen flex flex-col bg-[#f6f8fb] text-slate-900">
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
