const fs = require('fs');

// ========================================================
// 1. UPDATE BACKEND: computer-store-api/src/controllers/orderController.js
// ========================================================
let controller = fs.readFileSync('D:\\computer-store-api\\src\\controllers\\orderController.js', 'utf8');

// 1.1 Allow 'Returned' in updateStatus allowedStatuses
controller = controller.replace(
  "const allowedStatuses = new Set(['Pending', 'Confirmed', 'Processing', 'Shipping', 'Delivered', 'Cancelled', 'RefundPending', 'Pending Refund']);",
  "const allowedStatuses = new Set(['Pending', 'Confirmed', 'Processing', 'Shipping', 'Delivered', 'Cancelled', 'Returned', 'RefundPending', 'Pending Refund']);"
);

// 1.2 In approveRefundRequest: change Status from 'Cancelled' to 'Returned'
// Around line 802
controller = controller.replace(
  "        Status: 'Cancelled',\r\n        RefundStatus: 'approved',",
  "        Status: 'Returned',\r\n        RefundStatus: 'approved',"
);
controller = controller.replace(
  "        Status: 'Cancelled',\n        RefundStatus: 'approved',",
  "        Status: 'Returned',\n        RefundStatus: 'approved',"
);

// In OrderStatusHistory in approveRefundRequest
controller = controller.replace(
  "        PreviousStatus: 'RefundPending',\r\n        NewStatus: 'Cancelled',",
  "        PreviousStatus: 'RefundPending',\r\n        NewStatus: 'Returned',"
);
controller = controller.replace(
  "        PreviousStatus: 'RefundPending',\n        NewStatus: 'Cancelled',",
  "        PreviousStatus: 'RefundPending',\n        NewStatus: 'Returned',"
);

// In message of approveRefundRequest
controller = controller.replace(
  "chuyển trạng thái đơn hàng sang Đã hủy.",
  "chuyển trạng thái đơn hàng sang Đã trả hàng."
);

fs.writeFileSync('D:\\computer-store-api\\src\\controllers\\orderController.js', controller, 'utf8');
console.log('1. Backend updated with Returned status on refund approve!');

// ========================================================
// 2. UPDATE FRONTEND: my-store-frontend/app/admin/orders/page.tsx
// ========================================================
let ordersPage = fs.readFileSync('D:\\my-store-frontend\\app\\admin\\orders\\page.tsx', 'utf8');

// 2.1 Update STATUS_OPTIONS: add Returned and ensure RefundPending has clear style
const oldStatusOptions = `const STATUS_OPTIONS = [
  { value: 'Pending', label: 'Chờ xác nhận', style: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  { value: 'Confirmed', label: 'Đã xác nhận', style: 'bg-sky-500/10 text-sky-400 border-sky-500/20' },
  { value: 'Processing', label: 'Đang chuẩn bị hàng', style: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' },
  { value: 'Shipping', label: 'Đang giao hàng', style: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
  { value: 'Delivered', label: 'Giao thành công', style: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  { value: 'Cancelled', label: 'Đã hủy', style: 'bg-rose-500/10 text-rose-400 border-rose-500/20' },
];`;

const newStatusOptions = `const STATUS_OPTIONS = [
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
];`;

ordersPage = ordersPage.replace(oldStatusOptions.replace(/\r\n/g, '\n'), newStatusOptions);
ordersPage = ordersPage.replace(oldStatusOptions.replace(/\n/g, '\r\n'), newStatusOptions.replace(/\n/g, '\r\n'));

// 2.2 Update normalizedStatus to handle returned and refundpending
const oldNormalized = `function normalizedStatus(status?: string | null) {
  const value = (status || 'Pending').toLowerCase();
  if (['shipped', 'delivering'].includes(value)) return 'Shipping';
  if (['completed', 'complete'].includes(value)) return 'Delivered';
  if (['canceled', 'cancel'].includes(value)) return 'Cancelled';
  if (['preparing', 'ready'].includes(value)) return 'Processing';
  return STATUS_OPTIONS.find((item) => item.value.toLowerCase() === value)?.value || 'Pending';
}`;

const newNormalized = `function normalizedStatus(status?: string | null) {
  const value = (status || 'Pending').toLowerCase();
  if (['shipped', 'delivering'].includes(value)) return 'Shipping';
  if (['completed', 'complete'].includes(value)) return 'Delivered';
  if (['canceled', 'cancel'].includes(value)) return 'Cancelled';
  if (['preparing', 'ready'].includes(value)) return 'Processing';
  if (['returned', 'da tra hang', 'tra hang'].includes(value)) return 'Returned';
  if (['refundpending', 'pending refund', 'cho hoan tien'].includes(value)) return 'RefundPending';
  return STATUS_OPTIONS.find((item) => item.value.toLowerCase() === value)?.value || 'Pending';
}`;

ordersPage = ordersPage.replace(oldNormalized.replace(/\r\n/g, '\n'), newNormalized);
ordersPage = ordersPage.replace(oldNormalized.replace(/\n/g, '\r\n'), newNormalized.replace(/\n/g, '\r\n'));

// 2.3 Add confirm modal state for Delivered
ordersPage = ordersPage.replace(
  "  const [estimatedDelivery, setEstimatedDelivery] = useState('');",
  "  const [estimatedDelivery, setEstimatedDelivery] = useState('');\n  const [confirmDeliveredModal, setConfirmDeliveredModal] = useState(false);"
);

// 2.4 Update saveStatus to prompt confirmation if draftStatus === 'Delivered'
const oldSaveStatus = `  const saveStatus = async () => {
    if (!selected) return;
    if (draftStatus === 'Cancelled' && normalizedStatus(selected.Status) !== 'Cancelled' && !cancellationReason.trim()) {
      setFeedback('Vui lòng nhập lý do admin chủ động hủy đơn hàng.');
      return;
    }
    setSaving(true);
    setFeedback('');
    try {
      const result = await api.updateOrderStatus(selected.OrderID, draftStatus, draftStatus === 'Cancelled' ? cancellationReason.trim() : undefined);
      const updated = result.order || { ...selected, Status: draftStatus };
      void reload(true);
      setSelected((current) => current ? { ...current, ...updated } : current);
      setFeedback('Đã cập nhật tiến độ đơn hàng thành công.');
    } catch (e) {
      setFeedback(e instanceof Error ? e.message : 'Không thể cập nhật tiến độ đơn hàng.');
    } finally {
      setSaving(false);
    }
  };`;

const newSaveStatus = `  const executeSaveStatus = async () => {
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
  };`;

ordersPage = ordersPage.replace(oldSaveStatus.replace(/\r\n/g, '\n'), newSaveStatus);
ordersPage = ordersPage.replace(oldSaveStatus.replace(/\n/g, '\r\n'), newSaveStatus.replace(/\n/g, '\r\n'));

// 2.5 In the select element: use ADMIN_SELECTABLE_STATUSES instead of STATUS_OPTIONS
// This hides RefundPending & Returned from manual selection
ordersPage = ordersPage.replace(
  "{STATUS_OPTIONS.map((status) => (\r\n                    <option key={status.value} value={status.value}>\r\n                      {status.label}\r\n                    </option>\r\n                  ))}",
  "{ADMIN_SELECTABLE_STATUSES.map((status) => (\r\n                    <option key={status.value} value={status.value}>\r\n                      {status.label}\r\n                    </option>\r\n                  ))}"
);
ordersPage = ordersPage.replace(
  "{STATUS_OPTIONS.map((status) => (\n                    <option key={status.value} value={status.value}>\n                      {status.label}\n                    </option>\n                  ))}",
  "{ADMIN_SELECTABLE_STATUSES.map((status) => (\n                    <option key={status.value} value={status.value}>\n                      {status.label}\n                    </option>\n                  ))}"
);

// 2.6 Add Confirmation Modal JSX before closing of AdminOrders
const modalConfirmDelivered = `
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
`;

ordersPage = ordersPage.replace('    </div>\n  );\n}', `${modalConfirmDelivered}    </div>\n  );\n}`);
ordersPage = ordersPage.replace('    </div>\r\n  );\r\n}', `${modalConfirmDelivered}    </div>\r\n  );\r\n}`);

fs.writeFileSync('D:\\my-store-frontend\\app\\admin\\orders\\page.tsx', ordersPage, 'utf8');
console.log('2. Frontend Orders page updated with Delivered Confirmation & Restricted Dropdown!');
