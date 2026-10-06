"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api, getStoredUser, type User, type Voucher } from "@/lib/api";
import { getSelectedVoucherId, isVoucherValid, saveSelectedVoucher } from "@/lib/vouchers";

export default function VouchersPage() {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [customCode, setCustomCode] = useState("");
  const [checkingCustom, setCheckingCustom] = useState(false);

  useEffect(() => {
    const currentUser = getStoredUser();
    setUser(currentUser);
    const savedId = getSelectedVoucherId(currentUser?.UserID);
    if (savedId) setSelected(savedId);

    api.getVouchers()
      .then(setVouchers)
      .catch((e) => setError(e instanceof Error ? e.message : "Không tải được voucher."))
      .finally(() => setLoading(false));
  }, []);

  function choose(voucher: Voucher | null) {
    if (voucher && !isVoucherValid(voucher)) {
      setError(`Mã ${voucher.Code} đã hết hạn hoặc tạm dừng áp dụng.`);
      return;
    }
    if (voucher) {
      saveSelectedVoucher(user?.UserID, voucher.VoucherID);
      setSelected(voucher.VoucherID);
      setMessage(`Đã chọn mã ${voucher.Code}. Mức giảm sẽ tự động áp dụng tại giỏ hàng và thanh toán.`);
    } else {
      saveSelectedVoucher(user?.UserID, null);
      setSelected(null);
      setMessage("Đã bỏ chọn voucher.");
    }
    setError("");
  }

  async function handleApplyCustomCode(e: React.FormEvent) {
    e.preventDefault();
    const code = customCode.trim();
    if (!code) {
      setError("Vui lòng nhập mã giảm giá.");
      return;
    }
    setCheckingCustom(true);
    setError("");
    setMessage("");
    try {
      const res = await api.validateVoucher(code);
      if (res.valid && res.voucher) {
        // If not in list, add to list
        if (!vouchers.some((v) => v.VoucherID === res.voucher!.VoucherID)) {
          setVouchers((prev) => [res.voucher!, ...prev]);
        }
        choose(res.voucher);
        setCustomCode("");
      } else {
        setError(res.message || "Mã giảm giá không hợp lệ hoặc đã hết hạn.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Mã giảm giá không tồn tại hoặc đã hết hạn.");
    } finally {
      setCheckingCustom(false);
    }
  }

  const selectedVoucher = vouchers.find((v) => v.VoucherID === selected);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-center justify-between gap-4">
          <Link
            href="/customer/cart"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-xs transition hover:border-slate-300 hover:bg-slate-50 hover:text-blue-600"
          >
            <svg className="h-4 w-4 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            <span>Quay lại giỏ hàng</span>
          </Link>

          <Link
            href="/checkout"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 hover:underline"
          >
            <span>Đến trang thanh toán →</span>
          </Link>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Mã giảm giá & Khuyến mãi</h1>
            <p className="mt-1 text-sm text-slate-600">Chọn hoặc nhập mã ưu đãi để được khấu trừ trực tiếp khi đặt hàng.</p>
          </div>
        </div>

        {/* Khung nhập mã giảm giá trực tiếp */}
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
            </svg>
            Nhập mã khuyến mãi của bạn
          </h2>
          <form onSubmit={handleApplyCustomCode} className="mt-3 flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={customCode}
              onChange={(e) => setCustomCode(e.target.value.toUpperCase())}
              placeholder="Nhập mã giảm giá (ví dụ: SALE20, MANB50...)"
              className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold uppercase placeholder-slate-400 focus:bg-white focus:border-blue-500 focus:outline-none transition"
            />
            <button
              type="submit"
              disabled={checkingCustom || !customCode.trim()}
              className="rounded-xl bg-blue-700 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-blue-800 disabled:bg-slate-300 shrink-0"
            >
              {checkingCustom ? "Đang kiểm tra..." : "Áp dụng mã"}
            </button>
          </form>
        </div>

        {error && (
          <div role="alert" className="mt-4 rounded-xl bg-rose-50 border border-rose-200 p-3.5 text-sm text-rose-700 flex items-center gap-2 font-medium">
            <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {message && (
          <div role="status" className="mt-4 rounded-xl bg-emerald-50 border border-emerald-200 p-3.5 text-sm text-emerald-800 flex items-center justify-between gap-2 font-medium">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 shrink-0 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>{message}</span>
            </div>
            {selected && (
              <button
                onClick={() => choose(null)}
                className="text-xs font-bold text-rose-600 hover:text-rose-700 underline shrink-0"
              >
                Hủy chọn
              </button>
            )}
          </div>
        )}

        {/* Voucher đang được chọn */}
        {selectedVoucher && (
          <div className="mt-5 rounded-2xl border-2 border-emerald-500 bg-emerald-50/50 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-black text-sm">
                ✓
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                  Mã đang kích hoạt: <span className="font-mono">{selectedVoucher.Code}</span>
                </p>
                <p className="text-sm font-black text-slate-900">{selectedVoucher.Name}</p>
              </div>
            </div>
            <button
              onClick={() => choose(null)}
              className="rounded-xl border border-rose-200 bg-white px-3.5 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 transition shrink-0"
            >
              Bỏ chọn mã
            </button>
          </div>
        )}

        {/* Danh sách các mã có sẵn */}
        <h2 className="mt-8 text-lg font-black text-slate-800">Danh sách mã ưu đãi có sẵn</h2>

        {loading ? (
          <div className="mt-4 rounded-2xl bg-white p-12 text-center text-slate-500 font-medium">
            Đang tải danh sách voucher…
          </div>
        ) : vouchers.length === 0 ? (
          <div className="mt-4 rounded-2xl bg-white p-12 text-center text-slate-500">
            Hiện chưa có mã giảm giá công khai nào.
          </div>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {vouchers.map((voucher) => {
              const valid = isVoucherValid(voucher);
              const active = selected === voucher.VoucherID;

              return (
                <article
                  key={voucher.VoucherID}
                  className={`relative rounded-2xl border bg-white p-5 shadow-xs transition-all ${
                    active
                      ? "border-blue-600 ring-2 ring-blue-100"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="inline-block font-mono text-xs font-extrabold uppercase tracking-wide text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                        {voucher.Code}
                      </span>
                      <h3 className="mt-2 text-base font-black text-slate-900 line-clamp-1">{voucher.Name}</h3>
                    </div>
                    <span className="rounded-xl bg-blue-600 px-3 py-1.5 text-lg font-black text-white shrink-0">
                      -{Number(voucher.DiscountPercentage) || 0}%
                    </span>
                  </div>

                  {voucher.MaxDiscountAmount && (
                    <p className="mt-3 text-xs font-semibold text-slate-600">
                      Giảm tối đa: <span className="font-bold text-slate-900">{Number(voucher.MaxDiscountAmount).toLocaleString("vi-VN")} ₫</span>
                    </p>
                  )}

                  <p className="mt-1 text-[11px] text-slate-500">
                    Hạn dùng: {voucher.ExpiryDate ? new Date(voucher.ExpiryDate).toLocaleDateString("vi-VN") : "Không giới hạn"}
                  </p>

                  <button
                    disabled={!valid}
                    onClick={() => (active ? choose(null) : choose(voucher))}
                    className={`mt-4 w-full rounded-xl py-2.5 text-xs font-bold transition ${
                      !valid
                        ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                        : active
                        ? "bg-emerald-600 text-white hover:bg-emerald-700"
                        : "bg-blue-700 text-white hover:bg-blue-800"
                    }`}
                  >
                    {!valid ? "Hết hạn / Ngừng áp dụng" : active ? "✓ Đang áp dụng (Nhấn để hủy)" : "Áp dụng mã này"}
                  </button>
                </article>
              );
            })}
          </div>
        )}

        <div className="mt-8 flex justify-center">
          <Link
            href="/customer/cart"
            className="inline-flex rounded-xl bg-blue-700 px-6 py-3 font-bold text-white shadow-sm hover:bg-blue-800 transition"
          >
            Quay lại giỏ hàng và thanh toán
          </Link>
        </div>
      </div>
    </main>
  );
}
