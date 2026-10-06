'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { api, type Voucher } from '@/lib/api';
import { isVoucherValid } from '@/lib/vouchers';

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
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-950/60 p-6 rounded-3xl border border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Quản lý Mã giảm giá (Vouchers)
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Thiết lập, theo dõi và cấu hình các chương trình ưu đãi, mã giảm giá cho khách hàng.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => void loadVouchers()}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 rounded-xl text-xs font-semibold text-slate-300 transition"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Làm mới</span>
          </button>

          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-xl text-xs font-bold text-white shadow-lg shadow-blue-600/30 transition"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            <span>Tạo mã giảm giá mới</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Tổng số mã</p>
            <p className="text-2xl font-black text-white mt-1">{stats.total}</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
            </svg>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-400">Đang kích hoạt</p>
            <p className="text-2xl font-black text-emerald-400 mt-1">{stats.active}</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-amber-400">Tạm dừng</p>
            <p className="text-2xl font-black text-amber-400 mt-1">{stats.paused}</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-rose-400">Đã hết hạn</p>
            <p className="text-2xl font-black text-rose-400 mt-1">{stats.expired}</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-sm font-semibold flex items-center gap-2">
          <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm font-semibold flex items-center gap-2">
          <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-950/40 p-4 rounded-2xl border border-slate-800">
        {/* Search */}
        <div className="relative flex-1">
          <svg className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Tìm theo mã hoặc tên voucher..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { key: 'all', label: 'Tất cả' },
            { key: 'active', label: 'Đang áp dụng' },
            { key: 'paused', label: 'Tạm dừng' },
            { key: 'expired', label: 'Hết hạn' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key as typeof statusFilter)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                statusFilter === tab.key
                  ? 'bg-slate-800 text-white border border-slate-700'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Vouchers Table */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 font-medium">
          Đang tải danh sách mã giảm giá...
        </div>
      ) : filteredVouchers.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-slate-800 rounded-3xl text-slate-400">
          Không tìm thấy mã giảm giá nào phù hợp với bộ lọc.
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-950/60 shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-900/90 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-5 py-3.5">ID</th>
                  <th className="px-5 py-3.5">Mã Voucher</th>
                  <th className="px-5 py-3.5">Tên chương trình</th>
                  <th className="px-5 py-3.5">Mức giảm</th>
                  <th className="px-5 py-3.5">Giảm tối đa</th>
                  <th className="px-5 py-3.5">Hạn dùng</th>
                  <th className="px-5 py-3.5">Trạng thái</th>
                  <th className="px-5 py-3.5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredVouchers.map((item) => {
                  const now = new Date();
                  let isExpired = false;
                  if (item.ExpiryDate) {
                    const exp = new Date(item.ExpiryDate);
                    if (!Number.isNaN(exp.getTime())) {
                      exp.setHours(23, 59, 59, 999);
                      isExpired = exp < now;
                    }
                  }
                  const isActive = item.IsActive !== false && !isExpired;

                  return (
                    <tr key={item.VoucherID} className="hover:bg-slate-900/50 transition">
                      <td className="px-5 py-4 font-mono font-bold text-slate-400">
                        #{item.VoucherID}
                      </td>

                      <td className="px-5 py-4">
                        <span className="font-mono text-xs font-black uppercase text-blue-400 bg-blue-500/10 border border-blue-500/30 px-2.5 py-1 rounded-lg">
                          {item.Code}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <p className="font-bold text-white max-w-xs sm:max-w-sm truncate">
                          {item.Name}
                        </p>
                      </td>

                      <td className="px-5 py-4 font-bold text-emerald-400 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-extrabold">
                          -{Number(item.DiscountPercentage) || 0}%
                        </span>
                      </td>

                      <td className="px-5 py-4 whitespace-nowrap text-slate-300 text-xs font-medium">
                        {item.MaxDiscountAmount
                          ? `${Number(item.MaxDiscountAmount).toLocaleString('vi-VN')} ₫`
                          : <span className="text-slate-500 italic">Không giới hạn</span>}
                      </td>

                      <td className="px-5 py-4 whitespace-nowrap text-xs">
                        {item.ExpiryDate ? (
                          <div>
                            <p className="font-medium text-slate-300">
                              {new Date(item.ExpiryDate).toLocaleDateString('vi-VN')}
                            </p>
                            {isExpired && (
                              <span className="text-[10px] text-rose-400 font-bold block mt-0.5">
                                Đã hết hạn
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-500 italic">Vô thời hạn</span>
                        )}
                      </td>

                      <td className="px-5 py-4 whitespace-nowrap">
                        {item.IsActive === false ? (
                          <button
                            onClick={() => handleToggleStatus(item)}
                            title="Nhấn để kích hoạt"
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition cursor-pointer"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                            Tạm dừng
                          </button>
                        ) : isExpired ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
                            Hết hạn
                          </span>
                        ) : (
                          <button
                            onClick={() => handleToggleStatus(item)}
                            title="Nhấn để tạm dừng"
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition cursor-pointer"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                            Kích hoạt
                          </button>
                        )}
                      </td>

                      <td className="px-5 py-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenEdit(item)}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition"
                          >
                            Sửa
                          </button>
                          <button
                            onClick={() => setDeletingVoucher(item)}
                            className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-xs font-semibold text-rose-400 border border-rose-500/20 transition"
                          >
                            Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Thêm mới / Chỉnh sửa */}
      {openModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h2 className="text-xl font-bold text-white">
                {editingId ? `Chỉnh sửa mã #${editingId}` : 'Tạo mã giảm giá mới'}
              </h2>
              <button
                onClick={() => setOpenModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {formError && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-semibold">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmitForm} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Mã Voucher (Code) *
                </label>
                <input
                  type="text"
                  required
                  value={form.Code}
                  onChange={(e) => setForm({ ...form, Code: e.target.value.toUpperCase() })}
                  placeholder="Ví dụ: SALE20, MANB50, TET2026..."
                  className="w-full font-mono font-bold text-sm uppercase px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Tên chương trình / Mô tả ngắn *
                </label>
                <input
                  type="text"
                  required
                  value={form.Name}
                  onChange={(e) => setForm({ ...form, Name: e.target.value })}
                  placeholder="Ví dụ: Giảm 20% cho đơn hàng đầu tiên"
                  className="w-full text-sm px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Mức giảm (%) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    required
                    value={form.DiscountPercentage}
                    onChange={(e) => setForm({ ...form, DiscountPercentage: e.target.value })}
                    placeholder="1 - 100"
                    className="w-full text-sm px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Giảm tối đa (VNĐ)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={form.MaxDiscountAmount}
                    onChange={(e) => setForm({ ...form, MaxDiscountAmount: e.target.value })}
                    placeholder="Để trống nếu không giới hạn"
                    className="w-full text-sm px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Ngày hết hạn (Tuỳ chọn)
                  </label>
                  <input
                    type="date"
                    value={form.ExpiryDate}
                    onChange={(e) => setForm({ ...form, ExpiryDate: e.target.value })}
                    className="w-full text-sm px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex flex-col justify-end">
                  <label className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.IsActive}
                      onChange={(e) => setForm({ ...form, IsActive: e.target.checked })}
                      className="w-4 h-4 rounded text-blue-600 bg-slate-900 border-slate-700 focus:ring-0"
                    />
                    <span className="text-xs font-bold text-slate-200">Kích hoạt áp dụng ngay</span>
                  </label>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setOpenModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white shadow-lg shadow-blue-600/30 transition disabled:opacity-50"
                >
                  {saving ? 'Đang lưu...' : editingId ? 'Cập nhật' : 'Tạo mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Xác nhận Xóa */}
      {deletingVoucher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-6 space-y-4">
            <h3 className="text-lg font-bold text-white">Xác nhận xóa mã giảm giá</h3>
            <p className="text-sm text-slate-400">
              Bạn có chắc chắn muốn xóa mã giảm giá{' '}
              <span className="font-mono font-bold text-rose-400">{deletingVoucher.Code}</span> không?
              Thao tác này sẽ xóa hoàn toàn mã khỏi hệ thống.
            </p>
            <div className="flex justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => setDeletingVoucher(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white transition disabled:opacity-50"
              >
                {deleting ? 'Đang xóa...' : 'Xác nhận xóa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
