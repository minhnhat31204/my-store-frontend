"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api, getStoredUser, type User, type Voucher } from "@/lib/api";
import { isVoucherValid, voucherStorageKey } from "@/lib/vouchers";

export default function VouchersPage() {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const currentUser = getStoredUser();
    setUser(currentUser);
    if (currentUser) setSelected(Number(localStorage.getItem(voucherStorageKey(currentUser.UserID))) || null);
    api.getVouchers().then(setVouchers).catch((e) => setError(e instanceof Error ? e.message : "Không tải được voucher."))
      .finally(() => setLoading(false));
  }, []);

  function choose(voucher: Voucher | null) {
    if (!user) { setError("Đăng nhập để lưu voucher vào giỏ hàng."); return; }
    if (voucher && !isVoucherValid(voucher)) return;
    if (voucher) {
      localStorage.setItem(voucherStorageKey(user.UserID), String(voucher.VoucherID));
      setSelected(voucher.VoucherID);
      setMessage(`Đã chọn mã ${voucher.Code}. Mã sẽ được tính ở giỏ hàng.`);
    } else {
      localStorage.removeItem(voucherStorageKey(user.UserID));
      setSelected(null);
      setMessage("Đã bỏ chọn voucher.");
    }
    setError("");
  }

  return <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900"><div className="mx-auto max-w-4xl">
    <Link href="/customer/cart" className="text-sm font-semibold text-blue-700">← Quay lại giỏ hàng</Link><h1 className="mt-2 text-3xl font-black">Mã giảm giá</h1><p className="mt-2 text-sm text-slate-600">Chọn một mã còn hiệu lực; mức giảm được giới hạn theo giá trị tối đa của mã.</p>
    {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-red-700">{error}</p>}{message && <p role="status" className="mt-4 rounded-xl bg-emerald-50 p-3 text-emerald-800">{message}</p>}
    {selected !== null && <button onClick={() => choose(null)} className="mt-4 rounded-xl border bg-white px-4 py-2 font-semibold">Bỏ chọn voucher</button>}
    {loading ? <p className="mt-8 rounded-xl bg-white p-8 text-center">Đang tải voucher…</p> : vouchers.length === 0 ? <p className="mt-8 rounded-xl bg-white p-8 text-center text-slate-600">Hiện chưa có voucher.</p> : <div className="mt-6 grid gap-4 sm:grid-cols-2">{vouchers.map((voucher) => {
      const valid = isVoucherValid(voucher);
      const active = selected === voucher.VoucherID;
      return <article key={voucher.VoucherID} className={`rounded-2xl border bg-white p-5 shadow-sm ${active ? "border-blue-600 ring-2 ring-blue-100" : "border-slate-200"}`}>
        <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wide text-blue-700">{voucher.Code}</p><h2 className="mt-1 text-lg font-black">{voucher.Name}</h2></div><span className="rounded-xl bg-blue-50 px-3 py-2 text-xl font-black text-blue-800">{Number(voucher.DiscountPercentage) || 0}%</span></div>
        {voucher.MaxDiscountAmount && <p className="mt-3 text-sm text-slate-600">Giảm tối đa {Number(voucher.MaxDiscountAmount).toLocaleString("vi-VN")} ₫</p>}
        <p className="mt-2 text-xs text-slate-500">Hạn dùng: {voucher.ExpiryDate ? new Date(voucher.ExpiryDate).toLocaleDateString("vi-VN") : "Không giới hạn"}</p>
        <button disabled={!valid} onClick={() => choose(voucher)} className="mt-4 w-full rounded-xl bg-blue-700 py-2.5 font-bold text-white disabled:bg-slate-300">{!valid ? "Hết hạn / ngừng áp dụng" : active ? "Đang chọn" : "Áp dụng"}</button>
      </article>;
    })}</div>}
    <Link href="/customer/cart" className="mt-6 inline-flex rounded-xl bg-blue-700 px-5 py-3 font-bold text-white">Tiếp tục mua hàng</Link>
  </div></main>;
}
