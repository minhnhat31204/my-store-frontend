'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';

export default function AdminOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    api.getOrders()
      .then((data) => setOrders(Array.isArray(data) ? data : []))
      .catch((e) => setError(e instanceof Error ? e.message : 'Không tải được danh sách đơn hàng'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="min-h-screen bg-slate-50 p-6 text-slate-800">
      <div className="mx-auto max-w-6xl">
        {/* Tiêu đề & Nút điều hướng */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
          <div className="flex items-center gap-4">
            <Link
              href="/admin"
              className="rounded-lg bg-slate-200 px-4 py-2 text-sm font-semibold hover:bg-slate-300 transition"
            >
              ← Dashboard
            </Link>
            <h1 className="text-2xl font-bold">Quản lý đơn hàng</h1>
          </div>
        </div>

        {error && <p className="mb-4 rounded-lg bg-red-100 p-3 text-red-700">{error}</p>}

        {loading ? (
          <p className="text-slate-500">Đang tải danh sách đơn hàng...</p>
        ) : orders.length === 0 ? (
          <p className="text-slate-500">Chưa có đơn hàng nào.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {orders.map((order) => (
              <div 
                key={order.OrderID} 
                className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200 hover:border-emerald-500 transition flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Mã đơn: #{order.OrderID}
                    </span>
                    <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-600 border border-amber-200">
                      {order.Status || 'Pending'}
                    </span>
                  </div>
                  <div className="pt-2">
                    <p className="text-sm text-slate-500">Tổng tiền thanh toán</p>
                    <p className="text-xl font-black text-emerald-600">
                      {Number(order.TotalAmount || 0).toLocaleString('vi-VN')} VNĐ
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}