"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { api, Product } from "@/lib/api";
import { addToCart } from "@/lib/cart";
import CustomerNav from "@/app/components/CustomerNav";

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [keyword, setKeyword] = useState("");

  useEffect(() => {
    api.getProducts().then(setProducts).catch((e) => setError(e instanceof Error ? e.message : "Không thể tải sản phẩm")).finally(() => setLoading(false));
  }, []);

  const visibleProducts = useMemo(() => {
    const filtered = products.filter((p) => p.ProductName.toLowerCase().includes(keyword.toLowerCase()));
    return filtered.slice(0, 8);
  }, [products, keyword]);

  function handleAdd(product: Product) {
    addToCart({ ProductID: product.ProductID, ProductName: product.ProductName, Price: Number(product.Price), ImageUrl: product.ImageUrl });
    setMessage("Đã thêm sản phẩm vào giỏ hàng");
    setTimeout(() => setMessage(""), 1800);
  }

  return (
    <main className="store-page">
      <CustomerNav />
      <div className="store-container">
        <section className="promo-banner">
          <button className="banner-arrow">‹</button>
          <div className="promo-copy">
            <p>SẮM LAPTOP GAMING</p>
            <h1>NHẬN NGAY GIETCODE</h1>
            <strong>500.000 VNĐ</strong>
            <span>BACK TO SCHOOL • ƯU ĐÃI CỰC HOT</span>
          </div>
          <div className="promo-laptop">⌁</div>
          <button className="banner-arrow">›</button>
          <div className="banner-dots"><b /> <i /> <i /> <i /> <i /> <i /></div>
        </section>

        <section className="featured-section">
          <div className="section-heading">
            <div><p>🔥 SẢN PHẨM NỔI BẬT</p><h2>Sản phẩm dành cho bạn</h2></div>
            <Link href="/customer/products">Xem tất cả →</Link>
          </div>
          {message && <div className="success-message">{message}</div>}
          {loading && <p>Đang tải sản phẩm...</p>}
          {error && <p className="error-message">{error}</p>}
          {!loading && !error && <div className="product-grid">
            {visibleProducts.map((product) => <ProductCard key={product.ProductID} product={product} onAdd={() => handleAdd(product)} />)}
          </div>}
        </section>
      </div>
    </main>
  );
}

function ProductCard({ product, onAdd }: { product: Product; onAdd: () => void }) {
  const price = Number(product.Price);
  const oldPrice = product.DiscountPrice ? Number(product.DiscountPrice) : Math.round(price * 1.12);
  return (
    <article className="product-card">
      <div className="product-image"><img src={product.ImageUrl || "/placeholder.png"} alt={product.ProductName} /></div>
      <div className="product-info">
        <div className="product-specs"><span>Hiệu năng cao</span><span>Chính hãng</span></div>
        <div className="discount-tag">TIẾT KIỆM 12%</div>
        <p className="shop-label">MANB SHOP</p>
        <h3>{product.ProductName}</h3>
        <div className="price-row"><strong>{price.toLocaleString("vi-VN")} ₫</strong><del>{oldPrice.toLocaleString("vi-VN")} ₫</del></div>
        <button onClick={onAdd} className="add-button">Thêm vào giỏ hàng</button>
      </div>
    </article>
  );
}
