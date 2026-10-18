"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useFavorites } from "@/app/components/FavoritesProvider";
import FavoriteButton from "@/app/components/FavoriteButton";
import ScrollReveal from "@/app/components/ScrollReveal";
import { getPrimaryProductImage } from "@/lib/api";

export default function FavoritesPage() {
  const router = useRouter();
  const { products, loading } = useFavorites();

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <Link
          href="/customer/account"
          className="mb-5 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 hover:text-blue-600"
        >
          <svg className="h-4 w-4 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          <span>Quay lại</span>
        </Link>
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
            {products.map((product, idx) => {
              const price = Number(product.DiscountPrice || product.Price);
              const oldPrice = Number(product.Price);
              return (
                <ScrollReveal key={product.ProductID} index={idx}>
                  <article
                    onClick={(e) => {
                      const target = (e.target as HTMLElement)?.closest("button, .favorite-btn");
                      if (target) return;
                      try {
                        sessionStorage.setItem(`product_origin_${product.ProductID}`, "account");
                        sessionStorage.setItem(`product_return_url_${product.ProductID}`, "/customer/favorites");
                        sessionStorage.setItem("active_nav_origin", "account");
                      } catch {}
                      router.push(`/customer/products/${product.ProductID}`);
                    }}
                    className="product-card flex flex-col h-full cursor-pointer transition"
                  >
                    <div className="product-image">
                      <Link
                        href={`/customer/products/${product.ProductID}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          try {
                            sessionStorage.setItem(`product_origin_${product.ProductID}`, "account");
                            sessionStorage.setItem(`product_return_url_${product.ProductID}`, "/customer/favorites");
                            sessionStorage.setItem("active_nav_origin", "account");
                          } catch {}
                        }}
                        aria-label={`Xem chi tiết ${product.ProductName}`}
                      >
                        <img src={getPrimaryProductImage(product.ImageUrl) || "/placeholder.png"} alt={product.ProductName} />
                      </Link>
                      <FavoriteButton product={product} />
                    </div>
                    <div className="product-info flex flex-col flex-grow">
                      <h3>
                        <Link
                          href={`/customer/products/${product.ProductID}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            try {
                              sessionStorage.setItem(`product_origin_${product.ProductID}`, "account");
                              sessionStorage.setItem(`product_return_url_${product.ProductID}`, "/customer/favorites");
                              sessionStorage.setItem("active_nav_origin", "account");
                            } catch {}
                          }}
                        >
                          {product.ProductName}
                        </Link>
                      </h3>
                      <div className="price-row mt-auto">
                        <strong>{price.toLocaleString("vi-VN")} ₫</strong>
                        {oldPrice > price && <del>{oldPrice.toLocaleString("vi-VN")} ₫</del>}
                      </div>
                    </div>
                  </article>
                </ScrollReveal>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
