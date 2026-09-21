"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CartItem, getCart, saveCart } from "@/lib/cart";

export default function CartPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  useEffect(() => { setCart(getCart()); }, []);
  const total = cart.reduce((sum, item) => sum + Number(item.Price) * item.quantity, 0);

  function update(id: number, quantity: number) {
    const next = cart.map((item) => item.ProductID === id ? { ...item, quantity } : item).filter((item) => item.quantity > 0);
    setCart(next); saveCart(next);
  }

  return <main className="min-h-screen bg-slate-50 px-6 py-10 text-slate-900"><div className="mx-auto max-w-5xl"><Link href="/customer/products" className="font-bold text-emerald-600">← Tiếp tục mua hàng</Link><h1 className="mt-4 text-4xl font-black">Giỏ hàng</h1>{cart.length === 0 ? <div className="mt-8 rounded-2xl bg-white p-10 text-center shadow-sm"><p className="text-slate-500">Giỏ hàng đang trống.</p><Link href="/customer/products" className="mt-5 inline-block rounded-full bg-emerald-600 px-5 py-3 font-bold text-white">Xem sản phẩm</Link></div> : <div className="mt-8 grid gap-6 md:grid-cols-[1fr_320px]"> <div className="space-y-4">{cart.map((item) => <div key={item.ProductID} className="flex gap-4 rounded-2xl bg-white p-4 shadow-sm"><img src={item.ImageUrl || "/placeholder.png"} alt={item.ProductName} className="h-24 w-24 rounded-xl bg-slate-100 object-contain p-2" /><div className="flex-1"><h2 className="font-bold">{item.ProductName}</h2><p className="mt-1 font-black text-emerald-600">{Number(item.Price).toLocaleString("vi-VN")} ₫</p><div className="mt-3 flex items-center gap-3"><button onClick={() => update(item.ProductID, item.quantity - 1)} className="h-8 w-8 rounded-full border">−</button><span>{item.quantity}</span><button onClick={() => update(item.ProductID, item.quantity + 1)} className="h-8 w-8 rounded-full border">+</button></div></div></div>)}</div><aside className="h-fit rounded-2xl bg-white p-6 shadow-sm"><p className="text-slate-500">Tạm tính</p><p className="mt-2 text-3xl font-black text-emerald-600">{total.toLocaleString("vi-VN")} ₫</p><button className="mt-6 w-full rounded-xl bg-slate-900 py-3 font-bold text-white">Tiến hành thanh toán</button><p className="mt-3 text-xs text-slate-500">Nút thanh toán cần kết nối thêm API tạo đơn hàng.</p></aside></div>}</div></main>;
}
