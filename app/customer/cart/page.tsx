'use client';
import { useEffect, useState } from 'react';
import { api, getStoredUser } from '@/lib/api';

export default function CartPage() {
  const [items, setItems] = useState<any[]>([]); const [error, setError] = useState('');
  async function load() { const user = getStoredUser(); if (!user?.UserID) { setError('Vui lòng đăng nhập để xem giỏ hàng.'); return; } try { setItems(await api.getCart(user.UserID)); } catch (e) { setError(e instanceof Error ? e.message : 'Không tải được giỏ hàng'); } }
  useEffect(() => { void load(); }, []);
  async function update(id: number, quantity: number) { if (quantity < 1) return; await api.updateCart(id, quantity); await load(); }
  async function remove(id: number) { await api.deleteCart(id); await load(); }
  return <main className="mx-auto max-w-4xl p-8 text-slate-800"><h1 className="mb-6 text-2xl font-bold">Giỏ hàng</h1>{error && <p className="rounded bg-red-100 p-3">{error}</p>}{items.map(item => <div key={item.ID} className="mb-3 flex items-center justify-between rounded border p-4"><div><p className="font-semibold">{item.ProductName}</p><p>{Number(item.Price || 0).toLocaleString('vi-VN')} VNĐ</p></div><div className="flex items-center gap-3"><button onClick={() => void update(item.ID, Number(item.Quantity) - 1)}>-</button><span>{item.Quantity}</span><button onClick={() => void update(item.ID, Number(item.Quantity) + 1)}>+</button><button onClick={() => void remove(item.ID)} className="text-red-600">Xóa</button></div></div>)}</main>;
}
