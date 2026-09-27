'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { api, type Product, type StoreOrder } from '@/lib/api';

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
  const [productCount, setProductCount] = useState(0);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<StoreOrder[]>([]);
  const [userCount, setUserCount] = useState(0);
  const [selectedMonth, setSelectedMonth] = useState(currentMonthValue);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      api.getProducts().then((data) => {
        const rows = Array.isArray(data) ? data : [];
        setProductCount(rows.length);
        setProducts(rows);
      }),
      api.getOrders().then((data) => {
        setOrders(Array.isArray(data) ? data : []);
      }),
      api.getUsers().then((data) => {
        setUserCount(Array.isArray(data) ? data.length : 0);
      }),
    ]).finally(() => setLoading(false));
  }, []);

  const deliveredOrders = useMemo(() => orders.filter((order) => isDelivered(order.Status)), [orders]);
  const pendingOrders = useMemo(() => orders.filter((order) => (order.Status || 'pending').toLowerCase() === 'pending'), [orders]);
  const lifetimeRevenue = useMemo(() => deliveredOrders.reduce((total, order) => total + Number(order.TotalAmount || 0), 0), [deliveredOrders]);
  const monthlyRevenue = useMemo(() => deliveredOrders
    .filter((order) => isInMonth(order.OrderDate, selectedMonth))
    .reduce((total, order) => total + Number(order.TotalAmount || 0), 0), [deliveredOrders, selectedMonth]);
  
  const year = Number(selectedMonth.slice(0, 4)) || new Date().getFullYear();
  const monthlySeries = useMemo(() => Array.from({ length: 12 }, (_, index) => {
    const month = `${year}-${String(index + 1).padStart(2, '0')}`;
    return {
      label: `T${index + 1}`,
      monthNum: index + 1,
      amount: deliveredOrders.filter((order) => isInMonth(order.OrderDate, month)).reduce((sum, order) => sum + Number(order.TotalAmount || 0), 0)
    };
  }), [deliveredOrders, year]);

  const maxMonthlyRevenue = Math.max(1, ...monthlySeries.map((item) => item.amount));
  const lowStockProducts = useMemo(() => products.filter((product) => Number(product.StockQuantity ?? 0) <= 5).sort((a, b) => Number(a.StockQuantity ?? 0) - Number(b.StockQuantity ?? 0)), [products]);

  function exportRevenueCsv() {
    const rows = deliveredOrders.filter((order) => order.OrderDate?.startsWith(String(year))).map((order) => [order.OrderID, order.OrderDate || '', order.RecipientName || order.User?.FullName || '', order.TotalAmount]);
    const escape = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`;
    const csv = ['Mã đơn,Ngày đặt,Khách hàng,Doanh thu', ...rows.map((row) => row.map(escape).join(','))].join('\r\n');
    const blob = new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `doanh-thu-${year}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-950/60 p-6 rounded-3xl border border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Tổng quan Hoạt động
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Theo dõi thống kê kinh doanh, đơn hàng và kho hàng theo thời gian thực.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-300 bg-slate-900 border border-slate-700/80 px-3 py-2 rounded-xl">
            <span>Tháng:</span>
            <input
              aria-label="Chọn tháng xem doanh thu"
              type="month"
              value={selectedMonth}
              onChange={(event) => setSelectedMonth(event.target.value)}
              className="bg-transparent text-white font-bold outline-none cursor-pointer"
            />
          </label>
        </div>
      </div>

      {/* Main KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Lifetime Revenue */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/20 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              Tổng doanh thu
            </span>
            <span className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              💵
            </span>
          </div>
          <p className="mt-3 text-2xl lg:text-3xl font-black text-white tracking-tight">
            {formatMoney(lifetimeRevenue)}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Từ {deliveredOrders.length} đơn hoàn tất
          </p>
        </div>

        {/* Monthly Revenue */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-950/40 via-slate-900 to-slate-900 border border-blue-500/20 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
              Doanh thu tháng
            </span>
            <span className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
              📅
            </span>
          </div>
          <p className="mt-3 text-2xl lg:text-3xl font-black text-white tracking-tight">
            {formatMoney(monthlyRevenue)}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Tháng {selectedMonth}
          </p>
        </div>

        {/* Orders Pending */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-900 border border-amber-500/20 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
              Chờ xác nhận
            </span>
            <span className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
              ⏳
            </span>
          </div>
          <p className="mt-3 text-2xl lg:text-3xl font-black text-white tracking-tight">
            {pendingOrders.length} <span className="text-sm font-normal text-slate-400">/ {orders.length} đơn</span>
          </p>
          <Link href="/admin/orders" className="mt-1 text-xs font-semibold text-amber-400 hover:underline block">
            Xử lý ngay →
          </Link>
        </div>

        {/* Total Products & Low stock alert */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-950/40 via-slate-900 to-slate-900 border border-purple-500/20 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-400">
              Sản phẩm & Kho
            </span>
            <span className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400">
              📦
            </span>
          </div>
          <p className="mt-3 text-2xl lg:text-3xl font-black text-white tracking-tight">
            {productCount} <span className="text-sm font-normal text-slate-400">mã SP</span>
          </p>
          <p className="mt-1 text-xs text-slate-400">
            {lowStockProducts.length > 0 ? (
              <span className="text-rose-400 font-semibold">{lowStockProducts.length} SP sắp hết hàng</span>
            ) : (
              <span className="text-emerald-400">Kho ổn định</span>
            )}
          </p>
        </div>
      </div>

      {/* Revenue Chart Section */}
      <section className="rounded-3xl border border-slate-800 bg-slate-950/60 p-6 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg font-bold text-white">Biểu đồ doanh thu năm {year}</h2>
            <p className="text-xs text-slate-400">Tính trên các đơn hàng đã giao thành công</p>
          </div>
          <button
            onClick={exportRevenueCsv}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-xs font-bold text-white transition shadow-md shadow-emerald-900/30"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span>Xuất CSV Báo cáo</span>
          </button>
        </div>

        {/* Chart Bars */}
        <div className="grid h-56 grid-cols-12 items-end gap-2 border-b border-l border-slate-800 px-3 pt-4 sm:gap-4">
          {monthlySeries.map((item) => {
            const heightPercent = Math.max(item.amount ? 8 : 2, (item.amount / maxMonthlyRevenue) * 85);
            return (
              <div key={item.label} className="group relative flex h-full flex-col items-center justify-end gap-2">
                {/* Tooltip on Hover */}
                <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-[10px] font-bold py-1 px-2 rounded pointer-events-none whitespace-nowrap border border-slate-700 shadow z-10">
                  {formatMoney(item.amount)}
                </div>
                
                <div
                  className="w-full min-w-3 rounded-t-lg bg-gradient-to-t from-emerald-600 to-teal-400 group-hover:from-emerald-500 group-hover:to-teal-300 transition"
                  style={{ height: `${heightPercent}%` }}
                />
                <span className="pb-1 text-[11px] font-medium text-slate-400">
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Two columns: Low Stock Alerts + Quick Modules */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Alert */}
        <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                <h3 className="text-base font-bold text-white">Cảnh báo kho hàng</h3>
              </div>
              <span className="text-xs font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2.5 py-0.5 rounded-full">
                {lowStockProducts.length} mặt hàng
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Các sản phẩm có số lượng tồn kho ≤ 5 cần được nhập thêm hàng sớm.
            </p>

            {lowStockProducts.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-slate-800 rounded-2xl text-slate-400 text-xs">
                Tất cả sản phẩm đều còn đủ hàng trong kho!
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {lowStockProducts.slice(0, 5).map((p) => (
                  <div
                    key={p.ProductID}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800/80 hover:border-slate-700 transition"
                  >
                    <div className="min-w-0 flex-1 pr-3">
                      <p className="text-xs font-bold text-white truncate">{p.ProductName}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{formatMoney(Number(p.Price))}</p>
                    </div>
                    <span className="shrink-0 text-xs font-black px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      Còn {p.StockQuantity ?? 0}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-slate-800 flex justify-end">
            <Link
              href="/admin/products"
              className="text-xs font-bold text-blue-400 hover:text-blue-300 transition"
            >
              Xem tất cả sản phẩm →
            </Link>
          </div>
        </div>

        {/* Quick Nav Shortcuts */}
        <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-white mb-1">Truy cập nhanh</h3>
            <p className="text-xs text-slate-400 mb-4">Điều hướng trực tiếp tới các phân hệ nghiệp vụ chính.</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Link
                href="/admin/products"
                className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-blue-500/50 hover:bg-slate-800/50 transition group"
              >
                <div className="text-2xl mb-2">📦</div>
                <div className="font-bold text-sm text-white group-hover:text-blue-400 transition">Sản phẩm</div>
                <p className="text-[11px] text-slate-400 mt-0.5">Quản lý catalog, thêm mới, sửa giá và kho</p>
              </Link>

              <Link
                href="/admin/orders"
                className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-800/50 transition group"
              >
                <div className="text-2xl mb-2">🛒</div>
                <div className="font-bold text-sm text-white group-hover:text-emerald-400 transition">Đơn hàng</div>
                <p className="text-[11px] text-slate-400 mt-0.5">Xem đơn mới, cập nhật vận đơn & trạng thái</p>
              </Link>

              <Link
                href="/admin/users"
                className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-purple-500/50 hover:bg-slate-800/50 transition group"
              >
                <div className="text-2xl mb-2">👥</div>
                <div className="font-bold text-sm text-white group-hover:text-purple-400 transition">Người dùng</div>
                <p className="text-[11px] text-slate-400 mt-0.5">Danh sách tài khoản & phân quyền quản trị</p>
              </Link>

              <Link
                href="/"
                className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-800/50 transition group"
              >
                <div className="text-2xl mb-2">🌐</div>
                <div className="font-bold text-sm text-white group-hover:text-cyan-400 transition">Trang bán lẻ</div>
                <p className="text-[11px] text-slate-400 mt-0.5">Kiểm tra trải nghiệm mua sắm của khách hàng</p>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
