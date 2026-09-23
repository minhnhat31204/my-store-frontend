"use client";
import { useEffect, useState } from "react";
import { getStoredUser, api } from "@/lib/api";

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [message, setMessage] = useState("");
  useEffect(() => {
    const user = getStoredUser();
    if (!user) { setMessage("Vui lòng đăng nhập để xem đơn hàng."); return; }
    api.getOrdersByUser(user.UserID).then(setOrders).catch(() => setMessage("Không thể tải lịch sử đơn hàng."));
  }, []);
  return <main className="min-h-screen bg-slate-50 text-slate-900"><div className="mx-auto max-w-4xl px-4 py-8 sm:px-6"><h1 className="text-4xl font-black">Lịch sử đơn hàng</h1>{message&&<p className="mt-6 rounded-xl bg-amber-100 p-4 text-amber-800">{message}</p>}<div className="mt-8 space-y-4">{orders.length===0&&!message&&<p className="text-slate-500">Chưa có đơn hàng.</p>}{orders.map(order=><div key={order.OrderID} className="rounded-2xl bg-white p-5 shadow-sm"><div className="flex flex-wrap justify-between gap-2"><p className="font-bold">Đơn hàng #{order.OrderID}</p><span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-700">{order.Status||"Đang xử lý"}</span></div><p className="mt-2 text-slate-600">Tổng tiền: {Number(order.TotalAmount||0).toLocaleString("vi-VN")} ₫</p></div>)}</div></div></main>;
}
