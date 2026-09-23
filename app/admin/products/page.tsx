'use client';
import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { api, Product } from '@/lib/api';

const emptyForm = { ProductName: '', Price: '', StockQuantity: '0', ImageUrl: '', Description: '' };

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // State quản lý danh sách nhiều ảnh cho sản phẩm
  const [imageList, setImageList] = useState<string[]>([]);
  const [urlInput, setUrlInput] = useState('');

  async function load() {
    setLoading(true); 
    setError('');
    try { 
      setProducts(await api.getProducts()); 
    } catch (e) { 
      setError(e instanceof Error ? e.message : 'Không tải được sản phẩm'); 
    } finally { 
      setLoading(false); 
    }
  }

  useEffect(() => { 
    void load(); 
  }, []);

  function openCreate() { 
    setEditingId(null); 
    setForm(emptyForm); 
    setImageList([]);
    setUrlInput('');
    setOpen(true); 
  }

  function openEdit(item: Product) {
    setEditingId(item.ProductID);
    setForm({ 
      ProductName: item.ProductName || '', 
      Price: String(item.Price ?? ''), 
      StockQuantity: String(item.StockQuantity ?? 0), 
      ImageUrl: item.ImageUrl || '', 
      Description: item.Description || '' 
    });
    
    const rawImgs = item.ImageUrl ? item.ImageUrl.split(',').map(s => s.trim()).filter(Boolean) : [];
    const uniqueImgs = Array.from(new Set(rawImgs));
    
    setImageList(uniqueImgs);
    setUrlInput('');
    setOpen(true);
  }

  // Thêm ảnh từ URL vào danh sách
  function handleAddImageUrl() {
    if (!urlInput.trim()) return;
    const newImages = [...imageList, urlInput.trim()];
    setImageList(newImages);
    setForm(prev => ({ ...prev, ImageUrl: newImages[0] || '' }));
    setUrlInput('');
  }

  // Thêm ảnh từ File máy tính gửi lên Backend để lưu vào thư mục
  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    setError('');

    try {
      const uploadedUrls: string[] = [];

      for (const file of fileArray) {
        const formData = new FormData();
        formData.append('image', file); // 'image' phải khớp với multer ở backend

        // Gọi API lên Backend port 5000 (hoặc thay đổi cho khớp server của bạn)
        const res = await fetch('http://localhost:5000/api/products/upload', {
            method: 'POST',
            body: formData,
          });
        const data = await res.json();

        if (data.success && data.url) {
          const fullUrl = `http://localhost:5000${data.url}`;
          uploadedUrls.push(fullUrl);
        } else {
          throw new Error(data.message || 'Upload thất bại');
        }
      }

      setImageList(prev => {
        const newImages = [...prev, ...uploadedUrls];
        setForm(f => ({ ...f, ImageUrl: newImages[0] || '' }));
        return newImages;
      });
    } catch (err) {
      console.error('Lỗi khi tải file ảnh lên server:', err);
      setError('Không thể tải file ảnh lên server backend');
    } finally {
      e.target.value = '';
    }
  }

  // Xóa ảnh khỏi danh sách bằng nút X
  function handleRemoveImage(index: number) {
    const newImages = imageList.filter((_, i) => i !== index);
    setImageList(newImages);
    setForm(prev => ({ ...prev, ImageUrl: newImages[0] || '' }));
  }

  async function save(e: FormEvent) {
    e.preventDefault(); 
    setSaving(true); 
    setError('');

    const combinedImageUrl = imageList.join(',') || form.ImageUrl.trim() || null;

    const payload = { 
      ProductName: form.ProductName.trim(), 
      Price: Number(form.Price), 
      StockQuantity: Number(form.StockQuantity), 
      ImageUrl: combinedImageUrl,
      Description: form.Description.trim() || null 
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
    if (!window.confirm('Bạn có chắc muốn xóa sản phẩm này?')) return;
    try { 
      await api.deleteProduct(id); 
      setProducts(current => current.filter(item => item.ProductID !== id)); 
    } catch (e) { 
      setError(e instanceof Error ? e.message : 'Xóa thất bại'); 
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6 text-slate-800">
      <div className="mx-auto max-w-6xl">
        {/* Tiêu đề & Nút điều hướng */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
          <div className="flex items-center gap-4">
            <Link
              href="/admin"
              className="rounded-lg bg-slate-200 px-4 py-2 text-sm font-semibold hover:bg-slate-300 transition"
            >
              ← Dashboard
            </Link>
            <h1 className="text-2xl font-bold">Quản lý sản phẩm</h1>
          </div>
          <button 
            onClick={openCreate} 
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700 transition shadow-sm"
          >
            + Thêm sản phẩm
          </button>
        </div>

        {error && <p className="mb-4 rounded bg-red-100 p-3 text-red-700">{error}</p>}

        {loading ? (
          <p className="text-slate-500">Đang tải danh sách sản phẩm...</p>
        ) : (
          <div className="overflow-x-auto rounded-xl bg-white shadow-sm border border-slate-200">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-100 text-xs font-bold uppercase text-slate-600 border-b">
                <tr>
                  <th className="p-3">ID</th>
                  <th className="p-3">Ảnh</th>
                  <th className="p-3">Tên sản phẩm</th>
                  <th className="p-3">Giá</th>
                  <th className="p-3 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {products.map(item => (
                  <tr key={item.ProductID} className="hover:bg-slate-50">
                    <td className="p-3 font-semibold">{item.ProductID}</td>
                    <td className="p-3">
                      {item.ImageUrl ? (
                        <img 
                          src={item.ImageUrl ? item.ImageUrl.split(',')[0].trim() : ''} 
                          alt={item.ProductName} 
                          className="w-12 h-12 object-cover rounded-lg border border-slate-200 bg-slate-100" 
                        />
                      ) : (
                        <div className="w-12 h-12 flex items-center justify-center bg-slate-100 text-xs text-slate-400 rounded-lg border border-slate-200">
                          No ảnh
                        </div>
                      )}
                    </td>
                    <td className="p-3 font-medium text-slate-900">{item.ProductName}</td>
                    <td className="p-3 text-emerald-600 font-semibold">
                      {Number(item.Price).toLocaleString('vi-VN')} VNĐ
                    </td>
                    <td className="p-3 text-center space-x-3">
                      <button 
                        onClick={() => openEdit(item)} 
                        className="font-semibold text-blue-600 hover:text-blue-800 transition"
                      >
                        Sửa
                      </button>
                      <button 
                        onClick={() => void remove(item.ProductID)} 
                        className="font-semibold text-red-600 hover:text-red-800 transition"
                      >
                        Xóa
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Modal Thêm / Sửa */}
        {open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs overflow-y-auto">
            <form onSubmit={save} className="w-full max-w-lg space-y-4 rounded-2xl bg-white p-6 shadow-xl my-8">
              <h2 className="text-xl font-bold text-slate-900 border-b pb-3">
                {editingId === null ? 'Thêm sản phẩm mới' : 'Chỉnh sửa sản phẩm'}
              </h2>
              
              <div>
                <label className="block text-sm font-medium text-slate-700">Tên sản phẩm *</label>
                <input 
                  required 
                  type="text" 
                  value={form.ProductName} 
                  onChange={e => setForm({ ...form, ProductName: e.target.value })} 
                  className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700">Giá *</label>
                  <input 
                    required 
                    type="number" 
                    value={form.Price} 
                    onChange={e => setForm({ ...form, Price: e.target.value })} 
                    className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Số lượng</label>
                  <input 
                    type="number" 
                    value={form.StockQuantity} 
                    onChange={e => setForm({ ...form, StockQuantity: e.target.value })} 
                    className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" 
                  />
                </div>
              </div>

              {/* KHU VỰC QUẢN LÝ NHIỀU ẢNH (DÁN URL HOẶC CHỌN FILE) */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">Hình ảnh sản phẩm (Ảnh đầu tiên là ảnh đại diện)</label>
                
                {/* 1. Dán URL */}
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Dán link ảnh (URL)..."
                    value={urlInput}
                    onChange={e => setUrlInput(e.target.value)}
                    className="flex-1 rounded-lg border border-slate-300 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <button 
                    type="button"
                    onClick={handleAddImageUrl}
                    className="rounded-lg bg-slate-800 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-900"
                  >
                    Thêm URL
                  </button>
                </div>

                {/* 2. Chọn File từ máy */}
                <div>
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition w-full justify-center">
                    <span>📁 Chọn ảnh từ máy tính</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      multiple 
                      onChange={handleFileChange} 
                      className="hidden" 
                    />
                  </label>
                </div>

                {/* Hiển thị danh sách ảnh đã chọn kèm nút Xóa */}
                {imageList.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2 pt-2 border-t border-slate-100">
                    {imageList.map((img, idx) => (
                      <div key={idx} className="relative group h-16 w-16 rounded-lg border border-slate-200 overflow-hidden bg-slate-100">
                        <img src={img} alt="" className="h-full w-full object-cover" />
                        {idx === 0 && (
                          <span className="absolute bottom-0 inset-x-0 bg-blue-600/80 text-[9px] text-white text-center font-bold">
                            Chính
                          </span>
                        )}
                        <button 
                          type="button"
                          onClick={() => handleRemoveImage(idx)}
                          className="absolute top-0.5 right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-rose-600 text-xs font-bold text-white shadow hover:bg-rose-700"
                          title="Xóa ảnh này"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">Mô tả</label>
                <textarea 
                  rows={3}
                  value={form.Description} 
                  onChange={e => setForm({ ...form, Description: e.target.value })} 
                  className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" 
                />
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t">
                <button 
                  type="button" 
                  onClick={() => setOpen(false)} 
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition"
                >
                  Hủy
                </button>
                <button 
                  disabled={saving} 
                  className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-bold text-white hover:bg-emerald-700 transition disabled:opacity-50"
                >
                  {saving ? 'Đang lưu...' : 'Lưu'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </main>
  );
}