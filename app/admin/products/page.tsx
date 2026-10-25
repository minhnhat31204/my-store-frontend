'use client';

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { api, getPrimaryProductImage, Product, ProductVariant, resolveApiAssetUrl, StoreCategory } from '@/lib/api';
import Pagination from '@/app/admin/components/Pagination';

interface SpecItem {
  id: string;
  key: string;
  value: string;
}

interface VariantItem {
  id: string;
  variantId?: number;
  color: string;
  configuration: string;
  price: string;
  stockQuantity: string;
}

function createNewSpec(key = '', value = ''): SpecItem {
  return {
    id: `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    key,
    value,
  };
}

function createNewVariant(color = '', configuration = '', price = '', stockQuantity = '0'): VariantItem {
  return {
    id: `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    color,
    configuration,
    price,
    stockQuantity,
  };
}

const COMMON_SPEC_SUGGESTIONS = [
  'CPU',
  'RAM',
  'Ổ cứng',
  'Card đồ họa (VGA)',
  'Màn hình',
  'Tần số quét',
  'Pin',
  'Trọng lượng',
  'Bảo hành',
];

const emptyForm = {
  ProductName: '',
  CategoryID: '',
  Price: '',
  DiscountPrice: '',
  StockQuantity: '0',
  ExtraNotes: '',
};

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<StoreCategory[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [specsList, setSpecsList] = useState<SpecItem[]>([]);
  const [variantsList, setVariantsList] = useState<VariantItem[]>([]);
  const [deletedVariantIds, setDeletedVariantIds] = useState<number[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [stockFilter, setStockFilter] = useState<'all' | 'instock' | 'lowstock' | 'outofstock'>('all');

  // State quản lý danh sách nhiều ảnh theo thứ tự 1...
  const [imageList, setImageList] = useState<string[]>([]);
  const [urlInput, setUrlInput] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const data = await api.getProducts();
      setProducts(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không tải được danh sách sản phẩm');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    api.getCategories().then((data) => setCategories(Array.isArray(data) ? data : [])).catch(() => setCategories([]));
  }, []);

  const stats = useMemo(() => {
    let instock = 0;
    let lowstock = 0;
    let outofstock = 0;
    for (const p of products) {
      const q = Number(p.StockQuantity ?? 0);
      if (q <= 0) outofstock++;
      else if (q <= 5) lowstock++;
      else instock++;
    }
    return { total: products.length, instock, lowstock, outofstock };
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const name = (p.ProductName || '').toLowerCase();
      const id = String(p.ProductID);
      const matchSearch = !searchTerm.trim() || name.includes(searchTerm.toLowerCase().trim()) || id.includes(searchTerm.trim());

      const stock = Number(p.StockQuantity ?? 0);
      let matchStock = true;
      if (stockFilter === 'instock') matchStock = stock > 5;
      else if (stockFilter === 'lowstock') matchStock = stock > 0 && stock <= 5;
      else if (stockFilter === 'outofstock') matchStock = stock <= 0;

      return matchSearch && matchStock;
    });
  }, [products, searchTerm, stockFilter]);
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / 20));
  const currentPage = Math.min(page, totalPages);
  const visibleProducts = filteredProducts.slice((currentPage - 1) * 20, currentPage * 20);

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setImageList([]);
    setUrlInput('');
    setShowUrlInput(false);
    setVariantsList([]);
    setDeletedVariantIds([]);
    setSpecsList([
      createNewSpec('CPU', ''),
      createNewSpec('RAM', ''),
      createNewSpec('Ổ cứng', ''),
      createNewSpec('Màn hình', ''),
    ]);
    setError('');
    setOpen(true);
  }

  async function openEdit(item: Product) {
    setEditingId(item.ProductID);
    setForm({
      ProductName: item.ProductName || '',
      CategoryID: item.CategoryID != null ? String(item.CategoryID) : '',
      Price: String(item.Price ?? ''),
      DiscountPrice: item.DiscountPrice != null ? String(item.DiscountPrice) : '',
      StockQuantity: String(item.StockQuantity ?? 0),
      ExtraNotes: '',
    });

    const rawImgs = item.ImageUrl ? item.ImageUrl.split(',').map((s) => s.trim()).filter(Boolean) : [];
    const uniqueImgs = Array.from(new Set(rawImgs));
    setImageList(uniqueImgs);
    setUrlInput('');
    setShowUrlInput(false);
    setVariantsList([]);
    setDeletedVariantIds([]);

    // Phân tích và nạp danh sách thông số kỹ thuật (Specs)
    const parsedSpecs: SpecItem[] = [];
    const handledKeys = new Set<string>();

    const standardFields: [string, string | null | undefined][] = [
      ['CPU', item.CPU],
      ['RAM', item.RAM],
      ['Ổ cứng', item.Storage],
      ['Màn hình', item.Display],
      ['Tần số quét', item.RefreshRate],
      ['Dòng máy', item.Series],
    ];

    for (const [key, val] of standardFields) {
      if (val) {
        parsedSpecs.push(createNewSpec(key, val));
        handledKeys.add(key.toLowerCase());
      }
    }

    const leftoverLines: string[] = [];
    if (item.Description) {
      const lines = item.Description.split('\n');
      for (const rawLine of lines) {
        const line = rawLine.replace(/^[•\-\*\+\s]+/, '').trim();
        if (!line) continue;
        const colonIndex = line.indexOf(':');
        if (colonIndex > 0) {
          const k = line.slice(0, colonIndex).trim();
          const v = line.slice(colonIndex + 1).trim();
          const normK = k.toLowerCase();
          if (!handledKeys.has(normK)) {
            parsedSpecs.push(createNewSpec(k, v));
            handledKeys.add(normK);
          }
        } else {
          leftoverLines.push(line);
        }
      }
    }

    if (leftoverLines.length > 0) {
      setForm((prev) => ({ ...prev, ExtraNotes: leftoverLines.join('\n') }));
    }

    if (parsedSpecs.length === 0) {
      parsedSpecs.push(
        createNewSpec('CPU', ''),
        createNewSpec('RAM', ''),
        createNewSpec('Ổ cứng', ''),
        createNewSpec('Màn hình', ''),
      );
    }

    setSpecsList(parsedSpecs);
    setError('');
    setOpen(true);

    // Tải danh sách các phiên bản (Variants) hiện có của sản phẩm này
    try {
      const allVariants = await api.getProductVariants();
      const currentVariants = (Array.isArray(allVariants) ? allVariants : []).filter(
        (v) => v.ProductID === item.ProductID
      );
      setVariantsList(
        currentVariants.map((v) => ({
          id: String(v.VariantID),
          variantId: v.VariantID,
          color: v.Color || '',
          configuration: v.Configuration || '',
          price: v.Price != null ? String(v.Price) : '',
          stockQuantity: String(v.StockQuantity ?? 0),
        }))
      );
    } catch (vErr) {
      console.warn('Không tải được phiên bản biến thể:', vErr);
    }
  }

  function handleAddImageUrl() {
    if (!urlInput.trim()) return;
    let parsed: URL;
    try {
      parsed = new URL(urlInput.trim());
    } catch {
      setError('URL ảnh không hợp lệ.');
      return;
    }
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      setError('URL ảnh phải bắt đầu bằng http:// hoặc https://.');
      return;
    }
    setImageList((current) => current.includes(parsed.toString()) ? current : [...current, parsed.toString()]);
    setError('');
    setUrlInput('');
    setShowUrlInput(false);
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    setError('');
    setUploadingImages(true);
    const uploadedUrls: string[] = [];

    try {
      for (const file of fileArray) {
        const data = await api.uploadProductImage(file);
        if (data.success && data.url) {
          uploadedUrls.push(data.url);
        } else {
          throw new Error(data.message || 'Upload thất bại');
        }
      }
    } catch (err) {
      console.error('Lỗi upload ảnh:', err);
      setError(err instanceof Error ? err.message : 'Không thể tải ảnh lên máy chủ.');
    } finally {
      if (uploadedUrls.length) setImageList((current) => [...current, ...uploadedUrls]);
      setUploadingImages(false);
      e.target.value = '';
    }
  }

  function handleRemoveImage(index: number) {
    setImageList((current) => current.filter((_, i) => i !== index));
  }

  function handleMoveImage(index: number, direction: -1 | 1) {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= imageList.length) return;
    setImageList((current) => {
      const list = [...current];
      const [item] = list.splice(index, 1);
      list.splice(targetIndex, 0, item);
      return list;
    });
  }

  // Quản lý từng mục thông số kỹ thuật chi tiết
  function handleAddSpec(key = '', value = '') {
    setSpecsList((current) => [...current, createNewSpec(key, value)]);
  }

  function handleRemoveSpec(id: string) {
    setSpecsList((current) => current.filter((s) => s.id !== id));
  }

  function handleUpdateSpecKey(id: string, newKey: string) {
    setSpecsList((current) =>
      current.map((s) => (s.id === id ? { ...s, key: newKey } : s))
    );
  }

  function handleUpdateSpecValue(id: string, newValue: string) {
    setSpecsList((current) =>
      current.map((s) => (s.id === id ? { ...s, value: newValue } : s))
    );
  }

  // Quản lý phiên bản sản phẩm (Variants)
  function handleAddVariant(color = '', configuration = '', price = '', stockQuantity = '0') {
    setVariantsList((current) => [...current, createNewVariant(color, configuration, price, stockQuantity)]);
  }

  function handleRemoveVariant(index: number) {
    const item = variantsList[index];
    if (item && item.variantId) {
      setDeletedVariantIds((prev) => [...prev, item.variantId!]);
    }
    setVariantsList((current) => current.filter((_, i) => i !== index));
  }

  function handleUpdateVariant(index: number, field: keyof VariantItem, value: string) {
    setVariantsList((current) =>
      current.map((v, i) => (i === index ? { ...v, [field]: value } : v))
    );
  }

  async function save(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');

    const combinedImageUrl = imageList.join(',') || null;

    // Lọc các thông số kỹ thuật hợp lệ
    const validSpecs = specsList.filter((s) => s.key.trim() || s.value.trim());

    let cpu = '';
    let ram = '';
    let storage = '';
    let display = '';
    let refreshRate = '';
    let series = '';

    validSpecs.forEach((s) => {
      const k = s.key.trim().toLowerCase();
      const v = s.value.trim();
      if (k.includes('cpu') || k.includes('vi xử lý')) cpu = v;
      else if (k.includes('ram')) ram = v;
      else if (k.includes('ổ cứng') || k.includes('ssd') || k.includes('hdd') || k.includes('storage') || k.includes('lưu trữ')) storage = v;
      else if (k.includes('màn hình') || k.includes('display') || k.includes('màn')) display = v;
      else if (k.includes('tần số quét') || k.includes('refresh') || k.includes('hz')) refreshRate = v;
      else if (k.includes('dòng máy') || k.includes('series')) series = v;
    });

    // Tạo chuỗi mô tả thông số chi tiết chuẩn hóa theo từng gạch đầu dòng
    const descLines: string[] = [];
    validSpecs.forEach((s) => {
      if (s.key.trim() && s.value.trim()) {
        descLines.push(`• ${s.key.trim()}: ${s.value.trim()}`);
      } else if (s.value.trim()) {
        descLines.push(`• ${s.value.trim()}`);
      }
    });

    if (form.ExtraNotes?.trim()) {
      if (descLines.length > 0) descLines.push('');
      descLines.push(form.ExtraNotes.trim());
    }

    const finalDescription = descLines.join('\n').trim() || null;
    const rawPrice = Number(form.Price);
    const rawDiscount = form.DiscountPrice.trim() ? Number(form.DiscountPrice) : null;

    const payload: Partial<Product> = {
      ProductName: form.ProductName.trim(),
      CategoryID: form.CategoryID ? Number(form.CategoryID) : null,
      Price: rawPrice,
      DiscountPrice: rawDiscount,
      StockQuantity: Number(form.StockQuantity || 0),
      ImageUrl: combinedImageUrl,
      Description: finalDescription,
      CPU: cpu || null,
      RAM: ram || null,
      Storage: storage || null,
      Display: display || null,
      RefreshRate: refreshRate || null,
      Series: series || null,
    };

    try {
      if (!payload.ProductName || !Number.isFinite(payload.Price) || Number(payload.Price) < 0) {
        throw new Error('Tên sản phẩm và Giá bán gốc không hợp lệ.');
      }
      if (rawDiscount != null) {
        if (!Number.isFinite(rawDiscount) || rawDiscount < 0) {
          throw new Error('Giá hiển thị / khuyến mãi không hợp lệ.');
        }
        if (rawDiscount > Number(payload.Price)) {
          throw new Error('Giá hiển thị / khuyến mãi không được lớn hơn Giá bán gốc.');
        }
      }

      let targetProductId = editingId;

      if (editingId === null) {
        const created = await api.createProduct(payload);
        targetProductId = created.ProductID;
      } else {
        await api.updateProduct(editingId, payload);
      }

      // Đồng bộ các phiên bản (Variants)
      if (targetProductId) {
        // 1. Xóa các phiên bản đã bấm nút xóa
        for (const vId of deletedVariantIds) {
          try {
            await api.deleteProductVariant(vId);
          } catch (delErr) {
            console.error('Lỗi khi xóa variant:', delErr);
          }
        }

        // 2. Thêm mới hoặc cập nhật các phiên bản còn lại
        for (const v of variantsList) {
          const hasContent = v.color.trim() || v.configuration.trim() || v.price.trim();
          if (!hasContent) continue;

          const variantPayload: Partial<ProductVariant> = {
            ProductID: targetProductId,
            Color: v.color.trim() || undefined,
            Configuration: v.configuration.trim() || undefined,
            Price: v.price.trim() ? Number(v.price) : Number(payload.Price),
            StockQuantity: Number(v.stockQuantity || 0),
          };

          if (v.variantId) {
            await api.updateProductVariant(v.variantId, variantPayload);
          } else {
            await api.createProductVariant(variantPayload);
          }
        }
      }

      setOpen(false);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Lưu sản phẩm thất bại.');
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: number) {
    if (!window.confirm('Bạn có chắc muốn xóa sản phẩm này khỏi hệ thống?')) return;
    try {
      await api.deleteProduct(id);
      setProducts((current) => current.filter((item) => item.ProductID !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Xóa thất bại');
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fadeIn">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-900/90 p-6 sm:p-7 rounded-3xl border border-slate-800/80 shadow-2xl">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold mb-2">
            📦 Phân hệ Quản lý Kho & Danh mục
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Quản Lý Sản Phẩm
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Thiết lập giá bán gốc, giá hiển thị khuyến mãi, thư viện ảnh thứ tự từ 1..., thông số chi tiết và phiên bản (variants).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 hover:bg-blue-500 px-5 py-2.5 text-sm font-bold text-white transition shadow-lg shadow-blue-600/30 active:scale-95"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            <span>Thêm Sản Phẩm Mới</span>
          </button>
        </div>
      </div>

      {/* Stock Summary Statistics Badges */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <button
          onClick={() => { setStockFilter('all'); setPage(1); }}
          className={`p-4 rounded-2xl border text-left transition ${
            stockFilter === 'all'
              ? 'bg-blue-600/10 border-blue-500/50 shadow-lg shadow-blue-950/40'
              : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700'
          }`}
        >
          <p className="text-xs font-bold text-slate-400">Tất cả sản phẩm</p>
          <p className="text-2xl font-black text-white mt-1">{stats.total}</p>
        </button>

        <button
          onClick={() => { setStockFilter('instock'); setPage(1); }}
          className={`p-4 rounded-2xl border text-left transition ${
            stockFilter === 'instock'
              ? 'bg-emerald-600/10 border-emerald-500/50 shadow-lg shadow-emerald-950/40'
              : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700'
          }`}
        >
          <p className="text-xs font-bold text-emerald-400">Còn hàng (&gt; 5)</p>
          <p className="text-2xl font-black text-emerald-300 mt-1">{stats.instock}</p>
        </button>

        <button
          onClick={() => { setStockFilter('lowstock'); setPage(1); }}
          className={`p-4 rounded-2xl border text-left transition ${
            stockFilter === 'lowstock'
              ? 'bg-amber-600/10 border-amber-500/50 shadow-lg shadow-amber-950/40'
              : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700'
          }`}
        >
          <p className="text-xs font-bold text-amber-400">Sắp hết hàng (1-5)</p>
          <p className="text-2xl font-black text-amber-300 mt-1">{stats.lowstock}</p>
        </button>

        <button
          onClick={() => { setStockFilter('outofstock'); setPage(1); }}
          className={`p-4 rounded-2xl border text-left transition ${
            stockFilter === 'outofstock'
              ? 'bg-rose-600/10 border-rose-500/50 shadow-lg shadow-rose-950/40'
              : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700'
          }`}
        >
          <p className="text-xs font-bold text-rose-400">Hết hàng (0)</p>
          <p className="text-2xl font-black text-rose-300 mt-1">{stats.outofstock}</p>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/80 p-4 rounded-2xl border border-slate-800/80 shadow-lg">
        <div className="relative flex-1">
          <svg className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Tìm kiếm theo mã sản phẩm hoặc tên máy..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
          />
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm font-semibold">
          {error}
        </div>
      )}

      {/* Product List / Table */}
      {loading ? (
        <div className="p-16 text-center text-slate-400 font-medium">
          <div className="inline-block w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-3" />
          <p>Đang đồng bộ dữ liệu sản phẩm từ máy chủ...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="p-16 text-center border border-dashed border-slate-800 rounded-3xl text-slate-400 bg-slate-900/30">
          Không tìm thấy sản phẩm nào khớp với điều kiện tìm kiếm.
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-slate-800/80 bg-slate-900/90 shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/80 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-5 py-4">Mã SP</th>
                  <th className="px-5 py-4">Hình ảnh</th>
                  <th className="px-5 py-4">Tên & Cấu hình</th>
                  <th className="px-5 py-4">Giá bán / Hiển thị</th>
                  <th className="px-5 py-4">Tồn kho</th>
                  <th className="px-5 py-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {visibleProducts.map((item) => {
                  const stock = Number(item.StockQuantity ?? 0);
                  const isLow = stock > 0 && stock <= 5;
                  const isOut = stock <= 0;
                  const images = item.ImageUrl ? item.ImageUrl.split(',').map((s) => s.trim()).filter(Boolean) : [];
                  const hasDiscount = item.DiscountPrice != null && Number(item.DiscountPrice) > 0 && Number(item.DiscountPrice) < Number(item.Price);

                  return (
                    <tr key={item.ProductID} className="hover:bg-slate-800/40 transition">
                      <td className="px-5 py-4 font-mono font-bold text-slate-400 text-xs">
                        #{item.ProductID}
                      </td>
                      <td className="px-5 py-4">
                        {images.length > 0 ? (
                          <div className="relative w-14 h-14 rounded-2xl border border-slate-800 overflow-hidden bg-slate-950 flex items-center justify-center group">
                            <img
                              src={resolveApiAssetUrl(images[0])}
                              alt={item.ProductName}
                              className="w-full h-full object-contain p-1"
                            />
                            {images.length > 1 && (
                              <span className="absolute bottom-0 right-0 bg-blue-600/90 text-[9px] font-black text-white px-1 rounded-tl-md">
                                +{images.length - 1}
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="w-14 h-14 flex items-center justify-center bg-slate-950 text-[10px] text-slate-500 rounded-2xl border border-slate-800">
                            Không ảnh
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-bold text-white text-sm max-w-xs sm:max-w-md line-clamp-2">
                          {item.ProductName}
                        </p>
                        <p className="mt-1 text-[11px] font-semibold text-cyan-300">
                          {categories.find((category) => category.CategoryID === Number(item.CategoryID))?.CategoryName || 'Chưa phân loại'}
                        </p>
                        {item.Description && (
                          <p className="text-xs text-slate-400 max-w-xs sm:max-w-md truncate mt-1">
                            {item.Description}
                          </p>
                        )}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        {hasDiscount ? (
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-emerald-400 text-sm">
                                {Number(item.DiscountPrice).toLocaleString('vi-VN')} ₫
                              </span>
                              <span className="text-[10px] font-black text-rose-300 bg-rose-500/20 border border-rose-500/30 px-1.5 py-0.2 rounded-full">
                                -{Math.round(((Number(item.Price) - Number(item.DiscountPrice)) / Number(item.Price)) * 100)}%
                              </span>
                            </div>
                            <span className="line-through text-slate-500 text-xs block mt-0.5">
                              {Number(item.Price).toLocaleString('vi-VN')} ₫
                            </span>
                          </div>
                        ) : (
                          <span className="font-bold text-emerald-400 whitespace-nowrap text-sm">
                            {Number(item.Price).toLocaleString('vi-VN')} ₫
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        {isOut ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                            Hết hàng (0)
                          </span>
                        ) : isLow ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            Sắp hết ({stock})
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            Còn {stock} máy
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right whitespace-nowrap space-x-2">
                        <button
                          onClick={() => void openEdit(item)}
                          className="px-3 py-1.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs font-bold transition active:scale-95"
                        >
                          Chỉnh sửa
                        </button>
                        <button
                          onClick={() => void remove(item.ProductID)}
                          className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold transition active:scale-95"
                        >
                          Xóa
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Pagination currentPage={currentPage} totalItems={filteredProducts.length} onPageChange={setPage} />

      {/* Modal Thêm / Sửa Sản Phẩm (Bố cục flexbox chống lỗi cuộn dính header) */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-6 backdrop-blur-md">
          <form
            onSubmit={save}
            className="w-full max-w-3xl flex flex-col rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl text-slate-200 max-h-[92vh] overflow-hidden"
          >
            {/* Header Modal (Cố định ở đỉnh, không bị trôi, không dính hay chồng lấn khi cuộn) */}
            <div className="flex items-center justify-between px-6 py-4 sm:px-8 sm:py-5 border-b border-slate-800 bg-slate-900 shrink-0">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400">
                  {editingId === null ? 'Tạo mới sản phẩm' : 'Cập nhật sản phẩm'}
                </span>
                <h2 className="text-xl font-black text-white mt-0.5">
                  {editingId === null ? 'Thêm Sản Phẩm Vào Kho' : `Chỉnh Sửa Sản Phẩm #${editingId}`}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition"
              >
                ✕
              </button>
            </div>

            {/* Body Modal (Vùng cuộn nội dung độc lập, mượt mà và sạch sẽ) */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-8 space-y-5">
              {error && (
                <p className="rounded-2xl bg-rose-500/10 border border-rose-500/20 p-3 text-xs font-semibold text-rose-300">
                  {error}
                </p>
              )}

              {/* Tên sản phẩm */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Tên sản phẩm đầy đủ *
                </label>
                <input
                  required
                  type="text"
                  placeholder="VD: Laptop DELL XPS 13 Plus 9320 (i7-1360P / 16GB / 512GB / 3.5K OLED Touch)..."
                  value={form.ProductName}
                  onChange={(e) => setForm({ ...form, ProductName: e.target.value })}
                  className="w-full rounded-2xl bg-slate-950 border border-slate-800 p-3 text-sm text-white focus:outline-none focus:border-blue-500 transition placeholder:text-slate-600"
                />
              </div>

              <div>
                <label htmlFor="product-category" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-300">Danh mục</label>
                <select
                  id="product-category"
                  value={form.CategoryID}
                  onChange={(e) => setForm({ ...form, CategoryID: e.target.value })}
                  className="w-full rounded-2xl border border-slate-800 bg-slate-950 p-3 text-sm text-white outline-none transition focus:border-blue-500"
                >
                  <option value="">Chưa phân loại</option>
                  {categories.map((category) => <option key={category.CategoryID} value={category.CategoryID}>{category.CategoryName}</option>)}
                </select>
                {categories.length === 0 && <p className="mt-1.5 text-[11px] text-amber-300">Chưa có danh mục. Tạo danh mục trong mục “Quản lý danh mục”.</p>}
              </div>

              {/* 1. GIÁ BÁN GỐC, GIÁ HIỂN THỊ, TỒN KHO */}
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">💰 Thiết lập giá & tồn kho</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Giá bán gốc */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                      Giá bán gốc (VNĐ) *
                    </label>
                    <input
                      required
                      type="number"
                      min="0"
                      placeholder="VD: 35990000"
                      value={form.Price}
                      onChange={(e) => setForm({ ...form, Price: e.target.value })}
                      className="w-full rounded-xl bg-slate-900 border border-slate-800 p-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition font-mono"
                    />
                    <span className="text-[10px] text-slate-400 block mt-1">Giá niêm yết ban đầu</span>
                  </div>

                  {/* Giá hiển thị (Khuyến mãi) */}
                  <div>
                    <label className="block text-[11px] font-bold text-emerald-400 uppercase tracking-wider mb-1">
                      Giá hiển thị / Giảm giá (VNĐ)
                    </label>
                    <input
                      type="number"
                      min="0"
                      placeholder="VD: 29990000"
                      value={form.DiscountPrice}
                      onChange={(e) => setForm({ ...form, DiscountPrice: e.target.value })}
                      className="w-full rounded-xl bg-slate-900 border border-slate-800 p-2.5 text-sm text-emerald-300 focus:outline-none focus:border-emerald-500 transition font-mono placeholder:text-slate-600"
                    />
                    <span className="text-[10px] text-slate-400 block mt-1">
                      Để trống nếu không có khuyến mãi
                    </span>
                  </div>

                  {/* Số lượng tồn kho */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                      Số lượng tồn kho
                    </label>
                    <input
                      type="number"
                      min="0"
                      placeholder="VD: 15"
                      value={form.StockQuantity}
                      onChange={(e) => setForm({ ...form, StockQuantity: e.target.value })}
                      className="w-full rounded-xl bg-slate-900 border border-slate-800 p-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition font-mono"
                    />
                    <span className="text-[10px] text-slate-400 block mt-1">Số máy sẵn sàng bán</span>
                  </div>
                </div>
              </div>

              {/* 2. HÌNH ẢNH (BẤM + RỒI THÊM ẢNH, THEO THỨ TỰ TỪ 1...) */}
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">
                        🖼️ Thư viện hình ảnh
                      </span>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-bold">
                        {imageList.length} ảnh
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Ảnh hiển thị theo thứ tự từ 1... (Ảnh 1 là ảnh chính đại diện cho sản phẩm).
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Nút bấm + Thêm ảnh từ máy */}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingImages}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 px-3.5 py-1.5 text-xs font-bold text-white transition active:scale-95 disabled:opacity-50 shadow-md shadow-blue-600/30"
                    >
                      <span className="text-sm font-black">+</span>
                      <span>{uploadingImages ? 'Đang tải...' : 'Thêm ảnh từ máy'}</span>
                    </button>

                    {/* Nút bấm + Thêm link URL */}
                    <button
                      type="button"
                      onClick={() => setShowUrlInput(!showUrlInput)}
                      className="inline-flex items-center gap-1 rounded-xl bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-xs font-bold text-slate-300 transition"
                    >
                      <span>+ Link URL</span>
                    </button>
                  </div>
                </div>

                {/* Input file ẩn */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  multiple
                  onChange={handleFileChange}
                  disabled={uploadingImages}
                  className="hidden"
                />

                {/* Ô nhập URL trực tiếp nếu người dùng muốn */}
                {showUrlInput && (
                  <div className="flex gap-2 p-3 rounded-xl bg-slate-900 border border-slate-800 animate-fadeIn">
                    <input
                      type="text"
                      placeholder="Dán link ảnh (http:// hoặc https://)..."
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      className="flex-1 rounded-lg bg-slate-950 border border-slate-800 px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={handleAddImageUrl}
                      disabled={!urlInput.trim()}
                      className="rounded-lg bg-blue-600 hover:bg-blue-500 px-3 py-1.5 text-xs font-bold text-white transition disabled:opacity-50"
                    >
                      + Thêm vào danh sách
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowUrlInput(false)}
                      className="rounded-lg bg-slate-800 px-2.5 py-1.5 text-xs text-slate-400 hover:text-white"
                    >
                      Đóng
                    </button>
                  </div>
                )}

                {/* Danh sách ảnh theo thứ tự 1... kèm nút + trực tiếp */}
                <div className="pt-2 flex flex-wrap gap-3 items-center">
                  {imageList.map((img, idx) => (
                    <div
                      key={idx}
                      className="relative group rounded-2xl border-2 border-slate-800 hover:border-slate-700 bg-slate-900 p-2 flex flex-col items-center w-28 sm:w-32 transition shadow-md"
                    >
                      {/* Badge thứ tự từ 1... */}
                      <div className="absolute top-1.5 left-1.5 z-10">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black tracking-tight ${
                            idx === 0
                              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/40'
                              : 'bg-slate-800/90 text-slate-300 border border-slate-700'
                          }`}
                        >
                          {idx === 0 ? '1 (Chính)' : `${idx + 1}`}
                        </span>
                      </div>

                      {/* Nút xóa ảnh */}
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        className="absolute top-1.5 right-1.5 z-10 w-5 h-5 rounded-full bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-black flex items-center justify-center transition shadow"
                        title="Xóa ảnh này"
                      >
                        ✕
                      </button>

                      {/* Thumbnail ảnh */}
                      <div className="w-24 h-24 flex items-center justify-center overflow-hidden rounded-xl bg-slate-950 border border-slate-800/80 mt-4 mb-2">
                        <img
                          src={resolveApiAssetUrl(img)}
                          alt={`Ảnh thứ ${idx + 1}`}
                          className="w-full h-full object-contain p-1"
                        />
                      </div>

                      {/* Nút điều chỉnh thứ tự (lên / xuống) */}
                      <div className="flex items-center justify-between w-full px-1 pt-1 border-t border-slate-800/80 text-[11px]">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => handleMoveImage(idx, -1)}
                          className="p-1 rounded hover:bg-slate-800 disabled:opacity-20 text-slate-300 font-bold transition"
                          title="Đẩy lên vị trí trước"
                        >
                          ◀
                        </button>
                        <span className="text-[10px] font-bold text-slate-400">
                          Vị trí {idx + 1}
                        </span>
                        <button
                          type="button"
                          disabled={idx === imageList.length - 1}
                          onClick={() => handleMoveImage(idx, 1)}
                          className="p-1 rounded hover:bg-slate-800 disabled:opacity-20 text-slate-300 font-bold transition"
                          title="Đẩy về vị trí sau"
                        >
                          ▶
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Ô dấu + Thêm ảnh to trực tiếp trong danh sách */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImages}
                    className="flex flex-col items-center justify-center w-28 h-36 sm:w-32 rounded-2xl border-2 border-dashed border-blue-500/40 hover:border-blue-400 bg-blue-500/5 hover:bg-blue-500/10 text-blue-400 transition cursor-pointer p-3 text-center group active:scale-95"
                    title="Bấm để thêm ảnh tiếp theo"
                  >
                    <div className="w-10 h-10 rounded-full bg-blue-500/20 group-hover:bg-blue-500/30 flex items-center justify-center text-2xl font-black mb-1 transition text-blue-300">
                      +
                    </div>
                    <span className="text-xs font-bold text-white">Thêm ảnh</span>
                    <span className="text-[10px] text-blue-400/80 mt-0.5 font-mono">
                      Ảnh số {imageList.length + 1}
                    </span>
                  </button>
                </div>
              </div>

              {/* 3. MÔ TẢ THÔNG TIN CHI TIẾT (BẤM + ĐỂ THÊM TỪNG MỤC) */}
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">
                      ⚙️ Thông số kỹ thuật & Chi tiết sản phẩm
                    </span>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Bấm dấu <strong className="text-blue-400">[+]</strong> để thêm từng mục thông số (CPU, RAM, Ổ cứng, VGA, Màn hình...).
                    </p>
                  </div>

                  {/* Nút + Thêm từng mục */}
                  <button
                    type="button"
                    onClick={() => handleAddSpec('', '')}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 px-3 py-1.5 text-xs font-bold text-blue-400 transition active:scale-95 self-start sm:self-auto"
                  >
                    <span className="text-sm font-black">+</span>
                    <span>Thêm mục thông số</span>
                  </button>
                </div>

                {/* Các nút bấm thêm nhanh mẫu thông số */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] text-slate-500 font-bold uppercase">Gợi ý nhanh:</span>
                  {COMMON_SPEC_SUGGESTIONS.map((spec) => {
                    const alreadyExists = specsList.some((s) => s.key.toLowerCase() === spec.toLowerCase());
                    return (
                      <button
                        key={spec}
                        type="button"
                        onClick={() => handleAddSpec(spec, '')}
                        className={`text-[11px] px-2.5 py-0.5 rounded-lg border transition font-medium ${
                          alreadyExists
                            ? 'border-slate-800 bg-slate-900/40 text-slate-500 hover:text-slate-400'
                            : 'border-slate-700/80 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:border-slate-600'
                        }`}
                      >
                        + {spec}
                      </button>
                    );
                  })}
                </div>

                {/* Danh sách các dòng thông số (Key - Value) */}
                <div className="space-y-2 pt-2">
                  {specsList.length === 0 ? (
                    <div className="text-center py-4 border border-dashed border-slate-800 rounded-xl text-slate-500 text-xs">
                      Chưa có mục thông số nào. Bấm nút <strong>[+ Thêm mục thông số]</strong> ở trên để bắt đầu thêm.
                    </div>
                  ) : (
                    specsList.map((item, idx) => (
                      <div key={item.id} className="flex items-center gap-2">
                        <div className="w-1/3 sm:w-1/4">
                          <input
                            type="text"
                            placeholder={`Mục ${idx + 1} (VD: CPU...)`}
                            value={item.key}
                            onChange={(e) => handleUpdateSpecKey(item.id, e.target.value)}
                            className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-xs text-white font-semibold focus:outline-none focus:border-blue-500 placeholder:text-slate-600"
                          />
                        </div>
                        <div className="flex-1">
                          <input
                            type="text"
                            placeholder="Chi tiết cấu hình (VD: Intel Core i7-1360P, 16GB DDR5...)"
                            value={item.value}
                            onChange={(e) => handleUpdateSpecValue(item.id, e.target.value)}
                            className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 placeholder:text-slate-600"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveSpec(item.id)}
                          className="w-8 h-8 rounded-xl bg-slate-900 hover:bg-rose-600/20 text-slate-500 hover:text-rose-400 border border-slate-800 hover:border-rose-500/30 flex items-center justify-center transition shrink-0"
                          title="Xóa mục này"
                        >
                          ✕
                        </button>
                      </div>
                    ))
                  )}
                </div>

                {/* Nút + Thêm mục ở cuối danh sách */}
                {specsList.length > 0 && (
                  <button
                    type="button"
                    onClick={() => handleAddSpec('', '')}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-400 hover:text-blue-300 pt-1 transition"
                  >
                    <span className="text-sm font-black">+</span>
                    <span>Thêm mục thông số tiếp theo</span>
                  </button>
                )}

                {/* Ghi chú mô tả thêm (tùy chọn) */}
                <div className="pt-3 border-t border-slate-800/80">
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Mô tả / Ghi chú bổ sung (tùy chọn)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Nhập thông tin quà tặng kèm theo, tình trạng máy, chính sách đổi trả hoặc ghi chú khác..."
                    value={form.ExtraNotes}
                    onChange={(e) => setForm({ ...form, ExtraNotes: e.target.value })}
                    className="w-full rounded-xl bg-slate-900 border border-slate-800 p-2.5 text-xs text-white focus:outline-none focus:border-blue-500 transition placeholder:text-slate-600"
                  />
                </div>
              </div>

              {/* 4. PHIÊN BẢN SẢN PHẨM (VARIANTS - BẤM + ĐỂ THÊM PHIÊN BẢN) */}
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">
                        🧬 Danh sách Phiên bản sản phẩm (Variants)
                      </span>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-bold">
                        {variantsList.length} phiên bản
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Thêm các tùy chọn biến thể màu sắc, dung lượng cấu hình (RAM/SSD), giá bán và số lượng tồn kho riêng biệt.
                    </p>
                  </div>

                  {/* Nút + Thêm phiên bản ở trên */}
                  <button
                    type="button"
                    onClick={() => handleAddVariant('', '', '', '0')}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 px-3 py-1.5 text-xs font-bold text-blue-400 transition active:scale-95 self-start sm:self-auto"
                  >
                    <span className="text-sm font-black">+</span>
                    <span>Thêm phiên bản</span>
                  </button>
                </div>

                {variantsList.length === 0 ? (
                  <div className="text-center py-5 border border-dashed border-slate-800 rounded-xl text-slate-500 text-xs">
                    <p>Chưa có phiên bản biến thể nào cho sản phẩm này.</p>
                    <button
                      type="button"
                      onClick={() => handleAddVariant('', '', '', '0')}
                      className="mt-2 text-blue-400 hover:text-blue-300 font-bold underline text-xs"
                    >
                      + Bấm vào đây để thêm phiên bản đầu tiên
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3 pt-1">
                    {variantsList.map((variant, idx) => (
                      <div
                        key={variant.id}
                        className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2.5 shadow-sm relative group"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-300">
                            Phiên bản #{idx + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveVariant(idx)}
                            className="w-6 h-6 rounded-lg bg-slate-800 hover:bg-rose-600/20 text-slate-400 hover:text-rose-400 flex items-center justify-center text-xs transition"
                            title="Xóa phiên bản này"
                          >
                            ✕
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                              Màu sắc
                            </label>
                            <input
                              type="text"
                              placeholder="VD: Xám Bạc, Đen..."
                              value={variant.color}
                              onChange={(e) => handleUpdateVariant(idx, 'color', e.target.value)}
                              className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2 text-xs text-white focus:outline-none focus:border-blue-500"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                              Cấu hình tùy chọn
                            </label>
                            <input
                              type="text"
                              placeholder="VD: 16GB / 512GB SSD..."
                              value={variant.configuration}
                              onChange={(e) => handleUpdateVariant(idx, 'configuration', e.target.value)}
                              className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2 text-xs text-white focus:outline-none focus:border-blue-500"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                              Giá phiên bản (VNĐ)
                            </label>
                            <input
                              type="number"
                              min="0"
                              placeholder="Để trống = Giá gốc"
                              value={variant.price}
                              onChange={(e) => handleUpdateVariant(idx, 'price', e.target.value)}
                              className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2 text-xs text-emerald-300 focus:outline-none focus:border-blue-500 font-mono"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                              Tồn kho phiên bản
                            </label>
                            <input
                              type="number"
                              min="0"
                              placeholder="VD: 5"
                              value={variant.stockQuantity}
                              onChange={(e) => handleUpdateVariant(idx, 'stockQuantity', e.target.value)}
                              className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                            />
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Nút thêm phiên bản ở dưới danh sách */}
                    <button
                      type="button"
                      onClick={() => handleAddVariant('', '', '', '0')}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-400 hover:text-blue-300 pt-1 transition"
                    >
                      <span className="text-sm font-black">+</span>
                      <span>Thêm phiên bản tiếp theo</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Footer Modal (Cố định ở đáy, không trôi, có nút Hủy và Lưu) */}
            <div className="flex justify-end gap-3 px-6 py-4 sm:px-8 border-t border-slate-800 bg-slate-900 shrink-0">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-2xl border border-slate-800 bg-slate-800 px-5 py-2.5 text-xs font-bold text-slate-300 hover:bg-slate-700 transition"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={saving || uploadingImages}
                className="rounded-2xl bg-blue-600 hover:bg-blue-500 px-6 py-2.5 text-xs font-bold text-white transition disabled:opacity-50 shadow-lg shadow-blue-600/30 active:scale-95"
              >
                {saving ? 'Đang lưu...' : 'Lưu Thay Đổi'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
