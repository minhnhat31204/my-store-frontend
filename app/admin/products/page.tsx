'use client';
import { FormEvent, useEffect, useState } from 'react';
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
    setLoading(true); setError('');
    try { setProducts(await api.getProducts()); } catch (e) { setError(e instanceof Error ? e.message : 'Không tải được sản phẩm'); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, []);

  function openCreate() { setEditingId(null); setForm(emptyForm); setOpen(true); }
  function openEdit(item: Product) {
    setEditingId(item.ProductID);
    setForm({ ProductName: item.ProductName || '', Price: String(item.Price ?? ''), StockQuantity: String(item.StockQuantity ?? 0), ImageUrl: item.ImageUrl || '', Description: item.Description || '' });
    setOpen(true);
  }
  async function save(e: FormEvent) {
    e.preventDefault(); setSaving(true); setError('');
    const payload = { ProductName: form.ProductName.trim(), Price: Number(form.Price), StockQuantity: Number(form.StockQuantity), ImageUrl: form.ImageUrl.trim() || null, Description: form.Description.trim() || null };
    try { if (!payload.ProductName || !Number.isFinite(payload.Price) || payload.Price < 0) throw new Error('Tên và giá sản phẩm không hợp lệ'); if (editingId === null) await api.createProduct(payload); else await api.updateProduct(editingId, payload); setOpen(false); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : 'Lưu thất bại'); } finally { setSaving(false); }
  }
  async function remove(id: number) {
    if (!window.confirm('Bạn có chắc muốn xóa sản phẩm này?')) return;
    try { await api.deleteProduct(id); setProducts(current => current.filter(item => item.ProductID !== id)); }
    catch (e) { setError(e instanceof Error ? e.message : 'Xóa thất bại'); }
  }

  return <main className="min-h-screen bg-slate-50 p-6 text-slate-800"><div className="mx-auto max-w-6xl"><div className="mb-6 flex items-center justify-between"><h1 className="text-2xl font-bold">Quản lý sản phẩm</h1><button onClick={openCreate} className="rounded-lg bg-emerald-600 px-4 py-2 text-white">+ Thêm sản phẩm</button></div>{error && <p className="mb-4 rounded bg-red-100 p-3 text-red-700">{error}</p>}{loading ? <p>Đang tải...</p> : <div className="overflow-x-auto rounded-lg bg-white shadow"><table className="w-full text-left"><thead className="bg-slate-100"><tr><th className="p-3">ID</th><th className="p-3">Tên</th><th className="p-3">Giá</th><th className="p-3">Thao tác</th></tr></thead><tbody>{products.map(item => <tr key={item.ProductID} className="border-t"><td className="p-3">{item.ProductID}</td><td className="p-3">{item.ProductName}</td><td className="p-3">{Number(item.Price).toLocaleString('vi-VN')} VNĐ</td><td className="space-x-3 p-3"><button onClick={() => openEdit(item)} className="text-blue-600">Sửa</button><button onClick={() => void remove(item.ProductID)} className="text-red-600">Xóa</button></td></tr>)}</tbody></table></div>}{open && <div className="fixed inset-0 flex items-center justify-center bg-black/50 p-4"><form onSubmit={save} className="w-full max-w-lg space-y-3 rounded-xl bg-white p-6"><h2 className="text-xl font-bold">{editingId === null ? 'Thêm sản phẩm' : 'Sửa sản phẩm'}</h2>{[['ProductName','Tên sản phẩm'],['Price','Giá'],['StockQuantity','Số lượng'],['ImageUrl','Link ảnh'],['Description','Mô tả']].map(([key,label]) => <label key={key} className="block text-sm">{label}<input required={key === 'ProductName' || key === 'Price'} type={key === 'Price' || key === 'StockQuantity' ? 'number' : 'text'} value={form[key as keyof typeof form]} onChange={e => setForm({ ...form, [key]: e.target.value })} className="mt-1 w-full rounded border p-2" /></label>)}<div className="flex justify-end gap-2"><button type="button" onClick={() => setOpen(false)} className="rounded border px-4 py-2">Hủy</button><button disabled={saving} className="rounded bg-emerald-600 px-4 py-2 text-white">{saving ? 'Đang lưu...' : 'Lưu'}</button></div></form></div>}</div></main>;
}
