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
  return `${Math.round(amount).toLocaleString('vi-VN')} ₫`;
}

function dateTime(value?: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
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
  const processingOrders = useMemo(() => orders.filter((order) => ['confirmed', 'processing', 'shipping'].includes((order.Status || '').toLowerCase())), [orders]);
  
  const lifetimeRevenue = useMemo(() => deliveredOrders.reduce((total, order) => total + Number(order.TotalAmount || 0), 0), [deliveredOrders]);
  const monthlyRevenue = useMemo(() => deliveredOrders
    .filter((order) => isInMonth(order.OrderDate, selectedMonth))
    .reduce((total, order) => total + Number(order.TotalAmount || 0), 0), [deliveredOrders, selectedMonth]);

  const avgOrderValue = useMemo(() => {
    if (!deliveredOrders.length) return 0;
    return lifetimeRevenue / deliveredOrders.length;
  }, [deliveredOrders, lifetimeRevenue]);

  const year = Number(selectedMonth.slice(0, 4)) || new Date().getFullYear();
  const monthlySeries = useMemo(() => Array.from({ length: 12 }, (_, index) => {
    const month = `${year}-${String(index + 1).padStart(2, '0')}`;
    const ordersInMonth = deliveredOrders.filter((order) => isInMonth(order.OrderDate, month));
    return {
      label: `T${index + 1}`,
      monthNum: index + 1,
      count: ordersInMonth.length,
      amount: ordersInMonth.reduce((sum, order) => sum + Number(order.TotalAmount || 0), 0)
    };
  }), [deliveredOrders, year]);

  const maxMonthlyRevenue = Math.max(1, ...monthlySeries.map((item) => item.amount));
  const lowStockProducts = useMemo(() => products.filter((product) => Number(product.StockQuantity ?? 0) <= 5).sort((a, b) => Number(a.StockQuantity ?? 0) - Number(b.StockQuantity ?? 0)), [products]);
  const recentOrders = useMemo(() => [...orders].sort((a, b) => new Date(b.OrderDate || 0).getTime() - new Date(a.OrderDate || 0).getTime()).slice(0, 5), [orders]);

  function exportRevenueCsv() {
    const rows = deliveredOrders.filter((order) => order.OrderDate?.startsWith(String(year))).map((order) => [order.OrderID, order.OrderDate || '', order.RecipientName || order.User?.FullName || '', order.TotalAmount]);
    const escape = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`;
    const csv = ['Mã đơn,Ngày đặt,Khách hàng,Doanh thu', ...rows.map((row) => row.map(escape).join(','))].join('\r\n');
    const blob = new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `doanh-thu-manb-${year}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fadeIn">
      {/* Top Welcome Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800/80 p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-16 w-64 h-64 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold mb-3">
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
              Hệ thống Quản trị Doanh nghiệp MANB SHOP
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Bảng điều khiển Tổng quan
            </h1>
            <p className="text-sm text-slate-400 mt-1.5 max-w-2xl">
              Chào mừng trở lại! Dưới đây là phân tích toàn diện về dòng tiền, đơn hàng, khách hàng và biến động kho hàng trong hệ thống.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-xs font-bold text-slate-300 bg-slate-950/80 border border-slate-700/80 px-4 py-2.5 rounded-2xl shadow-sm hover:border-slate-600 transition">
              <span className="text-slate-400">Chọn tháng:</span>
              <input
                aria-label="Chọn tháng xem doanh thu"
                type="month"
                value={selectedMonth}
                onChange={(event) => setSelectedMonth(event.target.value)}
                className="bg-transparent text-white font-bold outline-none cursor-pointer"
              />
            </label>

            <button
              onClick={exportRevenueCsv}
              className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2.5 text-xs font-bold text-white transition shadow-lg shadow-emerald-950/50"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span>Xuất Excel Báo Cáo</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Lifetime Revenue */}
        <div className="relative group overflow-hidden p-6 rounded-3xl bg-slate-900/90 border border-slate-800/80 hover:border-emerald-500/40 shadow-xl transition duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:scale-125 transition duration-500" />
          <div className="flex items-center justify-between relative z-10">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              Tổng Doanh Thu
            </span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 text-lg shadow-inner">
              💰
            </div>
          </div>
          <div className="mt-4 relative z-10">
            <p className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {formatMoney(lifetimeRevenue)}
            </p>
            <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-bold">
                {deliveredOrders.length} đơn
              </span>
              <span>đã hoàn tất</span>
            </div>
          </div>
        </div>

        {/* Monthly Revenue */}
        <div className="relative group overflow-hidden p-6 rounded-3xl bg-slate-900/90 border border-slate-800/80 hover:border-blue-500/40 shadow-xl transition duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl group-hover:scale-125 transition duration-500" />
          <div className="flex items-center justify-between relative z-10">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
              Doanh Thu Tháng
            </span>
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 text-lg shadow-inner">
              📅
            </div>
          </div>
          <div className="mt-4 relative z-10">
            <p className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {formatMoney(monthlyRevenue)}
            </p>
            <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
              <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 font-bold">
                {selectedMonth}
              </span>
              <span>kỳ báo cáo</span>
            </div>
          </div>
        </div>

        {/* Orders Pending & Processing */}
        <div className="relative group overflow-hidden p-6 rounded-3xl bg-slate-900/90 border border-slate-800/80 hover:border-amber-500/40 shadow-xl transition duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl group-hover:scale-125 transition duration-500" />
          <div className="flex items-center justify-between relative z-10">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
              Đơn Cần Xử Lý
            </span>
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 text-lg shadow-inner">
              ⏳
            </div>
          </div>
          <div className="mt-4 relative z-10">
            <p className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {pendingOrders.length} <span className="text-sm font-semibold text-slate-400">chờ duyệt</span>
            </p>
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-slate-400">
                +{processingOrders.length} đang giao
              </span>
              <Link href="/admin/orders" className="text-xs font-bold text-amber-400 hover:text-amber-300 underline">
                Xem đơn →
              </Link>
            </div>
          </div>
        </div>

        {/* Products & Inventory */}
        <div className="relative group overflow-hidden p-6 rounded-3xl bg-slate-900/90 border border-slate-800/80 hover:border-purple-500/40 shadow-xl transition duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl group-hover:scale-125 transition duration-500" />
          <div className="flex items-center justify-between relative z-10">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-400">
              Sản Phẩm & Khách
            </span>
            <div className="w-10 h-10 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 text-lg shadow-inner">
              👥
            </div>
          </div>
          <div className="mt-4 relative z-10">
            <p className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {productCount} <span className="text-sm font-semibold text-slate-400">SP / {userCount} Users</span>
            </p>
            <div className="flex items-center gap-2 mt-2 text-xs">
              {lowStockProducts.length > 0 ? (
                <span className="text-rose-400 font-bold bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
                  {lowStockProducts.length} SP sắp hết hàng
                </span>
              ) : (
                <span className="text-emerald-400 font-medium">Kho hàng đầy đủ</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Chart Section */}
      <section className="rounded-3xl border border-slate-800/80 bg-slate-900/90 p-6 sm:p-8 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500" />
              <h2 className="text-xl font-black text-white tracking-tight">Biểu Đồ Doanh Thu Năm {year}</h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Thống kê tổng doanh thu thực nhận theo từng tháng dựa trên các đơn hàng giao thành công.
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5 text-slate-400 font-semibold">
              <span className="w-3 h-3 rounded bg-gradient-to-t from-emerald-600 to-teal-400" />
              <span>Doanh thu tháng (VNĐ)</span>
            </div>
          </div>
        </div>

        {/* Chart Bars */}
        <div className="relative h-64 flex items-end gap-2 sm:gap-4 border-b border-l border-slate-800 px-4 pb-2 pt-8">
          {/* Background Grid Lines */}
          <div className="absolute inset-x-0 top-1/4 border-b border-slate-800/40 pointer-events-none" />
          <div className="absolute inset-x-0 top-2/4 border-b border-slate-800/40 pointer-events-none" />
          <div className="absolute inset-x-0 top-3/4 border-b border-slate-800/40 pointer-events-none" />

          {monthlySeries.map((item) => {
            const heightPercent = Math.max(item.amount ? 12 : 3, (item.amount / maxMonthlyRevenue) * 90);
            return (
              <div key={item.label} className="group relative flex-1 flex h-full flex-col items-center justify-end">
                {/* Floating Tooltip */}
                <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition duration-200 bg-slate-950 text-white text-[11px] font-bold py-1.5 px-3 rounded-xl pointer-events-none whitespace-nowrap border border-slate-700 shadow-2xl z-20">
                  <p className="text-emerald-400 font-black">{formatMoney(item.amount)}</p>
                  <p className="text-[10px] text-slate-400">{item.count} đơn hoàn tất</p>
                </div>
                
                {/* Bar */}
                <div
                  className="w-full max-w-[48px] rounded-t-xl bg-gradient-to-t from-emerald-600 via-teal-500 to-cyan-400 group-hover:from-emerald-500 group-hover:to-cyan-300 transition-all duration-300 shadow-lg shadow-emerald-950/50"
                  style={{ height: `${heightPercent}%` }}
                />
                <span className="mt-2 text-[11px] font-bold text-slate-400 group-hover:text-white transition">
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Two Columns: Recent Orders + Low Stock Warnings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders Overview */}
        <div className="rounded-3xl border border-slate-800/80 bg-slate-900/90 p-6 shadow-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <h3 className="text-base font-bold text-white">Đơn hàng mới nhất</h3>
              </div>
              <Link href="/admin/orders" className="text-xs font-bold text-blue-400 hover:text-blue-300 transition">
                Tất cả đơn →
              </Link>
            </div>

            {recentOrders.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-slate-800 rounded-2xl text-slate-400 text-xs">
                Chưa có đơn hàng nào trong hệ thống.
              </div>
            ) : (
              <div className="space-y-3">
                {recentOrders.map((order) => {
                  const status = (order.Status || 'pending').toLowerCase();
                  const isDone = isDelivered(status);
                  const isCancel = status === 'cancelled';
                  return (
                    <div
                      key={order.OrderID}
                      className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition"
                    >
                      <div className="min-w-0 flex-1 pr-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-white">#{order.OrderID}</span>
                          <span className="text-xs font-semibold text-slate-300 truncate">
                            {order.RecipientName || order.User?.FullName || 'Khách hàng'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">{dateTime(order.OrderDate)}</p>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="text-xs font-bold text-emerald-400">{formatMoney(Number(order.TotalAmount || 0))}</p>
                        <span className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isDone ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                          isCancel ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                          'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}>
                          {order.Status || 'Chờ duyệt'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Low Stock Warning */}
        <div className="rounded-3xl border border-slate-800/80 bg-slate-900/90 p-6 shadow-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                <h3 className="text-base font-bold text-white">Cảnh báo tồn kho</h3>
              </div>
              <span className="text-xs font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2.5 py-0.5 rounded-full">
                {lowStockProducts.length} mặt hàng
              </span>
            </div>

            {lowStockProducts.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-slate-800 rounded-2xl text-emerald-400 text-xs font-medium">
                ✅ Tất cả sản phẩm đều có số lượng an toàn (&gt; 5)
              </div>
            ) : (
              <div className="space-y-3">
                {lowStockProducts.slice(0, 5).map((p) => (
                  <div
                    key={p.ProductID}
                    className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition"
                  >
                    <div className="min-w-0 flex-1 pr-3">
                      <p className="text-xs font-bold text-white truncate">{p.ProductName}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{formatMoney(Number(p.Price || 0))}</p>
                    </div>
                    <span className="shrink-0 text-xs font-black px-3 py-1 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      Còn {p.StockQuantity ?? 0}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-5 pt-4 border-t border-slate-800/80 flex justify-end">
            <Link
              href="/admin/products"
              className="text-xs font-bold text-blue-400 hover:text-blue-300 transition"
            >
              Quản lý kho hàng đầy đủ →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
