"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { api, type Product, type StoreOrder } from "@/lib/api";
import { useAdminGuard } from '@/lib/useAdminGuard';

function isDelivered(status?: string | null) {
  return ['delivered', 'completed', 'complete'].includes((status || '').trim().toLowerCase());
}

function currentMonthValue() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function isInMonth(orderDate: string | null | undefined, month: string) {
  if (!orderDate || !month) return false;
  const date = new Date(orderDate);
  return !Number.isNaN(date.getTime()) && `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}` === month;
}

function formatMoney(amount: number) {
  return `${amount.toLocaleString('vi-VN')} ₫`;
}

export default function AdminDashboard() {
  useAdminGuard();
  const [productCount, setProductCount] = useState(0);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<StoreOrder[]>([]);
  const [userCount, setUserCount] = useState(0);
  const [selectedMonth, setSelectedMonth] = useState(currentMonthValue);

  useEffect(() => {
    // Tải dữ liệu thống kê nhanh
    api.getProducts()
      .then((data) => { const rows = Array.isArray(data) ? data : []; setProductCount(rows.length); setProducts(rows); })
      .catch(() => {});

    api.getOrders()
      .then((data) => setOrders(Array.isArray(data) ? data : []))
      .catch(() => {});

    api.getUsers()
      .then((data) => setUserCount(Array.isArray(data) ? data.length : 0))
      .catch(() => {});
  }, []);

  const deliveredOrders = useMemo(() => orders.filter((order) => isDelivered(order.Status)), [orders]);
  const lifetimeRevenue = useMemo(() => deliveredOrders.reduce((total, order) => total + Number(order.TotalAmount || 0), 0), [deliveredOrders]);
  const monthlyRevenue = useMemo(() => deliveredOrders
    .filter((order) => isInMonth(order.OrderDate, selectedMonth))
    .reduce((total, order) => total + Number(order.TotalAmount || 0), 0), [deliveredOrders, selectedMonth]);
  const year = Number(selectedMonth.slice(0, 4)) || new Date().getFullYear();
  const monthlySeries = useMemo(() => Array.from({ length: 12 }, (_, index) => {
    const month = `${year}-${String(index + 1).padStart(2, '0')}`;
    return { label: String(index + 1), amount: deliveredOrders.filter((order) => isInMonth(order.OrderDate, month)).reduce((sum, order) => sum + Number(order.TotalAmount || 0), 0) };
  }), [deliveredOrders, year]);
  const maxMonthlyRevenue = Math.max(1, ...monthlySeries.map((item) => item.amount));
  const lowStockProducts = useMemo(() => products.filter((product) => Number(product.StockQuantity ?? 0) <= 5).sort((a, b) => Number(a.StockQuantity ?? 0) - Number(b.StockQuantity ?? 0)), [products]);

  function exportRevenueCsv() {
    const rows = deliveredOrders.filter((order) => order.OrderDate?.startsWith(String(year))).map((order) => [order.OrderID, order.OrderDate || '', order.RecipientName || order.User?.FullName || '', order.TotalAmount]);
    const escape = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`;
    const csv = ['Mã đơn,Ngày đặt,Khách hàng,Doanh thu', ...rows.map((row) => row.map(escape).join(','))].join('\r\n');
    const blob = new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a'); link.href = url; link.download = `doanh-thu-${year}.csv`; link.click(); URL.revokeObjectURL(url);
  }

  return (
    <main className="min-h-screen bg-slate-50 p-8 text-slate-800">
      <div className="mx-auto max-w-6xl">
        {/* Tiêu đề */}
        <div className="mb-8">
          <h1 className="text-3xl font-black text-slate-900">Trang Quản Trị (Admin Dashboard)</h1>
          <p className="text-sm text-slate-500 mt-1">Chào mừng bạn trở lại bảng điều khiển hệ thống cửa hàng.</p>
        </div>

        <div className="mb-3 flex justify-end">
          <label className="flex items-center gap-3 text-sm font-semibold text-slate-600">
            <span>Tháng xem doanh thu</span>
            <input aria-label="Chọn tháng xem doanh thu" type="month" value={selectedMonth} onChange={(event) => setSelectedMonth(event.target.value)} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-800 outline-none focus:border-teal-500" />
          </label>
        </div>
        <section aria-label="Thống kê cửa hàng" className="mb-10 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="grid grid-cols-1 divide-y divide-slate-200 md:grid-cols-3 md:divide-x md:divide-y-0">
            <div className="p-6 sm:p-8">
              <p className="min-h-5 text-sm font-bold uppercase tracking-wide text-emerald-700">Tổng doanh thu</p>
              <p className="mt-3 break-words text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">{formatMoney(lifetimeRevenue)}</p>
              <p className="mt-2 text-sm text-slate-500">Từ tất cả đơn đã giao thành công</p>
            </div>
            <div className="p-6 sm:p-8">
              <p className="min-h-5 text-sm font-bold uppercase tracking-wide text-teal-700">Doanh thu theo tháng</p>
              <p className="mt-3 break-words text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">{formatMoney(monthlyRevenue)}</p>
              <p className="mt-2 text-sm text-slate-500">Đơn đặt trong {selectedMonth || 'tháng đã chọn'} đã giao thành công</p>
            </div>
            <div className="p-6 sm:p-8">
              <p className="min-h-5 text-sm font-bold uppercase tracking-wide text-blue-700">Đơn hàng đã giao thành công</p>
              <p className="mt-3 text-5xl font-black tracking-tight text-slate-950 sm:text-6xl">{deliveredOrders.length}</p>
              <p className="mt-2 text-sm text-slate-500">Tổng số đơn giao hoàn tất</p>
            </div>
          </div>
        </section>

        <section className="mb-8 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7" aria-labelledby="revenue-chart-title">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div><h2 id="revenue-chart-title" className="text-lg font-black">Doanh thu theo tháng năm {year}</h2><p className="text-sm text-slate-500">Chỉ tính đơn đã giao thành công</p></div><button onClick={exportRevenueCsv} className="rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-800">Xuất báo cáo CSV</button></div>
          <div className="grid h-52 grid-cols-12 items-end gap-2 border-b border-l border-slate-200 px-2 pt-2 sm:gap-4">{monthlySeries.map((item) => <div key={item.label} className="flex h-full flex-col items-center justify-end gap-2"><div title={`${item.amount.toLocaleString('vi-VN')} ₫`} className="w-full min-w-3 rounded-t-md bg-emerald-500 transition hover:bg-emerald-700" style={{ height: `${Math.max(item.amount ? 5 : 1, item.amount / maxMonthlyRevenue * 82)}%` }} /><span className="pb-1 text-[10px] text-slate-500 sm:text-xs">T{item.label}</span></div>)}</div>
        </section>

        {lowStockProducts.length > 0 && <section className="mb-8 rounded-2xl border border-amber-200 bg-amber-50 p-5" aria-labelledby="low-stock-title"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 id="low-stock-title" className="font-black text-amber-900">Cảnh báo tồn kho thấp ({lowStockProducts.length})</h2><p className="mt-1 text-sm text-amber-800">Sản phẩm còn không quá 5 đơn vị</p></div><Link href="/admin/products" className="rounded-lg bg-amber-700 px-3 py-2 text-sm font-bold text-white">Quản lý sản phẩm</Link></div><ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{lowStockProducts.slice(0, 6).map((product) => <li key={product.ProductID} className="flex justify-between gap-3 rounded-xl bg-white p-3 text-sm"><span className="truncate font-semibold">{product.ProductName}</span><span className="shrink-0 font-black text-amber-800">Còn {product.StockQuantity ?? 0}</span></li>)}</ul></section>}

        <h2 className="mb-4 text-lg font-bold text-slate-800">Tính năng quản trị</h2>
        <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
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
                  {orders.length}
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
