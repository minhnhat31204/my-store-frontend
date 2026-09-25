"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { api, getStoredUser, type User } from "@/lib/api";
import { useRouter } from "next/navigation";

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="search-icon">
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m16 16 5 5" />
    </svg>
  );
}

function CartIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="cart-icon">
      <path d="M3 4h2l2.2 10.2a2 2 0 0 0 2 1.6h7.9a2 2 0 0 0 1.9-1.4L21 7H6" />
      <circle cx="10" cy="20" r="1.3" />
      <circle cx="18" cy="20" r="1.3" />
    </svg>
  );
}

type CustomerNavProps = {
  searchValue?: string;
  onSearchChange?: (value: string) => void;
};

export default function CustomerNav({
  searchValue = "",
  onSearchChange,
}: CustomerNavProps) {
  const [cartCount, setCartCount] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [user, setUser] = useState<User | null>(null);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [localSearch, setLocalSearch] = useState(searchValue);
  const [navVisible, setNavVisible] = useState(true);
  const lastScrollY = useRef(0);
  const scrollDelta = useRef(0);
  const scrollDirection = useRef<"up" | "down" | null>(null);
  const accountMenuRef = useRef<HTMLDivElement>(null);
  const accountButtonRef = useRef<HTMLButtonElement>(null);
  const router = useRouter();

  useEffect(() => {
    lastScrollY.current = window.scrollY;

    const handleScroll = () => {
      const currentY = Math.max(0, window.scrollY);
      const delta = currentY - lastScrollY.current;
      lastScrollY.current = currentY;

      if (currentY < 80) {
        scrollDelta.current = 0;
        scrollDirection.current = null;
        setNavVisible(true);
        return;
      }

      if (Math.abs(delta) < 1) return;
      const direction = delta > 0 ? "down" : "up";
      if (direction !== scrollDirection.current) {
        scrollDirection.current = direction;
        scrollDelta.current = 0;
      }
      scrollDelta.current += Math.abs(delta);

      if (direction === "down" && scrollDelta.current >= 12) {
        setNavVisible(false);
      } else if (direction === "up" && scrollDelta.current >= 3) {
        setNavVisible(true);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const refreshUser = () => {
      setUser(getStoredUser());
    };

    refreshUser();

    window.addEventListener("user-updated", refreshUser);
    window.addEventListener("storage", refreshUser);

    return () => {
      window.removeEventListener("user-updated", refreshUser);
      window.removeEventListener("storage", refreshUser);
    };
  }, []);

  useEffect(() => {
    const fetchCartCount = async () => {
      try {
        const storedUser = getStoredUser();
        if (storedUser && storedUser.UserID) {
          const cartData = await api.getCart(storedUser.UserID);
          const total = Array.isArray(cartData)
            ? cartData.reduce((sum, item) => sum + Number(item.Quantity || 1), 0)
            : 0;
          setCartCount(total);
        } else {
          setCartCount(0);
        }
      } catch (err) {
        console.error("Lỗi lấy giỏ hàng cho Navbar:", err);
        setCartCount(0);
      }
    };

    fetchCartCount();

    window.addEventListener("cart-updated", fetchCartCount);
    window.addEventListener("user-updated", fetchCartCount);
    window.addEventListener("storage", fetchCartCount);

    return () => {
      window.removeEventListener("cart-updated", fetchCartCount);
      window.removeEventListener("user-updated", fetchCartCount);
      window.removeEventListener("storage", fetchCartCount);
    };
  }, []);

  useEffect(() => {
    let active = true;
    const fetchUnreadNotifications = async () => {
      const storedUser = getStoredUser();
      if (!storedUser?.UserID) {
        if (active) setUnreadNotifications(0);
        return;
      }
      try {
        const result = await api.getNotifications(storedUser.UserID);
        if (active) setUnreadNotifications(result.unreadCount);
      } catch {
        if (active) setUnreadNotifications(0);
      }
    };

    void fetchUnreadNotifications();
    const timer = window.setInterval(fetchUnreadNotifications, 30_000);
    window.addEventListener("user-updated", fetchUnreadNotifications);
    window.addEventListener("notifications-updated", fetchUnreadNotifications);
    window.addEventListener("storage", fetchUnreadNotifications);
    return () => {
      active = false;
      window.clearInterval(timer);
      window.removeEventListener("user-updated", fetchUnreadNotifications);
      window.removeEventListener("notifications-updated", fetchUnreadNotifications);
      window.removeEventListener("storage", fetchUnreadNotifications);
    };
  }, []);

  useEffect(() => {
    if (!accountMenuOpen) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && !accountMenuRef.current?.contains(event.target)) {
        setAccountMenuOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setAccountMenuOpen(false);
        accountButtonRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [accountMenuOpen]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null);
    setAccountMenuOpen(false);
    window.dispatchEvent(new Event("user-updated"));
    window.location.href = "/login";
  };

  // Xử lý khi người dùng nhập tìm kiếm hoặc nhấn Enter
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const val = event.target.value;
    if (onSearchChange) {
      onSearchChange(val);
    } else {
      setLocalSearch(val);
    }
    window.dispatchEvent(new CustomEvent("store-search", { detail: val }));
  };

  const handleSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    const value = onSearchChange ? searchValue : localSearch;
    if (event.key === "Enter" && value.trim()) {
      router.push(`/customer/products?search=${encodeURIComponent(value.trim())}`);
    }
  };

  return (
    <>
      <header className={`store-header${navVisible ? "" : " nav-hidden"}`}>
        <div className="header-inner">
          <Link href="/" className="brand">
            MANB<span>.VN</span>
          </Link>

          <div className="header-search">
            <SearchIcon />
            <input
              aria-label="Tìm sản phẩm"
              placeholder="Tìm sản phẩm..."
              value={onSearchChange ? searchValue : localSearch}
              onChange={handleSearchChange}
              onKeyDown={handleSearchKeyDown}
            />
          </div>

          <nav className="desktop-links">
            <Link href="/">Trang chủ</Link>
            <Link href="/customer/products">Sản phẩm</Link>
            <Link href="/customer/favorites">Yêu thích</Link>
            <Link href="/customer/notifications" className="relative">Thông báo{unreadNotifications > 0 && <span className="ml-1 inline-flex min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-black leading-none text-white">{unreadNotifications > 99 ? "99+" : unreadNotifications}</span>}</Link>

            {user && (user.Role === 'admin' || (user as any).role === 'admin') && (
              <Link 
                href="/admin" 
                className="font-bold text-emerald-600 hover:text-emerald-700 transition"
              >
                Quản trị Admin
              </Link>
            )}

            <Link
              href="/customer/cart"
              className="cart-link"
              aria-label={`Giỏ hàng, ${cartCount} sản phẩm`}
            >
              <span className="cart-icon-wrap">
                <CartIcon />
                {cartCount > 0 && <b className="cart-badge">{cartCount}</b>}
              </span>
            </Link>
          </nav>

          {user ? (
            <div className="relative flex items-center" ref={accountMenuRef}>
              <button
                ref={accountButtonRef}
                type="button"
                aria-haspopup="menu"
                aria-expanded={accountMenuOpen}
                aria-label={`Menu tài khoản${user.FullName ? ` của ${user.FullName}` : ""}`}
                title={user.FullName || user.Email}
                onClick={() => setAccountMenuOpen((open) => !open)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white p-1 shadow-sm transition hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                {user.Avatar ? (
                  <img
                    src={user.Avatar}
                    alt=""
                    className="h-8 w-8 rounded-full border border-slate-200 object-cover"
                  />
                ) : (
                  <div aria-hidden="true" className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-xs font-bold uppercase text-white">
                    {(user.FullName || user.Email || "U").charAt(0)}
                  </div>
                )}
              </button>
              {accountMenuOpen && <div role="menu" aria-label="Chức năng tài khoản" className="absolute right-0 top-full z-[70] mt-3 w-64 rounded-2xl border border-slate-200 bg-white p-2 text-slate-800 shadow-xl">
                <div className="border-b border-slate-100 px-3 py-2">
                  <p className="truncate text-sm font-black">{user.FullName || "Tài khoản của tôi"}</p>
                  <p className="truncate text-xs text-slate-500">{user.Email}</p>
                </div>
                <Link role="menuitem" href="/customer/account" onClick={() => setAccountMenuOpen(false)} className="mt-1 block rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-blue-50 hover:text-blue-700">Thông tin tài khoản</Link>
                <Link role="menuitem" href="/customer/orders" onClick={() => setAccountMenuOpen(false)} className="block rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-blue-50 hover:text-blue-700">Đơn hàng &amp; trạng thái</Link>
                <Link role="menuitem" href="/customer/addresses" onClick={() => setAccountMenuOpen(false)} className="block rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-blue-50 hover:text-blue-700">Sổ địa chỉ</Link>
                <Link role="menuitem" href="/customer/notifications" onClick={() => setAccountMenuOpen(false)} className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-blue-50 hover:text-blue-700"><span>Thông báo</span>{unreadNotifications > 0 && <span className="rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-black text-white">{unreadNotifications > 99 ? "99+" : unreadNotifications}</span>}</Link>
                <div className="my-1 border-t border-slate-100" />
                <button role="menuitem" type="button" onClick={handleLogout} className="w-full rounded-xl px-3 py-2.5 text-left text-sm font-bold text-red-600 transition hover:bg-red-50">Đăng xuất</button>
              </div>}
            </div>
          ) : (
            <Link href="/login" className="login-button">
              Đăng nhập
            </Link>
          )}
        </div>
      </header>

      <nav className={`mobile-bottom-nav${navVisible ? "" : " nav-hidden"}`}>
        <Link href="/" className="mobile-nav-item active">
          <span>⌂</span>
          <small>Trang chủ</small>
        </Link>

        <Link href="/customer/products" className="mobile-nav-item">
          <span>▦</span>
          <small>Danh mục</small>
        </Link>

        <Link href="/customer/cart" className="mobile-nav-item mobile-cart-item">
          <span className="mobile-cart-icon">
            <CartIcon />
            {cartCount > 0 && <b className="mobile-cart-badge">{cartCount}</b>}
          </span>
          <small>Giỏ hàng</small>
        </Link>

        <Link href="/customer/favorites" className="mobile-nav-item">
          <span>♡</span>
          <small>Yêu thích</small>
        </Link>

        {user && (user.Role === 'admin' || (user as any).role === 'admin') && (
          <Link href="/admin" className="mobile-nav-item text-emerald-600 font-bold">
            <span>⚙</span>
            <small>Admin</small>
          </Link>
        )}

        <Link href="/customer/notifications" className="mobile-nav-item">
          <span>♧</span>
          <small>Thông báo{unreadNotifications > 0 ? ` (${unreadNotifications > 99 ? "99+" : unreadNotifications})` : ""}</small>
        </Link>

        {!user && (
          <Link href="/login" className="mobile-nav-item">
            <span>◉</span>
            <small>Đăng nhập</small>
          </Link>
        )}
      </nav>
    </>
  );
}
