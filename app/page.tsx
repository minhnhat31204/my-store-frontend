"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api, Product } from "@/lib/api";
import { addToCart } from "@/lib/cart";

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    api.getProducts()
      .then(setProducts)
      .catch((err) => setError(err instanceof Error ? err.message : "Không thể tải sản phẩm"))
      .finally(() => setLoading(false));
  }, []);

  function handleAdd(product: Product) {
    addToCart({ ProductID: product.ProductID, ProductName: product.ProductName, Price: Number(product.Price), ImageUrl: product.ImageUrl });
    setMessage("Đã thêm sản phẩm vào giỏ hàng");
    setTimeout(() => setMessage(""), 1800);
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-10 border-b bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-2xl font-black tracking-tight text-emerald-600">TechNest<span className="text-slate-900">.</span></Link>
          <nav className="flex items-center gap-5 text-sm font-semibold">
            <Link href="/customer/products" className="hover:text-emerald-600">Sản phẩm</Link>
            <Link href="/customer/cart" className="hover:text-emerald-600">Giỏ hàng</Link>
            <Link href="/login" className="rounded-full bg-slate-900 px-4 py-2 text-white hover:bg-emerald-600">Đăng nhập</Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-8 px-6 py-16 md:grid-cols-2 md:items-center">
        <div>
          <p className="mb-3 font-bold uppercase tracking-[0.25em] text-emerald-600">Computer Store</p>
          <h1 className="text-4xl font-black leading-tight md:text-6xl">Công nghệ tốt hơn, trải nghiệm tốt hơn.</h1>
          <p className="mt-5 max-w-xl text-lg text-slate-600">Khám phá laptop, PC và phụ kiện phù hợp cho học tập, công việc và giải trí.</p>
          <Link href="/customer/products" className="mt-8 inline-block rounded-full bg-emerald-600 px-6 py-3 font-bold text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700">Khám phá sản phẩm →</Link>
        </div>
        <div className="rounded-[2rem] bg-gradient-to-br from-emerald-500 to-slate-900 p-8 text-white shadow-xl">
          <p className="text-sm font-semibold uppercase tracking-widest text-emerald-100">Nâng cấp góc máy</p>
          <h2 className="mt-4 text-4xl font-black">Power your next move.</h2>
          <p className="mt-4 text-emerald-50">Thiết bị hiện đại cho mọi mục tiêu của bạn.</p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-16">
        <div className="mb-6 flex items-end justify-between"><div><p className="font-bold text-emerald-600">Gợi ý cho bạn</p><h2 className="text-3xl font-black">Sản phẩm nổi bật</h2></div><Link href="/customer/products" className="text-sm font-bold text-emerald-600">Xem tất cả →</Link></div>
        {message && <div className="mb-4 rounded-xl bg-emerald-100 px-4 py-3 text-emerald-800">{message}</div>}
        {loading && <p>Đang tải sản phẩm...</p>}
        {error && <p className="rounded-xl bg-red-100 p-4 text-red-700">{error}</p>}
        {!loading && !error && <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{products.slice(0, 6).map((product) => <ProductCard key={product.ProductID} product={product} onAdd={() => handleAdd(product)} />)}</div>}
      </section>
    </main>
  );
}

function ProductCard({ product, onAdd }: { product: Product; onAdd: () => void }) {
  return <article className="overflow-hidden rounded-2xl border bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"><div className="flex h-56 items-center justify-center bg-slate-100 p-5"><img src={product.ImageUrl || "/placeholder.png"} alt={product.ProductName} className="max-h-full max-w-full object-contain" /></div><div className="p-5"><p className="text-xs font-bold uppercase tracking-widest text-slate-400">Computer Store</p><h3 className="mt-2 min-h-12 font-bold">{product.ProductName}</h3><p className="mt-3 text-xl font-black text-emerald-600">{Number(product.Price).toLocaleString("vi-VN")} ₫</p><button onClick={onAdd} className="mt-4 w-full rounded-xl bg-slate-900 py-3 font-bold text-white hover:bg-emerald-600">Thêm vào giỏ</button></div></article>;
}
