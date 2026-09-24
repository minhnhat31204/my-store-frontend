"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getStoredUser, type User } from "@/lib/api";
import { getAddresses, saveAddresses, saveSelectedAddressId, type ShippingAddress } from "@/lib/addresses";

const emptyForm = { recipientName: "", phone: "", address: "" };

export default function AddressesPage() {
  const [user, setUser] = useState<User | null>(null);
  const [addresses, setAddressList] = useState<ShippingAddress[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const stored = getStoredUser();
    setUser(stored);
    if (stored) setAddressList(getAddresses(stored));
  }, []);

  function persist(next: ShippingAddress[]) {
    if (!user) return;
    setAddressList(next);
    saveAddresses(user.UserID, next);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2200);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!user) return;
    if (!form.recipientName.trim() || !form.phone.trim() || !form.address.trim()) {
      setError("Vui lòng điền đầy đủ thông tin nhận hàng.");
      return;
    }
    const next = editingId
      ? addresses.map((item) => item.id === editingId ? { ...item, ...form } : item)
      : [...addresses, { id: crypto.randomUUID(), ...form, isDefault: addresses.length === 0 }];
    persist(next);
    setForm(emptyForm);
    setEditingId(null);
  }

  function makeDefault(id: string) {
    if (!user) return;
    persist(addresses.map((item) => ({ ...item, isDefault: item.id === id })));
    saveSelectedAddressId(user.UserID, id);
  }

  function remove(id: string) {
    const next = addresses.filter((item) => item.id !== id);
    if (addresses.find((item) => item.id === id)?.isDefault && next.length) next[0].isDefault = true;
    persist(next);
    if (editingId === id) { setEditingId(null); setForm(emptyForm); }
  }

  if (!user) return <main className="mx-auto max-w-3xl px-4 py-10"><h1 className="text-3xl font-black">Sổ địa chỉ</h1><p className="mt-4">Đăng nhập để quản lý địa chỉ giao hàng.</p><Link className="mt-4 inline-block text-blue-700" href="/login">Đăng nhập →</Link></main>;

  return <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900"><div className="mx-auto max-w-4xl">
    <Link href="/customer/account" className="text-sm font-semibold text-blue-700">← Tài khoản</Link>
    <h1 className="mt-2 text-3xl font-black">Sổ địa chỉ</h1>
    <p className="mt-2 text-sm text-slate-600">Lưu thông tin người nhận để chọn nhanh khi thanh toán.</p>
    {saved && <p role="status" className="mt-4 rounded-xl bg-emerald-50 p-3 text-emerald-800">Đã lưu thay đổi.</p>}
    <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
      <section className="space-y-3">
        {addresses.length === 0 && <div className="rounded-2xl bg-white p-6 text-slate-600 shadow-sm">Bạn chưa lưu địa chỉ nào.</div>}
        {addresses.map((item) => <article key={item.id} className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2"><div className="font-bold">{item.recipientName} <span className="font-normal text-slate-500">· {item.phone}</span></div>{item.isDefault && <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">Mặc định</span>}</div>
          <p className="mt-3 whitespace-pre-wrap text-sm text-slate-600">{item.address}</p>
          <div className="mt-4 flex flex-wrap gap-4 text-sm font-semibold"><button onClick={() => { setForm({ recipientName: item.recipientName, phone: item.phone, address: item.address }); setEditingId(item.id); }} className="text-blue-700">Sửa</button><button onClick={() => remove(item.id)} className="text-red-600">Xóa</button>{!item.isDefault && <button onClick={() => makeDefault(item.id)} className="text-slate-700">Đặt mặc định</button>}</div>
        </article>)}
      </section>
      <form onSubmit={submit} className="h-fit space-y-4 rounded-2xl bg-white p-5 shadow-sm">
        <h2 className="text-lg font-black">{editingId ? "Sửa địa chỉ" : "Thêm địa chỉ"}</h2>
        {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <label className="block text-sm font-semibold">Tên người nhận<input required value={form.recipientName} onChange={(e) => setForm({ ...form, recipientName: e.target.value })} className="mt-1 w-full rounded-xl border p-3 font-normal" /></label>
        <label className="block text-sm font-semibold">Số điện thoại<input required type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="mt-1 w-full rounded-xl border p-3 font-normal" /></label>
        <label className="block text-sm font-semibold">Địa chỉ<textarea required rows={3} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="mt-1 w-full rounded-xl border p-3 font-normal" placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành" /></label>
        <button className="w-full rounded-xl bg-blue-700 py-3 font-bold text-white">{editingId ? "Lưu địa chỉ" : "Thêm vào sổ"}</button>
        {editingId && <button type="button" onClick={() => { setEditingId(null); setForm(emptyForm); }} className="w-full rounded-xl border py-3 font-semibold">Hủy sửa</button>}
      </form>
    </div>
  </div></main>;
}
