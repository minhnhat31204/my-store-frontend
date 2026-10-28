'use client';

import { useState } from 'react';
import { api, getPrimaryProductImage, type StoreOrder } from '@/lib/api';
import { useAdminData } from '@/lib/useAdminData';
import { exportToExcel } from '@/lib/exportExcel';
import { printRefundReceipt } from '@/lib/printUtils';
import Pagination from '@/app/admin/components/Pagination';

function money(value?: number | string | null) {
  return `${Number(value || 0).toLocaleString('vi-VN')} ₫`;
}

function dateTime(value?: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString('vi-VN');
}

export default function AdminRefundsPage() {
  const { data: requestsData, loading, error, reload } = useAdminData<StoreOrder[]>(
    'admin:refunds',
    () => api.getRefundRequests(),
  );
  const requests = requestsData ?? [];
  const [page, setPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<StoreOrder | null>(null);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectNote, setRejectNote] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredRequests = (requests || []).filter((order) => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return true;
    const idMatch = String(order.OrderID).includes(query) || `#${order.OrderID}`.includes(query);
    const nameMatch = (order.RecipientName || '').toLowerCase().includes(query) || (order.User?.FullName || '').toLowerCase().includes(query);
    const phoneMatch = (order.RecipientPhone || '').toLowerCase().includes(query) || (order.RefundPhone || '').toLowerCase().includes(query);
    const bankMatch = (order.RefundBankAccount || '').toLowerCase().includes(query) || (order.RefundBankHolder || '').toLowerCase().includes(query) || (order.RefundBankName || '').toLowerCase().includes(query);
    const reasonMatch = (order.RefundReason || '').toLowerCase().includes(query);
    const productMatch = (order.OrderItems || []).some((item) => 
      String(item.ProductID).includes(query) ||
      `sp${item.ProductID}`.includes(query) ||
      `#${item.ProductID}`.includes(query) ||
      `#sp${item.ProductID}`.includes(query) ||
      (item.Product?.ProductName || '').toLowerCase().includes(query)
    );
    return idMatch || nameMatch || phoneMatch || bankMatch || reasonMatch || productMatch;
  });

  const totalPages = Math.max(1, Math.ceil(filteredRequests.length / 20));
  const currentPage = Math.min(page, totalPages);
  const visibleRequests = filteredRequests.slice((currentPage - 1) * 20, currentPage * 20);



  const handleExportExcel = () => {
    exportToExcel<StoreOrder>({
      filename: 'Yeu_Cau_Hoan_Tien',
      sheetName: 'HoanTien',
      data: filteredRequests,
      columns: [
        { header: 'STT', transform: (_, idx) => idx + 1, width: 8 },
        { header: 'Mã đơn hàng', transform: (r) => '#' + r.OrderID, width: 14 },
        { header: 'Khách hàng', transform: (r) => r.RecipientName || r.User?.FullName || '', width: 22 },
        { header: 'Số điện thoại', transform: (r) => r.RefundPhone || r.RecipientPhone || '', width: 16 },
        { header: 'Số tiền cần hoàn (₫)', transform: (r) => Number(r.TotalAmount || 0), width: 20 },
        { header: 'Ngân hàng thụ hưởng', key: 'RefundBankName', width: 24 },
        { header: 'Số tài khoản', key: 'RefundBankAccount', width: 20 },
        { header: 'Chủ tài khoản', key: 'RefundBankHolder', width: 22 },
        { header: 'Lý do yêu cầu hoàn tiền', key: 'RefundReason', width: 35 },
        { header: 'Thời gian đặt hàng', transform: (r) => dateTime(r.OrderDate), width: 18 },
      ],
    });
  };

  const handleApprove = async (orderId: number) => {
    if (!window.confirm(`Xác nhận duyệt hoàn tiền cho đơn hàng #${orderId}? Bạn đã thực hiện chuyển tiền thành công cho khách hàng chưa?`)) return;
    setProcessingId(orderId);
    setFeedback(null);
    try {
      const res = await api.approveRefundRequest(orderId);
      setFeedback({ type: 'success', message: res.message || `Đã phê duyệt hoàn tiền cho đơn #${orderId}.` });
      setSelectedOrder(null);
      await reload(true);
    } catch (err) {
      setFeedback({ type: 'error', message: err instanceof Error ? err.message : 'Lỗi khi phê duyệt hoàn tiền.' });
    } finally {
      setProcessingId(null);
    }
  };

  const handleOpenReject = (order: StoreOrder) => {
    setSelectedOrder(order);
    setRejectNote('');
    setRejectModalOpen(true);
  };

  const handleConfirmReject = async () => {
    if (!selectedOrder) return;
    setProcessingId(selectedOrder.OrderID);
    setFeedback(null);
    try {
      const res = await api.rejectRefundRequest(selectedOrder.OrderID, rejectNote);
      setFeedback({ type: 'success', message: res.message || `Đã từ chối hoàn tiền cho đơn #${selectedOrder.OrderID}.` });
      setRejectModalOpen(false);
      setSelectedOrder(null);
      await reload(true);
    } catch (err) {
      setFeedback({ type: 'error', message: err instanceof Error ? err.message : 'Lỗi khi từ chối hoàn tiền.' });
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">Yêu cầu hoàn tiền</h1>
          <p className="mt-1 text-sm text-slate-400">
            Quản lý và phê duyệt các yêu cầu hoàn tiền từ khách hàng đã chuyển khoản qua VietQR / PayOS.
          </p>
        </div>
        <button
          onClick={() => void reload(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-slate-800 border border-slate-700 px-4 py-2.5 text-sm font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Làm mới
        </button>
      </div>

      {feedback && (
        <div className={`p-4 rounded-xl border flex items-center justify-between gap-3 text-sm font-semibold ${
          feedback.type === 'success'
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
            : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
        }`}>
          <span>{feedback.message}</span>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-white text-xs">✕</button>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm font-semibold">
          {error}
        </div>
      )}

      {/* Search Bar */}
      <div className="space-y-3 bg-slate-900/80 p-4 rounded-2xl border border-slate-800/80 shadow-lg">
        <div className="relative">
          <svg className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
            placeholder="Tìm theo mã đơn (#101), mã SP (#12, SP12), tên sản phẩm, tên khách hàng, SĐT, số tài khoản..."
            className="w-full pl-10 pr-10 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs font-bold p-1 cursor-pointer"
              title="Xóa tìm kiếm"
            >
              ✕
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 text-[11px] text-slate-400 flex-wrap pt-1 border-t border-slate-800/60">
          <span className="font-semibold text-slate-500">Tìm kiếm theo:</span>
          <span className="px-2 py-0.5 rounded-md bg-slate-950 text-slate-300 border border-slate-800">🏷️ Mã SP (#12, SP12)</span>
          <span className="px-2 py-0.5 rounded-md bg-slate-950 text-slate-300 border border-slate-800">💻 Tên sản phẩm</span>
          <span className="px-2 py-0.5 rounded-md bg-slate-950 text-slate-300 border border-slate-800">🧾 Mã đơn (#ID)</span>
          <span className="px-2 py-0.5 rounded-md bg-slate-950 text-slate-300 border border-slate-800">💳 Số tài khoản ngân hàng</span>
          {searchTerm && (
            <span className="ml-auto text-blue-400 font-bold">
              Tìm thấy {filteredRequests.length} yêu cầu
            </span>
          )}
        </div>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-12 text-center text-slate-400">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent mb-4"></div>
          <p>Đang tải danh sách yêu cầu hoàn tiền...</p>
        </div>
      ) : requests.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-12 text-center text-slate-400">
          <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-4 text-slate-500">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-lg font-bold text-slate-300">Không có yêu cầu hoàn tiền nào đang chờ duyệt</p>
          <p className="text-sm text-slate-500 mt-1">Khi khách hàng gửi yêu cầu hủy đơn đã chuyển khoản, thông tin tài khoản ngân hàng sẽ xuất hiện tại đây.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {visibleRequests.map((order, index) => {
            const stt = (currentPage - 1) * 20 + index + 1;
            const isProcessing = processingId === order.OrderID;
            return (
              <div
                key={order.OrderID}
                className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg space-y-4 hover:border-slate-700 transition"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
                  <div className="flex items-center gap-3">
                    <span className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 font-bold text-xs">STT: {stt}</span>
                    <span className="text-lg font-black text-white">Đơn hàng #{order.OrderID}</span>
                    <span className="rounded-full bg-amber-500/10 border border-amber-500/20 px-3 py-0.5 text-xs font-bold text-amber-400">
                      Chờ hoàn tiền
                    </span>
                  </div>
                  <div className="text-xs text-slate-400">
                    Gửi yêu cầu: <span className="text-slate-200 font-semibold">{dateTime(order.RefundRequestAt)}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                  {/* Khách hàng */}
                  <div className="space-y-1 rounded-xl bg-slate-950/50 p-3 border border-slate-800/80">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Thông tin khách hàng</p>
                    <p className="font-bold text-slate-200">{order.User?.FullName || order.RecipientName || 'Khách lẻ'}</p>
                    <p className="text-xs text-slate-400">SĐT đơn: {order.RecipientPhone || '—'}</p>
                    <p className="text-xs text-slate-400">SĐT hoàn tiền: <span className="font-semibold text-blue-400">{order.RefundPhone || '—'}</span></p>
                  </div>

                  {/* Tài khoản nhận tiền */}
                  <div className="space-y-1 rounded-xl bg-blue-950/20 p-3 border border-blue-900/40">
                    <p className="text-xs font-bold text-blue-400 uppercase tracking-wider">Tài khoản nhận hoàn tiền</p>
                    <p className="font-black text-white text-base tracking-wide">
                      {order.RefundBankAccount || '—'}
                    </p>
                    <p className="font-semibold text-slate-300">{order.RefundBankHolder || '—'}</p>
                    <p className="text-xs text-blue-300 font-medium">{order.RefundBankName || '—'}</p>
                  </div>

                  {/* Số tiền & Lý do */}
                  <div className="space-y-1 rounded-xl bg-slate-950/50 p-3 border border-slate-800/80">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Số tiền cần hoàn</p>
                    <p className="text-xl font-black text-emerald-400">{money(order.TotalAmount)}</p>
                    <p className="text-xs text-slate-400">
                      Lý do: <span className="text-slate-200 italic">{order.RefundReason || 'Khách không cung cấp lý do'}</span>
                    </p>
                  </div>
                </div>

                {/* Sản phẩm trong đơn */}
                {order.OrderItems && order.OrderItems.length > 0 && (
                  <div className="rounded-xl bg-slate-950/30 p-3 border border-slate-800/50">
                    <p className="text-xs font-bold text-slate-500 mb-2">SẢN PHẨM ({order.OrderItems.length}):</p>
                    <div className="flex flex-wrap gap-3">
                      {order.OrderItems.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs text-slate-300 bg-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-800">
                          {item.Product?.ImageUrl && (
                            <img src={getPrimaryProductImage(item.Product.ImageUrl)} alt="" className="w-6 h-6 object-cover rounded" />
                          )}
                          <span className="font-mono text-[10px] font-bold text-blue-400 bg-blue-500/10 px-1 py-0.5 rounded border border-blue-500/20 shrink-0">#SP{item.ProductID}</span>
                          <span className="font-semibold max-w-[200px] truncate">{item.Product?.ProductName || `Sản phẩm #${item.ProductID}`}</span>
                          <span className="text-slate-500">×{item.Quantity}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => printRefundReceipt(order)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-xs font-bold text-blue-300 hover:bg-blue-500/20 transition cursor-pointer shadow-sm active:scale-95"
                    title="In phiếu chi hoàn tiền / biên bản hoàn tất"
                  >
                    <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                    <span>In Phiếu Hoàn Tiền</span>
                  </button>
                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={() => handleOpenReject(order)}
                    className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-xs font-bold text-rose-400 hover:bg-rose-500/20 disabled:opacity-50 transition"
                  >
                    Từ chối yêu cầu
                  </button>
                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={() => handleApprove(order.OrderID)}
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-500 shadow-md shadow-emerald-950 disabled:opacity-50 transition"
                  >
                    {isProcessing ? (
                      'Đang xử lý...'
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                        </svg>
                        Xác nhận đã chuyển tiền hoàn
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Pagination currentPage={currentPage} totalItems={filteredRequests.length} onPageChange={setPage} />

      {/* Modal từ chối */}
      {rejectModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-black text-white">Từ chối hoàn tiền #{selectedOrder.OrderID}</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Đơn hàng sẽ được chuyển lại trạng thái <strong>Đang chuẩn bị hàng (Processing)</strong> để tiếp tục xử lý và giao hàng cho khách.
            </p>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Lý do từ chối (tùy chọn)</label>
              <textarea
                rows={3}
                value={rejectNote}
                onChange={(e) => setRejectNote(e.target.value)}
                placeholder="Nhập lý do gửi đến khách hàng..."
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 outline-none focus:border-blue-500"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setRejectModalOpen(false)}
                className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-bold text-slate-300 hover:bg-slate-700"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={processingId !== null}
                onClick={handleConfirmReject}
                className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-500 disabled:opacity-50"
              >
                {processingId !== null ? 'Đang xử lý...' : 'Xác nhận từ chối'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
