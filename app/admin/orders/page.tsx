'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
export default function AdminOrders() { const [orders, setOrders] = useState<any[]>([]); const [error, setError] = useState(''); useEffect(() => { api.getOrders().then(setOrders).catch(e => setError(e.message)); }, []); return <main className="min-h-screen p-8 text-slate-800"><h1 className="mb-6 text-2xl font-bold">Quản lý đơn hàng</h1>{error && <p className="rounded bg-red-100 p-3">{error}</p>}<div className="space-y-3">{orders.map(order => <div key={order.OrderID} className="rounded border p-4"><p>Mã đơn: {order.OrderID}</p><p>Trạng thái: {order.Status}</p><p>Tổng tiền: {Number(order.TotalAmount || 0).toLocaleString('vi-VN')} VNĐ</p></div>)}</div></main>; }
