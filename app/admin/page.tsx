"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export default function AdminDashboard() {
  const [productCount, setProductCount] = useState(0);
  const [orderCount, setOrderCount] = useState(0);
  const [userCount, setUserCount] = useState(0);

  useEffect(() => {
    // Tải dữ liệu thống kê nhanh
    api.getProducts()
      .then((data) => setProductCount(Array.isArray(data) ? data.length : 0))
      .catch(() => {});

    api.getOrders()
      .then((data) => setOrderCount(Array.isArray(data) ? data.length : 0))
      .catch(() => {});

    api.getUsers()
      .then((data) => setUserCount(Array.isArray(data) ? data.length : 0))
      .catch(() => {});
  }, []);

  return (
    <main className="min-h-screen bg-slate-50 p-8 text-slate-800">
      <div className="mx-auto max-w-6xl">
        {/* Tiêu đề */}
        <div className="mb-8">
          <h1 className="text-3xl font-black text-slate-900">Trang Quản Trị (Admin Dashboard)</h1>
          <p className="text-sm text-slate-500 mt-1">Chào mừng bạn trở lại bảng điều khiển hệ thống cửa hàng.</p>
        </div>

        {/* Các thẻ thống kê nhanh */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Thẻ Sản phẩm */}
          <Link
            href="/admin/products"
            className="block rounded-2xl bg-white p-6 shadow-sm border border-slate-200 hover:border-blue-500 transition group"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-500 uppercase">Tổng sản phẩm</p>
                <h3 className="text-3xl font-black text-slate-900 mt-2 group-hover:text-blue-600 transition">
                  {productCount}
                </h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 text-xl font-bold">
                📦
              </div>
            </div>
            <span className="inline-block mt-4 text-xs font-bold text-blue-600">Quản lý sản phẩm →</span>
          </Link>

          {/* Thẻ Đơn hàng */}
          <Link
            href="/admin/orders"
            className="block rounded-2xl bg-white p-6 shadow-sm border border-slate-200 hover:border-emerald-500 transition group"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-500 uppercase">Tổng đơn hàng</p>
                <h3 className="text-3xl font-black text-slate-900 mt-2 group-hover:text-emerald-600 transition">
                  {orderCount}
                </h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 text-xl font-bold">
                🛒
              </div>
            </div>
            <span className="inline-block mt-4 text-xs font-bold text-emerald-600">Quản lý đơn hàng →</span>
          </Link>

          {/* Thẻ Tài khoản */}
          <Link
            href="/admin/users"
            className="block rounded-2xl bg-white p-6 shadow-sm border border-slate-200 hover:border-purple-500 transition group"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-500 uppercase">Tổng tài khoản</p>
                <h3 className="text-3xl font-black text-slate-900 mt-2 group-hover:text-purple-600 transition">
                  {userCount}
                </h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 text-xl font-bold">
                👥
              </div>
            </div>
            <span className="inline-block mt-4 text-xs font-bold text-purple-600">Quản lý tài khoản →</span>
          </Link>
        </div>

        {/* Nút quay lại trang chủ khách hàng */}
        <div className="flex justify-start">
          <Link
            href="/"
            className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-bold text-white hover:bg-slate-800 transition"
          >
            ← Quay lại trang chủ cửa hàng
          </Link>
        </div>
      </div>
    </main>
  );
}