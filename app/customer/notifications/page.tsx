"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { api, getStoredUser, type OrderNotification } from "@/lib/api";

export default function NotificationsPage() {
  const [notices, setNotices] = useState<OrderNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    const user = getStoredUser();
    if (!user) { setNotices([]); setError("Đăng nhập để xem thông báo đơn hàng."); setLoading(false); return; }
    if (!hasLoaded) setLoading(true);
    setError("");
    try {
      const result = await api.getNotifications(user.UserID);
      setNotices(result.notifications);
      setHasLoaded(true);
      window.dispatchEvent(new Event("notifications-updated"));
    } catch (e) { setError(e instanceof Error ? e.message : "Không tải được thông báo."); }
    finally { setLoading(false); }
  }, [hasLoaded]);

  useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => void refresh(), 30_000);
    return () => window.clearInterval(timer);
  }, [refresh]);

  async function markRead(id: number, read: boolean) {
    const user = getStoredUser();
    if (!user) return;
    try {
      await api.setNotificationRead(user.UserID, id, read);
      setNotices((items) => items.map((item) => item.NotificationID === id ? { ...item, IsRead: read } : item));
      window.dispatchEvent(new Event("notifications-updated"));
    } catch (e) { setError(e instanceof Error ? e.message : "Không cập nhật được thông báo."); }
  }

  async function markAllRead() {
    const user = getStoredUser();
    if (!user) return;
    try {
      await api.markAllNotificationsRead(user.UserID);
      setNotices((items) => items.map((item) => ({ ...item, IsRead: true })));
      window.dispatchEvent(new Event("notifications-updated"));
    } catch (e) { setError(e instanceof Error ? e.message : "Không cập nhật được thông báo."); }
  }
  const unreadCount = notices.filter((item) => !item.IsRead).length;

  return <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900"><div className="mx-auto max-w-3xl">
    <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-sm font-bold uppercase tracking-wide text-blue-700">Tài khoản của bạn</p><h1 className="mt-1 text-3xl font-black">Thông báo</h1><p className="mt-2 text-sm text-slate-600">Cập nhật được tạo từ trạng thái đơn hàng mới nhất.</p></div><div className="flex gap-2"><button onClick={() => void refresh()} className="rounded-xl border bg-white px-4 py-2 font-semibold">Làm mới</button><button onClick={markAllRead} disabled={!unreadCount} className="rounded-xl bg-blue-700 px-4 py-2 font-bold text-white disabled:bg-slate-300">Đã đọc tất cả</button></div></div>
    {error && <div role="alert" className="mt-6 rounded-xl bg-amber-50 p-4 text-amber-900">{error}{!getStoredUser() && <Link href="/login" className="ml-2 font-bold text-blue-700">Đăng nhập →</Link>}</div>}
    {loading ? <p className="mt-6 rounded-2xl bg-white p-8 text-center text-slate-500">Đang tải thông báo…</p> : !error && notices.length === 0 ? <div className="mt-6 rounded-2xl bg-white p-8 text-center shadow-sm"><p className="font-bold">Chưa có thông báo đơn hàng</p><Link href="/customer/orders" className="mt-3 inline-block font-semibold text-blue-700">Xem đơn hàng →</Link></div> : <div className="mt-6 space-y-3">{notices.map((item) => <article key={item.NotificationID} className={`rounded-2xl border p-5 shadow-sm ${item.IsRead ? "border-slate-200 bg-white" : "border-blue-200 bg-blue-50/70"}`}>
      <div className="flex items-start justify-between gap-3"><div className="flex gap-3"><span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${item.IsRead ? "bg-slate-300" : "bg-blue-600"}`} /><div><h2 className="font-black">{item.Title}</h2><p className="mt-1 text-sm text-slate-600">{item.Message}</p><p className="mt-2 text-xs text-slate-500">{item.CreatedAt ? new Date(item.CreatedAt).toLocaleString("vi-VN") : ""}</p>{item.OrderID && <Link href={`/customer/orders/${item.OrderID}`} className="mt-3 inline-block text-sm font-bold text-blue-700">Xem đơn hàng #{item.OrderID} →</Link>}</div></div><button onClick={() => void markRead(item.NotificationID, !item.IsRead)} className="shrink-0 text-xs font-bold text-slate-600">{item.IsRead ? "Đánh dấu chưa đọc" : "Đánh dấu đã đọc"}</button></div>
    </article>)}</div>}
    {notices.length > 0 && <p className="mt-4 text-xs text-slate-500">Thông báo và trạng thái đã đọc được đồng bộ với tài khoản qua backend.</p>}
  </div></main>;
}
