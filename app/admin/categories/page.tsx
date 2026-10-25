'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { api, type Product, type StoreCategory } from '@/lib/api';
import Pagination from '@/app/admin/components/Pagination';

type CategoryForm = { CategoryName: string; ImageUrl: string };
const emptyForm: CategoryForm = { CategoryName: '', ImageUrl: '' };

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<StoreCategory[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<StoreCategory | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<StoreCategory | null>(null);
  const [form, setForm] = useState<CategoryForm>(emptyForm);
  const [formError, setFormError] = useState('');

  async function loadData(showLoading = true) {
    if (showLoading) setLoading(true);
    setError('');
    try {
      const [categoryRows, productRows] = await Promise.all([api.getCategories(), api.getProducts()]);
      setCategories(Array.isArray(categoryRows) ? categoryRows : []);
      setProducts(Array.isArray(productRows) ? productRows : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải danh sách danh mục.');
    } finally {
      if (showLoading) setLoading(false);
    }
  }

  useEffect(() => { void loadData(); }, []);

  const productCounts = useMemo(() => {
    const counts = new Map<number, number>();
    for (const product of products) {
      const categoryId = Number(product.CategoryID);
      if (categoryId > 0) counts.set(categoryId, (counts.get(categoryId) || 0) + 1);
    }
    return counts;
  }, [products]);

  const filteredCategories = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('vi');
    return [...categories]
      .filter((category) => !query || category.CategoryName.toLocaleLowerCase('vi').includes(query) || String(category.CategoryID).includes(query))
      .sort((a, b) => a.CategoryName.localeCompare(b.CategoryName, 'vi'));
  }, [categories, search]);
  const totalPages = Math.max(1, Math.ceil(filteredCategories.length / 20));
  const currentPage = Math.min(page, totalPages);
  const visibleCategories = filteredCategories.slice((currentPage - 1) * 20, currentPage * 20);

  function openCreate() {
    setEditingCategory(null);
    setForm(emptyForm);
    setFormError('');
    setModalOpen(true);
  }

  function openEdit(category: StoreCategory) {
    setEditingCategory(category);
    setForm({ CategoryName: category.CategoryName, ImageUrl: category.ImageUrl || '' });
    setFormError('');
    setModalOpen(true);
  }

  async function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const CategoryName = form.CategoryName.trim();
    const ImageUrl = form.ImageUrl.trim() || null;
    if (!CategoryName) {
      setFormError('Vui lòng nhập tên danh mục.');
      return;
    }

    setSaving(true);
    setFormError('');
    setError('');
    try {
      if (editingCategory) {
        const result = await api.updateCategory(editingCategory.CategoryID, { CategoryName, ImageUrl });
        setCategories((current) => current.map((item) => item.CategoryID === editingCategory.CategoryID ? result.category : item));
        setSuccess(`Đã cập nhật danh mục “${CategoryName}”.`);
      } else {
        const created = await api.createCategory({ CategoryName, ImageUrl });
        setCategories((current) => [...current, created]);
        setSuccess(`Đã tạo danh mục “${CategoryName}”.`);
      }
      await api.getCategories();
      setModalOpen(false);
      setEditingCategory(null);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Không thể lưu danh mục.');
    } finally {
      setSaving(false);
    }
  }

  async function deleteCategory() {
    if (!categoryToDelete) return;
    setDeletingId(categoryToDelete.CategoryID);
    setError('');
    setSuccess('');
    try {
      await api.deleteCategory(categoryToDelete.CategoryID);
      setCategories((current) => current.filter((item) => item.CategoryID !== categoryToDelete.CategoryID));
      setCategoryToDelete(null);
      setSuccess(`Đã xóa danh mục “${categoryToDelete.CategoryName}”.`);
      await api.getCategories();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể xóa danh mục.');
      setCategoryToDelete(null);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 animate-fadeIn">
      <section className="flex flex-col gap-4 rounded-3xl border border-slate-800/80 bg-slate-900/90 p-6 shadow-2xl sm:flex-row sm:items-center sm:justify-between sm:p-7">
        <div>
          <span className="mb-2 inline-flex rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-xs font-bold text-cyan-300">▦ Danh mục hàng hóa</span>
          <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">Quản lý danh mục</h1>
          <p className="mt-1 text-sm text-slate-400">Tạo và tổ chức danh mục để cửa hàng có thể mở rộng thêm các ngành hàng.</p>
        </div>
        <button type="button" onClick={openCreate} className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-500">＋ Thêm danh mục</button>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4"><p className="text-xs font-semibold text-slate-400">Tổng danh mục</p><p className="mt-1 text-2xl font-black text-white">{categories.length}</p></div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4"><p className="text-xs font-semibold text-slate-400">Sản phẩm đã phân loại</p><p className="mt-1 text-2xl font-black text-white">{products.filter((product) => Number(product.CategoryID) > 0).length}</p></div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4"><p className="text-xs font-semibold text-slate-400">Chưa có danh mục</p><p className="mt-1 text-2xl font-black text-white">{products.filter((product) => !Number(product.CategoryID)).length}</p></div>
      </section>

      <section className="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-900/80 p-4 sm:flex-row sm:items-center">
        <label className="min-w-0 flex-1">
          <span className="sr-only">Tìm danh mục</span>
          <input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Tìm theo tên hoặc mã danh mục…" className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-blue-500" />
        </label>
        <button type="button" onClick={() => void loadData()} disabled={loading} className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:bg-slate-800 disabled:opacity-50">{loading ? 'Đang tải…' : 'Làm mới'}</button>
      </section>

      {error && <p role="alert" className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm font-semibold text-rose-300">{error}</p>}
      {success && <p role="status" className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm font-semibold text-emerald-300">{success}</p>}

      {loading ? (
        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-14 text-center text-slate-400">Đang tải danh mục…</div>
      ) : filteredCategories.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-800 bg-slate-900/40 p-14 text-center text-slate-400">{categories.length ? 'Không tìm thấy danh mục phù hợp.' : 'Chưa có danh mục. Hãy tạo danh mục đầu tiên.'}</div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/80 shadow-xl">
          <div className="hidden grid-cols-[minmax(0,1fr)_160px_180px] gap-4 border-b border-slate-800 bg-slate-950/60 px-5 py-3 text-[11px] font-black uppercase tracking-wider text-slate-500 sm:grid"><span>Danh mục</span><span>Sản phẩm</span><span className="text-right">Thao tác</span></div>
          <div className="divide-y divide-slate-800">
            {visibleCategories.map((category) => {
              const count = productCounts.get(category.CategoryID) || 0;
              return (
                <article key={category.CategoryID} className="grid gap-3 p-4 sm:grid-cols-[minmax(0,1fr)_160px_180px] sm:items-center sm:gap-4 sm:px-5">
                  <div className="flex min-w-0 items-center gap-3">
                    {category.ImageUrl ? <img src={category.ImageUrl} alt="" className="h-12 w-12 shrink-0 rounded-xl border border-slate-700 bg-white object-contain p-1" /> : <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-slate-700 bg-slate-950 text-xl text-slate-500">▦</div>}
                    <div className="min-w-0"><h2 className="truncate font-bold text-white">{category.CategoryName}</h2><p className="mt-1 text-xs text-slate-500">Mã danh mục #{category.CategoryID}</p></div>
                  </div>
                  <p className="text-sm text-slate-300"><span className="sm:hidden">Sản phẩm: </span><strong>{count}</strong> sản phẩm</p>
                  <div className="flex gap-2 sm:justify-end">
                    <button type="button" onClick={() => openEdit(category)} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-bold text-slate-200 transition hover:border-blue-500 hover:text-blue-300">Sửa</button>
                    <button type="button" onClick={() => setCategoryToDelete(category)} disabled={deletingId === category.CategoryID} className="rounded-lg border border-rose-900/60 bg-rose-950/30 px-3 py-2 text-xs font-bold text-rose-300 transition hover:bg-rose-900/50 disabled:opacity-50">Xóa</button>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      )}

      <Pagination currentPage={currentPage} totalItems={filteredCategories.length} onPageChange={setPage} />

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) setModalOpen(false); }}>
          <form onSubmit={(event) => void submitForm(event)} className="w-full max-w-lg space-y-4 rounded-3xl border border-slate-700 bg-slate-900 p-5 shadow-2xl sm:p-7" aria-labelledby="category-modal-title">
            <div><h2 id="category-modal-title" className="text-xl font-black text-white">{editingCategory ? 'Chỉnh sửa danh mục' : 'Thêm danh mục mới'}</h2><p className="mt-1 text-sm text-slate-400">Tên danh mục sẽ hiển thị ở các khu vực phân loại sản phẩm.</p></div>
            {formError && <p role="alert" className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-300">{formError}</p>}
            <label className="block text-sm font-semibold text-slate-200">Tên danh mục <span className="text-rose-400">*</span><input autoFocus required maxLength={255} value={form.CategoryName} onChange={(event) => setForm((current) => ({ ...current, CategoryName: event.target.value }))} placeholder="Ví dụ: Laptop, Màn hình, Linh kiện" className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-blue-500" /></label>
            <label className="block text-sm font-semibold text-slate-200">Đường dẫn ảnh (không bắt buộc)<input type="url" value={form.ImageUrl} onChange={(event) => setForm((current) => ({ ...current, ImageUrl: event.target.value }))} placeholder="https://…" className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-blue-500" /></label>
            <div className="flex justify-end gap-2 pt-2"><button type="button" onClick={() => setModalOpen(false)} disabled={saving} className="rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-semibold text-slate-300 hover:bg-slate-800 disabled:opacity-50">Đóng</button><button type="submit" disabled={saving || !form.CategoryName.trim()} className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-500 disabled:opacity-50">{saving ? 'Đang lưu…' : editingCategory ? 'Lưu thay đổi' : 'Tạo danh mục'}</button></div>
          </form>
        </div>
      )}

      {categoryToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md space-y-4 rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
            <div><h2 className="text-lg font-black text-white">Xóa danh mục này?</h2><p className="mt-2 text-sm text-slate-400">Bạn đang xóa “{categoryToDelete.CategoryName}”. Danh mục có sản phẩm sẽ không thể xóa cho đến khi chuyển các sản phẩm đó sang danh mục khác.</p></div>
            <div className="flex justify-end gap-2"><button type="button" onClick={() => setCategoryToDelete(null)} disabled={deletingId !== null} className="rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-semibold text-slate-300 hover:bg-slate-800 disabled:opacity-50">Hủy</button><button type="button" onClick={() => void deleteCategory()} disabled={deletingId !== null} className="rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-rose-500 disabled:opacity-50">{deletingId !== null ? 'Đang xóa…' : 'Xóa danh mục'}</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
