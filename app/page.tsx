"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { api, getPrimaryProductImage, Product, Promotion } from "@/lib/api";
import { addToCart } from "@/lib/cart";
import { animateFlyToCart } from "@/lib/cart-animation";
import FavoriteButton from "@/app/components/FavoriteButton";

const FALLBACK_BANNER = "/banner-placeholder.jpg";

function getBannerImage(promotion: Promotion) {
  return (
    promotion.BannerImageUrl ||
    promotion.ImageUrl ||
    promotion.IMAGEURL ||
    promotion.imageUrl ||
    promotion.Image ||
    ""
  );
}

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [trackIndex, setTrackIndex] = useState(1);
  const [withTransition, setWithTransition] = useState(true);
  const [loading, setLoading] = useState(true);
  const [bannerLoading, setBannerLoading] = useState(true);
  const [error, setError] = useState("");
  const [keyword, setKeyword] = useState("");
  const [visibleCount, setVisibleCount] = useState(8);

  // States & Refs cho tính năng kéo chuột trượt banner
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const startXRef = useRef(0);
  const isDraggingRef = useRef(false);
  const isAnimatingRef = useRef(false);
  const dragOffsetRef = useRef(0);

  useEffect(() => {
    api.getProducts()
      .then(setProducts)
      .catch((e) => setError(e instanceof Error ? e.message : "Không thể tải sản phẩm"))
      .finally(() => setLoading(false));

    api.getPromotions()
      .then((data) => {
        const validPromos = Array.isArray(data) ? data.filter((item) => getBannerImage(item)) : [];
        setPromotions(validPromos);
        setTrackIndex(validPromos.length > 1 ? 1 : 0);
      })
      .catch(() => setPromotions([]))
      .finally(() => setBannerLoading(false));
  }, []);

  useEffect(() => {
    const onSearch = (event: Event) => {
      setKeyword((event as CustomEvent<string>).detail || "");
    };
    window.addEventListener("store-search", onSearch);
    return () => window.removeEventListener("store-search", onSearch);
  }, []);

  const N = promotions.length;

  // Danh sách slides có clone 2 đầu để tạo vòng lặp vô tận không bị trượt ngược
  const slides = useMemo(() => {
    if (N <= 1) return promotions;
    return [promotions[N - 1], ...promotions, promotions[0]];
  }, [promotions, N]);

  // Active index cho dots (0 đến N - 1)
  const activeDotIndex = N > 0 ? (trackIndex - 1 + N) % N : 0;

  // Chuyển slide mượt mà, nhận mọi cú click nhanh (double-click) không bị nuốt lệnh
  const changeBanner = (step: number) => {
    if (N <= 1) return;

    if (trackIndex >= N + 1 && step > 0) {
      setWithTransition(false);
      setTrackIndex(1);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setWithTransition(true);
          setTrackIndex(2);
        });
      });
      return;
    }

    if (trackIndex <= 0 && step < 0) {
      setWithTransition(false);
      setTrackIndex(N);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setWithTransition(true);
          setTrackIndex(N - 1);
        });
      });
      return;
    }

    setWithTransition(true);
    setTrackIndex((prev) => Math.max(0, Math.min(N + 1, prev + step)));
  };

  const goToDot = (dotIdx: number) => {
    if (N <= 1) return;
    setWithTransition(true);
    setTrackIndex(dotIdx + 1);
  };

  // Reset không hiệu ứng khi chạm slide clone
  const handleTransitionEnd = () => {
    if (N <= 1) return;
    if (trackIndex >= N + 1) {
      setWithTransition(false);
      setTrackIndex(1);
    } else if (trackIndex <= 0) {
      setWithTransition(false);
      setTrackIndex(N);
    }
  };

  // Timer an toàn tự động chuẩn hóa vị trí nếu transitionEnd bị lỡ nhịp
  useEffect(() => {
    if (N <= 1) return;
    if (trackIndex >= N + 1) {
      const timer = window.setTimeout(() => {
        setWithTransition(false);
        setTrackIndex(1);
      }, 360);
      return () => window.clearTimeout(timer);
    }
    if (trackIndex <= 0) {
      const timer = window.setTimeout(() => {
        setWithTransition(false);
        setTrackIndex(N);
      }, 360);
      return () => window.clearTimeout(timer);
    }
  }, [trackIndex, N]);

  useEffect(() => {
    if (N < 2 || isHovered || isDragging) return;

    const timer = window.setInterval(() => {
      changeBanner(1);
    }, 4000);

    return () => window.clearInterval(timer);
  }, [N, isHovered, isDragging, trackIndex]);

  const filteredProducts = useMemo(() => {
    const value = keyword.trim().toLowerCase();
    return products.filter((product) => product.ProductName.toLowerCase().includes(value));
  }, [products, keyword]);

  const visibleProducts = filteredProducts.slice(0, visibleCount);
  const remainingCount = Math.max(filteredProducts.length - visibleCount, 0);

  async function handleAdd(product: Product, event: React.MouseEvent) {
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
      alert(error instanceof Error ? error.message : "Không thể thêm sản phẩm vào giỏ hàng.");
    }
  }

  // Xử lý kéo bằng chuột và cảm ứng trên poster
  const handlePointerDown = (e: React.PointerEvent<HTMLElement>) => {
    if (N <= 1) return;
    if ((e.target as HTMLElement).closest("button")) return;

    // Chuẩn hóa vị trí nếu đang ở slide clone trước khi kéo
    if (trackIndex >= N + 1) {
      setWithTransition(false);
      setTrackIndex(1);
    } else if (trackIndex <= 0) {
      setWithTransition(false);
      setTrackIndex(N);
    }
    
    isAnimatingRef.current = false;
    isDraggingRef.current = true;
    startXRef.current = e.clientX;
    dragOffsetRef.current = 0;
    setIsDragging(true);
    setWithTransition(false);
    setDragOffset(0);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLElement>) => {
    if (!isDraggingRef.current) return;
    const diff = e.clientX - startXRef.current;
    dragOffsetRef.current = diff;
    setDragOffset(diff);
  };

  const handlePointerEnd = () => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    setIsDragging(false);

    const threshold = 50;
    setWithTransition(true);
    isAnimatingRef.current = true;
    if (dragOffsetRef.current > threshold) {
      setTrackIndex((prev) => Math.max(0, prev - 1));
    } else if (dragOffsetRef.current < -threshold) {
      setTrackIndex((prev) => Math.min(N + 1, prev + 1));
    }
    setDragOffset(0);
    dragOffsetRef.current = 0;
  };

  return (
    <main className="store-page">
      <div className="store-container">
        <section
          className={`promo-banner ${isDragging ? "is-dragging" : ""}`}
          aria-label="Banner khuyến mãi"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => {
            setIsHovered(false);
            if (isDraggingRef.current) handlePointerEnd();
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerEnd}
          onPointerCancel={handlePointerEnd}
        >
          {slides.length > 0 ? (
            <div
              className="promo-slider-track"
              onTransitionEnd={handleTransitionEnd}
              style={{
                transform: `translateX(calc(-${trackIndex * 100}% + ${dragOffset}px))`,
                transition: withTransition && !isDragging ? "transform 0.35s cubic-bezier(0.2, 0.85, 0.3, 1)" : "none",
              }}
            >
              {slides.map((promotion, idx) => (
                <div key={`${promotion.PromotionID ?? idx}-${idx}`} className="promo-slide">
                  <img
                    className="banner-image"
                    src={getBannerImage(promotion)}
                    alt={promotion.Title || `Khuyến mãi`}
                    draggable={false}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="banner-fallback">
              <p>SẮM LAPTOP GAMING</p>
              <h1>NHẬN NGAY ƯU ĐÃI</h1>
              <strong>500.000 VNĐ</strong>
              <span>BACK TO SCHOOL • ƯU ĐÃI CỰC HOT</span>
            </div>
          )}

          {N > 1 && (
            <>
              <button
                type="button"
                className="banner-arrow banner-arrow-left"
                onClick={(e) => {
                  e.stopPropagation();
                  changeBanner(-1);
                }}
                aria-label="Banner trước"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </button>
              <button
                type="button"
                className="banner-arrow banner-arrow-right"
                onClick={(e) => {
                  e.stopPropagation();
                  changeBanner(1);
                }}
                aria-label="Banner tiếp theo"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>
              <div className="banner-dots" onClick={(e) => e.stopPropagation()}>
                {promotions.map((promotion, index) => (
                  <button
                    type="button"
                    key={promotion.PromotionID ?? index}
                    className={index === activeDotIndex ? "active" : ""}
                    onClick={(e) => {
                      e.stopPropagation();
                      goToDot(index);
                    }}
                    aria-label={`Chọn banner ${index + 1}`}
                  />
                ))}
              </div>
            </>
          )}

          {bannerLoading && <span className="banner-status">Đang tải banner...</span>}
        </section>

        <section className="featured-section">
          <div className="section-heading">
            <div>
              <p>SẢN PHẨM NỔI BẬT</p>
              <h2>Sản phẩm dành cho bạn</h2>
            </div>
            <Link href="/customer/products">Xem tất cả →</Link>
          </div>

          {loading && <p>Đang tải sản phẩm...</p>}
          {error && <p className="error-message">{error}</p>}

          {!loading && !error && (
            <>
              <div className="product-grid">
                {visibleProducts.map((product) => (
                  <ProductCard key={product.ProductID} product={product} onAdd={(e) => handleAdd(product, e)} />
                ))}
              </div>

              {remainingCount > 0 && (
                <button className="load-more-button" onClick={() => setVisibleCount((count) => count + 8)}>
                  Xem tiếp {remainingCount} sản phẩm →
                </button>
              )}
            </>
          )}
        </section>
      </div>
    </main>
  );
}

function ProductCard({ product, onAdd }: { product: Product; onAdd: (e: React.MouseEvent) => void }) {
  const price = Number(product.DiscountPrice || product.Price);
  const oldPrice = Number(product.Price);
  const discountPercent = oldPrice > price
    ? Math.round(((oldPrice - price) / oldPrice) * 100)
    : 0;

  // Xử lý tách lấy ảnh đầu tiên và kiểm tra xem có phải là đường dẫn URL hợp lệ hay không
  const displayImage = getPrimaryProductImage(product.ImageUrl) || "/placeholder.png";

  return (
    <article className="product-card flex flex-col h-full">
      <div className="product-image">
        <Link href={`/customer/products/${product.ProductID}`} aria-label={`Xem chi tiết ${product.ProductName}`}>
          <img src={displayImage} alt={product.ProductName} />
        </Link>
        <FavoriteButton product={product} />
      </div>
      <div className="product-info flex flex-col flex-grow">
        {discountPercent > 0 && <div className="discount-tag">TIẾT KIỆM {discountPercent}%</div>}
        <p className="shop-label">MANB SHOP</p>
        <h3><Link href={`/customer/products/${product.ProductID}`} className="hover:text-blue-700">{product.ProductName}</Link></h3>
        
        <div className="mt-auto pt-2">
          <div className="price-row">
            <strong>{price.toLocaleString("vi-VN")} ₫</strong>
            {oldPrice > price && <del>{oldPrice.toLocaleString("vi-VN")} ₫</del>}
          </div>
          <p className={`mb-2 text-xs font-semibold ${Number(product.StockQuantity ?? 0) > 0 ? "text-slate-500" : "text-red-600"}`}>{Number(product.StockQuantity ?? 0) > 0 ? `Còn ${product.StockQuantity} sản phẩm` : "Tạm hết hàng"}</p>
          <button onClick={onAdd} disabled={Number(product.StockQuantity ?? 0) <= 0} className="add-button disabled:cursor-not-allowed disabled:opacity-60">{Number(product.StockQuantity ?? 0) > 0 ? "Thêm vào giỏ hàng" : "Hết hàng"}</button>
        </div>
      </div>
    </article>
  );
}
