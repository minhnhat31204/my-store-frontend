'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { api, getPrimaryProductImage, Product, resolveApiAssetUrl } from '@/lib/api';

const emptyForm = { ProductName: '', Price: '', StockQuantity: '0', Description: '' };

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [stockFilter, setStockFilter] = useState<'all' | 'instock' | 'lowstock' | 'outofstock'>('all');

  // State quản lý danh sách nhiều ảnh cho sản phẩm
  const [imageList, setImageList] = useState<string[]>([]);
  const [urlInput, setUrlInput] = useState('');
  const [uploadingImages, setUploadingImages] = useState(false);

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

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setImageList([]);
    setUrlInput('');
    setError('');
    setOpen(true);
  }

  function openEdit(item: Product) {
    setEditingId(item.ProductID);
    setForm({
      ProductName: item.ProductName || '',
      Price: String(item.Price ?? ''),
      StockQuantity: String(item.StockQuantity ?? 0),
      Description: item.Description || '',
    });

    const rawImgs = item.ImageUrl ? item.ImageUrl.split(',').map((s) => s.trim()).filter(Boolean) : [];
    const uniqueImgs = Array.from(new Set(rawImgs));

    setImageList(uniqueImgs);
    setUrlInput('');
    setError('');
    setOpen(true);
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
      setError(err instanceof Error ? err.message : 'Không thể tải ảnh lên backend.');
    } finally {
      if (uploadedUrls.length) setImageList((current) => [...current, ...uploadedUrls]);
      setUploadingImages(false);
      e.target.value = '';
    }
  }

  function handleRemoveImage(index: number) {
    setImageList((current) => current.filter((_, i) => i !== index));
  }

  async function save(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');

    const combinedImageUrl = imageList.join(',') || null;

    const payload = {
      ProductName: form.ProductName.trim(),
      Price: Number(form.Price),
      StockQuantity: Number(form.StockQuantity),
      ImageUrl: combinedImageUrl,
      Description: form.Description.trim() || null,
    };

    try {
      if (!payload.ProductName || !Number.isFinite(payload.Price) || payload.Price < 0) {
        throw new Error('Tên và giá sản phẩm không hợp lệ');
      }
      if (editingId === null) {
        await api.createProduct(payload);
      } else {
        await api.updateProduct(editingId, payload);
      }
      setOpen(false);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Lưu thất bại');
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
            Theo dõi, thiết lập giá, mô tả thông số kỹ thuật và hình ảnh sản phẩm.
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
          onClick={() => setStockFilter('all')}
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
          onClick={() => setStockFilter('instock')}
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
          onClick={() => setStockFilter('lowstock')}
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
          onClick={() => setStockFilter('outofstock')}
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
        {/* Search */}
        <div className="relative flex-1">
          <svg className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Tìm kiếm theo mã sản phẩm hoặc tên máy..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
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
                  <th className="px-5 py-4">Giá niêm yết</th>
                  <th className="px-5 py-4">Tồn kho</th>
                  <th className="px-5 py-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredProducts.map((item) => {
                  const stock = Number(item.StockQuantity ?? 0);
                  const isLow = stock > 0 && stock <= 5;
                  const isOut = stock <= 0;

                  return (
                    <tr key={item.ProductID} className="hover:bg-slate-800/40 transition">
                      <td className="px-5 py-4 font-mono font-bold text-slate-400 text-xs">
                        #{item.ProductID}
                      </td>
                      <td className="px-5 py-4">
                        {item.ImageUrl ? (
                          <div className="w-14 h-14 rounded-2xl border border-slate-800 overflow-hidden bg-slate-950 flex items-center justify-center">
                            <img
                              src={getPrimaryProductImage(item.ImageUrl)}
                              alt={item.ProductName}
                              className="w-full h-full object-contain p-1"
                            />
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
                        {item.Description && (
                          <p className="text-xs text-slate-400 max-w-xs sm:max-w-md truncate mt-1">
                            {item.Description}
                          </p>
                        )}
                      </td>
                      <td className="px-5 py-4 font-bold text-emerald-400 whitespace-nowrap text-sm">
                        {Number(item.Price).toLocaleString('vi-VN')} ₫
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
                          onClick={() => openEdit(item)}
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

      {/* Modal Thêm / Sửa Sản Phẩm */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md overflow-y-auto">
          <form
            onSubmit={save}
            className="w-full max-w-2xl space-y-5 rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-8 shadow-2xl my-8 text-slate-200"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400">
                  {editingId === null ? 'Tạo mới' : 'Cập nhật'}
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

            {error && (
              <p className="rounded-2xl bg-rose-500/10 border border-rose-500/20 p-3 text-xs font-semibold text-rose-300">
                {error}
              </p>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Tên sản phẩm đầy đủ *
              </label>
              <input
                required
                type="text"
                placeholder="VD: Laptop DELL XPS 13 Plus 9320 (i7-1360P/ 16GB/ 512GB/ 3.5K OLED Touch)..."
                value={form.ProductName}
                onChange={(e) => setForm({ ...form, ProductName: e.target.value })}
                className="w-full rounded-2xl bg-slate-950 border border-slate-800 p-3 text-sm text-white focus:outline-none focus:border-blue-500 transition"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Giá bán (VNĐ) *
                </label>
                <input
                  required
                  type="number"
                  placeholder="VD: 35990000"
                  value={form.Price}
                  onChange={(e) => setForm({ ...form, Price: e.target.value })}
                  className="w-full rounded-2xl bg-slate-950 border border-slate-800 p-3 text-sm text-white focus:outline-none focus:border-blue-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Số lượng tồn kho
                </label>
                <input
                  type="number"
                  placeholder="VD: 15"
                  value={form.StockQuantity}
                  onChange={(e) => setForm({ ...form, StockQuantity: e.target.value })}
                  className="w-full rounded-2xl bg-slate-950 border border-slate-800 p-3 text-sm text-white focus:outline-none focus:border-blue-500 transition"
                />
              </div>
            </div>

            {/* QUẢN LÝ HÌNH ẢNH */}
            <div className="space-y-3 p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                Thư viện Hình ảnh (Ảnh đầu tiên là ảnh đại diện)
              </label>

              {/* Dán URL */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Dán link ảnh trực tiếp (http:// hoặc https://)..."
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  className="flex-1 rounded-xl bg-slate-900 border border-slate-800 px-3.5 py-2 text-xs text-white focus:outline-none focus:border-blue-500 transition"
                />
                <button
                  type="button"
                  onClick={handleAddImageUrl}
                  disabled={uploadingImages || !urlInput.trim()}
                  className="rounded-xl bg-slate-800 hover:bg-slate-700 px-4 py-2 text-xs font-bold text-white transition disabled:opacity-50"
                >
                  Thêm URL
                </button>
              </div>

              {/* Chọn File máy tính */}
              <div>
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-slate-700 bg-slate-900/60 px-4 py-3 text-xs font-bold text-slate-300 hover:border-slate-500 transition w-full justify-center">
                  <span>{uploadingImages ? '⏳ Đang tải tệp lên server...' : '📁 Tải ảnh từ máy tính (nhiều tệp)'}</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    multiple
                    onChange={handleFileChange}
                    disabled={uploadingImages}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Danh sách ảnh đã chọn */}
              {imageList.length > 0 && (
                <div className="pt-2 border-t border-slate-800 flex flex-wrap gap-2.5">
                  {imageList.map((img, idx) => (
                    <div
                      key={idx}
                      className="relative group h-16 w-16 rounded-xl border border-slate-700 overflow-hidden bg-slate-950 shadow-md"
                    >
                      <img src={resolveApiAssetUrl(img)} alt="" className="h-full w-full object-contain p-1" />
                      {idx === 0 && (
                        <span className="absolute bottom-0 inset-x-0 bg-blue-600 text-[8px] text-white text-center font-black py-0.5 tracking-tighter uppercase">
                          Ảnh chính
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white shadow hover:bg-rose-500 transition"
                        title="Xóa ảnh"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Mô tả thông số chi tiết
              </label>
              <textarea
                rows={3}
                placeholder="Nhập cấu hình CPU, RAM, SSD, VGA, Màn hình, Cổng kết nối..."
                value={form.Description}
                onChange={(e) => setForm({ ...form, Description: e.target.value })}
                className="w-full rounded-2xl bg-slate-950 border border-slate-800 p-3 text-sm text-white focus:outline-none focus:border-blue-500 transition"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
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
                className="rounded-2xl bg-blue-600 hover:bg-blue-500 px-6 py-2.5 text-xs font-bold text-white transition disabled:opacity-50 shadow-lg shadow-blue-600/30"
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
