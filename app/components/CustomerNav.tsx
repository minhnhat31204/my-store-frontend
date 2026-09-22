"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getCart } from "@/lib/cart";

export default function CustomerNav() {
  const [cartCount, setCartCount] = useState(0);
  useEffect(() => {
    const refresh = () => setCartCount(getCart().reduce((sum, item) => sum + item.quantity, 0));
    refresh();
    window.addEventListener("cart-updated", refresh);
    return () => window.removeEventListener("cart-updated", refresh);
  }, []);

  return (
    <>
      <header className="store-header">
        <div className="header-inner">
          <Link href="/" className="brand">MANB<span>.VN</span></Link>
          <nav className="desktop-links">
            <Link href="/">Trang chủ</Link>
            <Link href="/customer/products">Sản phẩm</Link>
            <Link href="/customer/cart">Giỏ hàng{cartCount > 0 ? ` (${cartCount})` : ""}</Link>
            <Link href="/customer/notifications">Thông báo</Link>
            <Link href="/customer/account">Tài khoản</Link>
          </nav>
          <Link href="/login" className="login-button">Đăng nhập</Link>
        </div>
        <div className="search-wrap">
          <input aria-label="Tìm sản phẩm" placeholder="Tìm sản phẩm..." />
        </div>
      </header>

      <nav className="mobile-bottom-nav">
        <Link href="/" className="mobile-nav-item active"><span>⌂</span><small>Trang chủ</small></Link>
        <Link href="/customer/products" className="mobile-nav-item"><span>▦</span><small>Danh mục</small></Link>
        <Link href="/customer/cart" className="mobile-nav-item"><span>🛒</span><small>Giỏ hàng</small></Link>
        <Link href="/customer/notifications" className="mobile-nav-item"><span>♧</span><small>Thông báo</small></Link>
        <Link href="/customer/account" className="mobile-nav-item"><span>◉</span><small>Tài khoản</small></Link>
      </nav>
    </>
  );
}
