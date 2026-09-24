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
import { api, getStoredUser, type Voucher } from "@/lib/api";
import { voucherDiscount, voucherStorageKey } from "@/lib/vouchers";

export default function CartPage() {
  const [cart, setCart] =
    useState<CartItem[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");
  const [voucher, setVoucher] = useState<Voucher | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);

        const items = await loadCart();

        setCart(items);
        const user = getStoredUser();
        if (user) {
          const voucherId = Number(localStorage.getItem(voucherStorageKey(user.UserID)));
          if (voucherId) {
            const vouchers = await api.getVouchers();
            setVoucher(vouchers.find((item) => item.VoucherID === voucherId) || null);
          }
        }
      } catch (err) {
        console.error(err);

        setError(
          "Không thể tải giỏ hàng."
        );
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

      setError(
        "Không thể cập nhật giỏ hàng."
      );
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

  return (
    <main className="min-h-screen bg-slate-50 pb-24 text-slate-900">

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
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
                      item.ImageUrl ||
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
                        className="h-8 w-8 rounded-full border hover:bg-slate-100"
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
              <div className="mb-5 rounded-xl border border-dashed border-blue-300 bg-blue-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div><p className="font-bold">{voucher ? `Voucher ${voucher.Code}` : "Mã giảm giá"}</p><p className="mt-1 text-xs text-slate-600">{voucher ? `${Number(voucher.DiscountPercentage) || 0}% · giảm ${discount.toLocaleString("vi-VN")} ₫` : "Chọn mã để giảm giá đơn hàng"}</p></div>
                  <a href="/customer/vouchers" className="shrink-0 font-bold text-blue-700">{voucher ? "Đổi mã" : "Chọn mã"}</a>
                </div>
                {voucher && <button onClick={() => { const user = getStoredUser(); if (user) localStorage.removeItem(voucherStorageKey(user.UserID)); setVoucher(null); }} className="mt-2 text-xs font-semibold text-red-600">Bỏ voucher</button>}
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
                href="/checkout"
                className="mt-6 block w-full rounded-xl bg-blue-700 py-3 text-center font-bold text-white hover:bg-blue-800"
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
