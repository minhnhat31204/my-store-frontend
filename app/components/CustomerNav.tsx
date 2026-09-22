"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getCart } from "@/lib/cart";

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

export default function CustomerNav({ searchValue = "", onSearchChange }: CustomerNavProps) {
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    const refresh = () => {
      setCartCount(getCart().reduce((sum, item) => sum + item.quantity, 0));
    };

    refresh();
    window.addEventListener("cart-updated", refresh);
    window.addEventListener("storage", refresh);

    return () => {
      window.removeEventListener("cart-updated", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  return (
    <>
      <header className="store-header">
        <div className="header-inner">
          <Link href="/" className="brand">
            MANB<span>.VN</span>
          </Link>

          <div className="header-search">
            <SearchIcon />
            <input
              aria-label="Tìm sản phẩm"
              placeholder="Tìm sản phẩm..."
              value={searchValue}
              onChange={(event) => onSearchChange?.(event.target.value)}
            />
          </div>

          <nav className="desktop-links">
            <Link href="/">Trang chủ</Link>
            <Link href="/customer/products">Sản phẩm</Link>
            <Link href="/customer/notifications">Thông báo</Link>
            <Link href="/customer/account">Tài khoản</Link>
            <Link href="/customer/cart" className="cart-link" aria-label={`Giỏ hàng, ${cartCount} sản phẩm`}>
              <span className="cart-icon-wrap">
                <CartIcon />
                {cartCount > 0 && <b className="cart-badge">{cartCount}</b>}
              </span>
            </Link>
          </nav>

          <Link href="/login" className="login-button">
            Đăng nhập
          </Link>
        </div>
      </header>

      <nav className="mobile-bottom-nav">
        <Link href="/" className="mobile-nav-item active">
          <span>⌂</span><small>Trang chủ</small>
        </Link>
        <Link href="/customer/products" className="mobile-nav-item">
          <span>▦</span><small>Danh mục</small>
        </Link>
        <Link href="/customer/cart" className="mobile-nav-item mobile-cart-item">
          <span className="mobile-cart-icon"><CartIcon />{cartCount > 0 && <b className="mobile-cart-badge">{cartCount}</b>}</span>
          <small>Giỏ hàng</small>
        </Link>
        <Link href="/customer/notifications" className="mobile-nav-item">
          <span>♧</span><small>Thông báo</small>
        </Link>
        <Link href="/customer/account" className="mobile-nav-item">
          <span>◉</span><small>Tài khoản</small>
        </Link>
      </nav>
    </>
  );
}
