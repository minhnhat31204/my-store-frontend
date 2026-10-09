'use client';

import { useEffect, useMemo, useState } from 'react';
import { api, getPrimaryProductImage, type StoreOrder } from '@/lib/api';

const STATUS_OPTIONS = [
  { value: 'Pending', label: 'Chờ xác nhận', style: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  { value: 'Confirmed', label: 'Đã xác nhận', style: 'bg-sky-500/10 text-sky-400 border-sky-500/20' },
  { value: 'Processing', label: 'Đang chuẩn bị hàng', style: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' },
  { value: 'Shipping', label: 'Đang giao hàng', style: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
  { value: 'Delivered', label: 'Giao thành công', style: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  { value: 'Cancelled', label: 'Đã hủy', style: 'bg-rose-500/10 text-rose-400 border-rose-500/20' },
];

function normalizedStatus(status?: string | null) {
  const value = (status || 'Pending').toLowerCase();
  if (['shipped', 'delivering'].includes(value)) return 'Shipping';
  if (['completed', 'complete'].includes(value)) return 'Delivered';
  if (['canceled', 'cancel'].includes(value)) return 'Cancelled';
  if (['preparing', 'ready'].includes(value)) return 'Processing';
  return STATUS_OPTIONS.find((item) => item.value.toLowerCase() === value)?.value || 'Pending';
}

function statusInfo(status?: string | null) {
  const value = normalizedStatus(status);
  return STATUS_OPTIONS.find((item) => item.value === value) || STATUS_OPTIONS[0];
}

function money(value?: number | string | null) {
  return `${Number(value || 0).toLocaleString('vi-VN')} ₫`;
}

function dateTime(value?: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString('vi-VN');
}

function monthKey(value?: string | null) {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export default function AdminOrders() {
  const [orders, setOrders] = useState<StoreOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<StoreOrder | null>(null);
  const [draftStatus, setDraftStatus] = useState('Pending');
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [monthFilter, setMonthFilter] = useState('');
  const [statusHistory, setStatusHistory] = useState<Awaited<ReturnType<typeof api.getOrderStatusHistory>>>([]);
  const [carrierName, setCarrierName] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [estimatedDelivery, setEstimatedDelivery] = useState('');

  useEffect(() => {
    api.getOrders()
      .then((data) => setOrders(Array.isArray(data) ? data : []))
      .catch((e) => setError(e instanceof Error ? e.message : 'Không tải được danh sách đơn hàng'))
      .finally(() => setLoading(false));
  }, []);

  const countsByStatus = useMemo(() => {
    const map: Record<string, number> = { all: orders.length };
    for (const opt of STATUS_OPTIONS) map[opt.value] = 0;
    for (const o of orders) {
      const s = normalizedStatus(o.Status);
      map[s] = (map[s] || 0) + 1;
    }
    return map;
  }, [orders]);

  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase();
    return orders.filter((order) => {
      const matchesQuery = !query || [
        String(order.OrderID), order.RecipientName, order.RecipientPhone, order.User?.FullName, order.User?.Email,
      ].some((value) => value?.toLowerCase().includes(query));
      const matchesStatus = statusFilter === 'all' || normalizedStatus(order.Status) === statusFilter;
      const orderMonth = monthKey(order.OrderDate);
      return matchesQuery && matchesStatus && (!monthFilter || orderMonth === monthFilter);
    });
  }, [orders, search, statusFilter, monthFilter]);

  const openOrder = (order: StoreOrder) => {
    setSelected(order);
    setDraftStatus(normalizedStatus(order.Status));
    setFeedback('');
    setCarrierName(order.CarrierName || '');
    setTrackingNumber(order.TrackingNumber || '');
    setEstimatedDelivery(order.EstimatedDelivery || '');
    api.getOrderStatusHistory(order.OrderID).then(setStatusHistory).catch(() => setStatusHistory([]));
  };

  const saveShipping = async () => {
    if (!selected) return;
    setSaving(true);
    setFeedback('');
    try {
      const result = await api.updateOrderShipping(selected.OrderID, {
        CarrierName: carrierName.trim() || null,
        TrackingNumber: trackingNumber.trim() || null,
        EstimatedDelivery: estimatedDelivery || null,
      });
      setOrders((current) => current.map((order) => order.OrderID === selected.OrderID ? { ...order, ...result.order } : order));
      setSelected((current) => current ? { ...current, ...result.order } : current);
      setFeedback('Đã lưu thông tin vận chuyển thành công.');
    } catch (e) {
      setFeedback(e instanceof Error ? e.message : 'Không thể lưu thông tin vận chuyển.');
    } finally {
      setSaving(false);
    }
  };

  const saveStatus = async () => {
    if (!selected) return;
    setSaving(true);
    setFeedback('');
    try {
      const result = await api.updateOrderStatus(selected.OrderID, draftStatus);
      const updated = result.order || { ...selected, Status: draftStatus };
      setOrders((current) => current.map((order) => order.OrderID === selected.OrderID ? { ...order, ...updated } : order));
      setSelected((current) => current ? { ...current, ...updated } : current);
      setFeedback('Đã cập nhật tiến độ đơn hàng thành công.');
    } catch (e) {
      setFeedback(e instanceof Error ? e.message : 'Không thể cập nhật tiến độ đơn hàng.');
    } finally {
      setSaving(false);
    }
  };

  const selectedStatus = statusInfo(selected?.Status);
  const isDelivered = ['delivered', 'completed', 'complete'].includes((selected?.Status || '').trim().toLowerCase());

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fadeIn">
      {/* Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-900/90 p-6 sm:p-7 rounded-3xl border border-slate-800/80 shadow-2xl">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold mb-2">
            🛒 Phân hệ Bán hàng & Vận đơn
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Quản Lý Đơn Hàng
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Tổng cộng {orders.length} đơn hàng trong hệ thống cơ sở dữ liệu.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="space-y-3 bg-slate-900/80 p-5 rounded-3xl border border-slate-800/80 shadow-xl">
        {/* Status Tab Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition whitespace-nowrap flex items-center gap-2 ${
              statusFilter === 'all'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                : 'bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <span>Tất cả đơn</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-300 font-black">
              {countsByStatus.all || 0}
            </span>
          </button>

          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setStatusFilter(opt.value)}
              className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition whitespace-nowrap flex items-center gap-2 ${
                statusFilter === opt.value
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                  : 'bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <span>{opt.label}</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-300 font-black">
                {countsByStatus[opt.value] || 0}
              </span>
            </button>
          ))}
        </div>

        {/* Search & Month Filter Inputs */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_200px] pt-1">
          <div className="relative">
            <svg className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Tìm theo mã đơn (#123), người nhận, số điện thoại, email..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-2xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
            />
          </div>

          <input
            type="month"
            value={monthFilter}
            onChange={(event) => setMonthFilter(event.target.value)}
            className="rounded-2xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs font-semibold text-white outline-none focus:border-blue-500 cursor-pointer"
          />
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm font-semibold">
          {error}
        </div>
      )}

      {/* Orders List Table */}
      {loading ? (
        <div className="p-16 text-center text-slate-400 font-medium">
          <div className="inline-block w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-3" />
          <p>Đang đồng bộ danh sách đơn hàng...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="p-16 text-center border border-dashed border-slate-800 rounded-3xl text-slate-400 bg-slate-900/30">
          {orders.length ? 'Không tìm thấy đơn hàng nào khớp với điều kiện lọc.' : 'Chưa có đơn hàng nào trong hệ thống.'}
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-slate-800/80 bg-slate-900/90 shadow-2xl">
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm text-slate-300">
              <thead className="bg-slate-950/80 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-5 py-4">Mã đơn</th>
                  <th className="px-5 py-4">Khách hàng / Người nhận</th>
                  <th className="px-5 py-4">Thời gian đặt</th>
                  <th className="px-5 py-4">Tổng thanh toán</th>
                  <th className="px-5 py-4">Trạng thái</th>
                  <th className="px-5 py-4 text-right">Chi tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredOrders.map((order) => {
                  const status = statusInfo(order.Status);
                  return (
                    <tr key={order.OrderID} className="hover:bg-slate-800/40 transition">
                      <td className="px-5 py-4 font-mono font-bold text-slate-200 text-xs">
                        #{order.OrderID}
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-bold text-white text-sm">
                          {order.RecipientName || order.User?.FullName || 'Khách hàng'}
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          {order.RecipientPhone || order.User?.Phone || order.User?.Email || '—'}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-xs text-slate-400 whitespace-nowrap">
                        {dateTime(order.OrderDate)}
                      </td>
                      <td className="px-5 py-4 font-bold text-emerald-400 whitespace-nowrap text-sm">
                        {money(order.TotalAmount)}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${status.style}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => openOrder(order)}
                          className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-md shadow-blue-600/20 active:scale-95"
                        >
                          Xem chi tiết
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="divide-y divide-slate-800 sm:hidden">
            {filteredOrders.map((order) => {
              const status = statusInfo(order.Status);
              return (
                <div key={order.OrderID} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold text-white">Đơn #{order.OrderID}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{dateTime(order.OrderDate)}</p>
                    </div>
                    <span className={`inline-flex px-2.5 py-0.5 text-[11px] font-bold rounded-full border ${status.style}`}>
                      {status.label}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-200">
                      {order.RecipientName || order.User?.FullName || 'Khách hàng'}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {order.RecipientPhone || order.User?.Phone || order.User?.Email || '—'}
                    </p>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="font-black text-emerald-400">{money(order.TotalAmount)}</span>
                    <button
                      onClick={() => openOrder(order)}
                      className="px-3.5 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-bold"
                    >
                      Chi tiết
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal / Drawer Chi tiết Đơn hàng */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md overflow-y-auto"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !saving) setSelected(null);
          }}
        >
          <div className="w-full max-w-3xl space-y-6 rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-8 shadow-2xl my-8 text-slate-200 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400">
                  Thông Tin Đơn Hàng
                </span>
                <h2 className="text-xl font-black text-white mt-0.5">
                  Đơn Hàng #{selected.OrderID}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Thời gian ghi nhận: {dateTime(selected.OrderDate)}
                </p>
              </div>
              <button
                onClick={() => setSelected(null)}
                disabled={saving}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition"
              >
                ✕
              </button>
            </div>

            {/* Customer & Shipping Summary */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-800/80 bg-slate-950/60 p-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  👤 Thông tin khách hàng
                </h3>
                <p className="font-bold text-white text-sm">
                  {selected.User?.FullName || selected.RecipientName || 'Khách hàng'}
                </p>
                <p className="mt-1 text-xs text-slate-300">
                  Email: {selected.User?.Email || 'Chưa cập nhật'}
                </p>
                <p className="mt-1 text-xs text-slate-300">
                  SĐT: {selected.User?.Phone || selected.RecipientPhone || 'Chưa cập nhật'}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800/80 bg-slate-950/60 p-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  📍 Địa chỉ nhận hàng & Thanh toán
                </h3>
                <p className="text-xs text-slate-300">
                  <span className="font-bold text-white">Người nhận:</span> {selected.RecipientName || '—'} ({selected.RecipientPhone || '—'})
                </p>
                <p className="mt-1 text-xs text-slate-300">
                  <span className="font-bold text-white">Địa chỉ giao:</span> {selected.ShippingAddress || '—'}
                </p>
                <p className="mt-1 text-xs text-slate-300">
                  <span className="font-bold text-white">Phương thức:</span> {selected.PaymentMethod || '—'} {selected.Payments?.[0]?.Status ? `(${selected.Payments[0].Status})` : ''}
                </p>
              </div>
            </div>

            {/* Products in Order */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                📦 Danh sách sản phẩm trong đơn ({selected.OrderItems?.length || 0})
              </h3>
              <div className="divide-y divide-slate-800 rounded-2xl border border-slate-800/80 bg-slate-950/60 overflow-hidden">
                {(selected.OrderItems || []).length === 0 ? (
                  <p className="p-4 text-xs text-slate-400">Không có thông tin chi tiết sản phẩm.</p>
                ) : (
                  selected.OrderItems?.map((item, index) => {
                    const image = getPrimaryProductImage(item.Product?.ImageUrl);
                    return (
                      <div key={item.OrderItemID || `${item.ProductID}-${index}`} className="flex items-center gap-3.5 p-4">
                        {image ? (
                          <div className="h-14 w-14 rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden flex items-center justify-center shrink-0">
                            <img src={image} alt="" className="h-full w-full object-contain p-1" />
                          </div>
                        ) : (
                          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-[10px] text-slate-500 border border-slate-800">
                            Ảnh
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-bold text-sm text-white">
                            {item.Product?.ProductName || `Sản phẩm #${item.ProductID}`}
                          </p>
                          <p className="mt-0.5 text-xs text-slate-400">
                            {money(item.UnitPrice)} × <span className="text-white font-bold">{item.Quantity}</span>
                          </p>
                        </div>
                        <p className="shrink-0 font-bold text-emerald-400 text-sm">
                          {money(Number(item.UnitPrice) * Number(item.Quantity))}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Shipping Details Updater */}
            <div className="rounded-2xl border border-slate-800/80 bg-slate-950/60 p-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-sky-400 mb-3">
                🚚 Thiết lập Vận chuyển & Mã theo dõi
              </h3>
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1.5">
                    Đơn vị vận chuyển
                  </label>
                  <input
                    value={carrierName}
                    onChange={(e) => setCarrierName(e.target.value)}
                    placeholder="VD: GHTK, GHN, ViettelPost..."
                    className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3.5 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1.5">
                    Mã vận đơn
                  </label>
                  <input
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    placeholder="VD: MANB89745123VN"
                    className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3.5 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1.5">
                    Dự kiến giao hàng
                  </label>
                  <input
                    type="date"
                    value={estimatedDelivery}
                    onChange={(e) => setEstimatedDelivery(e.target.value)}
                    className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3.5 py-2 text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                  />
                </div>
              </div>
              <div className="mt-3 flex justify-end">
                <button
                  onClick={saveShipping}
                  disabled={saving}
                  className="rounded-xl bg-sky-600 hover:bg-sky-500 px-4 py-2 text-xs font-bold text-white transition disabled:opacity-50 shadow-md shadow-sky-950/40"
                >
                  Lưu Thông Tin Vận Chuyển
                </button>
              </div>
            </div>

            {/* Price Breakdown */}
            <div className="ml-auto max-w-sm space-y-2 border-t border-slate-800 pt-4 text-xs">
              {Number(selected.DiscountAmount) > 0 && (
                <>
                  <div className="flex justify-between text-slate-400">
                    <span>Tổng tiền hàng</span>
                    <span>{money(Number(selected.TotalAmount) + Number(selected.DiscountAmount))}</span>
                  </div>
                  <div className="flex justify-between text-emerald-400">
                    <span>Giảm giá Voucher {selected.VoucherCode ? `(${selected.VoucherCode})` : ''}</span>
                    <span>−{money(selected.DiscountAmount)}</span>
                  </div>
                </>
              )}
              <div className="flex justify-between text-base font-black text-white pt-1 border-t border-slate-800/80">
                <span>Tổng cộng thực thu</span>
                <span className="text-emerald-400">{money(selected.TotalAmount)}</span>
              </div>
            </div>

            {/* Status Update Control */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Cập nhật tiến trình đơn hàng
                </h3>
                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${selectedStatus.style}`}>
                  {selectedStatus.label}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <select
                  value={draftStatus}
                  onChange={(e) => setDraftStatus(e.target.value)}
                  disabled={isDelivered || saving}
                  className="flex-1 rounded-2xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-xs font-bold text-white outline-none focus:border-blue-500 disabled:opacity-50"
                >
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>

                <button
                  onClick={saveStatus}
                  disabled={isDelivered || saving || draftStatus === normalizedStatus(selected.Status)}
                  className="rounded-2xl bg-emerald-600 hover:bg-emerald-500 px-6 py-2.5 text-xs font-bold text-white transition disabled:opacity-50 shadow-lg shadow-emerald-950/50"
                >
                  {isDelivered ? 'Đã Giao Thành Công' : saving ? 'Đang Lưu...' : 'Cập Nhật Trạng Thái'}
                </button>
              </div>

              {isDelivered && (
                <p className="mt-2 text-[11px] text-emerald-400 font-medium">
                  ✅ Đơn hàng đã hoàn tất thành công nên không thể thay đổi tiến trình.
                </p>
              )}
              {feedback && (
                <p className={`mt-2 text-xs font-bold ${feedback.includes('thành công') ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {feedback}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
