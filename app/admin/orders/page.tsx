'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { api, getPrimaryProductImage, type StoreOrder } from '@/lib/api';
import Pagination from '@/app/admin/components/Pagination';
import DateFilterBar, { matchesDateFilter, type DateFilterPeriod } from '@/app/admin/components/DateFilterBar';
import { useAdminData } from '@/lib/useAdminData';
import { exportToExcel } from '@/lib/exportExcel';
import { printOrderInvoice } from '@/lib/printUtils';

const STATUS_ROW_1 = [
  { value: 'all', label: 'Tất cả đơn' },
  { value: 'Pending', label: 'Chờ xác nhận' },
  { value: 'Confirmed', label: 'Đã xác nhận' },
  { value: 'Processing', label: 'Đang chuẩn bị' },
  { value: 'Shipping', label: 'Đang giao hàng' },
  { value: 'Delivered', label: 'Giao thành công' },
];

const STATUS_ROW_2 = [
  { value: 'Cancelled', label: 'Đã hủy' },
  { value: 'Returned', label: 'Đã trả hàng (Hoàn tiền)' },
  { value: 'RefundPending', label: 'Yêu cầu hoàn tiền' },
];

const STATUS_OPTIONS = [
  { value: 'Pending', label: 'Chờ xác nhận', style: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  { value: 'Confirmed', label: 'Đã xác nhận', style: 'bg-sky-500/10 text-sky-400 border-sky-500/20' },
  { value: 'Processing', label: 'Đang chuẩn bị hàng', style: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' },
  { value: 'Shipping', label: 'Đang giao hàng', style: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
  { value: 'Delivered', label: 'Giao thành công', style: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  { value: 'Cancelled', label: 'Đã hủy', style: 'bg-rose-500/10 text-rose-400 border-rose-500/20' },
  { value: 'Returned', label: 'Đã trả hàng (Hoàn tiền)', style: 'bg-teal-500/10 text-teal-300 border-teal-500/20' },
  { value: 'RefundPending', label: 'Yêu cầu hoàn tiền', style: 'bg-pink-500/10 text-pink-400 border-pink-500/20' },
];

// Danh sách các trạng thái Admin được phép chủ động chọn thủ công
// (Lưu ý: RefundPending và Returned do quy trình Hoàn tiền tự động kích hoạt)
const ADMIN_SELECTABLE_STATUSES = [
  { value: 'Pending', label: 'Chờ xác nhận' },
  { value: 'Confirmed', label: 'Đã xác nhận' },
  { value: 'Processing', label: 'Đang chuẩn bị hàng' },
  { value: 'Shipping', label: 'Đang giao hàng' },
  { value: 'Delivered', label: 'Giao thành công' },
  { value: 'Cancelled', label: 'Đã hủy' },
];

function normalizedStatus(status?: string | null) {
  const value = (status || 'Pending').toLowerCase();
  if (['shipped', 'delivering'].includes(value)) return 'Shipping';
  if (['completed', 'complete'].includes(value)) return 'Delivered';
  if (['canceled', 'cancel'].includes(value)) return 'Cancelled';
  if (['preparing', 'ready'].includes(value)) return 'Processing';
  if (['returned', 'da tra hang', 'tra hang'].includes(value)) return 'Returned';
  if (['refundpending', 'pending refund', 'cho hoan tien'].includes(value)) return 'RefundPending';
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
  const { data: ordersData, loading, error, reload } = useAdminData<StoreOrder[]>(
    'admin:orders',
    () => api.getOrders(),
  );
  const orders = ordersData ?? [];
  const [selected, setSelected] = useState<StoreOrder | null>(null);
  const [draftStatus, setDraftStatus] = useState('Pending');
  const [cancellationReason, setCancellationReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const [monthFilter, setMonthFilter] = useState('');
  const [statusHistory, setStatusHistory] = useState<Awaited<ReturnType<typeof api.getOrderStatusHistory>>>([]);
  const [carrierName, setCarrierName] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [estimatedDelivery, setEstimatedDelivery] = useState('');
  const [confirmDeliveredModal, setConfirmDeliveredModal] = useState(false);
  const [dateFilter, setDateFilter] = useState<DateFilterPeriod>('today');
  const [customDate, setCustomDate] = useState('');
  const [selectedOrderIds, setSelectedOrderIds] = useState<number[]>([]);
  const [bulkStatus, setBulkStatus] = useState('Confirmed');
  const [bulkUpdating, setBulkUpdating] = useState(false);

  async function handleBulkUpdate() {
    if (!selectedOrderIds.length) return;
    setBulkUpdating(true);
    setFeedback('');
    try {
      const res = await api.bulkUpdateOrderStatus(selectedOrderIds, bulkStatus);
      setFeedback(res.message || 'Cập nhật hàng loạt thành công!');
      setSelectedOrderIds([]);
      void reload(true);
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : 'Cập nhật hàng loạt thất bại.');
    } finally {
      setBulkUpdating(false);
    }
  }

  function handleSelectAll() {
    const visibleIds = visibleOrders.map((o) => o.OrderID);
    const allSelected = visibleIds.every((id) => selectedOrderIds.includes(id));
    if (allSelected) {
      setSelectedOrderIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
    } else {
      setSelectedOrderIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
    }
  }



  const handleExportExcel = () => {
    exportToExcel<StoreOrder>({
      filename: 'Danh_Sach_Don_Hang',
      sheetName: 'DonHang',
      data: filteredOrders,
      columns: [
        { header: 'STT', transform: (_, idx) => idx + 1, width: 8 },
        { header: 'Mã đơn', transform: (o) => '#' + o.OrderID, width: 12 },
        { header: 'Ngày đặt', transform: (o) => dateTime(o.OrderDate), width: 18 },
        { header: 'Tài khoản đặt', transform: (o) => o.User?.FullName || o.User?.Email || '', width: 20 },
        { header: 'Người nhận hàng', key: 'RecipientName', width: 20 },
        { header: 'SĐT người nhận', key: 'RecipientPhone', width: 16 },
        { header: 'Địa chỉ giao hàng', key: 'ShippingAddress', width: 35 },
        { header: 'Phương thức thanh toán', key: 'PaymentMethod', width: 22 },
        { header: 'Trạng thái đơn hàng', transform: (o) => statusInfo(o.Status).label, width: 20 },
        { header: 'Mã voucher áp dụng', key: 'VoucherCode', width: 18 },
        { header: 'Tổng tiền hàng', transform: (o) => Number(o.TotalAmount || 0), width: 16 },
        { header: 'Mã vận đơn', key: 'TrackingNumber', width: 16 },
        { header: 'Đơn vị vận chuyển', key: 'CarrierName', width: 18 },
        { header: 'Sản phẩm đã mua', transform: (o) => (o.OrderItems || []).map(i => i.Product?.ProductName + ' (x' + i.Quantity + ')').join('; '), width: 40 },
      ],
    });
  };

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
        String(order.OrderID),
        `#${order.OrderID}`,
        order.RecipientName,
        order.RecipientPhone,
        order.User?.FullName,
        order.User?.Email,
        order.User?.Phone,
        order.TrackingNumber,
        order.CarrierName,
        order.VoucherCode,
        ...(order.OrderItems || []).flatMap((item) => [
          String(item.ProductID),
          `sp${item.ProductID}`,
          `#sp${item.ProductID}`,
          `#${item.ProductID}`,
          item.Product?.ProductName,
          item.Product?.Series,
        ]),
      ].some((value) => value && value.toString().toLowerCase().includes(query));
      const matchesStatus = statusFilter === 'all' || normalizedStatus(order.Status) === statusFilter;
      const matchesDate = matchesDateFilter(order.OrderDate, dateFilter, customDate);
      const orderMonth = monthKey(order.OrderDate);
      return matchesQuery && matchesStatus && matchesDate && (!monthFilter || orderMonth === monthFilter);
    });
  }, [orders, search, statusFilter, dateFilter, customDate, monthFilter]);
  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / 20));
  const currentPage = Math.min(page, totalPages);
  const visibleOrders = filteredOrders.slice((currentPage - 1) * 20, currentPage * 20);

  const openOrder = (order: StoreOrder) => {
    setSelected(order);
    setDraftStatus(normalizedStatus(order.Status));
    setCancellationReason('');
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
      void reload(true);
      setSelected((current) => current ? { ...current, ...result.order } : current);
      setFeedback('Đã lưu thông tin vận chuyển thành công.');
    } catch (e) {
      setFeedback(e instanceof Error ? e.message : 'Không thể lưu thông tin vận chuyển.');
    } finally {
      setSaving(false);
    }
  };

  const executeSaveStatus = async () => {
    if (!selected) return;
    setSaving(true);
    setFeedback('');
    try {
      const result = await api.updateOrderStatus(selected.OrderID, draftStatus, draftStatus === 'Cancelled' ? cancellationReason.trim() : undefined);
      const updated = result.order || { ...selected, Status: draftStatus };
      void reload(true);
      setSelected((current) => current ? { ...current, ...updated } : current);
      setFeedback('Đã cập nhật tiến độ đơn hàng thành công.');
      setConfirmDeliveredModal(false);
    } catch (e) {
      setFeedback(e instanceof Error ? e.message : 'Không thể cập nhật tiến độ đơn hàng.');
    } finally {
      setSaving(false);
    }
  };

  const saveStatus = async () => {
    if (!selected) return;
    if (draftStatus === 'Cancelled' && normalizedStatus(selected.Status) !== 'Cancelled' && !cancellationReason.trim()) {
      setFeedback('Vui lòng nhập lý do admin chủ động hủy đơn hàng.');
      return;
    }
    // Nếu chuyển sang "Giao thành công" (Delivered) -> Hiện popup xác nhận chắc chắn
    if (draftStatus === 'Delivered' && normalizedStatus(selected.Status) !== 'Delivered') {
      setConfirmDeliveredModal(true);
      return;
    }
    await executeSaveStatus();
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
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportExcel}
            className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600/10 hover:bg-emerald-600/20 border border-emerald-500/30 px-4 py-2.5 text-xs font-bold text-emerald-300 transition active:scale-95 cursor-pointer shadow-sm"
          >
            <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Xuất Excel ({filteredOrders.length})</span>
          </button>
          <button
            onClick={() => void reload(true)}
            className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 hover:bg-slate-800 border border-slate-700/80 px-4 py-2.5 text-xs font-bold text-slate-300 transition active:scale-95 cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Làm Mới</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="space-y-3 bg-slate-900/80 p-5 rounded-3xl border border-slate-800/80 shadow-xl">
        {/* Status Tab Chips - 2 Dòng Rõ Ràng, Không Có Thanh Trượt Ngang */}
        <div className="space-y-2.5 p-3.5 bg-slate-950/70 rounded-2xl border border-slate-800/80">
          {/* Hàng 1: Tất cả đơn, chờ xác nhận, đã xác nhận, đang chuẩn bị, đang giao hàng, giao thành công */}
          <div className="flex flex-wrap items-center gap-2">
            {STATUS_ROW_1.map((item) => {
              const isSelected = statusFilter === item.value;
              const count = item.value === 'all' ? (countsByStatus.all || 0) : (countsByStatus[item.value] || 0);
              return (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => { setStatusFilter(item.value); setPage(1); }}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-sm ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-blue-600/30 ring-2 ring-blue-400/40'
                      : 'bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800'
                  }`}
                >
                  <span>{item.label}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Hàng 2: Đã hủy, đã trả hàng và yêu cầu hoàn tiền */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/60">
            {STATUS_ROW_2.map((item) => {
              const isSelected = statusFilter === item.value;
              const count = countsByStatus[item.value] || 0;
              return (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => { setStatusFilter(item.value); setPage(1); }}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-sm ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-blue-600/30 ring-2 ring-blue-400/40'
                      : 'bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800'
                  }`}
                >
                  <span>{item.label}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Date Filter Bar */}
        <DateFilterBar
          value={dateFilter}
          customDate={customDate}
          onChange={(period, date) => {
            setDateFilter(period);
            if (date) setCustomDate(date);
            setPage(1);
          }}
          className="pb-2"
        />

        {/* Search & Month Filter Inputs */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_200px] pt-1">
          <div className="relative">
            <svg className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(event) => { setSearch(event.target.value); setPage(1); }}
              placeholder="Tìm theo mã đơn (#101), mã SP (#12, SP12), tên sản phẩm, tên khách hàng, SĐT, mã vận đơn..."
              className="w-full pl-10 pr-10 py-2.5 bg-slate-950 border border-slate-800 rounded-2xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs font-bold p-1 cursor-pointer"
                title="Xóa tìm kiếm"
              >
                ✕
              </button>
            )}
          </div>

          <input
            type="month"
            value={monthFilter}
            onChange={(event) => { setMonthFilter(event.target.value); setPage(1); }}
            className="rounded-2xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs font-semibold text-white outline-none focus:border-blue-500 cursor-pointer"
          />
        </div>

        {/* Quick Search Chips */}
        <div className="flex items-center gap-2 text-[11px] text-slate-400 flex-wrap pt-2 border-t border-slate-800/60">
          <span className="font-semibold text-slate-500">Tìm kiếm theo:</span>
          <span className="px-2 py-0.5 rounded-md bg-slate-950 text-slate-300 border border-slate-800">📦 Mã SP (#12, SP12)</span>
          <span className="px-2 py-0.5 rounded-md bg-slate-950 text-slate-300 border border-slate-800">💻 Tên sản phẩm</span>
          <span className="px-2 py-0.5 rounded-md bg-slate-950 text-slate-300 border border-slate-800">🧾 Mã đơn (#ID)</span>
          <span className="px-2 py-0.5 rounded-md bg-slate-950 text-slate-300 border border-slate-800">👤 Khách hàng / SĐT / Email</span>
          <span className="px-2 py-0.5 rounded-md bg-slate-950 text-slate-300 border border-slate-800">🚚 Mã vận đơn</span>
          {search && (
            <span className="ml-auto text-blue-400 font-bold">
              Tìm thấy {filteredOrders.length} đơn hàng
            </span>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm font-semibold">
          {error}
        </div>
      )}

      {/* Illuminated Bulk Actions Bar */}
      <AnimatePresence>
        {selectedOrderIds.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className="sticky top-4 z-30 flex flex-wrap items-center justify-between gap-3 p-4 rounded-3xl bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-600 text-white shadow-2xl shadow-blue-500/30 border border-blue-400/40"
          >
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
            <span className="font-extrabold text-sm">
              Đã chọn {selectedOrderIds.length} đơn hàng
            </span>
            <button
              type="button"
              onClick={() => setSelectedOrderIds([])}
              className="text-xs text-blue-200 hover:text-white underline cursor-pointer"
            >
              Bỏ chọn tất cả
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-blue-100">Đổi trạng thái thành:</span>
            <select
              aria-label="Chọn trạng thái cập nhật hàng loạt"
              value={bulkStatus}
              onChange={(e) => setBulkStatus(e.target.value)}
              className="bg-slate-900 text-white text-xs font-bold rounded-xl px-3 py-2 border border-blue-400/50 outline-none cursor-pointer"
            >
              {ADMIN_SELECTABLE_STATUSES.map((st) => (
                <option key={st.value} value={st.value}>
                  {st.label}
                </option>
              ))}
            </select>

            <button
              type="button"
              disabled={bulkUpdating}
              onClick={handleBulkUpdate}
              className="px-4 py-2 rounded-xl bg-white text-blue-800 hover:bg-blue-50 text-xs font-black shadow-lg transition active:scale-95 disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
            >
              {bulkUpdating ? 'Đang cập nhật...' : '✓ Cập nhật hàng loạt'}
            </button>
          </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Orders List in 2-Row Format (Khong dung thanh cuon ngang) */}
      {loading ? (
        <div className="p-16 text-center text-slate-400 font-medium min-h-[420px] flex flex-col items-center justify-center">
          <div className="inline-block w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-3" />
          <p>Đang đồng bộ danh sách đơn hàng...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="p-16 text-center border border-dashed border-slate-800 rounded-3xl text-slate-400 bg-slate-900/30 min-h-[420px] flex flex-col items-center justify-center">
          {orders.length ? 'Không tìm thấy đơn hàng nào khớp với điều kiện lọc.' : 'Chưa có đơn hàng nào trong hệ thống.'}
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-slate-800/80 bg-slate-900/90 shadow-2xl min-h-[420px]">
          {/* List Header with Select All */}
          <div className="flex items-center justify-between px-5 py-3.5 bg-slate-950/80 border-b border-slate-800 text-xs text-slate-400 font-bold uppercase tracking-wider">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                aria-label="Chọn tất cả đơn hàng"
                checked={visibleOrders.length > 0 && visibleOrders.every((o) => selectedOrderIds.includes(o.OrderID))}
                onChange={handleSelectAll}
                className="w-4 h-4 rounded text-blue-600 bg-slate-950 border-slate-700 cursor-pointer accent-blue-600"
              />
              <span>Chọn tất cả trang này ({visibleOrders.length})</span>
            </div>
            <span>Tổng cộng {filteredOrders.length} đơn</span>
          </div>

          <div className="divide-y divide-slate-800/80">
            {visibleOrders.map((order, index) => {
              const isSelected = selectedOrderIds.includes(order.OrderID);
              const status = statusInfo(order.Status);
              const stt = (currentPage - 1) * 20 + index + 1;

              return (
                <div
                  key={order.OrderID}
                  className={`p-4 sm:p-5 transition duration-150 ${
                    isSelected ? 'bg-blue-950/30' : 'hover:bg-slate-800/40'
                  }`}
                >
                  {/* HÀNG 1: Chọn, Mã đơn, Khách hàng, Ngày đặt, Số tiền, Trạng thái, Nút In & Chi tiết */}
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        aria-label={`Chọn đơn hàng #${order.OrderID}`}
                        checked={isSelected}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedOrderIds((prev) => [...prev, order.OrderID]);
                          else setSelectedOrderIds((prev) => prev.filter((id) => id !== order.OrderID));
                        }}
                        className="w-4 h-4 rounded text-blue-600 bg-slate-950 border-slate-700 cursor-pointer accent-blue-600"
                      />
                      <span className="text-xs font-bold text-slate-500">#{stt}</span>
                      <span className="font-mono font-black text-xs text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-lg border border-blue-500/20">
                        #{order.OrderID}
                      </span>
                      <div>
                        <p className="font-bold text-white text-sm">
                          {order.RecipientName || order.User?.FullName || 'Khách hàng'}
                        </p>
                        <p className="text-xs text-slate-400">
                          {order.RecipientPhone || order.User?.Phone || order.User?.Email || '—'}
                        </p>
                      </div>
                      <span className="text-xs text-slate-500 hidden md:inline">
                        · {dateTime(order.OrderDate)}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 ml-auto">
                      <div className="text-right">
                        <p className="text-sm sm:text-base font-black text-emerald-400">
                          {money(order.TotalAmount)}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {order.PaymentMethod || 'COD'}
                        </p>
                      </div>

                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${status.style}`}>
                        {status.label}
                      </span>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => printOrderInvoice(order)}
                          className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-blue-400 border border-slate-700 transition cursor-pointer active:scale-95"
                          title="In hóa đơn"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => openOrder(order)}
                          className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-md shadow-blue-600/20 active:scale-95 cursor-pointer"
                        >
                          Chi tiết
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* HÀNG 2: Danh sách sản phẩm mua + Địa chỉ nhận hàng + Vận đơn */}
                  <div className="mt-3 pl-7 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400 border-t border-slate-800/50 pt-2.5">
                    <div className="flex flex-wrap items-center gap-1.5 max-w-2xl">
                      {(order.OrderItems || []).slice(0, 3).map((item) => (
                        <span
                          key={item.ProductID}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-950 text-[11px] text-slate-300 border border-slate-800"
                        >
                          <span className="font-mono font-bold text-blue-400">#SP{item.ProductID}</span>
                          <span className="truncate max-w-[160px]">{item.Product?.ProductName || 'Sản phẩm'}</span>
                          <span className="text-slate-500 font-bold">x{item.Quantity}</span>
                        </span>
                      ))}
                      {(order.OrderItems || []).length > 3 && (
                        <span className="text-[11px] text-slate-500">
                          +{order.OrderItems!.length - 3} sản phẩm khác
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-slate-400 ml-auto truncate max-w-md">
                      <span>📍 {order.ShippingAddress || 'Địa chỉ giao hàng tiêu chuẩn'}</span>
                      {order.TrackingNumber && (
                        <span className="font-mono text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded border border-purple-500/20">
                          🚚 {order.TrackingNumber}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Pagination Controls */}
      <Pagination
        currentPage={currentPage}
        totalItems={filteredOrders.length}
        onPageChange={setPage}
      />

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
                <div className="flex items-center gap-3 mt-0.5">
                  <h2 className="text-xl font-black text-white">
                    Đơn Hàng #{selected.OrderID}
                  </h2>
                  <button
                    type="button"
                    onClick={() => printOrderInvoice(selected)}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-blue-600/20 hover:bg-blue-600 border border-blue-500/40 text-blue-300 hover:text-white text-xs font-bold transition shadow-sm cursor-pointer active:scale-95"
                    title="In hóa đơn bán hàng chuẩn A4"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                    <span>In Hóa Đơn</span>
                  </button>
                </div>
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
                    placeholder="VD: DEVORA89745123VN"
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
                  onChange={(e) => { setDraftStatus(e.target.value); setFeedback(''); }}
                  disabled={isDelivered || saving}
                  className="flex-1 rounded-2xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-xs font-bold text-white outline-none focus:border-blue-500 disabled:opacity-50"
                >
                  {ADMIN_SELECTABLE_STATUSES.map((status) => (
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

              {draftStatus === 'Cancelled' && normalizedStatus(selected.Status) !== 'Cancelled' && (
                <div className="mt-3">
                  <label htmlFor="admin-cancellation-reason" className="mb-1.5 block text-[11px] font-bold text-rose-300">
                    Lý do admin hủy đơn <span className="text-rose-400">*</span>
                  </label>
                  <textarea
                    id="admin-cancellation-reason"
                    rows={3}
                    maxLength={500}
                    value={cancellationReason}
                    onChange={(event) => { setCancellationReason(event.target.value); setFeedback(''); }}
                    placeholder="Nhập lý do hủy đơn để lưu vào lịch sử trạng thái..."
                    className="w-full resize-y rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2.5 text-xs text-white outline-none transition placeholder:text-slate-500 focus:border-rose-500"
                  />
                  <p className="mt-1 text-right text-[10px] text-slate-500">{cancellationReason.length}/500</p>
                </div>
              )}

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

      {/* Modal xác nhận chuyển sang Giao thành công (Delivered) */}
      {confirmDeliveredModal && selected && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-md space-y-5 rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-7 shadow-2xl text-slate-200">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20 inline-block mb-1">
                  Xác nhận giao hàng
                </span>
                <h3 className="text-lg font-black text-white">Xác nhận đơn đã giao thành công?</h3>
              </div>
            </div>

            <div className="rounded-2xl bg-slate-950/80 border border-slate-800 p-4 space-y-2 text-xs">
              <p className="text-slate-300">
                Đơn hàng: <strong className="text-white font-mono font-bold">#DH{selected.OrderID}</strong>
              </p>
              <p className="text-slate-300">
                Người nhận: <strong className="text-white">{selected.RecipientName || selected.User?.FullName}</strong>
              </p>
              <p className="text-amber-300/90 font-medium pt-1 border-t border-slate-800/80">
                ⚠️ Lưu ý: Khi chuyển sang "Giao thành công", đơn hàng sẽ được ghi nhận hoàn tất vào doanh thu và khách hàng có thể đánh giá sản phẩm.
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setConfirmDeliveredModal(false)}
                disabled={saving}
                className="rounded-2xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-xs font-bold text-slate-300 hover:bg-slate-700 transition"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={() => void executeSaveStatus()}
                disabled={saving}
                className="rounded-2xl bg-emerald-600 hover:bg-emerald-500 px-5 py-2.5 text-xs font-bold text-white transition shadow-lg shadow-emerald-950/50"
              >
                {saving ? 'Đang cập nhật...' : 'Xác nhận Đã Giao'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
