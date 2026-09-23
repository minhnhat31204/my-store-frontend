import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Geist, Geist_Mono } from 'next/font/google';
import CustomerNav from './components/CustomerNav';
import Footer from './components/Footer';
import { FavoritesProvider } from './components/FavoritesProvider';
import './globals.css';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });

export const metadata: Metadata = { title: 'MANB SHOP', description: 'Computer Store' };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="vi" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <CustomerNav />
        <FavoritesProvider>
          <div className="site-content">{children}</div>
        </FavoritesProvider>
        <Footer />
      </body>
    </html>
  );
}
