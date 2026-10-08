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

  async function remove(
    item: CartItem
  ) {
    try {
      setError("");

      const next =
        await removeFromCart(item);

      setCart(next);
    } catch (err) {
      console.error(err);

      setError(
        "Không thể xóa sản phẩm."
      );
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
                        onClick={() =>
                          remove(item)
                        }
                        className="ml-3 text-sm font-semibold text-red-600 hover:underline"
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
                  <form onSubmit={applyVoucherCode} className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                        placeholder="Nhập mã voucher (vd: SALE20)"
                        className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium uppercase placeholder-slate-400 focus:border-blue-500 focus:outline-none"
                      />
                      <button
                        type="submit"
                        disabled={applyingCoupon || !couponInput.trim()}
                        className="rounded-xl bg-blue-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-blue-700 disabled:bg-slate-300 shrink-0"
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
    </main>
  );
}
