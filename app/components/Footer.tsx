'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Footer() {
  const pathname = usePathname();

  // Ẩn footer trên các trang quản trị Admin
  if (pathname?.startsWith("/admin")) {
    return null;
  }

  const isDarkPage = pathname?.startsWith("/promotions");

  return (
    <footer
      className={`mt-auto border-t transition-colors ${
        isDarkPage
          ? "bg-slate-950 border-slate-800 text-slate-400"
          : "bg-white border-slate-200 text-slate-600"
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2.5">
              <img
                src="/devora-icon.png"
                alt="DEVORA"
                className="h-9 w-9 object-cover rounded-xl shadow-md border border-white/20 shrink-0"
              />
              <span className={`text-xl font-black tracking-tight ${isDarkPage ? "text-white" : "text-blue-700"}`}>
                DEVORA<span className={isDarkPage ? "text-blue-400" : "text-slate-900"}>.VN</span>
              </span>
            </div>
            <p className={`text-xs font-bold uppercase tracking-wider ${isDarkPage ? "text-blue-400" : "text-blue-600"}`}>
              INNOVATION THROUGH TECHNOLOGY
            </p>
            <p className={`text-xs max-w-md leading-relaxed ${isDarkPage ? "text-slate-400" : "text-slate-500"}`}>
              Hệ thống bán lẻ máy tính, laptop gaming và thiết bị công nghệ chính hãng hàng đầu với chính sách bảo hành và giá tốt nhất.
            </p>
          </div>

          <div>
            <h3 className={`text-xs font-black uppercase tracking-wider mb-3 ${isDarkPage ? "text-slate-200" : "text-slate-900"}`}>
              Hỗ trợ khách hàng
            </h3>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/customer/policies" className="hover:text-blue-500 transition">
                  Chính sách & điều khoản
                </Link>
              </li>
              <li>
                <Link href="/customer/showrooms" className="hover:text-blue-500 transition">
                  Hệ thống showroom
                </Link>
              </li>
              <li>
                <Link href="/customer/addresses" className="hover:text-blue-500 transition">
                  Sổ địa chỉ
                </Link>
              </li>
              <li>
                <Link href="/customer/vouchers" className="hover:text-blue-500 transition">
                  Mã giảm giá
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className={`text-xs font-black uppercase tracking-wider mb-3 ${isDarkPage ? "text-slate-200" : "text-slate-900"}`}>
              Liên hệ
            </h3>
            <ul className="space-y-2 text-xs">
              <li className="flex items-center gap-2">
                <span className="font-semibold">Email:</span>
                <a href="mailto:support@devora.id.vn" className="hover:text-blue-500 transition">
                  support@devora.id.vn
                </a>
              </li>
              <li className="flex items-center gap-2">
                <span className="font-semibold">Hotline:</span>
                <a href="tel:0909680426" className="font-bold text-blue-500 hover:underline">
                  0909 680 426
                </a>
              </li>
              <li className="text-[11px] pt-1 text-slate-500">
                Thứ 2 - Chủ Nhật: 8:00 - 21:30
              </li>
            </ul>
          </div>
        </div>

        <div className={`mt-8 pt-6 border-t text-center text-xs ${
          isDarkPage
            ? "border-slate-800 text-slate-500"
            : "border-slate-100 text-slate-400"
        }`}>
          © {new Date().getFullYear()} DEVORA.ID.VN. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
