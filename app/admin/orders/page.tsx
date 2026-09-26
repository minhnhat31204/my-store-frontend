'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { api, getPrimaryProductImage, type StoreOrder } from '@/lib/api';
import { useAdminGuard } from '@/lib/useAdminGuard';

const STATUS_OPTIONS = [
  { value: 'Pending', label: 'Chờ xác nhận', style: 'bg-amber-50 text-amber-700 border-amber-200' },
  { value: 'Confirmed', label: 'Đã xác nhận', style: 'bg-sky-50 text-sky-700 border-sky-200' },
  { value: 'Processing', label: 'Đang xử lý', style: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  { value: 'Shipping', label: 'Đang giao', style: 'bg-violet-50 text-violet-700 border-violet-200' },
  { value: 'Delivered', label: 'Đã giao', style: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { value: 'Cancelled', label: 'Đã hủy', style: 'bg-rose-50 text-rose-700 border-rose-200' },
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
  useAdminGuard();
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
    setCarrierName(order.CarrierName || ''); setTrackingNumber(order.TrackingNumber || ''); setEstimatedDelivery(order.EstimatedDelivery || '');
    api.getOrderStatusHistory(order.OrderID).then(setStatusHistory).catch(() => setStatusHistory([]));
  };

  const saveShipping = async () => {
    if (!selected) return;
    setSaving(true); setFeedback('');
    try {
      const result = await api.updateOrderShipping(selected.OrderID, { CarrierName: carrierName.trim() || null, TrackingNumber: trackingNumber.trim() || null, EstimatedDelivery: estimatedDelivery || null });
      setOrders((current) => current.map((order) => order.OrderID === selected.OrderID ? { ...order, ...result.order } : order));
      setSelected((current) => current ? { ...current, ...result.order } : current); setFeedback('Đã lưu thông tin vận chuyển.');
    } catch (e) { setFeedback(e instanceof Error ? e.message : 'Không thể lưu thông tin vận chuyển.'); }
    finally { setSaving(false); }
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
      setFeedback('Đã cập nhật tiến độ đơn hàng.');
    } catch (e) {
      setFeedback(e instanceof Error ? e.message : 'Không thể cập nhật tiến độ đơn hàng.');
    } finally {
      setSaving(false);
    }
  };

  const selectedStatus = statusInfo(selected?.Status);
  const isDelivered = ['delivered', 'completed', 'complete'].includes((selected?.Status || '').trim().toLowerCase());

  return (
    <main className="min-h-screen bg-slate-50 p-4 text-slate-800 sm:p-6">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="rounded-lg bg-slate-200 px-4 py-2 text-sm font-semibold transition hover:bg-slate-300">← Dashboard</Link>
            <div>
              <h1 className="text-2xl font-bold">Quản lý đơn hàng</h1>
              <p className="mt-1 text-sm text-slate-500">Xem thông tin và cập nhật tiến độ giao hàng</p>
            </div>
          </div>
        </header>

        <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(240px,1fr)_220px_200px]">
          <label><span className="sr-only">Tìm đơn hàng</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm mã đơn, tên, số điện thoại..." className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" /></label>
          <label className="sr-only" htmlFor="order-status-filter">Lọc trạng thái đơn hàng</label>
          <select id="order-status-filter" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold outline-none focus:border-emerald-500"><option value="all">Tất cả trạng thái</option>{STATUS_OPTIONS.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}</select>
          <label className="sr-only" htmlFor="order-month-filter">Lọc tháng đặt hàng</label>
          <input id="order-month-filter" type="month" value={monthFilter} onChange={(event) => setMonthFilter(event.target.value)} aria-label="Lọc tháng đặt hàng" className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-500" />
        </div>

        {error && <p className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        {loading ? <p className="rounded-xl bg-white p-8 text-center text-slate-500">Đang tải danh sách đơn hàng...</p> : filteredOrders.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-500">{orders.length ? 'Không tìm thấy đơn hàng phù hợp.' : 'Chưa có đơn hàng nào.'}</div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="hidden overflow-x-auto sm:block">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-500">
                  <tr><th className="px-5 py-4">Đơn hàng</th><th className="px-5 py-4">Khách hàng</th><th className="px-5 py-4">Ngày đặt</th><th className="px-5 py-4">Tổng tiền</th><th className="px-5 py-4">Tiến độ</th><th className="px-5 py-4 text-right">Chi tiết</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredOrders.map((order) => {
                    const status = statusInfo(order.Status);
                    return <tr key={order.OrderID} className="transition hover:bg-slate-50">
                      <td className="px-5 py-4 font-bold text-slate-800">#{order.OrderID}</td>
                      <td className="px-5 py-4"><div className="font-semibold">{order.RecipientName || order.User?.FullName || 'Khách hàng'}</div><div className="mt-1 text-xs text-slate-500">{order.RecipientPhone || order.User?.Phone || order.User?.Email || '—'}</div></td>
                      <td className="px-5 py-4 text-slate-600">{dateTime(order.OrderDate)}</td>
                      <td className="px-5 py-4 font-bold text-emerald-700">{money(order.TotalAmount)}</td>
                      <td className="px-5 py-4"><span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${status.style}`}>{status.label}</span></td>
                      <td className="px-5 py-4 text-right"><button onClick={() => openOrder(order)} className="rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-bold text-white transition hover:bg-emerald-700">Xem chi tiết</button></td>
                    </tr>;
                  })}
                </tbody>
              </table>
            </div>
            <div className="divide-y divide-slate-100 sm:hidden">
              {filteredOrders.map((order) => {
                const status = statusInfo(order.Status);
                return <article key={order.OrderID} className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-3"><div><p className="font-black">Đơn hàng #{order.OrderID}</p><p className="mt-1 text-xs text-slate-500">{dateTime(order.OrderDate)}</p></div><span className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-bold ${status.style}`}>{status.label}</span></div>
                  <div><p className="font-semibold">{order.RecipientName || order.User?.FullName || 'Khách hàng'}</p><p className="text-xs text-slate-500">{order.RecipientPhone || order.User?.Phone || order.User?.Email || '—'}</p></div>
                  <div className="flex items-center justify-between gap-3"><span className="font-black text-emerald-700">{money(order.TotalAmount)}</span><button onClick={() => openOrder(order)} className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-bold text-white">Chi tiết</button></div>
                </article>;
              })}
            </div>
          </div>
        )}
      </div>

      {selected && <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 p-0 backdrop-blur-sm sm:items-center sm:p-5" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) setSelected(null); }}>
        <section role="dialog" aria-modal="true" aria-labelledby="order-dialog-title" className="max-h-[94vh] w-full max-w-3xl overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">
          <div className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-100 bg-white/95 px-5 py-4 backdrop-blur sm:px-7">
            <div><p className="text-xs font-bold uppercase tracking-widest text-emerald-700">Chi tiết đơn hàng</p><h2 id="order-dialog-title" className="mt-1 text-xl font-black">Đơn hàng #{selected.OrderID}</h2><p className="mt-1 text-sm text-slate-500">Đặt lúc {dateTime(selected.OrderDate)}</p></div>
            <button onClick={() => setSelected(null)} disabled={saving} aria-label="Đóng" className="rounded-full bg-slate-100 px-3 py-1 text-xl text-slate-600 hover:bg-slate-200 disabled:opacity-50">×</button>
          </div>

          <div className="space-y-6 px-5 py-5 sm:px-7">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 p-4"><h3 className="mb-2 text-sm font-bold">Thông tin khách hàng</h3><p className="font-semibold">{selected.User?.FullName || selected.RecipientName || 'Khách hàng'}</p><p className="mt-1 text-sm text-slate-600">{selected.User?.Email || 'Không có email'}</p><p className="mt-1 text-sm text-slate-600">{selected.User?.Phone || selected.RecipientPhone || 'Không có số điện thoại'}</p></div>
              <div className="rounded-2xl border border-slate-200 p-4"><h3 className="mb-2 text-sm font-bold">Giao hàng & thanh toán</h3><p className="text-sm"><span className="font-semibold">Người nhận:</span> {selected.RecipientName || '—'} · {selected.RecipientPhone || '—'}</p><p className="mt-1 text-sm text-slate-600"><span className="font-semibold text-slate-800">Địa chỉ:</span> {selected.ShippingAddress || '—'}</p><p className="mt-2 text-sm text-slate-600"><span className="font-semibold text-slate-800">Thanh toán:</span> {selected.PaymentMethod || '—'}{selected.Payments?.[0]?.Status ? ` · ${selected.Payments[0].Status}` : ''}</p></div>
            </div>

            <div><h3 className="mb-3 text-sm font-bold">Sản phẩm trong đơn</h3><div className="divide-y divide-slate-100 rounded-2xl border border-slate-200">
              {(selected.OrderItems || []).length === 0 ? <p className="p-4 text-sm text-slate-500">Không có thông tin sản phẩm.</p> : selected.OrderItems?.map((item, index) => {
                const image = getPrimaryProductImage(item.Product?.ImageUrl);
                return <div key={item.OrderItemID || `${item.ProductID}-${index}`} className="flex items-center gap-3 p-4">
                  {image ? <img src={image} alt="" className="h-14 w-14 rounded-xl bg-slate-100 object-cover" /> : <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-slate-100 text-xs text-slate-400">Ảnh</div>}
                  <div className="min-w-0 flex-1"><p className="truncate font-semibold">{item.Product?.ProductName || `Sản phẩm #${item.ProductID}`}</p><p className="mt-1 text-xs text-slate-500">{money(item.UnitPrice)} × {item.Quantity}</p></div>
                  <p className="shrink-0 font-bold">{money(Number(item.UnitPrice) * Number(item.Quantity))}</p>
                </div>;
              })}
            </div></div>

            {selected.Note && <div className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900"><span className="font-bold">Ghi chú:</span> {selected.Note}</div>}
            <section className="rounded-2xl border border-sky-200 bg-sky-50/70 p-4 sm:p-5">
              <h3 className="font-bold text-sky-950">Thông tin vận chuyển</h3>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <label className="text-xs font-semibold text-slate-600">Đơn vị vận chuyển<input value={carrierName} onChange={(event) => setCarrierName(event.target.value)} placeholder="VD: GHTK, GHN" className="mt-1 min-h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900" /></label>
                <label className="text-xs font-semibold text-slate-600">Mã vận đơn<input value={trackingNumber} onChange={(event) => setTrackingNumber(event.target.value)} placeholder="Mã tra cứu" className="mt-1 min-h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900" /></label>
                <label className="text-xs font-semibold text-slate-600">Dự kiến giao<input type="date" value={estimatedDelivery} onChange={(event) => setEstimatedDelivery(event.target.value)} className="mt-1 min-h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900" /></label>
              </div>
              <button onClick={saveShipping} disabled={saving} className="mt-3 rounded-lg bg-sky-800 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">Lưu vận chuyển</button>
            </section>
              <section className="rounded-2xl border border-slate-200 p-4 sm:p-5"><h3 className="font-bold">Lịch sử trạng thái</h3>{statusHistory.length ? <ol className="mt-3 space-y-3">{statusHistory.map((entry) => <li key={entry.StatusHistoryID} className="border-l-2 border-emerald-300 pl-3"><p className="text-sm font-semibold">{entry.PreviousStatus ? `${statusInfo(entry.PreviousStatus).label} → ` : ''}{statusInfo(entry.NewStatus).label}</p><p className="mt-0.5 text-xs text-slate-500">{dateTime(entry.ChangedAt)} · {entry.Actor?.FullName || (entry.ActorUserID ? `Tài khoản #${entry.ActorUserID}` : 'Hệ thống')}{entry.Note ? ` · ${entry.Note}` : ''}</p></li>)}</ol> : <p className="mt-2 text-sm text-slate-500">Chưa có lịch sử hoặc không tải được.</p>}</section>
            <div className="ml-auto max-w-sm space-y-2 border-t border-slate-200 pt-4 text-sm">
              {Number(selected.DiscountAmount) > 0 && <><div className="flex justify-between text-slate-600"><span>Tạm tính</span><span>{money(Number(selected.TotalAmount) + Number(selected.DiscountAmount))}</span></div><div className="flex justify-between text-emerald-700"><span>Giảm giá{selected.VoucherCode ? ` (${selected.VoucherCode})` : ''}</span><span>−{money(selected.DiscountAmount)}</span></div></>}
              <div className="flex justify-between text-base font-black"><span>Tổng thanh toán</span><span className="text-emerald-700">{money(selected.TotalAmount)}</span></div>
            </div>

            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 sm:p-5">
              <div className="mb-3 flex items-center justify-between gap-3"><div><h3 className="font-bold">Cập nhật tiến độ</h3><p className="mt-1 text-xs text-slate-600">Trạng thái hiện tại: <span className={`inline-flex rounded-full border px-2 py-0.5 font-bold ${selectedStatus.style}`}>{selectedStatus.label}</span></p></div></div>
              <div className="flex flex-col gap-3 sm:flex-row"><select value={draftStatus} onChange={(event) => setDraftStatus(event.target.value)} disabled={isDelivered || saving} className="min-h-11 flex-1 rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500">{STATUS_OPTIONS.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}</select><button onClick={saveStatus} disabled={isDelivered || saving || draftStatus === normalizedStatus(selected.Status)} className="min-h-11 rounded-xl bg-emerald-700 px-5 text-sm font-bold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50">{isDelivered ? 'Đã khóa tiến độ' : saving ? 'Đang lưu...' : 'Lưu tiến độ'}</button></div>
              {isDelivered && <p className="mt-3 text-sm font-medium text-emerald-800">Đơn hàng đã giao thành công nên tiến độ không thể thay đổi.</p>}
              {feedback && <p role="status" className={`mt-3 text-sm font-medium ${feedback.startsWith('Đã') ? 'text-emerald-800' : 'text-red-700'}`}>{feedback}</p>}
            </div>
          </div>
        </section>
      </div>}
    </main>
  );
}
