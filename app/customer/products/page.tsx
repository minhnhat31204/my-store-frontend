'use client';
import { useEffect, useState } from 'react';
import { api, getStoredUser, Product } from '@/lib/api';

export default function CustomerProducts() {
  const [products, setProducts] = useState<Product[]>([]); const [loading, setLoading] = useState(true); const [message, setMessage] = useState('');
  useEffect(() => { api.getProducts().then(setProducts).catch(e => setMessage(e.message)).finally(() => setLoading(false)); }, []);
  async function add(item: Product) { const user = getStoredUser(); if (!user?.UserID) { setMessage('Vui lòng đăng nhập trước.'); return; } try { await api.addToCart({ UserID: user.UserID, ProductID: item.ProductID, Quantity: 1, Price: Number(item.DiscountPrice ?? item.Price) }); setMessage('Đã thêm vào giỏ hàng.'); } catch (e) { setMessage(e instanceof Error ? e.message : 'Không thể thêm vào giỏ'); } }
  return <main className="mx-auto max-w-6xl p-8 text-slate-800"><h1 className="mb-6 text-3xl font-bold">Sản phẩm nổi bật</h1>{message && <p className="mb-4 rounded bg-blue-100 p-3">{message}</p>}{loading ? <p>Đang tải...</p> : <div className="grid grid-cols-1 gap-6 md:grid-cols-3">{products.map(item => <div key={item.ProductID} className="rounded-xl border p-4 shadow-sm"><img src={item.ImageUrl || '/placeholder.png'} alt={item.ProductName} className="mb-3 h-48 w-full rounded-lg object-cover" /><h2 className="text-lg font-bold">{item.ProductName}</h2><p className="font-semibold text-red-600">{Number(item.DiscountPrice ?? item.Price).toLocaleString('vi-VN')} VNĐ</p><button onClick={() => void add(item)} className="mt-3 w-full rounded bg-blue-600 py-2 text-white">Thêm vào giỏ</button></div>)}</div>}</main>;
}
