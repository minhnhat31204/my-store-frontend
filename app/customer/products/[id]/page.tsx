"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { addToCart } from "@/lib/cart";
import { animateFlyToCart } from "@/lib/cart-animation";
import {
  api,
  getCachedProductsSync,
  getPrimaryProductImage,
  Product,
  ProductReview,
  ProductVariant,
  resolveApiAssetUrl,
} from "@/lib/api";
import FavoriteButton from "@/app/components/FavoriteButton";
import ScrollReveal from "@/app/components/ScrollReveal";

const formatPrice = (value: number | string) =>
  `${Number(value).toLocaleString("vi-VN")} ₫`;

export default function ProductDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const productId = Number(params.id);

  // Khởi tạo ngay từ bộ nhớ đệm client để khi bấm vào thẻ sản phẩm trang mở bung tức thì không độ trễ
  const initialCachedList = useMemo(() => getCachedProductsSync() || [], []);
  const initialCachedProduct = useMemo(
    () => initialCachedList.find((item) => item.ProductID === productId) || null,
    [initialCachedList, productId]
  );

  const [product, setProduct] = useState<Product | null>(initialCachedProduct);
  const [products, setProducts] = useState<Product[]>(initialCachedList);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [loading, setLoading] = useState(!initialCachedProduct);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [adding, setAdding] = useState(false);

  // States cho Ảnh & Biến thể được chọn
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedConfig, setSelectedConfig] = useState<string | null>(null);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

  useEffect(() => {
    if (!Number.isInteger(productId) || productId <= 0) {
      setError("Sản phẩm không hợp lệ.");
      setLoading(false);
      return;
    }

    let active = true;
    setSelectedImageIndex(0);

    // Nếu chưa có product trong state, thử đọc lại cache
    if (!product) {
      const cached = getCachedProductsSync()?.find((item) => item.ProductID === productId);
      if (cached) {
        setProduct(cached);
        setLoading(false);
      }
    }

    api.getProducts()
      .then((items) => {
        if (!active) return;
        setProducts(items);
        const selected = items.find((item) => item.ProductID === productId);
        if (!selected) {
          setError("Không tìm thấy sản phẩm này.");
        } else {
          setProduct(selected);
          setError("");
        }
      })
      .catch(() => {
        if (active && !product) setError("Không thể tải thông tin sản phẩm.");
      })
      .finally(() => active && setLoading(false));

    api.getProductVariants()
      .then((items) => {
        if (!active) return;
        const itemVariants = items.filter((item) => item.ProductID === productId);
        setVariants(itemVariants);
        if (itemVariants.length > 0) {
          setSelectedVariant(itemVariants[0]);
          setSelectedColor(itemVariants[0].Color?.trim() || null);
          setSelectedConfig(itemVariants[0].Configuration?.trim() || null);
        }
      })
      .catch(() => active && setVariants([]));

    api.getProductReviews(productId)
      .then((items) => active && setReviews(items))
      .catch(() => active && setReviews([]));

    return () => { active = false; };
  }, [productId]);

  // Tổng hợp danh sách ảnh (tách chuỗi theo dấu phẩy, chuẩn hóa URL domain backend)
  const allImages = useMemo(() => {
    if (!product) return ["/placeholder.png"];

    const rawList: string[] = [];

    // Tách các ảnh của sản phẩm chính phân cách bởi dấu phẩy
    if (product.ImageUrl) {
      product.ImageUrl.split(",").forEach((item) => {
        const trimmed = item.trim();
        if (trimmed) rawList.push(trimmed);
      });
    }

    // Tách các ảnh từ biến thể (nếu có)
    variants.forEach((v) => {
      if (v.ImageUrl) {
        v.ImageUrl.split(",").forEach((item) => {
          const trimmed = item.trim();
          if (trimmed && !rawList.includes(trimmed)) {
            rawList.push(trimmed);
          }
        });
      }
    });

    if (rawList.length === 0) return ["/placeholder.png"];

    return rawList.map(resolveApiAssetUrl);
  }, [product, variants]);

  useEffect(() => {
    if (allImages.length <= 1) return;
    const timer = window.setInterval(() => {
      setSelectedImageIndex((current) => (current + 1) % allImages.length);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [allImages.length, selectedImageIndex]);

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

  // Giá và tồn kho hiển thị thay đổi linh hoạt theo biến thể được chọn
  const displayPrice = selectedVariant?.Price ? Number(selectedVariant.Price) : Number(product?.DiscountPrice || product?.Price || 0);
  const displayStock = selectedVariant ? selectedVariant.StockQuantity : product?.StockQuantity;

  async function handleAddToCart(event: React.MouseEvent) {
    if (!product) return;
    animateFlyToCart(event, allImages[selectedImageIndex] || allImages[0] || "");
    setAdding(true);
    try {
      await addToCart({
        ProductID: product.ProductID,
        ProductName: `${product.ProductName}${selectedVariant ? ` (${[selectedVariant.Color, selectedVariant.Configuration].filter(Boolean).join(" - ")})` : ""}`,
        Price: displayPrice,
        ImageUrl: allImages[0] || "",
        StockQuantity: Number(displayStock ?? 0),
      });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Không thể thêm sản phẩm vào giỏ hàng.");
      window.setTimeout(() => setMessage(""), 2500);
    } finally {
      setAdding(false);
    }
  }

  const availableColors = useMemo(() => {
    const list = variants.map((v) => v.Color?.trim()).filter(Boolean) as string[];
    return Array.from(new Set(list));
  }, [variants]);

  const availableConfigs = useMemo(() => {
    const list = variants.map((v) => v.Configuration?.trim()).filter(Boolean) as string[];
    return Array.from(new Set(list));
  }, [variants]);

  const getColorStyle = (colorName: string) => {
    const lower = colorName.toLowerCase();
    if (lower.includes("đen") || lower.includes("black")) return { backgroundColor: "#1e293b" };
    if (lower.includes("trắng") || lower.includes("white")) return { backgroundColor: "#f8fafc", border: "1px solid #cbd5e1" };
    if (lower.includes("xám") || lower.includes("gray") || lower.includes("grey") || lower.includes("space")) return { backgroundColor: "#64748b" };
    if (lower.includes("bạc") || lower.includes("silver")) return { backgroundColor: "#e2e8f0" };
    if (lower.includes("xanh dương") || lower.includes("blue") || lower.includes("midnight")) return { backgroundColor: "#1d4ed8" };
    if (lower.includes("xanh lá") || lower.includes("green")) return { backgroundColor: "#16a34a" };
    if (lower.includes("vàng") || lower.includes("gold")) return { backgroundColor: "#eab308" };
    if (lower.includes("hồng") || lower.includes("pink") || lower.includes("rose")) return { backgroundColor: "#f43f5e" };
    if (lower.includes("đỏ") || lower.includes("red")) return { backgroundColor: "#dc2626" };
    if (lower.includes("tím") || lower.includes("purple")) return { backgroundColor: "#9333ea" };
    return null;
  };

  const handleColorChange = (color: string) => {
    setSelectedColor(color);
    const match =
      variants.find((v) => v.Color?.trim() === color && v.Configuration?.trim() === selectedConfig) ||
      variants.find((v) => v.Color?.trim() === color);
    if (match) {
      setSelectedVariant(match);
      if (match.Configuration) setSelectedConfig(match.Configuration.trim());
      if (match.ImageUrl) {
        const resolved = resolveApiAssetUrl(match.ImageUrl.split(",")[0].trim());
        const idx = allImages.findIndex((img) => img === resolved);
        if (idx !== -1) setSelectedImageIndex(idx);
      }
    }
  };

  const handleConfigChange = (config: string) => {
    setSelectedConfig(config);
    const match =
      variants.find((v) => v.Configuration?.trim() === config && v.Color?.trim() === selectedColor) ||
      variants.find((v) => v.Configuration?.trim() === config);
    if (match) {
      setSelectedVariant(match);
      if (match.Color) setSelectedColor(match.Color.trim());
      if (match.ImageUrl) {
        const resolved = resolveApiAssetUrl(match.ImageUrl.split(",")[0].trim());
        const idx = allImages.findIndex((img) => img === resolved);
        if (idx !== -1) setSelectedImageIndex(idx);
      }
    }
  };

  const handleSelectVariant = (v: ProductVariant | null) => {
    setSelectedVariant(v);
    if (v) {
      setSelectedColor(v.Color?.trim() || null);
      setSelectedConfig(v.Configuration?.trim() || null);
      if (v.ImageUrl) {
        const resolved = resolveApiAssetUrl(v.ImageUrl.split(",")[0].trim());
        const idx = allImages.findIndex((img) => img === resolved);
        if (idx !== -1) {
          setSelectedImageIndex(idx);
        }
      }
    } else {
      setSelectedImageIndex(0);
    }
  };

  const specList = useMemo(() => {
    if (!product) return [];
    return ([
      ["CPU", product.CPU],
      ["RAM", product.RAM],
      ["Lưu trữ", product.Storage],
      ["Màn hình", product.Display],
      ["Tần số quét", product.RefreshRate],
      ["Dòng máy", product.Series],
    ] as const).filter(([, value]) => Boolean(value));
  }, [product]);

  return (
    <main className="store-page min-h-screen pb-16">
      <div className="store-container py-5 sm:py-8 max-w-5xl mx-auto">
        <button
          type="button"
          onClick={() => {
            if (typeof window !== "undefined" && window.history.length > 1) {
              router.back();
            } else {
              router.push("/");
            }
          }}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-xs transition hover:border-slate-300 hover:bg-slate-50 hover:text-blue-600 cursor-pointer"
        >
          <svg className="h-4 w-4 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          <span>Quay lại</span>
        </button>

        {loading && !product && (
          <div className="mt-4 grid animate-pulse gap-6 rounded-3xl bg-white p-4 sm:p-7 shadow-xs border border-slate-200/80 md:grid-cols-2 md:gap-8 items-stretch">
            <div className="h-[380px] sm:h-[480px] rounded-2xl bg-slate-100" />
            <div className="flex flex-col justify-between space-y-4 py-2">
              <div className="space-y-3">
                <div className="h-4 w-24 rounded bg-slate-100" />
                <div className="h-7 w-3/4 rounded bg-slate-100" />
                <div className="h-4 w-1/3 rounded bg-slate-100" />
                <div className="h-9 w-1/2 rounded bg-slate-100" />
              </div>
              <div className="h-12 w-full rounded-xl bg-slate-100" />
            </div>
          </div>
        )}

        {!product && !loading && error && (
          <p role="alert" className="my-8 rounded-xl bg-rose-50 p-5 text-rose-700 font-semibold text-center">
            {error}
          </p>
        )}

        {product && (
          <>
            {/* FORM CHÍNH THÔNG TIN SẢN PHẨM */}
            <section className="product-detail-expand mt-4 grid gap-6 rounded-3xl bg-white p-4 sm:p-7 shadow-xs border border-slate-200/80 md:grid-cols-2 md:gap-8 items-stretch">
              {/* KHUNG ẢNH CÓ SLIDER & THUMBNAILS (KÉO TO FULL 100% CHIỀU CAO THẺ) */}
              <div className="flex flex-col h-full w-full gap-3">
                <div className="relative flex flex-1 w-full h-full min-h-[380px] sm:min-h-[480px] items-center justify-center rounded-2xl bg-slate-50/90 p-2 sm:p-4 border border-slate-100/90 overflow-hidden group">
                  <img
                    src={allImages[selectedImageIndex] || "/placeholder.png"}
                    alt={product.ProductName}
                    className="product-detail-image-bloom w-full h-full max-h-[460px] sm:max-h-[540px] object-contain transition-transform duration-300 group-hover:scale-[1.03]"
                  />
                  <FavoriteButton product={product} />

                  {/* Nút bấm chuyển ảnh */}
                  {allImages.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={() => setSelectedImageIndex((prev) => (prev === 0 ? allImages.length - 1 : prev - 1))}
                        className="absolute left-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-slate-700 shadow-md hover:bg-white transition z-10"
                        aria-label="Ảnh trước"
                      >
                        ‹
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedImageIndex((prev) => (prev === allImages.length - 1 ? 0 : prev + 1))}
                        className="absolute right-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-slate-700 shadow-md hover:bg-white transition z-10"
                        aria-label="Ảnh tiếp theo"
                      >
                        ›
                      </button>
                    </>
                  )}
                </div>

                {/* Danh sách ảnh thu nhỏ (Thumbnails) */}
                {allImages.length > 1 && (
                  <div className="flex gap-2.5 overflow-x-auto pt-1 pb-1 shrink-0">
                    {allImages.map((img, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedImageIndex(idx)}
                        aria-label={`Xem ảnh ${idx + 1}`}
                        aria-pressed={selectedImageIndex === idx}
                        className={`h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl border-2 transition ${selectedImageIndex === idx ? "border-blue-600 shadow-xs" : "border-slate-200 opacity-70 hover:opacity-100"}`}
                      >
                        <img src={img} alt="" className="h-full w-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* THÔNG TIN & CÁC MỤC CHỌN PHIÊN BẢN */}
              <div className="flex flex-col justify-between">
                <div>
                  <p className="text-[11px] font-extrabold uppercase tracking-wider text-blue-600">MANB SHOP</p>
                  <h1 className="mt-1 text-lg sm:text-xl font-black text-slate-900 leading-snug">{product.ProductName}</h1>
                  
                  <div className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-slate-600">
                    {reviews.length > 0 ? (
                      <a href="#reviews" className="font-semibold text-amber-600 hover:underline">
                        ★ {averageRating.toFixed(1)} · {reviews.length} đánh giá
                      </a>
                    ) : (
                      <span>Chưa có đánh giá</span>
                    )}
                    <span>•</span>
                    <span className={Number(displayStock ?? 0) > 0 ? "text-emerald-700 font-semibold" : "text-rose-600 font-semibold"}>
                      {Number(displayStock ?? 0) > 0 ? `Còn ${displayStock} sản phẩm` : "Tạm hết hàng"}
                    </span>
                  </div>

                  <div className="mt-3.5 flex flex-wrap items-baseline gap-2.5">
                    <strong className="text-2xl sm:text-3xl font-black text-blue-700">{formatPrice(displayPrice)}</strong>
                    {product.DiscountPrice && Number(product.DiscountPrice) < Number(product.Price) && !selectedVariant?.Price && (
                      <del className="text-xs text-slate-400 font-medium">{formatPrice(product.Price)}</del>
                    )}
                  </div>

                  {/* 1. MỤC CHỌN MÀU SẮC RIÊNG BIỆT */}
                  {availableColors.length > 0 && (
                    <div className="mt-3.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-800">Màu sắc:</label>
                        {selectedColor && <span className="text-[11px] font-bold text-blue-600">{selectedColor}</span>}
                      </div>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {availableColors.map((color) => {
                          const isSelected = selectedColor === color;
                          const colorStyle = getColorStyle(color);
                          return (
                            <button
                              key={color}
                              type="button"
                              onClick={() => handleColorChange(color)}
                              className={`flex items-center gap-1.5 rounded-lg border-2 px-3 py-1.5 text-xs font-bold transition ${
                                isSelected
                                  ? "border-blue-600 bg-blue-50/90 text-blue-700 shadow-xs"
                                  : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50/60"
                              }`}
                            >
                              {colorStyle && (
                                <span
                                  className="h-3.5 w-3.5 rounded-full shadow-xs shrink-0"
                                  style={colorStyle}
                                />
                              )}
                              <span>{color}</span>
                              {isSelected && (
                                <svg className="h-3 w-3 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* 2. MỤC CHỌN CẤU HÌNH / PHIÊN BẢN RIÊNG BIỆT */}
                  {availableConfigs.length > 0 && (
                    <div className="mt-3">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-800">Cấu hình / Dung lượng:</label>
                        {selectedConfig && <span className="text-[11px] font-bold text-blue-600">{selectedConfig}</span>}
                      </div>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {availableConfigs.map((config) => {
                          const isSelected = selectedConfig === config;
                          const matchingVar =
                            variants.find((v) => v.Configuration?.trim() === config && (!selectedColor || v.Color?.trim() === selectedColor)) ||
                            variants.find((v) => v.Configuration?.trim() === config);
                          const price = matchingVar?.Price;

                          return (
                            <button
                              key={config}
                              type="button"
                              onClick={() => handleConfigChange(config)}
                              className={`flex items-center gap-1.5 rounded-lg border-2 px-3 py-1.5 text-xs font-bold transition ${
                                isSelected
                                  ? "border-blue-600 bg-blue-50/90 text-blue-700 shadow-xs"
                                  : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50/60"
                              }`}
                            >
                              <span>{config}</span>
                              {price ? (
                                <span className={`text-[10.5px] font-semibold ${isSelected ? "text-blue-600" : "text-slate-400"}`}>
                                  ({formatPrice(price)})
                                </span>
                              ) : null}
                              {isSelected && (
                                <svg className="h-3 w-3 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* 3. NẾU BIẾN THỂ KHÔNG TÁCH MÀU/CẤU HÌNH ĐƯỢC THÌ HIỂN THỊ DANH SÁCH PHIÊN BẢN */}
                  {availableColors.length === 0 && availableConfigs.length === 0 && variants.length > 0 && (
                    <div className="mt-3">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-800">Phiên bản:</label>
                        {selectedVariant && (
                          <span className="text-[11px] font-semibold text-blue-600">
                            {[selectedVariant.Color, selectedVariant.Configuration].filter(Boolean).join(" - ") || `Phiên bản #${selectedVariant.VariantID}`}
                          </span>
                        )}
                      </div>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {variants.map((v) => {
                          const isSelected = selectedVariant?.VariantID === v.VariantID;
                          const labelText = [v.Color, v.Configuration].filter(Boolean).join(" - ") || `Phiên bản #${v.VariantID}`;
                          return (
                            <button
                              key={v.VariantID}
                              type="button"
                              onClick={() => handleSelectVariant(v)}
                              className={`flex items-center gap-1.5 rounded-lg border-2 px-3 py-1.5 text-xs font-bold transition ${
                                isSelected
                                  ? "border-blue-600 bg-blue-50/90 text-blue-700 shadow-xs"
                                  : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50/60"
                              }`}
                            >
                              <span>{labelText}</span>
                              {v.Price ? <span className="text-[10.5px] font-semibold">({formatPrice(v.Price)})</span> : null}
                              {isSelected && (
                                <svg className="h-3 w-3 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* 4. SẢN PHẨM KHÔNG CÓ BIẾN THỂ */}
                  {variants.length === 0 && (
                    <div className="mt-3">
                      <label className="text-xs font-bold text-slate-800">Phiên bản:</label>
                      <div className="mt-1.5 flex flex-wrap gap-2">
                        <div className="flex items-center gap-1.5 rounded-lg border-2 border-blue-600 bg-blue-50/90 px-3 py-1.5 text-xs font-bold text-blue-700 shadow-xs">
                          <svg className="h-3.5 w-3.5 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          <span>{product.RAM || product.Storage ? [product.RAM, product.Storage].filter(Boolean).join(" - ") : "Bản tiêu chuẩn (Mặc định)"}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-5">
                  {message && <p role="status" className="mb-2 rounded-lg bg-blue-50 p-2.5 text-xs text-blue-800">{message}</p>}
                  
                  <button 
                    onClick={(e) => handleAddToCart(e)} 
                    disabled={adding || Number(displayStock ?? 0) <= 0} 
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-xs sm:text-sm font-black text-white shadow-md transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
                    <span>{adding ? "Đang thêm vào giỏ..." : Number(displayStock ?? 0) <= 0 ? "Hết hàng" : "Thêm vào giỏ hàng"}</span>
                  </button>
                </div>
              </div>
            </section>

            {/* FORM THÔNG SỐ KỸ THUẬT & MÔ TẢ SẢN PHẨM RIÊNG BIỆT */}
            {(product.Description || specList.length > 0) && (
              <section className="mt-6 rounded-2xl bg-white p-5 sm:p-7 shadow-xs border border-slate-100">
                {/* THÔNG SỐ KỸ THUẬT */}
                {specList.length > 0 && (
                  <div className={product.Description ? "mb-6 pb-6 border-b border-slate-100" : ""}>
                    <div className="flex items-center gap-2 pb-3">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
                      </span>
                      <h2 className="text-base sm:text-lg font-bold text-slate-900">Thông số kỹ thuật</h2>
                    </div>

                    <dl className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {specList.map(([label, value]) => (
                        <div key={label} className="flex items-center justify-between rounded-xl bg-slate-50 px-3.5 py-2.5 border border-slate-100">
                          <dt className="text-xs text-slate-500 font-medium">{label}</dt>
                          <dd className="text-xs font-bold text-slate-900">{value}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                )}

                {/* MÔ TẢ SẢN PHẨM CÓ NÚT XEM THÊM */}
                {product.Description && (
                  <div>
                    <div className="flex items-center gap-2 pb-3">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                          <line x1="16" y1="13" x2="8" y2="13" />
                          <line x1="16" y1="17" x2="8" y2="17" />
                          <line x1="10" y1="9" x2="8" y2="9" />
                        </svg>
                      </span>
                      <h2 className="text-base sm:text-lg font-bold text-slate-900">Mô tả chi tiết sản phẩm</h2>
                    </div>

                    <div className="relative mt-2">
                      <div
                        className={`whitespace-pre-line text-sm leading-relaxed text-slate-600 transition-all duration-300 ${
                          !isDescriptionExpanded && product.Description.length > 280
                            ? "max-h-36 overflow-hidden"
                            : ""
                        }`}
                      >
                        {product.Description}
                      </div>

                      {/* Hiệu ứng mờ dần phía dưới khi chưa bấm Xem thêm */}
                      {!isDescriptionExpanded && product.Description.length > 280 && (
                        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white via-white/80 to-transparent pointer-events-none" />
                      )}
                    </div>

                    {product.Description.length > 280 && (
                      <div className="mt-3 text-center border-t border-slate-50 pt-3">
                        <button
                          type="button"
                          onClick={() => setIsDescriptionExpanded((prev) => !prev)}
                          className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50/70 px-5 py-2 text-xs font-bold text-blue-700 transition hover:bg-blue-100 hover:border-blue-300"
                        >
                          {isDescriptionExpanded ? (
                            <>
                              <span>Thu gọn mô tả</span>
                              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="18 15 12 9 6 15"/></svg>
                            </>
                          ) : (
                            <>
                              <span>Xem thêm toàn bộ mô tả</span>
                              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </section>
            )}

            {/* Đánh giá sản phẩm */}
            <section id="reviews" className="mt-6 rounded-2xl bg-white p-5 sm:p-7 shadow-xs border border-slate-100">
              <div className="flex flex-wrap items-end justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                  </span>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-slate-900">Đánh giá sản phẩm</h2>
                  </div>
                </div>
                {reviews.length > 0 && <p className="text-xs font-bold text-amber-600">★ {averageRating.toFixed(1)} / 5 ({reviews.length} lượt đánh giá)</p>}
              </div>
              {reviews.length === 0 ? (
                <p className="mt-4 rounded-xl bg-slate-50 p-4 text-xs text-slate-500 text-center">Sản phẩm chưa có đánh giá nào từ người mua.</p>
              ) : (
                <ul className="mt-4 divide-y divide-slate-100">
                  {reviews.map((review) => (
                    <li key={review.ReviewID} className="py-4 first:pt-0 last:pb-0">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-bold text-xs text-slate-900">{review.User?.FullName || "Khách hàng"}</p>
                        <time className="text-[11px] text-slate-400">
                          {review.ReviewDate && !Number.isNaN(Date.parse(review.ReviewDate))
                            ? new Date(review.ReviewDate).toLocaleDateString("vi-VN")
                            : ""}
                        </time>
                      </div>
                      <p className="mt-1 text-xs text-amber-500" aria-label={`${Number(review.Rating)} trên 5 sao`}>
                        {"★".repeat(Math.min(5, Math.max(0, Number(review.Rating) || 0)))}{"☆".repeat(5 - Math.min(5, Math.max(0, Number(review.Rating) || 0)))}
                      </p>
                      {review.Comment && <p className="mt-1.5 whitespace-pre-line text-xs leading-relaxed text-slate-600">{review.Comment}</p>}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* Sản phẩm liên quan */}
            {relatedProducts.length > 0 && (
              <section className="mt-8">
                <div className="section-heading mb-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-blue-600">GỢI Ý CHO BẠN</p>
                    <h2 className="text-lg sm:text-xl font-black text-slate-900">Sản phẩm liên quan</h2>
                  </div>
                  <Link href="/customer/products" className="text-xs font-bold text-blue-600 hover:underline">Xem tất cả →</Link>
                </div>
                <div className="product-grid">
                  {relatedProducts.map((item, idx) => (
                    <ScrollReveal key={item.ProductID} index={idx}>
                      <Link
                        href={`/customer/products/${item.ProductID}`}
                        className="product-card block p-4 transition hover:-translate-y-1 hover:shadow-md h-full"
                      >
                        <div className="product-image">
                          <img
                            src={getPrimaryProductImage(item.ImageUrl) || "/placeholder.png"}
                            alt={item.ProductName}
                          />
                        </div>
                        <h3 className="mt-3 font-bold text-slate-900 text-xs sm:text-sm">{item.ProductName}</h3>
                        <p className="mt-2 font-black text-blue-700 text-sm sm:text-base">
                          {formatPrice(item.DiscountPrice || item.Price)}
                        </p>
                      </Link>
                    </ScrollReveal>
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
