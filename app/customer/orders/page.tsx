"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api, getStoredUser, type StoreOrder } from "@/lib/api";

function statusLabel(status?: string | null) {
  const value = (status || "Pending").toLowerCase();
  if (value === "pending") return "Chờ xác nhận";
  if (["shipping", "delivering"].includes(value)) return "Đang giao";
  if (["completed", "delivered"].includes(value)) return "Đã giao";
  if (["cancelled", "canceled"].includes(value)) return "Đã hủy";
  return status || "Chờ xác nhận";
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<StoreOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

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

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <p className="text-sm font-bold uppercase tracking-wide text-blue-700">Tài khoản của bạn</p>
        <h1 className="mt-1 text-3xl font-black">Lịch sử đơn hàng</h1>

        {message && <p role="alert" className="mt-6 rounded-xl bg-amber-100 p-4 text-amber-800">{message}</p>}
        {loading && <p className="mt-8 rounded-2xl bg-white p-8 text-center text-slate-500">Đang tải đơn hàng...</p>}
        {!loading && !message && orders.length === 0 && (
          <div className="mt-8 rounded-2xl bg-white p-8 text-center shadow-sm">
            <p className="text-slate-600">Bạn chưa có đơn hàng nào.</p>
            <Link href="/customer/products" className="mt-4 inline-flex rounded-xl bg-blue-700 px-5 py-3 font-bold text-white">Mua sắm ngay</Link>
          </div>
        )}

        <div className="mt-7 space-y-4">
          {orders.map((order) => (
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
                <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-bold text-blue-700">{statusLabel(order.Status)}</span>
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
          ))}
        </div>
      </div>
    </main>
  );
}
