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
    setOpen(true);
  }

  async function save(e: FormEvent) {
    e.preventDefault(); 
    setSaving(true); 
    setError('');
    const payload = { 
      ProductName: form.ProductName.trim(), 
      Price: Number(form.Price), 
      StockQuantity: Number(form.StockQuantity), 
      ImageUrl: form.ImageUrl.trim() || null, 
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
                          src={item.ImageUrl} 
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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
            <form onSubmit={save} className="w-full max-w-lg space-y-4 rounded-2xl bg-white p-6 shadow-xl">
              <h2 className="text-xl font-bold text-slate-900 border-b pb-3">
                {editingId === null ? 'Thêm sản phẩm mới' : 'Chỉnh sửa sản phẩm'}
              </h2>
              
              {[
                ['ProductName', 'Tên sản phẩm'],
                ['Price', 'Giá'],
                ['StockQuantity', 'Số lượng'],
                ['ImageUrl', 'Link ảnh'],
                ['Description', 'Mô tả']
              ].map(([key, label]) => (
                <label key={key} className="block text-sm font-medium text-slate-700">
                  {label}
                  <input 
                    required={key === 'ProductName' || key === 'Price'} 
                    type={key === 'Price' || key === 'StockQuantity' ? 'number' : 'text'} 
                    value={form[key as keyof typeof form]} 
                    onChange={e => setForm({ ...form, [key]: e.target.value })} 
                    className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" 
                  />
                </label>
              ))}

              <div className="flex justify-end gap-3 pt-2">
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