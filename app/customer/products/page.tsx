"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  api,
  getPrimaryProductImage,
  Product,
} from "@/lib/api";
import type { StoreCategory } from "@/lib/api";
import Link from "next/link";
import FavoriteButton from "@/app/components/FavoriteButton";

import {
  addToCart,
} from "@/lib/cart";

function extractBrand(name: string) {
  const words = name.trim().split(/\s+/);
  const acronym = words.map((word) => word.replace(/^[^\w]+|[^\w]+$/g, "")).find((word) => /^[A-Z]+$/.test(word));
  return acronym || words[0]?.toUpperCase() || "";
}


export default function ProductsPage() {
  const [products, setProducts] =
    useState<Product[]>([]);

  const [keyword, setKeyword] =
    useState("");
  const [categories, setCategories] = useState<StoreCategory[]>([]);
  const [categoryId, setCategoryId] = useState("all");
  const [brand, setBrand] = useState("all");
  const [sortBy, setSortBy] = useState("recommended");

  const [message, setMessage] =
    useState("");

  const [addingId, setAddingId] =
    useState<number | null>(null);

  useEffect(() => {
    api
      .getProducts()
      .then(setProducts)
      .catch(console.error);
    api.getCategories().then(setCategories).catch(() => setCategories([]));

    const params = new URLSearchParams(window.location.search);
    setKeyword(params.get("search") || "");
    const onSearch = (event: Event) => {
      setKeyword((event as CustomEvent<string>).detail || "");
    };
    window.addEventListener("store-search", onSearch);
    return () => window.removeEventListener("store-search", onSearch);
  }, []);

  const brands = useMemo(() => [...new Set(products.map((p) => extractBrand(p.ProductName)).filter(Boolean))].sort(), [products]);
  const filtered = useMemo(() => {
    const list = products.filter((p) => {
      const matchesKeyword = p.ProductName.toLowerCase().includes(keyword.toLowerCase());
      const matchesCategory = categoryId === "all" || String(p.CategoryID ?? "") === categoryId;
      const matchesBrand = brand === "all" || extractBrand(p.ProductName) === brand;
      return matchesKeyword && matchesCategory && matchesBrand;
    });
    if (sortBy === "price-low") list.sort((a, b) => Number(a.DiscountPrice || a.Price) - Number(b.DiscountPrice || b.Price));
    if (sortBy === "price-high") list.sort((a, b) => Number(b.DiscountPrice || b.Price) - Number(a.DiscountPrice || a.Price));
    if (sortBy === "name") list.sort((a, b) => a.ProductName.localeCompare(b.ProductName, "vi"));
    return list;
  }, [products, keyword, categoryId, brand, sortBy]);

  async function add(product: Product) {
    try {
      setAddingId(product.ProductID);

      await addToCart({
        ProductID: product.ProductID,
        ProductName: product.ProductName,
        Price: Number(product.DiscountPrice || product.Price),
        ImageUrl: getPrimaryProductImage(product.ImageUrl),
        StockQuantity: Number(product.StockQuantity ?? 0),
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
        error instanceof Error ? error.message : "Không thể thêm sản phẩm vào giỏ hàng."
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
      <div className="store-container">
        <div className="section-heading mt-6">
          <div>
            <p>💻 DANH MỤC TOÀN BỘ</p>
            <h1>Sản phẩm dành cho bạn</h1>
          </div>
        </div>

        <section aria-label="Lọc và sắp xếp sản phẩm" className="mb-5 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-4">
          <label className="text-xs font-bold uppercase tracking-wide text-slate-500">Danh mục<select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="mt-1 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold normal-case text-slate-800"><option value="all">Tất cả danh mục</option>{categories.map((item) => <option key={item.CategoryID} value={item.CategoryID}>{item.CategoryName}</option>)}</select></label>
          <label className="text-xs font-bold uppercase tracking-wide text-slate-500">Thương hiệu<select value={brand} onChange={(e) => setBrand(e.target.value)} className="mt-1 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold normal-case text-slate-800"><option value="all">Tất cả thương hiệu</option>{brands.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
          <label className="text-xs font-bold uppercase tracking-wide text-slate-500">Sắp xếp<select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="mt-1 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold normal-case text-slate-800"><option value="recommended">Gợi ý</option><option value="price-low">Giá thấp đến cao</option><option value="price-high">Giá cao đến thấp</option><option value="name">Tên A–Z</option></select></label>
          <div className="flex items-end text-sm font-semibold text-slate-600">{filtered.length} sản phẩm</div>
        </section>

        {message && (
          <div className="success-message mb-4">
            {message}
          </div>
        )}

        {filtered.length === 0 ? <div className="rounded-2xl border bg-white p-10 text-center text-slate-500">Không tìm thấy sản phẩm phù hợp bộ lọc.</div> : <div className="product-grid">
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
                      src={getPrimaryProductImage(product.ImageUrl) || "/placeholder.png"}
                      alt={product.ProductName}
                    />
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
                    <p className={`mb-2 text-xs font-semibold ${Number(product.StockQuantity ?? 0) > 0 ? "text-slate-500" : "text-red-600"}`}>
                      {Number(product.StockQuantity ?? 0) > 0 ? `Còn ${product.StockQuantity} sản phẩm` : "Tạm hết hàng"}
                    </p>
                    <button
                      onClick={() => add(product)}
                      disabled={addingId === product.ProductID || Number(product.StockQuantity ?? 0) <= 0}
                      className="add-button disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {addingId === product.ProductID
                        ? "Đang thêm..."
                        : Number(product.StockQuantity ?? 0) <= 0
                        ? "Hết hàng"
                        : "Thêm vào giỏ hàng"}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>}
      </div>
    </main>
  );
}
