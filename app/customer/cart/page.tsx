"use client";

import {
  useEffect,
  useState,
} from "react";


import {
  CartItem,
  loadCart,
  updateCartItem,
  removeFromCart,
} from "@/lib/cart";
import { api, getPrimaryProductImage, getStoredUser, type Voucher } from "@/lib/api";
import { getSelectedVoucherId, saveSelectedVoucher, voucherDiscount } from "@/lib/vouchers";

export default function CartPage() {
  const [cart, setCart] =
    useState<CartItem[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");
  const [voucher, setVoucher] = useState<Voucher | null>(null);
  const [couponInput, setCouponInput] = useState("");
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [voucherFeedback, setVoucherFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [itemToDelete, setItemToDelete] = useState<CartItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);

        const items = await loadCart();
        setCart(items);

        const user = getStoredUser();
        const voucherId = getSelectedVoucherId(user?.UserID);
        if (voucherId) {
          const vouchers = await api.getVouchers();
          setVoucher(vouchers.find((item) => item.VoucherID === voucherId) || null);
        }
      } catch (err) {
        console.error(err);
        setError("Không thể tải giỏ hàng.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  async function update(
    item: CartItem,
    quantity: number
  ) {
    try {
      setError("");

      const next =
        await updateCartItem(
          item,
          quantity
        );

      setCart(next);
    } catch (err) {
      console.error(err);

      setError(err instanceof Error ? err.message : "Không thể cập nhật giỏ hàng.");
    }
  }

  async function confirmDelete() {
    if (!itemToDelete) return;
    try {
      setDeleting(true);
      setError("");
      const next = await removeFromCart(itemToDelete);
      setCart(next);
      setItemToDelete(null);
    } catch (err) {
      console.error(err);
      setError("Không thể xóa sản phẩm.");
    } finally {
      setDeleting(false);
    }
  }

  const total = cart.reduce(
    (sum, item) =>
      sum +
      Number(item.Price) *
        item.quantity,
    0
  );
  const discount = voucherDiscount(voucher, total);

  async function applyVoucherCode(e?: React.FormEvent) {
    if (e) e.preventDefault();
    const code = couponInput.trim();
    if (!code) {
      setVoucherFeedback({ type: 'error', message: 'Vui lòng nhập mã giảm giá.' });
      return;
    }
    setApplyingCoupon(true);
    setVoucherFeedback(null);
    try {
      const res = await api.validateVoucher(code, total);
      if (res.valid && res.voucher) {
        setVoucher(res.voucher);
        const user = getStoredUser();
        saveSelectedVoucher(user?.UserID, res.voucher.VoucherID);
        setVoucherFeedback({ type: 'success', message: res.message || `Đã áp dụng mã "${res.voucher.Code}"!` });
        setCouponInput('');
      } else {
        setVoucherFeedback({ type: 'error', message: res.message || 'Mã giảm giá không hợp lệ.' });
      }
    } catch (err) {
      setVoucherFeedback({ type: 'error', message: err instanceof Error ? err.message : 'Mã giảm giá không hợp lệ hoặc đã hết hạn.' });
    } finally {
      setApplyingCoupon(false);
    }
  }

  function handleRemoveVoucher() {
    const user = getStoredUser();
    saveSelectedVoucher(user?.UserID, null);
    setVoucher(null);
    setVoucherFeedback(null);
    setCouponInput('');
  }

  return (
    <main className="min-h-screen bg-slate-50 pb-24 text-slate-900">

      <div className="cart-page-animated mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <h1 className="text-4xl font-black">
          Giỏ hàng
        </h1>

        {error && (
          <div className="mt-6 rounded-xl bg-red-50 p-4 text-red-600">
            {error}
          </div>
        )}

        {loading ? (
          <div className="mt-8 rounded-2xl bg-white p-10 text-center shadow-sm">
            <p className="text-slate-500">
              Đang tải giỏ hàng...
            </p>
          </div>
        ) : cart.length === 0 ? (
          <div className="mt-8 rounded-2xl bg-white p-10 text-center shadow-sm">
            <p className="text-slate-500">
              Giỏ hàng đang trống.
            </p>

            <a
              href="/customer/products"
              className="mt-5 inline-block rounded-full bg-blue-700 px-5 py-3 font-bold text-white"
            >
              Xem sản phẩm
            </a>
          </div>
        ) : (
          <div className="mt-8 grid gap-6 md:grid-cols-[1fr_320px]">
            <div className="space-y-4">
              {cart.map((item) => (
                <div
                  key={
                    item.ID ??
                    item.ProductID
                  }
                  className="flex gap-4 rounded-2xl bg-white p-4 shadow-sm"
                >
                  <img
                    src={
                      getPrimaryProductImage(item.ImageUrl) ||
                      "/placeholder.png"
                    }
                    alt={item.ProductName}
                    className="h-24 w-24 rounded-xl bg-slate-100 object-contain p-2"
                  />

                  <div className="flex-1">
                    <h2 className="font-bold">
                      {item.ProductName}
                    </h2>

                    <p className="mt-1 font-black text-blue-700">
                      {Number(
                        item.Price
                      ).toLocaleString(
                        "vi-VN"
                      )}{" "}
                      ₫
                    </p>

                    {item.StockQuantity !== undefined && <p className={`mt-2 text-xs font-semibold ${item.StockQuantity > 0 ? "text-slate-500" : "text-red-600"}`}>
                      {item.StockQuantity > 0 ? `Còn ${item.StockQuantity} sản phẩm` : "Sản phẩm hiện đã hết hàng"}
                    </p>}
                    {Number(item.StockQuantity ?? 0) > 0 && item.quantity > Number(item.StockQuantity) && <p className="mt-1 text-xs font-semibold text-red-600">Số lượng trong giỏ vượt tồn kho, vui lòng giảm xuống.</p>}
                    <div className="mt-3 flex items-center gap-3">
                      <button
                        onClick={() =>
                          update(
                            item,
                            item.quantity - 1
                          )
                        }
                        className="h-8 w-8 rounded-full border hover:bg-slate-100"
                      >
                        −
                      </button>

                      <span className="min-w-6 text-center font-bold">
                        {item.quantity}
                      </span>

                      <button
                        onClick={() =>
                          update(
                            item,
                            item.quantity + 1
                          )
                        }
                        disabled={item.StockQuantity !== undefined && item.quantity >= item.StockQuantity}
                        className="h-8 w-8 rounded-full border hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        +
                      </button>

                      <button
                        type="button"
                        onClick={() => setItemToDelete(item)}
                        className="ml-3 text-sm font-semibold text-red-600 hover:underline cursor-pointer"
                      >
                        Xóa
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <aside className="h-fit rounded-2xl bg-white p-6 shadow-sm">
              <div className="mb-5 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                    </svg>
                    Mã giảm giá
                  </span>
                  <a href="/customer/vouchers" className="text-xs font-bold text-blue-700 hover:underline">
                    Xem mã có sẵn →
                  </a>
                </div>

                {voucher ? (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs font-black uppercase text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                            {voucher.Code}
                          </span>
                          <span className="text-xs font-bold text-emerald-700">
                            -{Number(voucher.DiscountPercentage) || 0}%
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-emerald-900 font-medium">
                          {voucher.Name}
                        </p>
                        {voucher.MaxDiscountAmount && (
                          <p className="text-[11px] text-emerald-700">
                            Tối đa {Number(voucher.MaxDiscountAmount).toLocaleString('vi-VN')} ₫
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveVoucher}
                        className="text-xs font-bold text-rose-600 hover:text-rose-700 underline shrink-0"
                      >
                        Gỡ bỏ
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={applyVoucherCode} className="space-y-2.5">
                    <div>
                      <input
                        type="text"
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                        placeholder="Nhập mã voucher (vd: SALE20)"
                        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-medium uppercase placeholder-slate-400 focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={applyingCoupon || !couponInput.trim()}
                        className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-blue-700 disabled:bg-slate-300 cursor-pointer shadow-xs"
                      >
                        {applyingCoupon ? 'Kiểm tra...' : 'Áp dụng'}
                      </button>
                    </div>
                  </form>
                )}

                {voucherFeedback && (
                  <div
                    className={`mt-2 rounded-lg p-2 text-xs font-medium ${
                      voucherFeedback.type === 'success'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-700'
                    }`}
                  >
                    {voucherFeedback.message}
                  </div>
                )}
              </div>
              <div className="flex justify-between text-sm text-slate-600"><span>Tạm tính</span><span>{total.toLocaleString("vi-VN")} ₫</span></div>
              {discount > 0 && <div className="mt-3 flex justify-between text-sm font-semibold text-emerald-700"><span>Giảm voucher</span><span>−{discount.toLocaleString("vi-VN")} ₫</span></div>}
              <p className="mt-4 border-t pt-4 text-sm font-semibold text-slate-600">Tổng sau giảm</p>
              <p className="mt-1 text-3xl font-black text-blue-700">
                {Math.max(0, total - discount).toLocaleString(
                  "vi-VN"
                )}{" "}
                ₫
              </p>

              <a
                href={cart.some((item) => item.StockQuantity !== undefined && (item.StockQuantity <= 0 || item.quantity > item.StockQuantity)) ? undefined : "/checkout"}
                aria-disabled={cart.some((item) => item.StockQuantity !== undefined && (item.StockQuantity <= 0 || item.quantity > item.StockQuantity))}
                onClick={(event) => { if (cart.some((item) => item.StockQuantity !== undefined && (item.StockQuantity <= 0 || item.quantity > item.StockQuantity))) { event.preventDefault(); setError("Hãy điều chỉnh số lượng sản phẩm theo tồn kho trước khi thanh toán."); } }}
                className="mt-6 block w-full rounded-xl bg-blue-700 py-3 text-center font-bold text-white hover:bg-blue-800 aria-disabled:pointer-events-none aria-disabled:opacity-50"
              >
                Tiến hành thanh toán
              </a>
            </aside>
          </div>
        )}
      </div>

      {/* MODAL XÁC NHẬN XÓA SẢN PHẨM KHỎI GIỎ HÀNG */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 text-center space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 text-red-600">
              <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18" />
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                <line x1="10" y1="11" x2="10" y2="17" />
                <line x1="14" y1="11" x2="14" y2="17" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900">Xóa khỏi giỏ hàng?</h3>
              <p className="mt-1.5 text-xs text-slate-500 line-clamp-2">
                Bạn có chắc chắn muốn xóa sản phẩm <strong className="text-slate-800 font-bold">{itemToDelete.ProductName}</strong> khỏi giỏ hàng không?
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                disabled={deleting}
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={deleting}
                className="w-full rounded-xl bg-red-600 py-2.5 text-xs font-bold text-white hover:bg-red-700 transition cursor-pointer shadow-xs disabled:opacity-50"
              >
                {deleting ? 'Đang xóa...' : 'Xóa sản phẩm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
