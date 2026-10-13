'use client';

import { useEffect, useState } from 'react';
import { api, Product, Promotion } from '@/lib/api';

export default function AdminBannersPage() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Form modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState<Promotion | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [discountPercent, setDiscountPercent] = useState<number | ''>('');
  const [selectedProductIds, setSelectedProductIds] = useState<number[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [promosRes, prodsRes] = await Promise.all([
        api.getPromotions(),
        api.getProducts().catch(() => []),
      ]);
      setPromotions(promosRes);
      setProducts(prodsRes);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi khi tải danh sách banner.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const openCreateModal = () => {
    setEditingPromo(null);
    setTitle('');
    setDescription('');
    setImageUrl('');
    setLinkUrl('');
    setDiscountPercent('');
    setSelectedProductIds([]);
    setStartDate('');
    setEndDate('');
    setIsActive(true);
    setModalOpen(true);
  };

  const openEditModal = (p: Promotion) => {
    setEditingPromo(p);
    setTitle(p.Title || '');
    setDescription(p.Description || '');
    setImageUrl(p.ImageUrl || p.BannerImageUrl || '');
    setLinkUrl(p.LinkUrl || '');
    setDiscountPercent(p.DiscountPercent ?? '');

    let ids: number[] = [];
    if (p.ProductIDs) {
      try {
        ids = Array.isArray(p.ProductIDs)
          ? p.ProductIDs.map(Number)
          : typeof p.ProductIDs === 'string' && p.ProductIDs.startsWith('[')
          ? JSON.parse(p.ProductIDs).map(Number)
          : String(p.ProductIDs).split(',').map((x) => Number(x.trim())).filter(Boolean);
      } catch {}
    }
    setSelectedProductIds(ids);
    setStartDate(p.StartDate || '');
    setEndDate(p.EndDate || '');
    setIsActive(p.IsActive !== false);
    setModalOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const res = await api.uploadProductImage(file);
      if (res.url) {
        setImageUrl(res.url);
      } else {
        alert(res.message || 'Lỗi khi tải ảnh.');
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Không tải được ảnh lên.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Vui lòng nhập tiêu đề banner.');
      return;
    }
    setSubmitting(true);
    setFeedback(null);

    const payload: Partial<Promotion> = {
      Title: title.trim(),
      Description: description.trim(),
      ImageUrl: imageUrl.trim(),
      LinkUrl: linkUrl.trim() || undefined,
      DiscountPercent: discountPercent !== '' ? Number(discountPercent) : 0,
      ProductIDs: JSON.stringify(selectedProductIds),
      StartDate: startDate || undefined,
      EndDate: endDate || undefined,
      IsActive: isActive,
    };

    try {
      if (editingPromo && editingPromo.PromotionID) {
        await api.updatePromotion(editingPromo.PromotionID, payload);
        setFeedback({ type: 'success', message: 'Cập nhật banner khuyến mãi thành công!' });
      } else {
        await api.createPromotion(payload);
        setFeedback({ type: 'success', message: 'Tạo banner khuyến mãi mới thành công!' });
      }
      setModalOpen(false);
      await loadData();
    } catch (err) {
      setFeedback({ type: 'error', message: err instanceof Error ? err.message : 'Lỗi khi lưu banner.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id?: number) => {
    if (!id || !window.confirm(`Bạn có chắc muốn xóa banner #${id} này không?`)) return;
    try {
      await api.deletePromotion(id);
      setFeedback({ type: 'success', message: `Đã xóa banner #${id} thành công.` });
      await loadData();
    } catch (err) {
      setFeedback({ type: 'error', message: err instanceof Error ? err.message : 'Không xóa được banner.' });
    }
  };

  const toggleProductSelect = (pId: number) => {
    setSelectedProductIds((prev) =>
      prev.includes(pId) ? prev.filter((id) => id !== pId) : [...prev, pId]
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">Quản lý Banner & Khuyến mãi</h1>
          <p className="mt-1 text-sm text-slate-400">
            Quản lý banner hiển thị ở trang chủ. Khi khách click vào banner sẽ mở trang khuyến mãi riêng tương ứng (kiểu Shopee).
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 rounded-xl bg-orange-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-orange-500 shadow-lg shadow-orange-950 transition"
        >
          <span className="text-lg">+</span> Thêm Banner Mới
        </button>
      </div>

      {feedback && (
        <div className={`p-4 rounded-xl border flex items-center justify-between gap-3 text-sm font-semibold ${
          feedback.type === 'success'
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
            : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
        }`}>
          <span>{feedback.message}</span>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-white text-xs">✕</button>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm font-semibold">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-12 text-center text-slate-400">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-orange-500 border-r-transparent mb-4"></div>
          <p>Đang tải danh sách banner...</p>
        </div>
      ) : promotions.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-12 text-center text-slate-400">
          <p className="text-lg font-bold text-slate-300">Chưa có banner khuyến mãi nào</p>
          <p className="text-sm text-slate-500 mt-1">Bấm nút "Thêm Banner Mới" ở góc trên để tạo sự kiện khuyến mãi đầu tiên.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {promotions.map((p) => {
            const img = p.ImageUrl || p.BannerImageUrl || '/banner-placeholder.jpg';
            return (
              <div
                key={p.PromotionID}
                className="rounded-2xl border border-slate-800 bg-slate-900/80 overflow-hidden shadow-lg hover:border-slate-700 transition flex flex-col justify-between"
              >
                <div>
                  <div className="relative aspect-video w-full bg-slate-950 overflow-hidden">
                    <img src={img} alt={p.Title || ''} className="w-full h-full object-cover" />
                    <span className="absolute top-2 right-2 rounded-md bg-black/70 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-xs">
                      #{p.PromotionID}
                    </span>
                  </div>
                  <div className="p-4 space-y-2">
                    <h3 className="font-bold text-white text-base line-clamp-1">{p.Title}</h3>
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {p.Description || 'Không có mô tả'}
                    </p>
                    <div className="pt-2 flex flex-wrap gap-2 text-[11px]">
                      {p.DiscountPercent ? (
                        <span className="rounded-md bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 font-bold text-orange-400">
                          Giảm đến {p.DiscountPercent}%
                        </span>
                      ) : null}
                      <span className="rounded-md bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 font-bold text-blue-400">
                        Link: /promotions/{p.PromotionID}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-4 pt-0 border-t border-slate-800/60 mt-3 flex items-center justify-between gap-2">
                  <a
                    href={`/promotions/${p.PromotionID}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-bold text-blue-400 hover:text-blue-300"
                  >
                    Xem trang ↗
                  </a>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEditModal(p)}
                      className="rounded-lg bg-slate-800 border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700"
                    >
                      Sửa
                    </button>
                    <button
                      onClick={() => handleDelete(p.PromotionID)}
                      className="rounded-lg bg-rose-500/10 border border-rose-500/20 px-3 py-1.5 text-xs font-semibold text-rose-400 hover:bg-rose-500/20"
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal tạo / sửa Banner */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-2xl rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl my-8 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-black text-white">
                {editingPromo ? `Chỉnh sửa Banner #${editingPromo.PromotionID}` : 'Tạo Banner Khuyến Mãi Mới'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Tiêu đề Banner / Sự kiện *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ví dụ: ĐẠI TIỆC LAPTOP GAMING - SALE UP TO 50%"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-slate-200 outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Hình ảnh Banner (URL hoặc Tải lên) *</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://... hoặc tải ảnh từ máy tính"
                    className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-slate-200 outline-none focus:border-orange-500"
                  />
                  <label className="cursor-pointer rounded-xl bg-slate-800 border border-slate-700 px-3 py-2 text-xs font-bold text-slate-300 hover:bg-slate-700 shrink-0">
                    {uploadingImage ? 'Đang tải...' : 'Tải ảnh lên'}
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  </label>
                </div>
                {imageUrl && (
                  <div className="relative aspect-[21/9] w-full rounded-xl overflow-hidden bg-slate-950 border border-slate-800">
                    <img src={imageUrl} alt="" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Mô tả sự kiện khuyến mãi</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Nội dung chi tiết chương trình ưu đãi hiển thị trong trang khuyến mãi..."
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-slate-200 outline-none focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">% Giảm giá tối đa hiển thị</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={discountPercent}
                    onChange={(e) => setDiscountPercent(e.target.value ? Number(e.target.value) : '')}
                    placeholder="Ví dụ: 30"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-slate-200 outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Hạn áp dụng đến ngày</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-slate-200 outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              {/* Chọn sản phẩm áp dụng */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-300">
                    Sản phẩm áp dụng trong trang khuyến mãi ({selectedProductIds.length} đã chọn)
                  </label>
                  <span className="text-[11px] text-slate-500">Nếu để trống, hệ thống tự lấy các sản phẩm đang giảm giá</span>
                </div>
                <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-800 bg-slate-950/70 p-2 space-y-1 divide-y divide-slate-800/40">
                  {products.map((p) => {
                    const isSelected = selectedProductIds.includes(p.ProductID);
                    return (
                      <div
                        key={p.ProductID}
                        onClick={() => toggleProductSelect(p.ProductID)}
                        className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition ${
                          isSelected ? 'bg-orange-950/30 text-orange-300 font-semibold' : 'text-slate-300 hover:bg-slate-900'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className={`w-4 h-4 rounded flex items-center justify-center text-xs font-bold ${
                            isSelected ? 'bg-orange-500 text-white' : 'border border-slate-600'
                          }`}>
                            {isSelected ? '✓' : ''}
                          </span>
                          <span className="text-xs truncate">{p.ProductName}</span>
                        </div>
                        <span className="text-xs font-mono text-slate-400 shrink-0 ml-2">
                          {Number(p.DiscountPrice || p.Price).toLocaleString('vi-VN')} ₫
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-xs font-bold text-slate-300 hover:bg-slate-700"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-orange-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-orange-500 shadow-lg shadow-orange-950 disabled:opacity-50"
                >
                  {submitting ? 'Đang lưu...' : editingPromo ? 'Cập nhật Banner' : 'Tạo Banner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
