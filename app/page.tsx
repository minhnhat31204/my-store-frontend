"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { api, Product, Promotion } from "@/lib/api";
import { addToCart } from "@/lib/cart";
import CustomerNav from "@/app/components/CustomerNav";
import Footer from "@/app/components/Footer";

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
  const [bannerIndex, setBannerIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [bannerLoading, setBannerLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [keyword, setKeyword] = useState("");
  const [visibleCount, setVisibleCount] = useState(8);

  useEffect(() => {
    api.getProducts()
      .then(setProducts)
      .catch((e) => setError(e instanceof Error ? e.message : "Không thể tải sản phẩm"))
      .finally(() => setLoading(false));

    api.getPromotions()
      .then((data) => setPromotions(Array.isArray(data) ? data.filter((item) => getBannerImage(item)) : []))
      .catch(() => setPromotions([]))
      .finally(() => setBannerLoading(false));
  }, []);

  useEffect(() => {
    if (promotions.length < 2) return;

    const timer = window.setInterval(() => {
      setBannerIndex((index) => (index + 1) % promotions.length);
    }, 3000);

    return () => window.clearInterval(timer);
  }, [promotions.length]);

  const filteredProducts = useMemo(() => {
    const value = keyword.trim().toLowerCase();
    return products.filter((product) => product.ProductName.toLowerCase().includes(value));
  }, [products, keyword]);

  const visibleProducts = filteredProducts.slice(0, visibleCount);
  const remainingCount = Math.max(filteredProducts.length - visibleCount, 0);
  const currentBanner = promotions[bannerIndex];

  async function handleAdd(product: Product) {
  try {
    await addToCart({
      ProductID: product.ProductID,
      ProductName: product.ProductName,
      Price: Number(product.Price),
      ImageUrl: product.ImageUrl || "",
    });

    setMessage(
      "Đã thêm sản phẩm vào giỏ hàng"
    );

    window.setTimeout(() => {
      setMessage("");
    }, 1800);
  } catch (error) {
    console.error(error);

    setMessage(
      "Không thể thêm sản phẩm vào giỏ hàng."
    );

    window.setTimeout(() => {
      setMessage("");
    }, 1800);
  }
}

  function changeBanner(step: number) {
    if (!promotions.length) return;
    setBannerIndex((index) => (index + step + promotions.length) % promotions.length);
  }

  return (
    <main className="store-page">
      <CustomerNav searchValue={keyword} onSearchChange={setKeyword} />

      <div className="store-container">
        <section className="promo-banner" aria-label="Banner khuyến mãi">
          {currentBanner ? (
            <img
              className="banner-image"
              src={getBannerImage(currentBanner)}
              alt={currentBanner.Title || "Khuyến mãi MANB SHOP"}
            />
          ) : (
            <div className="banner-fallback">
              <p>SẮM LAPTOP GAMING</p>
              <h1>NHẬN NGAY ƯU ĐÃI</h1>
              <strong>500.000 VNĐ</strong>
              <span>BACK TO SCHOOL • ƯU ĐÃI CỰC HOT</span>
            </div>
          )}

          {promotions.length > 1 && (
            <>
              <button className="banner-arrow banner-arrow-left" onClick={() => changeBanner(-1)} aria-label="Banner trước">‹</button>
              <button className="banner-arrow banner-arrow-right" onClick={() => changeBanner(1)} aria-label="Banner tiếp theo">›</button>
              <div className="banner-dots">
                {promotions.map((promotion, index) => (
                  <button
                    key={promotion.PromotionID ?? index}
                    className={index === bannerIndex ? "active" : ""}
                    onClick={() => setBannerIndex(index)}
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
              <p>🔥 SẢN PHẨM NỔI BẬT</p>
              <h2>Sản phẩm dành cho bạn</h2>
            </div>
            <Link href="/customer/products">Xem tất cả →</Link>
          </div>

          {message && <div className="success-message">{message}</div>}
          {loading && <p>Đang tải sản phẩm...</p>}
          {error && <p className="error-message">{error}</p>}

          {!loading && !error && (
            <>
              <div className="product-grid">
                {visibleProducts.map((product) => (
                  <ProductCard key={product.ProductID} product={product} onAdd={() => handleAdd(product)} />
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

      <Footer />
    </main>
  );
}

function ProductCard({ product, onAdd }: { product: Product; onAdd: () => void }) {
  const price = Number(product.DiscountPrice || product.Price);
  const oldPrice = Number(product.Price);
  const discountPercent = oldPrice > price
    ? Math.round(((oldPrice - price) / oldPrice) * 100)
    : 0;

  return (
    <article className="product-card flex flex-col h-full">
      <div className="product-image">
        <Link href={`/customer/products/${product.ProductID}`} aria-label={`Xem chi tiết ${product.ProductName}`}>
          <img src={product.ImageUrl || "/placeholder.png"} alt={product.ProductName} />
        </Link>
      </div>
      <div className="product-info flex flex-col flex-grow">
        {discountPercent > 0 && <div className="discount-tag">TIẾT KIỆM {discountPercent}%</div>}
        <p className="shop-label">MANB SHOP</p>
        <h3><Link href={`/customer/products/${product.ProductID}`} className="hover:text-blue-700">{product.ProductName}</Link></h3>
        
        {/* Thêm mt-auto để đẩy toàn bộ phần giá và nút bấm xuống đáy cố định */}
        <div className="mt-auto pt-2">
          <div className="price-row">
            <strong>{price.toLocaleString("vi-VN")} ₫</strong>
            {oldPrice > price && <del>{oldPrice.toLocaleString("vi-VN")} ₫</del>}
          </div>
          <button onClick={onAdd} className="add-button">Thêm vào giỏ hàng</button>
        </div>
      </div>
    </article>
  );
}
