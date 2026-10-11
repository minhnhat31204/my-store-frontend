'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Footer() {
  const pathname = usePathname();

  // Ẩn footer cửa hàng bán lẻ trên các trang quản trị Admin
  if (pathname?.startsWith("/admin")) {
    return null;
  }

  return (
    <footer className="store-footer">
      <div className="footer-inner">
        <div>
          <div className="footer-brand flex items-center gap-2.5">
            <img src="/devora-icon.png" alt="DEVORA" className="h-8 w-8 object-cover rounded-xl shadow-md border border-white/20" />
            <span>DEVORA<span>.VN</span></span>
          </div>
          <p className="font-bold text-blue-200 mt-2 text-xs tracking-wider uppercase">INNOVATION THROUGH TECHNOLOGY</p>
          <p className="text-xs text-slate-300">Development & Innovation</p>
        </div>
        <div>
          <h3>Hỗ trợ khách hàng</h3>
          <p><Link href="/customer/policies">Chính sách & điều khoản</Link></p>
          <p><Link href="/customer/showrooms">Hệ thống showroom</Link></p>
          <p><Link href="/customer/addresses">Sổ địa chỉ</Link></p>
          <p><Link href="/customer/vouchers">Mã giảm giá</Link></p>
        </div>
        <div>
          <h3>Liên hệ</h3>
          <p>Email: support@devora.vn</p>
          <p>Hotline: 0909 680 426</p>
        </div>
      </div>
      <div className="footer-bottom">© {new Date().getFullYear()} DEVORA.VN. All rights reserved.</div>
    </footer>
  );
}
