"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api, getStoredUser, type StoreOrder } from "@/lib/api";

type OrderBucket = "all" | "payment" | "pending" | "processing" | "shipping" | "delivered" | "cancelled";

const ORDER_TABS: { id: OrderBucket; label: string }[] = [
  { id: "all", label: "Tất cả" },
  { id: "payment", label: "Chờ thanh toán" },
  { id: "pending", label: "Chờ xác nhận" },
  { id: "processing", label: "Đang xử lý" },
  { id: "shipping", label: "Đang giao" },
  { id: "delivered", label: "Đã giao" },
  { id: "cancelled", label: "Đã hủy" },
];

function orderBucket(order: StoreOrder): Exclude<OrderBucket, "all"> {
  const value = (order.Status || "Pending").trim().toLowerCase();
  if (["cancelled", "canceled"].includes(value)) return "cancelled";
  const paymentStatus = order.Payments?.[0]?.Status?.toUpperCase();
  if (order.PaymentMethod === "PayOS" && paymentStatus !== "PAID") return "payment";

  if (["shipping", "shipped", "delivering", "on delivery"].includes(value)) return "shipping";
  if (["completed", "delivered"].includes(value)) return "delivered";
  if (["cancelled", "canceled"].includes(value)) return "cancelled";
  if (["confirmed", "processing", "preparing", "ready"].includes(value)) return "processing";
  return "pending";
}

function statusLabel(status?: string | null) {
  const value = (status || "Pending").toLowerCase();
  if (value === "pending") return "Chờ xác nhận";
  if (["confirmed", "processing", "preparing", "ready"].includes(value)) return "Đang xử lý";
  if (["shipping", "shipped", "delivering", "on delivery"].includes(value)) return "Đang giao";
  if (["completed", "delivered"].includes(value)) return "Đã giao";
  if (["cancelled", "canceled"].includes(value)) return "Đã hủy";
  return status || "Chờ xác nhận";
}

function paymentLabel(order: StoreOrder) {
  const status = order.Payments?.[0]?.Status?.toUpperCase();
  if (status === "FAILED") return "Thanh toán lỗi · cần thử lại";
  return "Chờ thanh toán";
}

function statusStyle(bucket: OrderBucket) {
  if (bucket === "payment") return "bg-amber-100 text-amber-800";
  if (bucket === "pending") return "bg-slate-100 text-slate-700";
  if (bucket === "processing") return "bg-blue-100 text-blue-800";
  if (bucket === "shipping") return "bg-violet-100 text-violet-800";
  if (bucket === "delivered") return "bg-emerald-100 text-emerald-800";
  if (bucket === "cancelled") return "bg-red-100 text-red-700";
  return "bg-blue-50 text-blue-700";
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<StoreOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [activeBucket, setActiveBucket] = useState<OrderBucket>("all");

  useEffect(() => {
    const user = getStoredUser();
    if (!user) {
      setMessage("Vui lòng đăng nhập để xem đơn hàng.");
      setLoading(false);
      return;
    }
    api.getOrdersByUser(user.UserID)
      .then(setOrders)
      .catch(() => setMessage("Không thể tải lịch sử đơn hàng."))
      .finally(() => setLoading(false));
  }, []);

  const counts = ORDER_TABS.reduce((result, tab) => {
    result[tab.id] = tab.id === "all" ? orders.length : orders.filter((order) => orderBucket(order) === tab.id).length;
    return result;
  }, {} as Record<OrderBucket, number>);
  const visibleOrders = activeBucket === "all" ? orders : orders.filter((order) => orderBucket(order) === activeBucket);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <p className="text-sm font-bold uppercase tracking-wide text-blue-700">Tài khoản của bạn</p>
        <h1 className="mt-1 text-3xl font-black">Lịch sử đơn hàng</h1>
        <p className="mt-2 text-sm text-slate-600">Chọn trạng thái để theo dõi nhanh từng nhóm đơn hàng.</p>

        {message && <p role="alert" className="mt-6 rounded-xl bg-amber-100 p-4 text-amber-800">{message}</p>}
        {loading && <p className="mt-8 rounded-2xl bg-white p-8 text-center text-slate-500">Đang tải đơn hàng...</p>}
        {!loading && !message && orders.length === 0 && (
          <div className="mt-8 rounded-2xl bg-white p-8 text-center shadow-sm">
            <p className="text-slate-600">Bạn chưa có đơn hàng nào.</p>
            <Link href="/customer/products" className="mt-4 inline-flex rounded-xl bg-blue-700 px-5 py-3 font-bold text-white">Mua sắm ngay</Link>
          </div>
        )}

        {!loading && !message && orders.length > 0 && <>
          <div role="group" aria-label="Lọc đơn hàng theo trạng thái" className="mt-6 flex gap-2 overflow-x-auto pb-2">
            {ORDER_TABS.map((tab) => <button
              key={tab.id}
              type="button"
              aria-pressed={activeBucket === tab.id}
              onClick={() => setActiveBucket(tab.id)}
              className={`flex shrink-0 items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-bold transition ${activeBucket === tab.id ? "border-blue-700 bg-blue-700 text-white shadow-sm" : "border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:text-blue-700"}`}
            >
              {tab.label}<span className={`rounded-full px-2 py-0.5 text-xs ${activeBucket === tab.id ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"}`}>{counts[tab.id]}</span>
            </button>)}
          </div>

          {visibleOrders.length === 0 ? <div className="mt-3 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">Chưa có đơn hàng ở mục “{ORDER_TABS.find((tab) => tab.id === activeBucket)?.label}”.</div> : <div className="mt-3 space-y-4">
          {visibleOrders.map((order) => {
            const bucket = orderBucket(order);
            const label = bucket === "payment" ? paymentLabel(order) : statusLabel(order.Status);
            return (
            <Link key={order.OrderID} href={`/customer/orders/${order.OrderID}`} className="block rounded-2xl bg-white p-5 shadow-sm transition hover:shadow-md">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-black">Đơn hàng #{order.OrderID}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    {order.OrderDate && !Number.isNaN(Date.parse(order.OrderDate))
                      ? new Date(order.OrderDate).toLocaleString("vi-VN")
                      : "Ngày đặt chưa cập nhật"}
                  </p>
                </div>
                <span className={`rounded-full px-3 py-1 text-sm font-bold ${statusStyle(bucket)}`}>{label}</span>
              </div>
              <p className="mt-4 line-clamp-2 text-sm text-slate-600">
                {order.OrderItems?.length
                  ? order.OrderItems.map((item) => `${item.Product?.ProductName || `Sản phẩm #${item.ProductID}`} × ${item.Quantity}`).join(" · ")
                  : "Chưa có thông tin sản phẩm"}
              </p>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-4">
                <span className="text-sm font-semibold text-slate-500">{order.PaymentMethod || "Chưa có phương thức thanh toán"}</span>
                <span className="font-black text-blue-800">{Number(order.TotalAmount || 0).toLocaleString("vi-VN")} ₫</span>
              </div>
            </Link>
          );})}
          </div>}
        </>}
      </div>
    </main>
  );
}
