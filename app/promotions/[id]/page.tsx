'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, getPrimaryProductImage, getStoredUser, Product, Promotion } from '@/lib/api';
import { addToCart } from '@/lib/cart';
import { animateFlyToCart } from '@/lib/cart-animation';
import FavoriteButton from '@/app/components/FavoriteButton';

function money(value?: number | string | null) {
  return `${Number(value || 0).toLocaleString('vi-VN')} ₫`;
}

export default function PromotionDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const promoId = Number(id);

  const [promotion, setPromotion] = useState<Promotion | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!promoId || Number.isNaN(promoId)) {
      setError('Mã chương trình khuyến mãi không hợp lệ.');
      setLoading(false);
      return;
    }

    Promise.all([
      api.getPromotionById(promoId),
      api.getProducts().catch(() => []),
    ])
      .then(([promoRes, fullProducts]) => {
        setPromotion(promoRes.promotion);
        setAllProducts(fullProducts);

        if (promoRes.products && Array.isArray(promoRes.products)) {
          setProducts(promoRes.products);
        } else {
          setProducts([]);
        }
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Không tải được trang khuyến mãi.');
      })
      .finally(() => setLoading(false));
  }, [promoId]);

  async function handleAdd(product: Product, event: React.MouseEvent) {
    const user = getStoredUser();
    if (!user) {
      router.push('/login');
      return;
    }
    animateFlyToCart(event, getPrimaryProductImage(product.ImageUrl));
    try {
      await addToCart({
        ProductID: product.ProductID,
        ProductName: product.ProductName,
        Price: Number(product.DiscountPrice || product.Price),
        ImageUrl: getPrimaryProductImage(product.ImageUrl),
        StockQuantity: Number(product.StockQuantity ?? 0),
      });
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : 'Không thể thêm sản phẩm vào giỏ hàng.');
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-solid border-orange-500 border-r-transparent"></div>
          <p className="text-slate-400">Đang tải trang sự kiện khuyến mãi...</p>
        </div>
      </main>
    );
  }

  if (error || !promotion) {
    return (
      <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
        <div className="text-center max-w-md bg-slate-900 border border-slate-800 p-8 rounded-3xl space-y-4">
          <p className="text-rose-400 font-bold">{error || 'Không tìm thấy khuyến mãi'}</p>
          <Link href="/" className="inline-block rounded-xl bg-blue-600 px-5 py-2.5 font-bold text-white hover:bg-blue-500">
            Quay về trang chủ
          </Link>
        </div>
      </main>
    );
  }

  const bannerImg = promotion.ImageUrl || promotion.BannerImageUrl || '';

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100 pb-16">
      {/* Top Banner Cover */}
      <div className="relative w-full overflow-hidden bg-slate-900">
        {bannerImg ? (
          <div className="relative max-h-[460px] w-full overflow-hidden">
            <img
              src={bannerImg}
              alt={promotion.Title || 'Khuyến mãi'}
              className="w-full object-cover max-h-[460px] filter brightness-95"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
          </div>
        ) : (
          <div className="h-64 bg-gradient-to-r from-orange-600 via-rose-600 to-amber-600 flex items-center justify-center">
            <h1 className="text-3xl sm:text-5xl font-black text-white drop-shadow-md text-center px-4">
              {promotion.Title}
            </h1>
          </div>
        )}

        {/* Floating Header Info */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 relative -mt-16 sm:-mt-24 z-10">
          <div className="rounded-3xl border border-white/10 bg-slate-900/90 backdrop-blur-md p-6 sm:p-8 shadow-2xl space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="rounded-full bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-1 text-xs font-black uppercase tracking-wider text-white shadow-md">
                SIÊU SALE SỰ KIỆN
              </span>
              <Link
                href="/"
                className="text-xs font-bold text-slate-400 hover:text-white flex items-center gap-1 transition"
              >
                ← Quay lại trang chủ
              </Link>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-white">{promotion.Title}</h1>
            {promotion.Description && (
              <p className="text-sm sm:text-base text-slate-300 max-w-3xl leading-relaxed whitespace-pre-line">
                {promotion.Description}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-slate-400">
              {promotion.DiscountPercent ? (
                <div className="flex items-center gap-1.5 text-amber-400 font-bold">
                  <span className="text-base">🔥</span> Giảm tới {promotion.DiscountPercent}%
                </div>
              ) : null}
              {promotion.EndDate ? (
                <div className="flex items-center gap-1.5 text-slate-300">
                  <span>⏳</span> Hạn áp dụng đến: <span className="font-semibold text-white">{new Date(`${promotion.EndDate}T00:00:00`).toLocaleDateString('vi-VN')}</span>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* Product Showcase Section */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 mt-12 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              <span className="text-orange-500">⚡</span> SẢN PHẨM KHUYẾN MÃI ĐẶC BIỆT
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Các sản phẩm áp dụng trong chương trình khuyến mãi này. Số lượng có hạn!
            </p>
          </div>
          <span className="text-xs font-bold text-slate-500 bg-slate-900 px-3 py-1.5 rounded-full border border-slate-800">
            {products.length} sản phẩm
          </span>
        </div>

        {products.length === 0 ? (
          <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-12 text-center text-slate-400 space-y-3">
            <p className="text-4xl">🏷️</p>
            <p className="text-base font-bold text-white">Chưa có sản phẩm nào trong chương trình khuyến mãi này</p>
            <p className="text-xs text-slate-400 max-w-md mx-auto">Chỉ các sản phẩm được thiết lập riêng cho banner này mới hiển thị ở đây.</p>
            <div className="pt-2">
              <Link
                href="/customer/products"
                className="inline-block rounded-xl bg-orange-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-orange-500 shadow-md transition"
              >
                Khám phá toàn bộ sản phẩm →
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {products.map((product) => {
              const originalPrice = Number(product.Price || 0);
              const discountPrice = Number(product.DiscountPrice || 0);
              const hasDiscount = discountPrice > 0 && discountPrice < originalPrice;
              const currentPrice = hasDiscount ? discountPrice : originalPrice;
              const discountPercent = hasDiscount ? Math.round(((originalPrice - discountPrice) / originalPrice) * 100) : 0;

              return (
                <div
                  key={product.ProductID}
                  className="group relative flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900/60 p-4 transition-all duration-300 hover:-translate-y-1 hover:border-orange-500/50 hover:bg-slate-900 hover:shadow-xl hover:shadow-orange-950/20"
                >
                  <div>
                    {/* Badge % giảm */}
                    {hasDiscount && (
                      <span className="absolute top-3 left-3 z-10 rounded-lg bg-gradient-to-r from-rose-600 to-orange-500 px-2 py-0.5 text-[11px] font-black text-white shadow-sm">
                        -{discountPercent}%
                      </span>
                    )}

                    {/* Favorite Button */}
                    <div className="absolute top-3 right-3 z-10">
                      <FavoriteButton product={product} />
                    </div>

                    {/* Image */}
                    <Link href={`/customer/products/${product.ProductID}`} className="block overflow-hidden rounded-xl bg-slate-950 p-2">
                      <img
                        src={getPrimaryProductImage(product.ImageUrl)}
                        alt={product.ProductName}
                        className="h-40 sm:h-48 w-full object-contain transition-transform duration-300 group-hover:scale-105"
                      />
                    </Link>

                    {/* Name */}
                    <Link href={`/customer/products/${product.ProductID}`} className="mt-3 block">
                      <h3 className="line-clamp-2 text-sm font-bold text-slate-200 group-hover:text-orange-400 transition">
                        {product.ProductName}
                      </h3>
                    </Link>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800/80">
                    {/* Price */}
                    <div className="mb-3">
                      <div className="text-base sm:text-lg font-black text-orange-400">
                        {money(currentPrice)}
                      </div>
                      {hasDiscount && (
                        <div className="text-xs text-slate-500 line-through">
                          {money(originalPrice)}
                        </div>
                      )}
                    </div>

                    {/* Add to cart button */}
                    <button
                      type="button"
                      onClick={(e) => handleAdd(product, e)}
                      className="w-full rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 py-2.5 text-xs font-bold text-white shadow-md shadow-orange-950 transition hover:from-orange-600 hover:to-amber-600 active:scale-95 cursor-pointer"
                    >
                      Thêm vào giỏ
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
