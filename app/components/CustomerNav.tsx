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
  const [user, setUser] = useState<User | null>(null);
  const [localSearch, setLocalSearch] = useState(searchValue);
  const [navVisible, setNavVisible] = useState(true);
  const lastScrollY = useRef(0);
  const scrollDelta = useRef(0);
  const scrollDirection = useRef<"up" | "down" | null>(null);
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

  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null);
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
            <Link href="/customer/notifications">Thông báo</Link>

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
            <div className="flex items-center gap-3">
              <Link
                href="/customer/account"
                className="flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-sm font-bold text-blue-700 hover:bg-blue-50 transition shadow-sm"
              >
                {user.Avatar ? (
                  <img
                    src={user.Avatar}
                    alt={user.FullName || "Avatar"}
                    className="w-7 h-7 rounded-full object-cover border border-slate-200"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold uppercase">
                    {(user.FullName || user.Email || "U").charAt(0)}
                  </div>
                )}
                <span>{user.FullName || user.Email}</span>
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                className="rounded-full bg-white px-4 py-2 font-bold text-blue-700 hover:bg-blue-50 transition shadow-sm text-sm"
              >
                Đăng xuất
              </button>
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
          <small>Thông báo</small>
        </Link>

        {user ? (
          <button type="button" className="mobile-nav-item" onClick={handleLogout}>
            <span>⇥</span>
            <small>Đăng xuất</small>
          </button>
        ) : (
          <Link href="/login" className="mobile-nav-item">
            <span>◉</span>
            <small>Đăng nhập</small>
          </Link>
        )}
      </nav>
    </>
  );
}
