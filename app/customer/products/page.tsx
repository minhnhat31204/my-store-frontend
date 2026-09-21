"use client";

import { useEffect, useMemo, useState } from "react";
import { api, Product } from "@/lib/api";
import { addToCart } from "@/lib/cart";
import Link from "next/link";

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [keyword, setKeyword] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => { api.getProducts().then(setProducts).catch(console.error); }, []);
  const filtered = useMemo(() => products.filter((p) => p.ProductName.toLowerCase().includes(keyword.toLowerCase())), [products, keyword]);

  function add(product: Product) {
    addToCart({ ProductID: product.ProductID, ProductName: product.ProductName, Price: Number(product.Price), ImageUrl: product.ImageUrl });
    setMessage(`Đã thêm ${product.ProductName} vào giỏ hàng`);
    setTimeout(() => setMessage(""), 1800);
  }

  return <main className="min-h-screen bg-slate-50 px-6 py-10 text-slate-900"><div className="mx-auto max-w-7xl"><div className="mb-8 flex flex-wrap items-end justify-between gap-4"><div><Link href="/" className="font-bold text-emerald-600">← Trang chủ</Link><h1 className="mt-3 text-4xl font-black">Tất cả sản phẩm</h1></div><Link href="/customer/cart" className="rounded-full bg-slate-900 px-5 py-3 font-bold text-white">Giỏ hàng</Link></div><input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="Tìm kiếm sản phẩm..." className="mb-6 w-full rounded-2xl border bg-white px-5 py-4 outline-none focus:border-emerald-500" />{message && <div className="mb-4 rounded-xl bg-emerald-100 p-3 text-emerald-800">{message}</div>}<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{filtered.map((p) => <article key={p.ProductID} className="rounded-2xl border bg-white p-5 shadow-sm"><div className="flex h-52 items-center justify-center rounded-xl bg-slate-100 p-4"><img src={p.ImageUrl || "/placeholder.png"} alt={p.ProductName} className="max-h-full max-w-full object-contain" /></div><h2 className="mt-4 min-h-12 font-bold">{p.ProductName}</h2><p className="mt-2 text-xl font-black text-emerald-600">{Number(p.Price).toLocaleString("vi-VN")} ₫</p><button onClick={() => add(p)} className="mt-4 w-full rounded-xl bg-emerald-600 py-3 font-bold text-white hover:bg-emerald-700">Thêm vào giỏ</button></article>)}</div></div></main>;
}
