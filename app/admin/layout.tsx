'use client';

import { ReactNode, useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { getStoredUser, api, User } from '@/lib/api';
import { useAdminGuard } from '@/lib/useAdminGuard';

interface AdminLayoutProps {
  children: ReactNode;
}

const NAV_GROUPS = [
  {
    title: 'Kinh doanh & Bán hàng',
    items: [
      {
        href: '/admin',
        label: 'Bảng điều khiển',
        badgeKey: null,
        icon: (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
          </svg>
        ),
        exact: true,
      },
      {
        href: '/admin/orders',
        label: 'Quản lý đơn hàng',
        badgeKey: 'pendingOrders',
        icon: (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
        ),
      },
      {
        href: '/admin/vouchers',
        label: 'Khuyến mãi & Voucher',
        badgeKey: null,
        icon: (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
        ),
      },
    ],
  },
  {
    title: 'Kho hàng & Dịch vụ',
    items: [
      {
        href: '/admin/products',
        label: 'Kho sản phẩm',
        badgeKey: 'lowStock',
        icon: (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        ),
      },
      {
        href: '/admin/support',
        label: 'Hỗ trợ khách hàng',
        badgeKey: 'unreadSupport',
        icon: (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        ),
      },
      {
        href: '/admin/users',
        label: 'Tài khoản & Phân quyền',
        badgeKey: null,
        icon: (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        ),
      },
    ],
  },
];

export default function AdminLayout({ children }: AdminLayoutProps) {
  useAdminGuard();
  const pathname = usePathname();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [badges, setBadges] = useState<{ pendingOrders?: number; lowStock?: number; unreadSupport?: number }>({});
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    setCurrentUser(getStoredUser());
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' • ' + now.toLocaleDateString('vi-VN'));
    };
    updateClock();
    const clockTimer = setInterval(updateClock, 1000);
    return () => clearInterval(clockTimer);
  }, []);

  useEffect(() => {
    async function fetchBadges() {
      try {
        const [ordersRes, productsRes, supportRes] = await Promise.allSettled([
          api.getOrders(),
          api.getProducts(),
          api.getSupportConversations(),
        ]);

        let pendingCount = 0;
        if (ordersRes.status === 'fulfilled' && Array.isArray(ordersRes.value)) {
          pendingCount = ordersRes.value.filter((o) => (o.Status || '').toLowerCase() === 'pending').length;
        }

        let lowStockCount = 0;
        if (productsRes.status === 'fulfilled' && Array.isArray(productsRes.value)) {
          lowStockCount = productsRes.value.filter((p) => Number(p.StockQuantity ?? 0) <= 5).length;
        }

        let unreadCount = 0;
        if (supportRes.status === 'fulfilled' && Array.isArray(supportRes.value)) {
          unreadCount = supportRes.value.length;
        }

        setBadges({
          pendingOrders: pendingCount,
          lowStock: lowStockCount,
          unreadSupport: unreadCount,
        });
      } catch {}
    }

    void fetchBadges();
    const badgeTimer = setInterval(fetchBadges, 20000);
    return () => clearInterval(badgeTimer);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('sessionToken');
    sessionStorage.removeItem('user');
    window.dispatchEvent(new Event('user-updated'));
    router.push('/login');
  };

  const getActiveLabel = () => {
    for (const group of NAV_GROUPS) {
      for (const item of group.items) {
        if (item.exact ? pathname === item.href : pathname.startsWith(item.href)) {
          return item.label;
        }
      }
    }
    return 'Bảng điều khiển';
  };

  return (
    <div className="h-screen overflow-hidden bg-slate-950 text-slate-100 flex flex-col md:flex-row antialiased font-sans">
      {/* Desktop Sidebar (Cố định toàn màn hình với hiệu ứng glassmorphism đẳng cấp) */}
      <aside className="hidden md:flex flex-col w-72 h-full bg-slate-950/95 border-r border-slate-800/80 p-5 shrink-0 select-none overflow-y-auto z-30">
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-3 py-3 mb-6 bg-gradient-to-r from-blue-900/20 via-indigo-900/10 to-transparent rounded-2xl border border-blue-500/20">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 flex items-center justify-center font-black text-white text-xl shadow-lg shadow-blue-500/25 ring-2 ring-blue-400/30">
            M
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-black text-base tracking-tight text-white block">MANB STORE</span>
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-blue-400 bg-blue-500/15 px-2 py-0.5 rounded-md border border-blue-500/30 inline-block mt-0.5">
              Admin Portal PRO
            </span>
          </div>
        </div>

        {/* Navigation Grouped List */}
        <nav className="space-y-6 flex-1">
          {NAV_GROUPS.map((group, groupIdx) => (
            <div key={groupIdx} className="space-y-1.5">
              <p className="px-3 text-[11px] font-black uppercase tracking-wider text-slate-400 mb-2.5">
                {group.title}
              </p>
              {group.items.map((item) => {
                const isActive = item.exact
                  ? pathname === item.href
                  : pathname.startsWith(item.href);

                const badgeVal = item.badgeKey ? badges[item.badgeKey as keyof typeof badges] : undefined;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`group relative flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/30 ring-1 ring-white/20'
                        : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`transition-transform duration-200 group-hover:scale-110 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-400'}`}>
                        {item.icon}
                      </span>
                      <span>{item.label}</span>
                    </div>

                    {badgeVal !== undefined && badgeVal > 0 && (
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : item.badgeKey === 'pendingOrders'
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : item.badgeKey === 'lowStock'
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      }`}>
                        {badgeVal > 99 ? '99+' : badgeVal}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Quick Store Links & User Footer */}
        <div className="pt-4 mt-6 border-t border-slate-800/80 space-y-3">
          <Link
            href="/"
            target="_blank"
            className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-300 hover:bg-slate-900 hover:text-white border border-slate-800 transition"
          >
            <div className="flex items-center gap-2.5">
              <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              <span>Xem trang bán lẻ</span>
            </div>
            <span className="text-[10px] font-semibold text-slate-400 bg-slate-800/60 px-1.5 py-0.5 rounded">↗ Shop</span>
          </Link>

          {/* Current Admin User Card */}
          {currentUser ? (
            <div className="p-3 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 flex items-center justify-between gap-3 shadow-sm">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 border border-blue-400/40 flex items-center justify-center font-black text-white text-sm shrink-0 shadow-sm">
                  {currentUser.FullName ? currentUser.FullName.charAt(0).toUpperCase() : 'A'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-black text-white truncate">{currentUser.FullName || 'Quản trị viên'}</p>
                  <p className="text-[10px] font-semibold text-emerald-400 truncate">● Quản trị viên hệ thống</p>
                </div>
              </div>

              <button
                onClick={handleLogout}
                title="Đăng xuất"
                className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          ) : (
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition text-left cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Đăng xuất</span>
            </button>
          )}
        </div>
      </aside>

      {/* Mobile Top Header */}
      <div className="md:hidden flex items-center justify-between px-4 py-3.5 bg-slate-950/95 backdrop-blur-md border-b border-slate-800 shrink-0 z-40">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-black text-white text-sm shadow-md">
            M
          </div>
          <div>
            <span className="font-black text-sm tracking-tight text-white block">MANB ADMIN</span>
            <span className="text-[9px] font-bold text-blue-400">Portal v2.5</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/"
            target="_blank"
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 text-xs font-bold"
          >
            ↗ Shop
          </Link>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 cursor-pointer"
            aria-label="Toggle menu"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Nav */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-950/98 backdrop-blur-2xl border-b border-slate-800 p-4 space-y-4 shrink-0 z-40 max-h-[80vh] overflow-y-auto">
          {NAV_GROUPS.map((group, gIdx) => (
            <div key={gIdx} className="space-y-1.5">
              <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">{group.title}</p>
              {group.items.map((item) => {
                const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${
                      isActive ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-900'
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          ))}

          <div className="pt-3 border-t border-slate-800 flex justify-between items-center">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="text-xs font-bold text-slate-400 hover:text-white"
            >
              ← Về trang bán lẻ
            </Link>
            <button
              onClick={handleLogout}
              className="text-xs font-bold text-rose-400 hover:text-rose-300 cursor-pointer"
            >
              Đăng xuất
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area (Cuộn độc lập, giữ cố định Sidebar) */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-y-auto bg-slate-950">
        {/* Top bar for desktop */}
        <header className="sticky top-0 z-20 hidden md:flex items-center justify-between px-8 py-3.5 bg-slate-950/90 backdrop-blur-xl border-b border-slate-800/80 shrink-0">
          <div className="flex items-center gap-3 text-xs font-medium">
            <span className="text-slate-400 font-semibold">Admin</span>
            <span className="text-slate-500">/</span>
            <span className="text-white font-bold bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700/60 shadow-xs">
              {getActiveLabel()}
            </span>
          </div>

          <div className="flex items-center gap-5">
            {currentTime && (
              <div className="hidden lg:flex items-center gap-2 text-xs font-bold text-slate-400 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-800">
                <svg className="w-3.5 h-3.5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{currentTime}</span>
              </div>
            )}

            <Link
              href="/"
              target="_blank"
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-blue-600/20 to-indigo-600/20 hover:from-blue-600/30 hover:to-indigo-600/30 text-xs font-bold text-blue-300 border border-blue-500/30 transition shadow-sm cursor-pointer"
            >
              <svg className="w-3.5 h-3.5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              <span>Xem trang bán lẻ (Shop)</span>
            </Link>
          </div>
        </header>

        {/* Page Inner Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-h-0">
          {children}
        </main>

        {/* Admin Dark Footer */}
        <footer className="mt-auto py-4 px-8 border-t border-slate-800/80 bg-slate-950/70 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400 shrink-0">
          <div className="flex items-center gap-2 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block shadow-sm shadow-emerald-400/50 animate-pulse" />
            <span>Hệ thống MANB Admin Portal v2.5 • Máy chủ hoạt động ổn định</span>
          </div>
          <div>
            © {new Date().getFullYear()} MANB.VN. Bản quyền quản trị hệ thống.
          </div>
        </footer>
      </div>
    </div>
  );
}
