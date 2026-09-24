"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { api, getStoredUser, type StoreOrder } from "@/lib/api";

type OrderNotice = { id: string; orderId: number; title: string; message: string; date?: string | null; read: boolean };

function orderState(order: StoreOrder) {
  const payment = order.Payments?.[0]?.Status?.toUpperCase();
  if (order.PaymentMethod === "PayOS" && payment === "PAID") return { key: "paid", title: "Đã nhận thanh toán", message: `Thanh toán cho đơn hàng #${order.OrderID} đã được xác nhận.` };
  if (order.PaymentMethod === "PayOS" && payment !== "PAID") return { key: "payment-pending", title: "Đơn hàng chờ thanh toán", message: `Hoàn tất thanh toán cho đơn hàng #${order.OrderID} để cửa hàng xử lý.` };
  const value = (order.Status || "Pending").toLowerCase();
  if (["shipping", "delivering"].includes(value)) return { key: value, title: "Đơn hàng đang giao", message: `Đơn hàng #${order.OrderID} đang trên đường giao đến bạn.` };
  if (["completed", "delivered"].includes(value)) return { key: value, title: "Đơn hàng đã giao", message: `Đơn hàng #${order.OrderID} đã được giao hoàn tất.` };
  if (["cancelled", "canceled"].includes(value)) return { key: value, title: "Đơn hàng đã hủy", message: `Đơn hàng #${order.OrderID} đã bị hủy.` };
  return { key: value, title: "Đơn hàng đang chờ xác nhận", message: `Cửa hàng đang tiếp nhận đơn hàng #${order.OrderID}.` };
}

export default function NotificationsPage() {
  const [notices, setNotices] = useState<OrderNotice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    const user = getStoredUser();
    if (!user) { setNotices([]); setError("Đăng nhập để xem thông báo đơn hàng."); setLoading(false); return; }
    setLoading(true);
    setError("");
    try {
      const [orders, readIds] = await Promise.all([
        api.getOrdersByUser(user.UserID),
        Promise.resolve(JSON.parse(localStorage.getItem(`manb-read-notifications-${user.UserID}`) || "[]") as string[]),
      ]);
      setNotices(orders.map((order) => {
        const state = orderState(order);
        const id = `${order.OrderID}:${state.key}`;
        return { id, orderId: order.OrderID, title: state.title, message: state.message, date: order.OrderDate, read: readIds.includes(id) };
      }));
    } catch (e) { setError(e instanceof Error ? e.message : "Không tải được thông báo."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => void refresh(), 30_000);
    return () => window.clearInterval(timer);
  }, [refresh]);

  function markRead(id: string, read: boolean) {
    const user = getStoredUser();
    if (!user) return;
    const key = `manb-read-notifications-${user.UserID}`;
    const ids = new Set<string>(JSON.parse(localStorage.getItem(key) || "[]"));
    if (read) ids.add(id); else ids.delete(id);
    localStorage.setItem(key, JSON.stringify([...ids]));
    setNotices((items) => items.map((item) => item.id === id ? { ...item, read } : item));
  }

  function markAllRead() { notices.filter((item) => !item.read).forEach((item) => markRead(item.id, true)); }
  const unreadCount = notices.filter((item) => !item.read).length;

  return <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900"><div className="mx-auto max-w-3xl">
    <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-sm font-bold uppercase tracking-wide text-blue-700">Tài khoản của bạn</p><h1 className="mt-1 text-3xl font-black">Thông báo</h1><p className="mt-2 text-sm text-slate-600">Cập nhật được tạo từ trạng thái đơn hàng mới nhất.</p></div><div className="flex gap-2"><button onClick={() => void refresh()} className="rounded-xl border bg-white px-4 py-2 font-semibold">Làm mới</button><button onClick={markAllRead} disabled={!unreadCount} className="rounded-xl bg-blue-700 px-4 py-2 font-bold text-white disabled:bg-slate-300">Đã đọc tất cả</button></div></div>
    {error && <div role="alert" className="mt-6 rounded-xl bg-amber-50 p-4 text-amber-900">{error}{!getStoredUser() && <Link href="/login" className="ml-2 font-bold text-blue-700">Đăng nhập →</Link>}</div>}
    {loading ? <p className="mt-6 rounded-2xl bg-white p-8 text-center text-slate-500">Đang tải thông báo…</p> : !error && notices.length === 0 ? <div className="mt-6 rounded-2xl bg-white p-8 text-center shadow-sm"><p className="font-bold">Chưa có thông báo đơn hàng</p><Link href="/customer/orders" className="mt-3 inline-block font-semibold text-blue-700">Xem đơn hàng →</Link></div> : <div className="mt-6 space-y-3">{notices.map((item) => <article key={item.id} className={`rounded-2xl border p-5 shadow-sm ${item.read ? "border-slate-200 bg-white" : "border-blue-200 bg-blue-50/70"}`}>
      <div className="flex items-start justify-between gap-3"><div className="flex gap-3"><span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${item.read ? "bg-slate-300" : "bg-blue-600"}`} /><div><h2 className="font-black">{item.title}</h2><p className="mt-1 text-sm text-slate-600">{item.message}</p><p className="mt-2 text-xs text-slate-500">{item.date ? new Date(item.date).toLocaleString("vi-VN") : ""}</p><Link href={`/customer/orders/${item.orderId}`} className="mt-3 inline-block text-sm font-bold text-blue-700">Xem đơn hàng #{item.orderId} →</Link></div></div><button onClick={() => markRead(item.id, !item.read)} className="shrink-0 text-xs font-bold text-slate-600">{item.read ? "Đánh dấu chưa đọc" : "Đánh dấu đã đọc"}</button></div>
    </article>)}</div>}
    {notices.length > 0 && <p className="mt-4 text-xs text-slate-500">Trạng thái tải từ backend khi mở trang hoặc bấm Làm mới; trạng thái đã đọc được lưu trên trình duyệt này.</p>}
  </div></main>;
}
