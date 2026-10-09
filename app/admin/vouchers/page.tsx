'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { api, type Voucher } from '@/lib/api';

type FormState = {
  Code: string;
  Name: string;
  DiscountPercentage: string;
  MaxDiscountAmount: string;
  ExpiryDate: string;
  IsActive: boolean;
};

const emptyForm: FormState = {
  Code: '',
  Name: '',
  DiscountPercentage: '',
  MaxDiscountAmount: '',
  ExpiryDate: '',
  IsActive: true,
};

function formatMoney(amount: number) {
  return `${amount.toLocaleString('vi-VN')} ₫`;
}

export default function AdminVouchersPage() {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'paused' | 'expired'>('all');

  // Modal create/edit
  const [openModal, setOpenModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [formError, setFormError] = useState('');

  // Delete confirm modal
  const [deletingVoucher, setDeletingVoucher] = useState<Voucher | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function loadVouchers() {
    setLoading(true);
    setError('');
    try {
      const data = await api.getVouchers();
      setVouchers(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không tải được danh sách mã giảm giá.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadVouchers();
  }, []);

  // Stats calculation
  const stats = useMemo(() => {
    const total = vouchers.length;
    let active = 0;
    let paused = 0;
    let expired = 0;
    const now = new Date();

    for (const v of vouchers) {
      if (v.IsActive === false) {
        paused++;
      } else if (v.ExpiryDate) {
        const exp = new Date(v.ExpiryDate);
        if (!Number.isNaN(exp.getTime())) {
          exp.setHours(23, 59, 59, 999);
          if (exp < now) {
            expired++;
            continue;
          }
        }
        active++;
      } else {
        active++;
      }
    }

    return { total, active, paused, expired };
  }, [vouchers]);

  // Filtered vouchers list
  const filteredVouchers = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const now = new Date();

    return vouchers.filter((v) => {
      const matchSearch =
        !term ||
        v.Code.toLowerCase().includes(term) ||
        v.Name.toLowerCase().includes(term) ||
        String(v.VoucherID).includes(term);

      if (!matchSearch) return false;

      let isExpired = false;
      if (v.ExpiryDate) {
        const exp = new Date(v.ExpiryDate);
        if (!Number.isNaN(exp.getTime())) {
          exp.setHours(23, 59, 59, 999);
          isExpired = exp < now;
        }
      }

      if (statusFilter === 'active') {
        return v.IsActive !== false && !isExpired;
      }
      if (statusFilter === 'paused') {
        return v.IsActive === false;
      }
      if (statusFilter === 'expired') {
        return isExpired;
      }

      return true;
    });
  }, [vouchers, searchTerm, statusFilter]);

  function handleOpenCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setFormError('');
    setOpenModal(true);
  }

  function handleOpenEdit(voucher: Voucher) {
    setEditingId(voucher.VoucherID);
    setForm({
      Code: voucher.Code,
      Name: voucher.Name,
      DiscountPercentage: String(voucher.DiscountPercentage ?? ''),
      MaxDiscountAmount: voucher.MaxDiscountAmount ? String(voucher.MaxDiscountAmount) : '',
      ExpiryDate: voucher.ExpiryDate ? String(voucher.ExpiryDate).split('T')[0] : '',
      IsActive: voucher.IsActive !== false,
    });
    setFormError('');
    setOpenModal(true);
  }

  async function handleToggleStatus(voucher: Voucher) {
    try {
      const newStatus = !voucher.IsActive;
      await api.updateVoucher(voucher.VoucherID, { IsActive: newStatus });
      setVouchers((prev) =>
        prev.map((item) =>
          item.VoucherID === voucher.VoucherID ? { ...item, IsActive: newStatus } : item
        )
      );
      setSuccessMsg(`Đã ${newStatus ? 'kích hoạt' : 'tạm ngưng'} mã ${voucher.Code}.`);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể cập nhật trạng thái.');
      setTimeout(() => setError(''), 4000);
    }
  }

  async function handleSubmitForm(e: FormEvent) {
    e.preventDefault();
    setFormError('');

    const code = form.Code.trim().toUpperCase();
    const name = form.Name.trim();
    const discountPct = Number(form.DiscountPercentage);
    const maxAmount = form.MaxDiscountAmount.trim() ? Number(form.MaxDiscountAmount) : null;

    if (!code) {
      setFormError('Vui lòng nhập mã giảm giá.');
      return;
    }
    if (!name) {
      setFormError('Vui lòng nhập tên chương trình giảm giá.');
      return;
    }
    if (!Number.isFinite(discountPct) || discountPct <= 0 || discountPct > 100) {
      setFormError('Phần trăm giảm giá phải là số từ 1 đến 100.');
      return;
    }
    if (maxAmount !== null && (!Number.isFinite(maxAmount) || maxAmount < 0)) {
      setFormError('Số tiền giảm tối đa không hợp lệ.');
      return;
    }

    setSaving(true);
    try {
      if (editingId) {
        // Update
        const res = await api.updateVoucher(editingId, {
          Code: code,
          Name: name,
          DiscountPercentage: discountPct,
          MaxDiscountAmount: maxAmount,
          ExpiryDate: form.ExpiryDate || null,
          IsActive: form.IsActive,
        });
        const updatedVoucher = res.voucher || {
          VoucherID: editingId,
          Code: code,
          Name: name,
          DiscountPercentage: discountPct,
          MaxDiscountAmount: maxAmount,
          ExpiryDate: form.ExpiryDate || null,
          IsActive: form.IsActive,
        };
        setVouchers((prev) =>
          prev.map((item) => (item.VoucherID === editingId ? { ...item, ...updatedVoucher } : item))
        );
        setSuccessMsg(`Cập nhật mã "${code}" thành công.`);
      } else {
        // Create
        const created = await api.createVoucher({
          Code: code,
          Name: name,
          DiscountPercentage: discountPct,
          MaxDiscountAmount: maxAmount,
          ExpiryDate: form.ExpiryDate || null,
          IsActive: form.IsActive,
        });
        setVouchers((prev) => [created, ...prev]);
        setSuccessMsg(`Tạo mới mã giảm giá "${code}" thành công.`);
      }
      setOpenModal(false);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Lỗi khi lưu mã giảm giá.');
    } finally {
      setSaving(false);
    }
  }

  async function handleConfirmDelete() {
    if (!deletingVoucher) return;
    setDeleting(true);
    try {
      await api.deleteVoucher(deletingVoucher.VoucherID);
      setVouchers((prev) => prev.filter((item) => item.VoucherID !== deletingVoucher.VoucherID));
      setSuccessMsg(`Đã xóa mã giảm giá "${deletingVoucher.Code}".`);
      setDeletingVoucher(null);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể xóa mã giảm giá.');
      setTimeout(() => setError(''), 4000);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-900/90 p-6 sm:p-7 rounded-3xl border border-slate-800/80 shadow-2xl">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-400 text-xs font-bold mb-2">
            🎟️ Phân hệ Khuyến mãi & Voucher
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Quản Lý Mã Giảm Giá
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Thiết lập chương trình khuyến mãi, tỷ lệ giảm % và hạn mức chiết khấu cho khách mua sắm.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => void loadVouchers()}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-700/80 rounded-2xl text-xs font-bold text-slate-300 transition active:scale-95"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Làm Mới</span>
          </button>

          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-2xl text-xs font-bold text-white shadow-lg shadow-blue-600/30 transition active:scale-95"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            <span>Tạo Voucher Mới</span>
          </button>
        </div>
      </div>

      {/* Success / Error alerts */}
      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-bold animate-fadeIn">
          ✅ {successMsg}
        </div>
      )}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-bold animate-fadeIn">
          ⚠️ {error}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <button
          onClick={() => setStatusFilter('all')}
          className={`p-4 rounded-2xl border text-left transition ${
            statusFilter === 'all'
              ? 'bg-blue-600/10 border-blue-500/50 shadow-lg shadow-blue-950/40'
              : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700'
          }`}
        >
          <p className="text-xs font-bold text-slate-400">Tổng số mã</p>
          <p className="text-2xl font-black text-white mt-1">{stats.total}</p>
        </button>

        <button
          onClick={() => setStatusFilter('active')}
          className={`p-4 rounded-2xl border text-left transition ${
            statusFilter === 'active'
              ? 'bg-emerald-600/10 border-emerald-500/50 shadow-lg shadow-emerald-950/40'
              : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700'
          }`}
        >
          <p className="text-xs font-bold text-emerald-400">Đang hoạt động</p>
          <p className="text-2xl font-black text-emerald-300 mt-1">{stats.active}</p>
        </button>

        <button
          onClick={() => setStatusFilter('paused')}
          className={`p-4 rounded-2xl border text-left transition ${
            statusFilter === 'paused'
              ? 'bg-amber-600/10 border-amber-500/50 shadow-lg shadow-amber-950/40'
              : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700'
          }`}
        >
          <p className="text-xs font-bold text-amber-400">Đang tạm ngưng</p>
          <p className="text-2xl font-black text-amber-300 mt-1">{stats.paused}</p>
        </button>

        <button
          onClick={() => setStatusFilter('expired')}
          className={`p-4 rounded-2xl border text-left transition ${
            statusFilter === 'expired'
              ? 'bg-rose-600/10 border-rose-500/50 shadow-lg shadow-rose-950/40'
              : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700'
          }`}
        >
          <p className="text-xs font-bold text-rose-400">Đã hết hạn</p>
          <p className="text-2xl font-black text-rose-300 mt-1">{stats.expired}</p>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800/80 shadow-lg">
        <div className="relative">
          <svg className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Tìm theo mã voucher (VD: GAMING500K) hoặc tên chương trình..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
          />
        </div>
      </div>

      {/* Vouchers Table */}
      {loading ? (
        <div className="p-16 text-center text-slate-400 font-medium">
          <div className="inline-block w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-3" />
          <p>Đang tải danh sách mã giảm giá...</p>
        </div>
      ) : filteredVouchers.length === 0 ? (
        <div className="p-16 text-center border border-dashed border-slate-800 rounded-3xl text-slate-400 bg-slate-900/30">
          Không tìm thấy mã giảm giá nào phù hợp.
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-slate-800/80 bg-slate-900/90 shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/80 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-5 py-4">Mã Voucher</th>
                  <th className="px-5 py-4">Chương trình & Mức giảm</th>
                  <th className="px-5 py-4">Giảm tối đa</th>
                  <th className="px-5 py-4">Hạn dùng</th>
                  <th className="px-5 py-4">Trạng thái</th>
                  <th className="px-5 py-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredVouchers.map((v) => {
                  let isExpired = false;
                  if (v.ExpiryDate) {
                    const exp = new Date(v.ExpiryDate);
                    if (!Number.isNaN(exp.getTime())) {
                      exp.setHours(23, 59, 59, 999);
                      isExpired = exp < new Date();
                    }
                  }

                  const isActive = v.IsActive !== false && !isExpired;

                  return (
                    <tr key={v.VoucherID} className="hover:bg-slate-800/40 transition">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-black text-white bg-slate-950 px-3 py-1 rounded-xl border border-slate-800 shadow-inner">
                            {v.Code}
                          </span>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(v.Code);
                              setSuccessMsg(`Đã sao chép mã "${v.Code}"!`);
                              setTimeout(() => setSuccessMsg(''), 2000);
                            }}
                            className="text-slate-500 hover:text-slate-300 transition"
                            title="Sao chép mã"
                          >
                            📋
                          </button>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <p className="font-bold text-white text-sm">{v.Name}</p>
                        <div className="inline-flex items-center gap-1.5 mt-1">
                          <span className="px-2 py-0.5 rounded-lg text-xs font-black bg-pink-500/10 text-pink-400 border border-pink-500/20">
                            Giảm {v.DiscountPercentage}%
                          </span>
                        </div>
                      </td>

                      <td className="px-5 py-4 font-bold text-slate-300 text-xs whitespace-nowrap">
                        {v.MaxDiscountAmount ? formatMoney(Number(v.MaxDiscountAmount)) : 'Không giới hạn'}
                      </td>

                      <td className="px-5 py-4 text-xs whitespace-nowrap">
                        {v.ExpiryDate ? (
                          <span className={isExpired ? 'text-rose-400 font-bold' : 'text-slate-400'}>
                            {new Date(v.ExpiryDate).toLocaleDateString('vi-VN')}
                          </span>
                        ) : (
                          <span className="text-emerald-400 font-bold">Vô thời hạn</span>
                        )}
                      </td>

                      <td className="px-5 py-4 whitespace-nowrap">
                        {isExpired ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                            Đã hết hạn
                          </span>
                        ) : v.IsActive === false ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            Tạm ngưng
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            Đang áp dụng
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4 text-right whitespace-nowrap space-x-2">
                        <button
                          onClick={() => void handleToggleStatus(v)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border active:scale-95 ${
                            v.IsActive === false
                              ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                              : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border-amber-500/30'
                          }`}
                        >
                          {v.IsActive === false ? 'Bật mã' : 'Tắt'}
                        </button>
                        <button
                          onClick={() => handleOpenEdit(v)}
                          className="px-3 py-1.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs font-bold transition active:scale-95"
                        >
                          Sửa
                        </button>
                        <button
                          onClick={() => setDeletingVoucher(v)}
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

      {/* Modal Create / Edit Voucher */}
      {openModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md overflow-y-auto">
          <form
            onSubmit={handleSubmitForm}
            className="w-full max-w-xl space-y-5 rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-8 shadow-2xl my-8 text-slate-200"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400">
                  {editingId ? 'Cập nhật' : 'Tạo mới'}
                </span>
                <h2 className="text-xl font-black text-white mt-0.5">
                  {editingId ? `Chỉnh Sửa Mã Giảm Giá #${editingId}` : 'Tạo Mã Giảm Giá Mới'}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setOpenModal(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition"
              >
                ✕
              </button>
            </div>

            {formError && (
              <p className="rounded-2xl bg-rose-500/10 border border-rose-500/20 p-3 text-xs font-semibold text-rose-300">
                {formError}
              </p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Mã Voucher (Code) *
                </label>
                <input
                  required
                  type="text"
                  placeholder="VD: MANB2026, HELLO50K"
                  value={form.Code}
                  onChange={(e) => setForm({ ...form, Code: e.target.value.toUpperCase() })}
                  className="w-full rounded-2xl bg-slate-950 border border-slate-800 p-3 font-mono text-sm text-white focus:outline-none focus:border-blue-500 uppercase transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Tỷ lệ giảm (% Discount) *
                </label>
                <input
                  required
                  type="number"
                  min="1"
                  max="100"
                  placeholder="VD: 10 (tương ứng 10%)"
                  value={form.DiscountPercentage}
                  onChange={(e) => setForm({ ...form, DiscountPercentage: e.target.value })}
                  className="w-full rounded-2xl bg-slate-950 border border-slate-800 p-3 text-sm text-white focus:outline-none focus:border-blue-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Tên chương trình ưu đãi *
              </label>
              <input
                required
                type="text"
                placeholder="VD: Giảm 10% tối đa 500k mừng sinh nhật..."
                value={form.Name}
                onChange={(e) => setForm({ ...form, Name: e.target.value })}
                className="w-full rounded-2xl bg-slate-950 border border-slate-800 p-3 text-sm text-white focus:outline-none focus:border-blue-500 transition"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Giảm tối đa (VNĐ)
                </label>
                <input
                  type="number"
                  placeholder="VD: 500000 (để trống nếu không giới hạn)"
                  value={form.MaxDiscountAmount}
                  onChange={(e) => setForm({ ...form, MaxDiscountAmount: e.target.value })}
                  className="w-full rounded-2xl bg-slate-950 border border-slate-800 p-3 text-sm text-white focus:outline-none focus:border-blue-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Ngày hết hạn (Tuỳ chọn)
                </label>
                <input
                  type="date"
                  value={form.ExpiryDate}
                  onChange={(e) => setForm({ ...form, ExpiryDate: e.target.value })}
                  className="w-full rounded-2xl bg-slate-950 border border-slate-800 p-3 text-sm text-white focus:outline-none focus:border-blue-500 cursor-pointer transition"
                />
              </div>
            </div>

            <div className="pt-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.IsActive}
                  onChange={(e) => setForm({ ...form, IsActive: e.target.checked })}
                  className="w-4 h-4 rounded text-blue-600 bg-slate-950 border-slate-800 cursor-pointer"
                />
                <span className="text-xs font-bold text-slate-300">
                  Kích hoạt mã ngay sau khi lưu
                </span>
              </label>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setOpenModal(false)}
                className="rounded-2xl border border-slate-800 bg-slate-800 px-5 py-2.5 text-xs font-bold text-slate-300 hover:bg-slate-700 transition"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-2xl bg-blue-600 hover:bg-blue-500 px-6 py-2.5 text-xs font-bold text-white transition disabled:opacity-50 shadow-lg shadow-blue-600/30"
              >
                {saving ? 'Đang lưu...' : 'Lưu Mã Giảm Giá'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete confirmation modal */}
      {deletingVoucher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
          <div className="w-full max-w-md space-y-4 rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-7 shadow-2xl text-slate-200">
            <h3 className="text-lg font-black text-white">Xác nhận xóa Voucher</h3>
            <p className="text-xs text-slate-400">
              Bạn có chắc muốn xóa mã giảm giá <strong className="text-white font-mono">{deletingVoucher.Code}</strong>? Thao tác này không thể hoàn tác.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setDeletingVoucher(null)}
                className="rounded-2xl bg-slate-800 px-4 py-2 text-xs font-bold text-slate-300 hover:bg-slate-700"
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="rounded-2xl bg-rose-600 hover:bg-rose-500 px-5 py-2 text-xs font-bold text-white transition disabled:opacity-50"
              >
                {deleting ? 'Đang xóa...' : 'Xóa vĩnh viễn'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
