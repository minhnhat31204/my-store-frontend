"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
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

function currency(value: number | string | null | undefined) {
  return `${Number(value || 0).toLocaleString("vi-VN")} ₫`;
}

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const orderId = Number(id);
  const [order, setOrder] = useState<StoreOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
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
    api.getOrdersByUser(user.UserID)
      .then((items) => {
        const found = items.find((item) => item.OrderID === orderId);
        if (!found) setError("Không tìm thấy đơn hàng này trong tài khoản của bạn.");
        setOrder(found || null);
      })
      .catch(() => setError("Không thể tải chi tiết đơn hàng."))
      .finally(() => setLoading(false));
  }, [orderId]);

  const items = order?.OrderItems || [];
  const itemSubtotal = items.reduce((sum, item) => sum + Number(item.UnitPrice || 0) * Number(item.Quantity || 0), 0);
  const discount = Number(order?.DiscountAmount || 0);
  const shipping = Math.max(0, Number(order?.TotalAmount || 0) - itemSubtotal + discount);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <Link href="/customer/orders" className="text-sm font-semibold text-blue-700 hover:underline">← Lịch sử đơn hàng</Link>
        {loading && <p className="mt-8 rounded-2xl bg-white p-8 text-center text-slate-500">Đang tải chi tiết đơn hàng...</p>}
        {!loading && error && <p role="alert" className="mt-6 rounded-xl bg-amber-100 p-4 text-amber-800">{error}</p>}

        {!loading && order && (
          <>
            <div className="mt-5 flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-bold uppercase tracking-wide text-blue-700">Thông tin đơn hàng</p>
                <h1 className="mt-1 text-3xl font-black">Đơn hàng #{order.OrderID}</h1>
              </div>
              <span className="rounded-full bg-blue-100 px-4 py-2 text-sm font-bold text-blue-800">{statusLabel(order.Status)}</span>
            </div>

            <section className="mt-6 grid gap-5 md:grid-cols-2">
              <div className="rounded-2xl bg-white p-5 shadow-sm">
                <h2 className="font-black">Thông tin giao hàng</h2>
                <dl className="mt-4 space-y-3 text-sm">
                  <div><dt className="text-slate-500">Người nhận</dt><dd className="mt-1 font-semibold">{order.RecipientName || "Chưa cập nhật"}</dd></div>
                  <div><dt className="text-slate-500">Số điện thoại</dt><dd className="mt-1 font-semibold">{order.RecipientPhone || "Chưa cập nhật"}</dd></div>
                  <div><dt className="text-slate-500">Địa chỉ</dt><dd className="mt-1 font-semibold">{order.ShippingAddress || "Chưa cập nhật"}</dd></div>
                  <div><dt className="text-slate-500">Ghi chú</dt><dd className="mt-1 font-semibold">{order.Note || "Không có"}</dd></div>
                </dl>
              </div>
              <div className="rounded-2xl bg-white p-5 shadow-sm">
                <h2 className="font-black">Thanh toán</h2>
                <dl className="mt-4 space-y-3 text-sm">
                  <div className="flex justify-between gap-4"><dt className="text-slate-500">Ngày đặt</dt><dd className="text-right font-semibold">{order.OrderDate && !Number.isNaN(Date.parse(order.OrderDate)) ? new Date(order.OrderDate).toLocaleString("vi-VN") : "Chưa cập nhật"}</dd></div>
                  <div className="flex justify-between gap-4"><dt className="text-slate-500">Phương thức</dt><dd className="text-right font-semibold">{order.PaymentMethod || "Chưa cập nhật"}</dd></div>
                  <div className="flex justify-between gap-4"><dt className="text-slate-500">Tạm tính</dt><dd className="text-right font-semibold">{currency(itemSubtotal)}</dd></div>
                  <div className="flex justify-between gap-4"><dt className="text-slate-500">Phí giao hàng</dt><dd className="text-right font-semibold">{currency(shipping)}</dd></div>
                  {discount > 0 && <div className="flex justify-between gap-4"><dt className="text-slate-500">Giảm giá</dt><dd className="text-right font-semibold text-emerald-700">−{currency(discount)}</dd></div>}
                  <div className="flex justify-between gap-4 border-t border-slate-100 pt-3 text-base"><dt className="font-black">Tổng cộng</dt><dd className="text-right font-black text-blue-800">{currency(order.TotalAmount)}</dd></div>
                </dl>
              </div>
            </section>

            <section className="mt-5 rounded-2xl bg-white p-5 shadow-sm">
              <h2 className="font-black">Sản phẩm đã đặt ({items.length})</h2>
              {items.length === 0 ? <p className="mt-4 text-sm text-slate-500">Đơn hàng chưa có chi tiết sản phẩm.</p> : (
                <ul className="mt-3 divide-y divide-slate-100">
                  {items.map((item) => {
                    const product = item.Product;
                    const name = product?.ProductName || `Sản phẩm #${item.ProductID}`;
                    return (
                      <li key={item.OrderItemID || `${order.OrderID}-${item.ProductID}`} className="flex items-center gap-4 py-4 first:pt-0 last:pb-0">
                        <img src={product?.ImageUrl || "/placeholder.png"} alt={name} className="h-16 w-16 rounded-xl bg-slate-50 object-contain p-1" />
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
    </main>
  );
}
