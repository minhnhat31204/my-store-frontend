"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  api,
  Product,
} from "@/lib/api";
import Link from "next/link";

import {
  addToCart,
} from "@/lib/cart";

import CustomerNav from "@/app/components/CustomerNav";

export default function ProductsPage() {
  const [products, setProducts] =
    useState<Product[]>([]);

  const [keyword, setKeyword] =
    useState("");

  const [message, setMessage] =
    useState("");

  const [addingId, setAddingId] =
    useState<number | null>(null);

  useEffect(() => {
    api
      .getProducts()
      .then(setProducts)
      .catch(console.error);
  }, []);

  const filtered = useMemo(() => {
    return products.filter((p) =>
      p.ProductName
        .toLowerCase()
        .includes(keyword.toLowerCase())
    );
  }, [products, keyword]);

  async function add(product: Product) {
    try {
      setAddingId(product.ProductID);

      await addToCart({
        ProductID: product.ProductID,
        ProductName: product.ProductName,
        Price: Number(product.Price),
        ImageUrl: product.ImageUrl || "",
      });

      setMessage(
        `Đã thêm ${product.ProductName} vào giỏ hàng`
      );

      setTimeout(() => {
        setMessage("");
      }, 1800);
    } catch (error) {
      console.error(error);

      setMessage(
        "Không thể thêm sản phẩm vào giỏ hàng."
      );

      setTimeout(() => {
        setMessage("");
      }, 1800);
    } finally {
      setAddingId(null);
    }
  }

  return (
    <main className="store-page">
      <CustomerNav searchValue={keyword} onSearchChange={setKeyword} />

      <div className="store-container">
        <div className="section-heading mt-6">
          <div>
            <p>💻 DANH MỤC TOÀN BỘ</p>
            <h1>Sản phẩm dành cho bạn</h1>
          </div>
        </div>

        {message && (
          <div className="success-message mb-4">
            {message}
          </div>
        )}

        <div className="product-grid">
          {filtered.map((product) => {
            const price = Number(product.DiscountPrice || product.Price);
            const oldPrice = Number(product.Price);
            const discountPercent = oldPrice > price
              ? Math.round(((oldPrice - price) / oldPrice) * 100)
              : 0;

            return (
              <article
                key={product.ProductID}
                className="product-card flex flex-col h-full"
              >
                <div className="product-image">
                  <Link href={`/customer/products/${product.ProductID}`} aria-label={`Xem chi tiết ${product.ProductName}`}>
                    <img
                      src={product.ImageUrl || "/placeholder.png"}
                      alt={product.ProductName}
                    />
                  </Link>
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
                    <button
                      onClick={() => add(product)}
                      disabled={addingId === product.ProductID}
                      className="add-button disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {addingId === product.ProductID
                        ? "Đang thêm..."
                        : "Thêm vào giỏ hàng"}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </main>
  );
}
