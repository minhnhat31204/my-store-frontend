import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Geist, Geist_Mono } from 'next/font/google';
import CustomerNav from './components/CustomerNav';
import Footer from './components/Footer';
import SupportWidget from './components/SupportWidget';
import { FavoritesProvider } from './components/FavoritesProvider';
import PageTransitionProvider from './components/PageTransitionProvider';
import './globals.css';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });

export const metadata: Metadata = { title: 'MANB SHOP', description: 'Computer Store' };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="vi" className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
      <body className="min-h-screen flex flex-col bg-[#f6f8fb] text-slate-900">
        <CustomerNav />
        <FavoritesProvider>
          <PageTransitionProvider>
            {children}
          </PageTransitionProvider>
        </FavoritesProvider>
        <Footer />
        <SupportWidget />
      </body>
    </html>
  );
}
