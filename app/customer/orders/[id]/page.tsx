"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api, getPrimaryProductImage, getStoredUser, type StoreOrder } from "@/lib/api";

function statusLabel(status?: string | null) {
  const value = (status || "Pending").toLowerCase();
  if (value === "pending") return "Chờ xác nhận";
  if (["shipping", "delivering"].includes(value)) return "Đang giao";
  if (["completed", "delivered"].includes(value)) return "Đã giao";
  if (["cancelled", "canceled"].includes(value)) return "Đã hủy";
  if (["refundpending", "pending refund"].includes(value)) return "Chờ hoàn tiền";
  return status || "Chờ xác nhận";
}

function currency(value: number | string | null | undefined) {
  return `${Number(value || 0).toLocaleString("vi-VN")} ₫`;
}

const COMMON_BANKS = [
  "Vietcombank",
  "MB Bank",
  "Techcombank",
  "BIDV",
  "VietinBank",
  "Agribank",
  "ACB",
  "TPBank",
  "VPBank",
  "MSB",
  "Sacombank",
  "HDBank",
  "VIB",
  "OCB"
];

export default function OrderDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const orderId = Number(id);
  const [order, setOrder] = useState<StoreOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [paymentBusy, setPaymentBusy] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [cancelBusy, setCancelBusy] = useState(false);
  const [cancelError, setCancelError] = useState("");
  const [isCodSuccess, setIsCodSuccess] = useState(false);
  const [isPaymentCancelled, setIsPaymentCancelled] = useState(false);

  // Refund modal state
  const [refundModalOpen, setRefundModalOpen] = useState(false);
  const [refundPhone, setRefundPhone] = useState("");
  const [refundBankName, setRefundBankName] = useState(COMMON_BANKS[0]);
  const [refundBankAccount, setRefundBankAccount] = useState("");
  const [refundBankHolder, setRefundBankHolder] = useState("");
  const [refundReason, setRefundReason] = useState("");
  const [refundSubmitting, setRefundSubmitting] = useState(false);
  const [refundError, setRefundError] = useState("");


  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("method") === "cod" && (params.get("status") === "success" || params.get("status") === "created")) {
        setIsCodSuccess(true);
      }
      if (params.get("payment") === "cancel" || params.get("status") === "cancel" || params.get("cancel") === "true") {
        setIsPaymentCancelled(true);
      }
    }
  }, []);

  const loadOrder = async () => {
    const user = getStoredUser();
    if (!user) {
      setError("Vui lòng đăng nhập để xem chi tiết đơn hàng.");
      setLoading(false);
      return;
    }
    if (!Number.isInteger(orderId) || orderId <= 0) {
      setError("Mã đơn hàng không hợp lệ.");
      setLoading(false);
      return;
    }
    try {
      const items = await api.getOrdersByUser(user.UserID);
      const found = items.find((item) => item.OrderID === orderId);
      if (!found) {
        setError("Không tìm thấy đơn hàng này trong tài khoản của bạn.");
      } else {
        setOrder(found);
        setRefundPhone(found.RecipientPhone || user.Phone || "");
        setRefundBankHolder(found.RecipientName || user.FullName || "");
      }
    } catch {
      setError("Không thể tải chi tiết đơn hàng.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadOrder();
  }, [orderId]);

  // Notification review links pass through the order so the app can resolve a product,
  // then open that product's review section directly.
  useEffect(() => {
    if (!order || typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("action") !== "review" || !["completed", "delivered", "đã giao", "giao thành công", "đã giao thành công"].includes(String(order.Status || "").toLowerCase())) return;
    const user = getStoredUser();
    const productIds = [...new Set((order.OrderItems || []).map((item) => Number(item.ProductID)).filter((id) => id > 0))];
    if (!user || productIds.length === 0) return;
    let active = true;
    void Promise.all(productIds.map(async (productId) => ({
      productId,
      eligibility: await api.getProductReviewEligibility(user.UserID, productId, order.OrderID).catch(() => null),
    }))).then((results) => {
      if (!active) return;
      const target = results.find((result) => (result.eligibility?.selectedOrder?.remainingQuantity || 0) > 0)
        || results.find((result) => (result.eligibility?.selectedOrder?.reviews.length || 0) > 0)
        || results[0];
      if (target) router.replace(`/customer/products/${target.productId}?action=review&orderId=${order.OrderID}#reviews`);
    });
    return () => { active = false; };
  }, [order, router]);

  useEffect(() => {
    const user = getStoredUser();
    if (!user || !order || order.Status?.toLowerCase() === "cancelled" || order.Status?.toLowerCase() === "canceled" || order.PaymentMethod !== "PayOS" || order.Payments?.[0]?.Status === "PAID") return;
    const timer = window.setInterval(() => {
      api.getPaymentStatus(orderId, user.UserID)
        .then(({ payment, orderStatus }) => {
          setOrder((current) => current ? { ...current, ...(payment ? { Payments: [payment] } : {}), ...(orderStatus ? { Status: orderStatus } : {}) } : current);
        })
        .catch(() => {});
    }, 3000);
    return () => window.clearInterval(timer);
  }, [order, orderId]);

  async function retryPayment() {
    const user = getStoredUser();
    if (!user) return;
    setPaymentBusy(true);
    setPaymentError("");
    try {
      const payment = await api.createPayOSPayment(orderId, user.UserID);
      window.location.assign(payment.checkoutUrl);
    } catch (err) {
      setPaymentError(err instanceof Error ? err.message : "Không tạo được link PayOS.");
    } finally {
      setPaymentBusy(false);
    }
  }

  async function cancelOrder() {
    const user = getStoredUser();
    if (!user || !order || !window.confirm("Bạn có chắc muốn hủy đơn hàng này không?")) return;
    setCancelBusy(true);
    setCancelError("");
    try {
      const result = await api.cancelOrder(order.OrderID, user.UserID);
      setOrder(result.order);
    } catch (err) {
      setCancelError(err instanceof Error ? err.message : "Không hủy được đơn hàng.");
    } finally {
      setCancelBusy(false);
    }
  }

  async function handleRefundSubmit(e: React.FormEvent) {
    e.preventDefault();
    const user = getStoredUser();
    if (!user || !order) return;

    if (!refundPhone.trim() || !refundBankAccount.trim() || !refundBankHolder.trim() || !refundBankName.trim()) {
      setRefundError("Vui lòng nhập đầy đủ thông tin tài khoản ngân hàng.");
      return;
    }

    setRefundSubmitting(true);
    setRefundError("");
    try {
      const result = await api.submitRefundRequest(order.OrderID, {
        UserID: user.UserID,
        Phone: refundPhone.trim(),
        BankName: refundBankName.trim(),
        BankAccount: refundBankAccount.trim(),
        BankHolder: refundBankHolder.trim().toUpperCase(),
        Reason: refundReason.trim(),
      });
      setOrder(result.order);
      setRefundModalOpen(false);
      alert("Đã gửi yêu cầu hoàn tiền thành công! Cửa hàng sẽ xét duyệt và chuyển tiền về tài khoản của bạn.");
    } catch (err) {
      setRefundError(err instanceof Error ? err.message : "Không gửi được yêu cầu hoàn tiền.");
    } finally {
      setRefundSubmitting(false);
    }
  }

  const items = order?.OrderItems || [];
  const itemSubtotal = items.reduce((sum, item) => sum + Number(item.UnitPrice || 0) * Number(item.Quantity || 0), 0);
  const discount = Number(order?.DiscountAmount || 0);
  const shipping = Math.max(0, Number(order?.TotalAmount || 0) - itemSubtotal + discount);

  const isPaid = order?.Payments?.[0]?.Status === "PAID";
  const orderStatus = (order?.Status || "").toLowerCase();
  const isCod = order?.PaymentMethod?.trim().toUpperCase() === "COD";
  const canSimpleCancel = !isPaid && (orderStatus === "pending" || (isCod && ["confirmed", "processing", "preparing", "ready"].includes(orderStatus)));
  const canRefundCancel = isPaid && !["shipping", "shipped", "delivering", "delivered", "completed", "cancelled", "canceled", "refundpending", "pending refund"].includes(orderStatus);
  const isRefundPending = ["refundpending", "pending refund"].includes(orderStatus) || order?.RefundStatus === "pending";
  const isDelivered = ["completed", "complete", "delivered", "đã giao", "giao thành công", "đã giao thành công"].includes(orderStatus);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <button
          type="button"
          onClick={() => {
            if (typeof window !== "undefined") {
              try {
                sessionStorage.setItem("is_pop_nav", "1");
              } catch {}
            }
            if (isPaymentCancelled) {
              router.push("/checkout");
            } else if (typeof window !== "undefined" && window.history.length > 1) {
              router.back();
            } else {
              router.push("/checkout");
            }
          }}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-xs transition hover:border-slate-300 hover:bg-slate-50 hover:text-blue-600 cursor-pointer"
        >
          <svg className="h-4 w-4 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          <span>Quay lại</span>
        </button>
        {loading && <p className="mt-8 rounded-2xl bg-white p-8 text-center text-slate-500">Đang tải chi tiết đơn hàng...</p>}
        {!loading && error && <p role="alert" className="mt-6 rounded-xl bg-amber-100 p-4 text-amber-800">{error}</p>}

        {!loading && order && (
          <>
            {isCodSuccess && (
              <div className="mt-4 rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-emerald-900 flex items-start gap-3 shadow-xs">
                <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                  ✓
                </div>
                <div>
                  <p className="font-bold text-base">Đặt hàng thành công!</p>
                  <p className="text-xs text-emerald-800 mt-0.5 leading-relaxed">
                    Đơn hàng của bạn đã được ghi nhận với phương thức <strong>Thanh toán khi nhận hàng (COD)</strong>. Đơn hàng hiện đang ở trạng thái <strong>Chờ thanh toán</strong> khi nhận hàng.
                  </p>
                </div>
              </div>
            )}

            {isPaymentCancelled && (
              <div className="mt-4 rounded-2xl bg-amber-50 border border-amber-200 p-4 text-amber-900 flex items-start gap-3 shadow-xs animate-in fade-in duration-200">
                <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-sm shrink-0">
                  !
                </div>
                <div className="flex-1">
                  <p className="font-bold text-base">Bạn đã hủy giao dịch quét mã QR PayOS</p>
                  <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
                    Giao dịch thanh toán chưa được hoàn tất. Đơn hàng vẫn được lưu lại để bạn có thể thanh toán lại bất cứ lúc nào, hoặc bạn có thể quay lại giỏ hàng để chỉnh sửa sản phẩm.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2.5">
                    <button
                      type="button"
                      onClick={retryPayment}
                      disabled={paymentBusy}
                      className="rounded-xl bg-blue-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-blue-700 transition cursor-pointer shadow-xs disabled:opacity-50"
                    >
                      {paymentBusy ? "Đang mở PayOS..." : "Mở lại trang thanh toán QR"}
                    </button>
                    <Link
                      href="/checkout"
                      className="rounded-xl border border-blue-600 bg-white px-3.5 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-50 transition inline-block"
                    >
                      Quay lại trang thanh toán
                    </Link>
                    <Link
                      href="/customer/cart"
                      className="rounded-xl border border-amber-300 bg-white px-3.5 py-1.5 text-xs font-bold text-amber-900 hover:bg-amber-100 transition inline-block"
                    >
                      Quay lại giỏ hàng
                    </Link>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-5 flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-bold uppercase tracking-wide text-blue-700">Thông tin đơn hàng</p>
                <h1 className="mt-1 text-3xl font-black">Đơn hàng #{order.OrderID}</h1>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-blue-100 px-4 py-2 text-sm font-bold text-blue-800">
                  {isRefundPending
                    ? "Chờ hoàn tiền"
                    : order.PaymentMethod === "COD" && !["cancelled", "canceled", "delivered", "completed"].includes((order.Status || "").toLowerCase())
                    ? "Chờ thanh toán (COD)"
                    : order.PaymentMethod === "PayOS" && order.Payments?.[0]?.Status !== "PAID" && !["cancelled", "canceled"].includes((order.Status || "").toLowerCase())
                    ? "Chờ thanh toán"
                    : statusLabel(order.Status)}
                </span>

                {/* Nút hủy đơn thường (chưa thanh toán) */}
                {canSimpleCancel && (
                  <button
                    type="button"
                    onClick={cancelOrder}
                    disabled={cancelBusy}
                    className="rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-bold text-red-700 hover:bg-red-50 disabled:opacity-60 transition"
                  >
                    {cancelBusy ? "Đang hủy..." : "Hủy đơn hàng"}
                  </button>
                )}

                {/* Nút yêu cầu hủy & hoàn tiền (đã chuyển khoản) */}
                {canRefundCancel && (
                  <button
                    type="button"
                    onClick={() => {
                      setRefundError("");
                      setRefundModalOpen(true);
                    }}
                    className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-bold text-white hover:bg-rose-500 shadow-sm transition"
                  >
                    Yêu cầu hủy & hoàn tiền
                  </button>
                )}

                {/* Đánh giá theo từng sản phẩm đã giao */}
                {isDelivered && (
                  <div className="flex flex-wrap gap-2">
                    {items.map((item) => <Link key={item.OrderItemID || item.ProductID} href={`/customer/products/${item.ProductID}?action=review&orderId=${order.OrderID}#reviews`} className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 text-sm font-bold text-white hover:bg-amber-600 shadow-sm transition">★ Đánh giá {item.Product?.ProductName || "sản phẩm"}</Link>)}
                  </div>
                )}
              </div>
            </div>

            {cancelError && <p role="alert" className="mt-3 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">{cancelError}</p>}

            {/* Banner trạng thái hoàn tiền */}
            {isRefundPending && (
              <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-xs">
                <div className="flex items-start gap-3">
                  <div className="rounded-xl bg-amber-500 p-2 text-white shrink-0">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="text-sm">
                    <p className="font-bold text-amber-950">Yêu cầu hoàn tiền đang chờ Admin phê duyệt</p>
                    <p className="mt-1 text-xs text-amber-800 leading-relaxed">
                      Bạn đã gửi yêu cầu hoàn tiền cho đơn hàng này. Shop sẽ kiểm tra và thực hiện chuyển khoản vào số tài khoản <strong>{order.RefundBankAccount}</strong> ({order.RefundBankName} - {order.RefundBankHolder}) sớm nhất.
                    </p>
                    <p className="mt-1.5 text-[11px] text-amber-700 italic">
                      Số lượng sản phẩm trong kho sẽ tự động hoàn lại sau 3 phút để những người mua khác có thể đặt mua.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {order.RefundStatus === "approved" && (
              <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900 flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shrink-0">✓</div>
                <div>
                  <p className="font-bold text-sm">Đã hoàn tiền thành công</p>
                  <p className="text-xs text-emerald-800 mt-0.5">Admin đã phê duyệt yêu cầu hoàn tiền và hoàn tất chuyển trả vào tài khoản {order.RefundBankName} ({order.RefundBankAccount}).</p>
                </div>
              </div>
            )}

            {order.RefundStatus === "rejected" && (
              <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-900 flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-rose-600 text-white flex items-center justify-center font-bold text-sm shrink-0">✕</div>
                <div>
                  <p className="font-bold text-sm">Yêu cầu hoàn tiền bị từ chối</p>
                  <p className="text-xs text-rose-800 mt-0.5">Yêu cầu hoàn tiền không được chấp thuận. Đơn hàng vẫn được xử lý bình thường.</p>
                </div>
              </div>
            )}

            <section className="mt-6 grid gap-5 md:grid-cols-2">
              <div className="rounded-2xl bg-white p-5 shadow-sm">
                <h2 className="font-black">Thông tin giao hàng</h2>
                <dl className="mt-4 space-y-3 text-sm">
                  <div><dt className="text-slate-500">Người nhận</dt><dd className="mt-1 font-semibold">{order.RecipientName || "Chưa cập nhật"}</dd></div>
                  <div><dt className="text-slate-500">Số điện thoại</dt><dd className="mt-1 font-semibold">{order.RecipientPhone || "Chưa cập nhật"}</dd></div>
                  <div><dt className="text-slate-500">Địa chỉ</dt><dd className="mt-1 font-semibold">{order.ShippingAddress || "Chưa cập nhật"}</dd></div>
                  <div><dt className="text-slate-500">Ghi chú</dt><dd className="mt-1 font-semibold">{order.Note || "Không có"}</dd></div>
                  {(order.CarrierName || order.TrackingNumber || order.EstimatedDelivery) && <div className="border-t border-slate-100 pt-3"><dt className="font-bold text-blue-800">Theo dõi giao hàng</dt>{order.CarrierName && <dd className="mt-1">Đơn vị vận chuyển: {order.CarrierName}</dd>}{order.TrackingNumber && <dd className="mt-1">Mã vận đơn: <span className="font-bold">{order.TrackingNumber}</span></dd>}{order.EstimatedDelivery && <dd className="mt-1">Dự kiến giao: {new Date(`${order.EstimatedDelivery}T00:00:00`).toLocaleDateString('vi-VN')}</dd>}</div>}
                </dl>
              </div>
              <div className="rounded-2xl bg-white p-5 shadow-sm">
                <h2 className="font-black">Thanh toán</h2>
                <dl className="mt-4 space-y-3 text-sm">
                  <div className="flex justify-between gap-4"><dt className="text-slate-500">Ngày đặt</dt><dd className="text-right font-semibold">{order.OrderDate && !Number.isNaN(Date.parse(order.OrderDate)) ? new Date(order.OrderDate).toLocaleString("vi-VN") : "Chưa cập nhật"}</dd></div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-500">Phương thức</dt>
                    <dd className="text-right font-semibold">
                      {order.PaymentMethod === "COD" ? "Thanh toán khi nhận hàng (COD)" : order.PaymentMethod === "PayOS" ? "PayOS · Chuyển khoản QR" : order.PaymentMethod || "Chưa cập nhật"}
                    </dd>
                  </div>
                  {order.PaymentMethod === "COD" && (
                    <div className="flex justify-between gap-4">
                      <dt className="text-slate-500">Thanh toán</dt>
                      <dd className={`text-right font-bold ${["delivered", "completed"].includes((order.Status || "").toLowerCase()) ? "text-emerald-700" : "text-amber-700"}`}>
                        {["delivered", "completed"].includes((order.Status || "").toLowerCase()) ? "Đã thanh toán khi nhận hàng" : "Chờ thanh toán khi nhận hàng"}
                      </dd>
                    </div>
                  )}
                  {order.PaymentMethod === "PayOS" && <div className="flex justify-between gap-4"><dt className="text-slate-500">Thanh toán</dt><dd className={`text-right font-bold ${order.Payments?.[0]?.Status === "PAID" ? "text-emerald-700" : ["FAILED", "EXPIRED", "CANCELLED"].includes(order.Payments?.[0]?.Status?.toUpperCase() || "") ? "text-red-700" : "text-amber-700"}`}>{order.Payments?.[0]?.Status === "PAID" ? "Đã thanh toán" : ["FAILED", "EXPIRED", "CANCELLED"].includes(order.Payments?.[0]?.Status?.toUpperCase() || "") ? "Thanh toán chưa hoàn tất" : "Đang chờ thanh toán"}</dd></div>}
                  <div className="flex justify-between gap-4"><dt className="text-slate-500">Tạm tính</dt><dd className="text-right font-semibold">{currency(itemSubtotal)}</dd></div>
                  <div className="flex justify-between gap-4"><dt className="text-slate-500">Phí giao hàng</dt><dd className="text-right font-semibold">{currency(shipping)}</dd></div>
                  {discount > 0 && <div className="flex justify-between gap-4"><dt className="text-slate-500">Voucher{order.VoucherCode ? ` (${order.VoucherCode})` : ""}</dt><dd className="text-right font-semibold text-emerald-700">−{currency(discount)}</dd></div>}
                  <div className="flex justify-between gap-4 border-t border-slate-100 pt-3 text-base"><dt className="font-black">Tổng cộng</dt><dd className="text-right font-black text-blue-800">{currency(order.TotalAmount)}</dd></div>
                </dl>
              </div>
            </section>

            {order.PaymentMethod === "COD" && !["cancelled", "canceled"].includes((order.Status || "").toLowerCase()) && (
              <section className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-5">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-emerald-600 text-white shrink-0">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-bold text-emerald-950">Đơn hàng thanh toán khi nhận hàng (COD)</p>
                    <p className="mt-1 text-sm text-emerald-900 leading-relaxed">
                      Đơn hàng đang ở trạng thái <strong>Chờ thanh toán</strong>. Cửa hàng sẽ xác nhận và tiến hành giao hàng. Quý khách vui lòng chuẩn bị số tiền <strong>{currency(order.TotalAmount)}</strong> để thanh toán tiền mặt cho nhân viên giao hàng khi nhận sản phẩm.
                    </p>
                  </div>
                </div>
              </section>
            )}

            {order.PaymentMethod === "PayOS" && order.Payments?.[0]?.Status !== "PAID" && !["cancelled", "canceled"].includes((order.Status || "").toLowerCase()) && (
              <section className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-5">
                <p className="font-bold text-amber-900">{["FAILED", "EXPIRED", "CANCELLED"].includes(order.Payments?.[0]?.Status?.toUpperCase() || "") ? "Lần thanh toán trước chưa hoàn tất" : "Đơn hàng đang chờ thanh toán PayOS"}</p>
                <p className="mt-1 text-sm text-amber-800">{["FAILED", "EXPIRED", "CANCELLED"].includes(order.Payments?.[0]?.Status?.toUpperCase() || "") ? "Bạn có thể tạo liên kết thanh toán mới. Tồn kho vẫn được giữ cho đến khi đơn bị hủy." : "Nếu bạn vừa thanh toán, trạng thái sẽ tự cập nhật sau khi PayOS xác nhận."}</p>
                {paymentError && <p role="alert" className="mt-3 text-sm font-semibold text-red-700">{paymentError}</p>}
                <button type="button" onClick={retryPayment} disabled={paymentBusy} className="mt-4 rounded-xl bg-blue-700 px-5 py-3 font-bold text-white disabled:opacity-60">{paymentBusy ? "Đang mở PayOS..." : "Mở lại trang thanh toán"}</button>
              </section>
            )}

            <section className="mt-5 rounded-2xl bg-white p-5 shadow-sm">
              <h2 className="font-black">Sản phẩm đã đặt ({items.length})</h2>
              {items.length === 0 ? <p className="mt-4 text-sm text-slate-500">Đơn hàng chưa có chi tiết sản phẩm.</p> : (
                <ul className="mt-3 divide-y divide-slate-100">
                  {items.map((item) => {
                    const product = item.Product;
                    const name = product?.ProductName || `Sản phẩm #${item.ProductID}`;
                    return (
                      <li key={item.OrderItemID || `${order.OrderID}-${item.ProductID}`} className="flex items-center gap-4 py-4 first:pt-0 last:pb-0">
                        <img src={getPrimaryProductImage(product?.ImageUrl) || "/placeholder.png"} alt={name} className="h-16 w-16 rounded-xl bg-slate-50 object-contain p-1" />
                        <div className="min-w-0 flex-1">
                          <Link href={`/customer/products/${item.ProductID}`} className="font-bold hover:text-blue-700">{name}</Link>
                          <p className="mt-1 text-sm text-slate-500">Số lượng: {item.Quantity}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-slate-500">{currency(item.UnitPrice)} × {item.Quantity}</p>
                          <p className="mt-1 font-black text-blue-800">{currency(Number(item.UnitPrice) * Number(item.Quantity))}</p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </>
        )}
      </div>

      {/* POPUP YÊU CẦU HOÀN TIỀN */}
      {refundModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-black text-slate-900">Yêu cầu hoàn tiền đơn hàng #{orderId}</h3>
                <p className="text-xs text-slate-500 mt-0.5">Số tiền hoàn lại: <span className="font-bold text-rose-600">{currency(order?.TotalAmount)}</span></p>
              </div>
              <button
                type="button"
                onClick={() => setRefundModalOpen(false)}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            {refundError && (
              <div className="rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-700">
                {refundError}
              </div>
            )}

            <form onSubmit={handleRefundSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Số điện thoại liên hệ *</label>
                <input
                  type="tel"
                  required
                  value={refundPhone}
                  onChange={(e) => setRefundPhone(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-blue-600"
                  placeholder="Nhập số điện thoại"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tên ngân hàng *</label>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <select
                    value={refundBankName}
                    onChange={(e) => setRefundBankName(e.target.value)}
                    className="col-span-2 rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm bg-white outline-none focus:border-blue-600"
                  >
                    {COMMON_BANKS.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                    <option value="Khác">Ngân hàng khác (tự nhập)</option>
                  </select>
                </div>
                {refundBankName === "Khác" && (
                  <input
                    type="text"
                    required
                    onChange={(e) => setRefundBankName(e.target.value)}
                    placeholder="Nhập tên ngân hàng của bạn..."
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm outline-none focus:border-blue-600"
                  />
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Số tài khoản nhận tiền *</label>
                <input
                  type="text"
                  required
                  value={refundBankAccount}
                  onChange={(e) => setRefundBankAccount(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-semibold tracking-wider outline-none focus:border-blue-600"
                  placeholder="Nhập số tài khoản ngân hàng"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tên chủ tài khoản (viết hoa không dấu) *</label>
                <input
                  type="text"
                  required
                  value={refundBankHolder}
                  onChange={(e) => setRefundBankHolder(e.target.value.toUpperCase())}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-semibold uppercase outline-none focus:border-blue-600"
                  placeholder="NGUYEN VAN A"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Lý do hủy đơn *</label>
                <textarea
                  rows={2}
                  required
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm outline-none focus:border-blue-600"
                  placeholder="Ví dụ: Đổi ý không mua nữa, đặt nhầm sản phẩm..."
                />
              </div>

              <div className="rounded-xl bg-amber-50 p-3 text-[11px] text-amber-800 leading-relaxed border border-amber-200/60">
                📌 Sau khi bạn gửi yêu cầu, đơn hàng sẽ chuyển trạng thái <strong>Chờ hoàn tiền</strong>. Số lượng tồn kho sẽ được hoàn lại sau 3 phút. Shop sẽ tiến hành chuyển tiền hoàn theo thông tin tài khoản trên và cập nhật trạng thái đơn sang <strong>Đã hủy</strong>.
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setRefundModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  disabled={refundSubmitting}
                  className="rounded-xl bg-rose-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-rose-500 disabled:opacity-60 transition"
                >
                  {refundSubmitting ? "Đang gửi..." : "Gửi yêu cầu hoàn tiền"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </main>
  );
}
