"use client";

import Link from "next/link";
import { useFavorites } from "@/app/components/FavoritesProvider";
import FavoriteButton from "@/app/components/FavoriteButton";

export default function FavoritesPage() {
  const { products, loading } = useFavorites();

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <p className="text-sm font-bold uppercase tracking-wide text-blue-700">Lưu lại để xem sau</p>
        <h1 className="mt-1 text-3xl font-black">Sản phẩm yêu thích</h1>
        {loading ? (
          <p className="mt-8 rounded-2xl bg-white p-8 text-center text-slate-500">Đang tải danh sách yêu thích...</p>
        ) : products.length === 0 ? (
          <div className="mt-8 rounded-2xl bg-white p-8 text-center shadow-sm">
            <p className="text-slate-600">Bạn chưa lưu sản phẩm yêu thích nào.</p>
            <Link href="/customer/products" className="mt-4 inline-flex rounded-xl bg-blue-700 px-5 py-3 font-bold text-white hover:bg-blue-800">Khám phá sản phẩm</Link>
          </div>
        ) : (
          <div className="product-grid mt-7">
            {products.map((product) => {
              const price = Number(product.DiscountPrice || product.Price);
              const oldPrice = Number(product.Price);
              return (
                <article key={product.ProductID} className="product-card flex flex-col">
                  <div className="product-image">
                    <Link href={`/customer/products/${product.ProductID}`} aria-label={`Xem chi tiết ${product.ProductName}`}>
                      <img src={product.ImageUrl || "/placeholder.png"} alt={product.ProductName} />
                    </Link>
                    <FavoriteButton product={product} />
                  </div>
                  <div className="product-info">
                    <p className="shop-label">MANB SHOP</p>
                    <h3><Link href={`/customer/products/${product.ProductID}`}>{product.ProductName}</Link></h3>
                    <div className="price-row mt-auto">
                      <strong>{price.toLocaleString("vi-VN")} ₫</strong>
                      {oldPrice > price && <del>{oldPrice.toLocaleString("vi-VN")} ₫</del>}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
