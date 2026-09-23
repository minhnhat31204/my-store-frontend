"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { addToCart } from "@/lib/cart";
import { api, Product, ProductReview, ProductVariant } from "@/lib/api";

const formatPrice = (value: number | string) =>
  `${Number(value).toLocaleString("vi-VN")} ₫`;

export default function ProductDetailPage() {
  const params = useParams<{ id: string }>();
  const productId = Number(params.id);
  const [product, setProduct] = useState<Product | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (!Number.isInteger(productId) || productId <= 0) {
      setError("Sản phẩm không hợp lệ.");
      setLoading(false);
      return;
    }

    let active = true;
    api.getProducts()
      .then((items) => {
        if (!active) return;
        setProducts(items);
        const selected = items.find((item) => item.ProductID === productId);
        if (!selected) setError("Không tìm thấy sản phẩm này.");
        setProduct(selected ?? null);
      })
      .catch(() => active && setError("Không thể tải thông tin sản phẩm."))
      .finally(() => active && setLoading(false));

    api.getProductVariants()
      .then((items) => active && setVariants(items.filter((item) => item.ProductID === productId)))
      .catch(() => active && setVariants([]));

    api.getProductReviews(productId)
      .then((items) => active && setReviews(items))
      .catch(() => active && setReviews([]));

    return () => { active = false; };
  }, [productId]);

  const relatedProducts = useMemo(() => {
    if (!product) return [];
    const sameCategory = products.filter((item) =>
      item.ProductID !== product.ProductID && item.CategoryID === product.CategoryID
    );
    const others = products.filter((item) =>
      item.ProductID !== product.ProductID && item.CategoryID !== product.CategoryID
    );
    return [...sameCategory, ...others].slice(0, 4);
  }, [product, products]);

  const averageRating = reviews.length
    ? reviews.reduce((total, review) => total + Number(review.Rating || 0), 0) / reviews.length
    : 0;

  async function handleAddToCart() {
    if (!product) return;
    setAdding(true);
    try {
      await addToCart({
        ProductID: product.ProductID,
        ProductName: product.ProductName,
        Price: Number(product.DiscountPrice || product.Price),
        ImageUrl: product.ImageUrl || "",
      });
      setMessage("Đã thêm sản phẩm vào giỏ hàng.");
    } catch {
      setMessage("Không thể thêm sản phẩm vào giỏ hàng.");
    } finally {
      setAdding(false);
      window.setTimeout(() => setMessage(""), 2200);
    }
  }

  return (
    <main className="store-page min-h-screen">
      <div className="store-container py-6 sm:py-10">
        <Link href="/customer/products" className="text-sm font-semibold text-blue-700 hover:underline">
          ← Quay lại danh sách sản phẩm
        </Link>

        {loading && <p className="py-16 text-center text-slate-600">Đang tải thông tin sản phẩm...</p>}
        {!loading && error && <p role="alert" className="my-8 rounded-xl bg-rose-50 p-5 text-rose-700">{error}</p>}

        {!loading && product && (
          <>
            <section className="mt-6 grid gap-8 rounded-3xl bg-white p-5 shadow-sm md:grid-cols-2 md:p-8">
              <div className="flex min-h-72 items-center justify-center rounded-2xl bg-slate-50 p-5 sm:min-h-96">
                <img
                  src={product.ImageUrl || "/placeholder.png"}
                  alt={product.ProductName}
                  className="max-h-[420px] w-full object-contain"
                />
              </div>

              <div className="flex flex-col">
                <p className="text-sm font-bold uppercase tracking-wide text-blue-700">MANB SHOP</p>
                <h1 className="mt-2 text-2xl font-black text-slate-900 sm:text-3xl">{product.ProductName}</h1>
                <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-600">
                  {reviews.length > 0 ? (
                    <a href="#reviews" className="font-semibold text-amber-600">★ {averageRating.toFixed(1)} · {reviews.length} đánh giá</a>
                  ) : <span>Chưa có đánh giá</span>}
                  <span>•</span>
                  <span>{Number(product.StockQuantity ?? 0) > 0 ? `Còn ${product.StockQuantity} sản phẩm` : "Liên hệ để kiểm tra hàng"}</span>
                </div>

                <div className="mt-6 flex flex-wrap items-baseline gap-3">
                  <strong className="text-3xl font-black text-blue-800">{formatPrice(product.DiscountPrice || product.Price)}</strong>
                  {product.DiscountPrice && Number(product.DiscountPrice) < Number(product.Price) && (
                    <del className="text-slate-400">{formatPrice(product.Price)}</del>
                  )}
                </div>

                {product.Description && (
                  <div className="mt-6">
                    <h2 className="font-bold text-slate-900">Mô tả sản phẩm</h2>
                    <p className="mt-2 whitespace-pre-line leading-7 text-slate-600">{product.Description}</p>
                  </div>
                )}

                <div className="mt-6">
                  <h2 className="font-bold text-slate-900">Thông số nổi bật</h2>
                  <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
                    {([
                      ["CPU", product.CPU], ["RAM", product.RAM], ["Lưu trữ", product.Storage],
                      ["Màn hình", product.Display], ["Tần số quét", product.RefreshRate], ["Dòng máy", product.Series],
                    ] as const).filter(([, value]) => value).map(([label, value]) => (
                      <div key={label} className="rounded-xl bg-slate-50 p-3">
                        <dt className="text-slate-500">{label}</dt>
                        <dd className="mt-1 font-semibold text-slate-800">{value}</dd>
                      </div>
                    ))}
                    {!product.CPU && !product.RAM && !product.Storage && !product.Display && !product.RefreshRate && !product.Series && (
                      <p className="col-span-2 text-slate-500">Chưa có thông số chi tiết.</p>
                    )}
                  </dl>
                </div>

                {variants.length > 0 && (
                  <div className="mt-6">
                    <h2 className="font-bold text-slate-900">Phiên bản hiện có</h2>
                    <ul className="mt-3 space-y-2">
                      {variants.map((variant) => (
                        <li key={variant.VariantID} className="flex flex-wrap justify-between gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm">
                          <span className="font-medium text-slate-800">{[variant.Color, variant.Configuration].filter(Boolean).join(" · ") || "Phiên bản tiêu chuẩn"}</span>
                          <span className="text-slate-600">{variant.Price ? formatPrice(variant.Price) : "Theo giá sản phẩm"} · Còn {variant.StockQuantity ?? 0}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {message && <p role="status" className="mt-4 rounded-xl bg-blue-50 p-3 text-sm text-blue-800">{message}</p>}
                <button onClick={handleAddToCart} disabled={adding} className="add-button mt-7 w-full disabled:cursor-wait disabled:opacity-60">
                  {adding ? "Đang thêm vào giỏ..." : "Thêm vào giỏ hàng"}
                </button>
              </div>
            </section>

            <section id="reviews" className="mt-10 rounded-3xl bg-white p-5 shadow-sm sm:p-8">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-sm font-bold uppercase tracking-wide text-blue-700">Khách hàng nói gì</p>
                  <h2 className="mt-1 text-2xl font-black text-slate-900">Đánh giá sản phẩm</h2>
                </div>
                {reviews.length > 0 && <p className="font-semibold text-amber-600">★ {averageRating.toFixed(1)} / 5 ({reviews.length})</p>}
              </div>
              {reviews.length === 0 ? (
                <p className="mt-5 rounded-xl bg-slate-50 p-5 text-slate-600">Sản phẩm chưa có đánh giá.</p>
              ) : (
                <ul className="mt-5 divide-y divide-slate-100">
                  {reviews.map((review) => (
                    <li key={review.ReviewID} className="py-5 first:pt-0 last:pb-0">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-bold text-slate-900">{review.User?.FullName || "Khách hàng"}</p>
                        <time className="text-sm text-slate-500">
                          {review.ReviewDate && !Number.isNaN(Date.parse(review.ReviewDate))
                            ? new Date(review.ReviewDate).toLocaleDateString("vi-VN")
                            : ""}
                        </time>
                      </div>
                      <p className="mt-1 text-amber-500" aria-label={`${Number(review.Rating)} trên 5 sao`}>
                        {"★".repeat(Math.min(5, Math.max(0, Number(review.Rating) || 0)))}{"☆".repeat(5 - Math.min(5, Math.max(0, Number(review.Rating) || 0)))}
                      </p>
                      {review.Comment && <p className="mt-2 whitespace-pre-line leading-6 text-slate-600">{review.Comment}</p>}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {relatedProducts.length > 0 && (
              <section className="mt-10">
                <div className="section-heading">
                  <div><p>GỢI Ý CHO BẠN</p><h2>Sản phẩm liên quan</h2></div>
                  <Link href="/customer/products">Xem tất cả →</Link>
                </div>
                <div className="product-grid">
                  {relatedProducts.map((item) => (
                    <Link key={item.ProductID} href={`/customer/products/${item.ProductID}`} className="product-card block p-4 transition hover:-translate-y-1 hover:shadow-lg">
                      <div className="product-image"><img src={item.ImageUrl || "/placeholder.png"} alt={item.ProductName} /></div>
                      <h3 className="mt-3 font-bold text-slate-900">{item.ProductName}</h3>
                      <p className="mt-2 font-black text-blue-800">{formatPrice(item.DiscountPrice || item.Price)}</p>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </main>
  );
}
