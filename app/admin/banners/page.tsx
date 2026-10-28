'use client';

import { useMemo, useState } from 'react';
import { api, getPrimaryProductImage, Product, Promotion, setCachedProductsSync } from '@/lib/api';
import { useAdminData } from '@/lib/useAdminData';
import { exportToExcel } from '@/lib/exportExcel';
import Pagination from '@/app/admin/components/Pagination';
import ConfirmDeleteModal from '@/app/admin/components/ConfirmDeleteModal';

export default function AdminBannersPage() {
  type BannerData = { promotions: Promotion[]; products: Product[] };
  const { data: bannerCacheData, loading, error, reload } = useAdminData<BannerData>(
    'admin:banners',
    async () => {
      const [promosRes, prodsRes] = await Promise.all([api.getPromotions(), api.getProducts().catch(() => [])]);
      return { promotions: promosRes, products: prodsRes };
    },
  );
  const promotions = bannerCacheData?.promotions ?? [];
  const products = bannerCacheData?.products ?? [];
  const [page, setPage] = useState(1);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [bannerSearch, setBannerSearch] = useState('');

  // Form modal
  const [modalOpen, setModalOpen] = useState(false);
  const [deletingBanner, setDeletingBanner] = useState<Promotion | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editingPromo, setEditingPromo] = useState<Promotion | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [discountPercent, setDiscountPercent] = useState<number | ''>('');
  const [selectedProductIds, setSelectedProductIds] = useState<number[]>([]);
  const [productDiscountPrices, setProductDiscountPrices] = useState<Record<number, number | string>>({});
  const [productSearch, setProductSearch] = useState('');
  const [productPickerPage, setProductPickerPage] = useState(1);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);



  const handleExportExcel = () => {
    exportToExcel<Promotion>({
      filename: 'Danh_Sach_Banner_Khuyen_Mai',
      sheetName: 'Banner',
      data: filteredPromotions,
      columns: [
        { header: 'STT', transform: (_, idx) => idx + 1, width: 8 },
        { header: 'Mã banner', key: 'PromotionID', width: 12 },
        { header: 'Tiêu đề chiến dịch', key: 'Title', width: 30 },
        { header: 'Mô tả', key: 'Description', width: 40 },
        { header: 'Giảm giá (%)', transform: (b) => b.DiscountPercent ? b.DiscountPercent + '%' : '', width: 14 },
        { header: 'Link điều hướng', key: 'LinkUrl', width: 28 },
        { header: 'Đường dẫn ảnh banner', key: 'ImageUrl', width: 35 },
      ],
    });
  };

  const openCreateModal = () => {
    setEditingPromo(null);
    setTitle('');
    setDescription('');
    setImageUrl('');
    setLinkUrl('');
    setDiscountPercent('');
    setSelectedProductIds([]);
    setProductDiscountPrices({});
    setProductSearch('');
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
    setProductSearch('');

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

    // Điền trước giá khuyến mãi hiện tại của các sản phẩm đã chọn
    const pricesMap: Record<number, number | string> = {};
    ids.forEach((id) => {
      const prod = products.find((item) => item.ProductID === id);
      if (prod) {
        pricesMap[id] = prod.DiscountPrice ?? prod.Price;
      }
    });
    setProductDiscountPrices(pricesMap);

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

  const toggleProductSelect = (pId: number) => {
    const isSelected = selectedProductIds.includes(pId);
    if (isSelected) {
      setSelectedProductIds((prev) => prev.filter((id) => id !== pId));
      setProductDiscountPrices((prev) => {
        const next = { ...prev };
        delete next[pId];
        return next;
      });
    } else {
      setSelectedProductIds((prev) => [...prev, pId]);
      const prod = products.find((item) => item.ProductID === pId);
      if (prod) {
        let initialDiscount = prod.DiscountPrice || prod.Price;
        if (discountPercent !== '' && Number(discountPercent) > 0) {
          initialDiscount = Math.round(Number(prod.Price) * (1 - Number(discountPercent) / 100));
        }
        setProductDiscountPrices((prev) => ({
          ...prev,
          [pId]: initialDiscount,
        }));
      }
    }
  };

  const handleRemoveSelectedProduct = (pId: number) => {
    setSelectedProductIds((prev) => prev.filter((id) => id !== pId));
    setProductDiscountPrices((prev) => {
      const next = { ...prev };
      delete next[pId];
      return next;
    });
  };

  const handlePriceChange = (pId: number, val: string) => {
    setProductDiscountPrices((prev) => ({
      ...prev,
      [pId]: val,
    }));
  };

  const handleApplyPercentToAllSelected = () => {
    if (discountPercent === '' || Number(discountPercent) <= 0) {
      alert('Vui lòng nhập % giảm giá hợp lệ ở ô phía trên trước.');
      return;
    }
    const percent = Number(discountPercent);
    const updatedMap = { ...productDiscountPrices };
    selectedProductIds.forEach((id) => {
      const prod = products.find((p) => p.ProductID === id);
      if (prod) {
        updatedMap[id] = Math.round(Number(prod.Price) * (1 - percent / 100));
      }
    });
    setProductDiscountPrices(updatedMap);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Vui lòng nhập tiêu đề banner.');
      return;
    }
    setSubmitting(true);
    setFeedback(null);

    // Chuẩn bị payload lưu banner
    const cleanDiscounts: Record<number, number | null> = {};
    selectedProductIds.forEach((id) => {
      const raw = productDiscountPrices[id];
      if (raw !== undefined && raw !== null && raw !== '') {
        const num = Number(raw);
        cleanDiscounts[id] = !isNaN(num) && num > 0 ? num : null;
      }
    });

    const payload = {
      Title: title.trim(),
      Description: description.trim(),
      ImageUrl: imageUrl.trim(),
      LinkUrl: linkUrl.trim() || undefined,
      DiscountPercent: discountPercent !== '' ? Number(discountPercent) : 0,
      ProductIDs: JSON.stringify(selectedProductIds),
      productDiscounts: cleanDiscounts,
      StartDate: startDate || undefined,
      EndDate: endDate || undefined,
      IsActive: isActive,
    };

    try {
      if (editingPromo && editingPromo.PromotionID) {
        await api.updatePromotion(editingPromo.PromotionID, payload);
      } else {
        await api.createPromotion(payload);
      }

      // Cập nhật giá khuyến mãi của từng sản phẩm để đảm bảo DB đồng bộ lập tức
      const updatePromises = Object.entries(cleanDiscounts).map(([idStr, discPrice]) =>
        api.updateProduct(Number(idStr), { DiscountPrice: discPrice }).catch(() => null)
      );
      await Promise.all(updatePromises);

      // Cập nhật lại cache sản phẩm
      const freshProducts = await api.getProducts();
      void reload(true);
      setCachedProductsSync(freshProducts);

      setFeedback({
        type: 'success',
        message: 'Đã lưu banner và đồng bộ giá khuyến mãi cho các sản phẩm thành công!',
      });
      setModalOpen(false);
      await reload(true);
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Lỗi khi lưu banner.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingBanner?.PromotionID) return;
    setIsDeleting(true);
    try {
      await api.deletePromotion(deletingBanner.PromotionID);
      setFeedback({ type: 'success', message: `Đã xóa banner #${deletingBanner.PromotionID} thành công.` });
      setDeletingBanner(null);
      await reload(true);
    } catch (err) {
      setFeedback({ type: 'error', message: err instanceof Error ? err.message : 'Không xóa được banner.' });
    } finally {
      setIsDeleting(false);
    }
  };

  // Lọc sản phẩm theo mã SP hoặc tên máy
  const filteredProductsToChoose = useMemo(() => {
    const kw = productSearch.trim().toLowerCase();
    if (!kw) return products;
    return products.filter((p) =>
      p.ProductName.toLowerCase().includes(kw) ||
      String(p.ProductID).includes(kw) ||
      `sp${p.ProductID}`.includes(kw) ||
      `#${p.ProductID}`.includes(kw)
    );
  }, [products, productSearch]);
  const pickerTotalPages = Math.max(1, Math.ceil(filteredProductsToChoose.length / 20));
  const pickerCurrentPage = Math.min(productPickerPage, pickerTotalPages);
  const visibleProductsToChoose = filteredProductsToChoose.slice((pickerCurrentPage - 1) * 20, pickerCurrentPage * 20);

  // Lọc banner theo tiêu đề, mã banner hoặc sản phẩm bên trong
  const filteredPromotions = useMemo(() => {
    const query = bannerSearch.trim().toLowerCase();
    if (!query) return promotions;
    return promotions.filter((p) => {
      const titleMatch = (p.Title || '').toLowerCase().includes(query);
      const descMatch = (p.Description || '').toLowerCase().includes(query);
      const idMatch = String(p.PromotionID || '').includes(query) || `#${p.PromotionID}`.includes(query);

      let pIds: number[] = [];
      if (p.ProductIDs) {
        try {
          pIds = Array.isArray(p.ProductIDs)
            ? p.ProductIDs.map(Number)
            : typeof p.ProductIDs === 'string' && p.ProductIDs.startsWith('[')
            ? JSON.parse(p.ProductIDs).map(Number)
            : String(p.ProductIDs).split(',').map((x) => Number(x.trim())).filter(Boolean);
        } catch {}
      }

      const hasProductMatch = pIds.some((id) => {
        const prod = products.find((item) => item.ProductID === id);
        if (!prod) return String(id).includes(query) || `sp${id}`.includes(query);
        return (
          String(prod.ProductID).includes(query) ||
          `sp${prod.ProductID}`.includes(query) ||
          `#${prod.ProductID}`.includes(query) ||
          (prod.ProductName || '').toLowerCase().includes(query)
        );
      });

      return titleMatch || descMatch || idMatch || hasProductMatch;
    });
  }, [promotions, products, bannerSearch]);

  const promoTotalPages = Math.max(1, Math.ceil(filteredPromotions.length / 20));
  const promoCurrentPage = Math.min(page, promoTotalPages);
  const visiblePromotions = filteredPromotions.slice((promoCurrentPage - 1) * 20, promoCurrentPage * 20);

  const selectedProductsList = useMemo(() => {
    return selectedProductIds
      .map((id) => products.find((p) => p.ProductID === id))
      .filter((p): p is Product => Boolean(p));
  }, [selectedProductIds, products]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">Quản lý Banner & Khuyến mãi</h1>
          <p className="mt-1 text-sm text-slate-400">
            Quản lý banner hiển thị ở trang chủ. Chỉ những sản phẩm được chỉ định mới hiển thị trên trang khuyến mãi của banner đó.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 rounded-xl bg-orange-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-orange-500 shadow-lg shadow-orange-950 transition cursor-pointer"
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

      {/* Search Banners */}
      <div className="space-y-3 bg-slate-900/80 p-4 rounded-2xl border border-slate-800/80 shadow-lg">
        <div className="relative">
          <input
            type="text"
            value={bannerSearch}
            onChange={(e) => { setBannerSearch(e.target.value); setPage(1); }}
            placeholder="Tìm theo mã banner (#12), tiêu đề, hoặc mã SP (#15, SP15), tên sản phẩm áp dụng trong banner..."
            className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 pr-10 text-xs text-white outline-none placeholder:text-slate-500 focus:border-orange-500 transition"
          />
          {bannerSearch && (
            <button
              type="button"
              onClick={() => setBannerSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs font-bold p-1 cursor-pointer"
              title="Xóa tìm kiếm"
            >
              ✕
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 text-[11px] text-slate-400 flex-wrap pt-1 border-t border-slate-800/60">
          <span className="font-semibold text-slate-500">Tìm kiếm theo:</span>
          <span className="px-2 py-0.5 rounded-md bg-slate-950 text-slate-300 border border-slate-800">🏷️ Mã SP (#12, SP12)</span>
          <span className="px-2 py-0.5 rounded-md bg-slate-950 text-slate-300 border border-slate-800">💻 Tên sản phẩm</span>
          <span className="px-2 py-0.5 rounded-md bg-slate-950 text-slate-300 border border-slate-800">🖼️ Tiêu đề banner</span>
          {bannerSearch && (
            <span className="ml-auto text-orange-400 font-bold">
              Tìm thấy {filteredPromotions.length} banner
            </span>
          )}
        </div>
      </div>

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
          {visiblePromotions.map((p, index) => {
            const stt = (promoCurrentPage - 1) * 9 + index + 1;
            const img = p.ImageUrl || p.BannerImageUrl || '/banner-placeholder.jpg';
            let promoProductCount = 0;
            if (p.ProductIDs) {
              try {
                const parsed = Array.isArray(p.ProductIDs)
                  ? p.ProductIDs
                  : typeof p.ProductIDs === 'string' && p.ProductIDs.startsWith('[')
                  ? JSON.parse(p.ProductIDs)
                  : String(p.ProductIDs).split(',').filter(Boolean);
                promoProductCount = parsed.length;
              } catch {}
            }

            return (
              <div
                key={p.PromotionID}
                className="rounded-2xl border border-slate-800 bg-slate-900/80 overflow-hidden shadow-lg hover:border-slate-700 transition flex flex-col justify-between"
              >
                <div>
                  <div className="relative aspect-video w-full bg-slate-950 overflow-hidden">
                    <img src={img} alt={p.Title || ''} className="w-full h-full object-cover" />
                    <span className="absolute top-2 left-2 rounded-md bg-slate-900/90 border border-slate-700 px-2 py-0.5 text-[10px] font-bold text-slate-200 backdrop-blur-xs">
                      STT: {stt}
                    </span>
                    <span className="absolute top-2 right-2 rounded-md bg-black/70 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-xs">
                      Mã: #{p.PromotionID}
                    </span>
                  </div>
                  <div className="p-4 space-y-2">
                    <h3 className="font-bold text-white text-base line-clamp-1">{p.Title}</h3>
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {p.Description || 'Không có mô tả'}
                    </p>
                    <div className="pt-2 flex flex-wrap gap-2 text-[11px]">
                      <span className="rounded-md bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 font-bold text-orange-400">
                        {promoProductCount} sản phẩm áp dụng
                      </span>
                      {p.DiscountPercent ? (
                        <span className="rounded-md bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 font-bold text-amber-400">
                          Giảm đến {p.DiscountPercent}%
                        </span>
                      ) : null}
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
                    Xem trang khuyến mãi ↗
                  </a>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEditModal(p)}
                      className="rounded-lg bg-slate-800 border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 cursor-pointer"
                    >
                      Sửa
                    </button>
                    <button
                      onClick={() => setDeletingBanner(p)}
                      className="rounded-lg bg-rose-500/10 border border-rose-500/20 px-3 py-1.5 text-xs font-semibold text-rose-400 hover:bg-rose-500/20 cursor-pointer"
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

      <Pagination currentPage={promoCurrentPage} totalItems={filteredPromotions.length} onPageChange={setPage} />

      <ConfirmDeleteModal
        isOpen={Boolean(deletingBanner)}
        title="Xác nhận xóa Banner"
        itemType="banner khuyến mãi"
        itemName={deletingBanner ? `#${deletingBanner.PromotionID} - ${deletingBanner.Title}` : ''}
        description="Banner này sẽ bị gỡ bỏ khỏi trang chủ và danh sách sự kiện ưu đãi của cửa hàng."
        isDeleting={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingBanner(null)}
      />

      {/* Modal tạo / sửa Banner */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-3xl rounded-3xl border border-slate-800 bg-slate-900 p-6 sm:p-7 shadow-2xl my-8 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-lg font-black text-white">
                  {editingPromo ? `Chỉnh sửa Banner #${editingPromo.PromotionID}` : 'Tạo Banner Khuyến Mãi Mới'}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Thiết lập thông tin banner, chọn sản phẩm và tùy chỉnh giá khuyến mãi trực tiếp.
                </p>
              </div>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer text-lg font-bold">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 text-sm">
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
                  <div className="relative aspect-video max-h-36 w-full rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
                    <img src={imageUrl} alt="Banner Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Mô tả sự kiện</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Nội dung chi tiết chương trình ưu đãi hiển thị trong trang khuyến mãi..."
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-slate-200 outline-none focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">% Giảm giá chung hiển thị</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={discountPercent}
                    onChange={(e) => setDiscountPercent(e.target.value ? Number(e.target.value) : '')}
                    placeholder="Ví dụ: 30 (để tính nhanh giá ưu đãi)"
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

              {/* PHẦN QUẢN LÝ SẢN PHẨM TRONG BANNER */}
              <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-800/80 pb-3">
                  <div>
                    <h4 className="text-sm font-black text-white flex items-center gap-2">
                      <span className="text-orange-500">🛒</span> Sản phẩm trong Banner Khuyến Mãi
                      <span className="rounded-full bg-orange-600/20 text-orange-400 border border-orange-500/30 px-2.5 py-0.5 text-xs font-bold">
                        {selectedProductIds.length} sản phẩm
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Chỉ những sản phẩm có trong danh sách này mới xuất hiện trong trang khuyến mãi riêng của banner.
                    </p>
                  </div>

                  {selectedProductIds.length > 0 && discountPercent !== '' && Number(discountPercent) > 0 && (
                    <button
                      type="button"
                      onClick={handleApplyPercentToAllSelected}
                      className="rounded-lg bg-orange-950/40 border border-orange-500/40 text-orange-300 hover:bg-orange-900/60 px-3 py-1.5 text-xs font-bold transition cursor-pointer"
                    >
                      ⚡ Tự động tính giảm {discountPercent}% cho tất cả
                    </button>
                  )}
                </div>

                {/* Danh sách sản phẩm ĐÃ CHỌN kèm ô nhập Giá Khuyến Mãi */}
                {selectedProductsList.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-slate-300">
                      Sản phẩm được chọn & Giá khuyến mãi áp dụng (hiển thị trên toàn hệ thống):
                    </p>
                    <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                      {selectedProductsList.map((prod) => {
                        const originalPrice = Number(prod.Price || 0);
                        const customDiscount = productDiscountPrices[prod.ProductID];
                        const currentDiscount = customDiscount !== undefined && customDiscount !== ''
                          ? Number(customDiscount)
                          : Number(prod.DiscountPrice ?? originalPrice);
                        const hasDiscount = currentDiscount > 0 && currentDiscount < originalPrice;
                        const percent = hasDiscount ? Math.round(((originalPrice - currentDiscount) / originalPrice) * 100) : 0;

                        return (
                          <div
                            key={prod.ProductID}
                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl border border-slate-800 bg-slate-900/90 hover:border-slate-700 transition"
                          >
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <img
                                src={getPrimaryProductImage(prod.ImageUrl) || '/placeholder.png'}
                                alt=""
                                className="w-10 h-10 object-contain rounded-lg bg-slate-950 p-1 shrink-0"
                              />
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-bold text-slate-200 truncate">{prod.ProductName}</p>
                                <p className="text-[11px] text-slate-400">
                                  Giá gốc: <span className="font-mono">{originalPrice.toLocaleString('vi-VN')} ₫</span>
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2.5 shrink-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[11px] text-slate-400">Giá KM:</span>
                                <input
                                  type="number"
                                  min="0"
                                  step="1000"
                                  value={productDiscountPrices[prod.ProductID] ?? ''}
                                  onChange={(e) => handlePriceChange(prod.ProductID, e.target.value)}
                                  placeholder={String(originalPrice)}
                                  className="w-32 rounded-lg border border-orange-500/40 bg-slate-950 px-2.5 py-1 text-xs font-bold text-orange-400 outline-none focus:border-orange-500 font-mono"
                                />
                                <span className="text-xs text-slate-500">₫</span>
                              </div>

                              {hasDiscount && (
                                <span className="rounded-md bg-rose-500/20 text-rose-400 border border-rose-500/30 px-1.5 py-0.5 text-[10px] font-bold">
                                  -{percent}%
                                </span>
                              )}

                              <button
                                type="button"
                                onClick={() => handleRemoveSelectedProduct(prod.ProductID)}
                                title="Xóa sản phẩm khỏi banner"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition text-xs font-bold cursor-pointer"
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-slate-800 p-6 text-center text-xs text-slate-500">
                    Chưa có sản phẩm nào được chọn vào banner này. Hãy tìm và chọn sản phẩm ở bảng bên dưới!
                  </div>
                )}

                {/* Thanh tìm kiếm & Bảng chọn thêm sản phẩm */}
                <div className="pt-2 border-t border-slate-800/60 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <label className="text-xs font-bold text-slate-300">
                      Chọn thêm sản phẩm từ kho ({filteredProductsToChoose.length} sản phẩm)
                    </label>
                  </div>
                  <input
                    type="text"
                    value={productSearch}
                    onChange={(e) => { setProductSearch(e.target.value); setProductPickerPage(1); }}
                    placeholder="🔍 Nhập mã SP (#12, SP12) hoặc tên sản phẩm..."
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-200 outline-none focus:border-orange-500"
                  />

                  <div id="banner-product-picker-list" className="max-h-48 overflow-y-auto rounded-xl border border-slate-800 bg-slate-950/90 divide-y divide-slate-800/40">
                    {visibleProductsToChoose.map((p) => {
                      const isSelected = selectedProductIds.includes(p.ProductID);
                      return (
                        <div
                          key={p.ProductID}
                          onClick={() => toggleProductSelect(p.ProductID)}
                          className={`flex items-center justify-between p-2.5 transition cursor-pointer ${
                            isSelected
                              ? 'bg-orange-950/20 text-orange-300'
                              : 'text-slate-300 hover:bg-slate-900'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <span className={`w-4 h-4 rounded flex items-center justify-center text-[10px] font-bold shrink-0 ${
                              isSelected ? 'bg-orange-500 text-white' : 'border border-slate-600'
                            }`}>
                              {isSelected ? '✓' : ''}
                            </span>
                            <img
                              src={getPrimaryProductImage(p.ImageUrl) || '/placeholder.png'}
                              alt=""
                              className="w-7 h-7 object-contain rounded bg-slate-950 shrink-0"
                            />
                            <span className="font-mono text-[10px] font-bold text-blue-400 bg-blue-500/10 px-1 py-0.5 rounded border border-blue-500/20 shrink-0">#SP{p.ProductID}</span>
                            <span className="text-xs truncate">{p.ProductName}</span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0 ml-2">
                            <span className="text-xs font-mono text-slate-400">
                              {Number(p.DiscountPrice || p.Price).toLocaleString('vi-VN')} ₫
                            </span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                              isSelected ? 'bg-rose-500/20 text-rose-300' : 'bg-slate-800 text-slate-400'
                            }`}>
                              {isSelected ? 'Đã thêm' : '+ Thêm'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <Pagination currentPage={pickerCurrentPage} totalItems={filteredProductsToChoose.length} onPageChange={setProductPickerPage} scrollTargetId="banner-product-picker-list" />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-xs font-bold text-slate-300 hover:bg-slate-700 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-orange-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-orange-500 shadow-lg shadow-orange-950 disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? 'Đang lưu...' : editingPromo ? 'Cập nhật Banner & Giá Khuyến Mãi' : 'Tạo Banner Mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
