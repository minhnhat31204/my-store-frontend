"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  api,
  getCachedCategoriesSync,
  getCachedProductsSync,
  getPrimaryProductImage,
  Product,
} from "@/lib/api";
import type { StoreCategory } from "@/lib/api";
import Link from "next/link";
import { useRouter } from "next/navigation";
import FavoriteButton from "@/app/components/FavoriteButton";
import ScrollReveal from "@/app/components/ScrollReveal";
import CustomSelect from "@/app/components/CustomSelect";
import { addToCart } from "@/lib/cart";
import { animateFlyToCart } from "@/lib/cart-animation";

function extractBrand(name: string) {
  const words = name.trim().split(/\s+/);
  const acronym = words.map((word) => word.replace(/^[^\w]+|[^\w]+$/g, "")).find((word) => /^[A-Z]+$/.test(word));
  return acronym || words[0]?.toUpperCase() || "";
}

export default function ProductsPage() {
  const router = useRouter();
  const initialProducts = useMemo(() => getCachedProductsSync() || [], []);
  const initialCategories = useMemo(() => getCachedCategoriesSync() || [], []);
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [keyword, setKeyword] = useState("");
  const [categories, setCategories] = useState<StoreCategory[]>(initialCategories);
  const [categoryId, setCategoryId] = useState("all");
  const [brand, setBrand] = useState("all");
  const [sortBy, setSortBy] = useState("recommended");
  const [addingId, setAddingId] = useState<number | null>(null);

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
  
  const categoryOptions = useMemo(() => [
    { value: 'all', label: 'Tất cả danh mục' },
    ...categories.map((c) => ({ value: String(c.CategoryID), label: c.CategoryName }))
  ], [categories]);

  const brandOptions = useMemo(() => [
    { value: 'all', label: 'Tất cả thương hiệu' },
    ...brands.map((b) => ({ value: b, label: b }))
  ], [brands]);

  const sortOptions = useMemo(() => [
    { value: 'recommended', label: 'Gợi ý nổi bật' },
    { value: 'price-low', label: 'Giá: Thấp đến cao' },
    { value: 'price-high', label: 'Giá: Cao đến thấp' },
    { value: 'name', label: 'Tên sản phẩm: A → Z' },
  ], []);

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

  async function add(product: Product, event: React.MouseEvent) {
    animateFlyToCart(event, getPrimaryProductImage(product.ImageUrl));
    try {
      setAddingId(product.ProductID);

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
    } finally {
      setAddingId(null);
    }
  }

  return (
    <main className="store-page">
      <div className="store-container">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-5">
          <div>
            <p className="text-xs font-black uppercase text-blue-600 tracking-wider">Danh Mục Toàn Bộ</p>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">Sản phẩm dành cho bạn</h1>
          </div>
          <div className="text-sm font-semibold text-slate-500">
            Hiển thị <strong className="text-slate-900 font-bold">{filtered.length}</strong> sản phẩm
          </div>
        </div>

        {/* Thanh lọc 3 cột tiêu chuẩn */}
        <section aria-label="Lọc và sắp xếp sản phẩm" className="mb-6 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm">
          <div className="grid gap-3.5 sm:grid-cols-3">
            <CustomSelect
              label="Danh mục"
              value={categoryId}
              onChange={setCategoryId}
              options={categoryOptions}
            />

            <CustomSelect
              label="Thương hiệu"
              value={brand}
              onChange={setBrand}
              options={brandOptions}
            />

            <CustomSelect
              label="Sắp xếp theo"
              value={sortBy}
              onChange={setSortBy}
              options={sortOptions}
            />
          </div>

          {/* Dòng hiển thị bộ lọc đang chọn + Nút đặt lại */}
          {(categoryId !== 'all' || brand !== 'all' || sortBy !== 'recommended' || keyword) && (
            <div className="mt-3.5 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="text-slate-400 font-medium">Đang lọc:</span>
                {categoryId !== 'all' && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 font-bold border border-blue-200/60">
                    {categoryOptions.find((c) => c.value === categoryId)?.label}
                    <button
                      type="button"
                      onClick={() => setCategoryId('all')}
                      className="hover:text-blue-900 cursor-pointer ml-0.5"
                      title="Bỏ lọc danh mục"
                    >
                      ✕
                    </button>
                  </span>
                )}
                {brand !== 'all' && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 font-bold border border-blue-200/60">
                    {brand}
                    <button
                      type="button"
                      onClick={() => setBrand('all')}
                      className="hover:text-blue-900 cursor-pointer ml-0.5"
                      title="Bỏ lọc thương hiệu"
                    >
                      ✕
                    </button>
                  </span>
                )}
                {keyword && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 font-bold border border-blue-200/60">
                    Từ khóa: &quot;{keyword}&quot;
                    <button
                      type="button"
                      onClick={() => setKeyword('')}
                      className="hover:text-blue-900 cursor-pointer ml-0.5"
                      title="Xóa từ khóa"
                    >
                      ✕
                    </button>
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={() => {
                  setCategoryId('all');
                  setBrand('all');
                  setSortBy('recommended');
                  setKeyword('');
                }}
                className="text-xs font-bold text-rose-600 hover:text-rose-700 hover:underline transition cursor-pointer"
              >
                Xóa tất cả bộ lọc ↺
              </button>
            </div>
          )}
        </section>

        {filtered.length === 0 ? (
          <div className="rounded-2xl border bg-white p-10 text-center text-slate-500">
            Không tìm thấy sản phẩm phù hợp bộ lọc.
          </div>
        ) : (
          <div className="product-grid">
            {filtered.map((product, idx) => {
              const price = Number(product.DiscountPrice || product.Price);
              const oldPrice = Number(product.Price);
              const discountPercent =
                oldPrice > price ? Math.round(((oldPrice - price) / oldPrice) * 100) : 0;

              return (
                <ScrollReveal key={product.ProductID} index={idx}>
                  <article
                    onClick={(e) => {
                      const target = (e.target as HTMLElement)?.closest("button, .favorite-btn, .add-button");
                      if (target) return;
                      try {
                        sessionStorage.setItem(`product_origin_${product.ProductID}`, "products");
                        sessionStorage.setItem(`product_return_url_${product.ProductID}`, "/customer/products");
                        sessionStorage.setItem("active_nav_origin", "products");
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
                            sessionStorage.setItem(`product_origin_${product.ProductID}`, "products");
                            sessionStorage.setItem(`product_return_url_${product.ProductID}`, "/customer/products");
                            sessionStorage.setItem("active_nav_origin", "products");
                          } catch {}
                        }}
                        aria-label={`Xem chi tiết ${product.ProductName}`}
                      >
                        <img
                          src={getPrimaryProductImage(product.ImageUrl) || "/placeholder.png"}
                          alt={product.ProductName}
                        />
                      </Link>
                      <FavoriteButton product={product} />
                    </div>
                    <div className="product-info flex flex-col flex-grow">
                      {discountPercent > 0 && <div className="discount-tag">TIẾT KIỆM {discountPercent}%</div>}
                      <h3>
                        <Link
                          href={`/customer/products/${product.ProductID}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            try {
                              sessionStorage.setItem(`product_origin_${product.ProductID}`, "products");
                              sessionStorage.setItem(`product_return_url_${product.ProductID}`, "/customer/products");
                              sessionStorage.setItem("active_nav_origin", "products");
                            } catch {}
                          }}
                          className="hover:text-blue-700"
                        >
                          {product.ProductName}
                        </Link>
                      </h3>

                      <div className="mt-auto pt-2">
                        <div className="price-row">
                          <strong>{price.toLocaleString("vi-VN")} ₫</strong>
                          {oldPrice > price && <del>{oldPrice.toLocaleString("vi-VN")} ₫</del>}
                        </div>
                        <p
                          className={`mb-2 text-xs font-semibold ${
                            Number(product.StockQuantity ?? 0) > 0 ? "text-slate-500" : "text-red-600"
                          }`}
                        >
                          {Number(product.StockQuantity ?? 0) > 0
                            ? `Còn ${product.StockQuantity} sản phẩm`
                            : "Tạm hết hàng"}
                        </p>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            add(product, e);
                          }}
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
                </ScrollReveal>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
