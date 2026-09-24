"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getStoredUser, type User } from "@/lib/api";
import { getAddresses, saveAddresses, saveSelectedAddressId, type ShippingAddress } from "@/lib/addresses";

const MapPicker = dynamic(() => import("./MapPicker"), { ssr: false, loading: () => <div className="h-72 animate-pulse rounded-xl bg-slate-100" /> });
type Region = { code: string; name: string };
type AddressForm = {
  recipientName: string; phone: string; address: string;
  provinceCode: string; provinceName: string; wardCode: string; wardName: string;
  latitude: number | null; longitude: number | null;
};
const emptyForm: AddressForm = { recipientName: "", phone: "", address: "", provinceCode: "", provinceName: "", wardCode: "", wardName: "", latitude: null, longitude: null };

export default function AddressesPage() {
  const [user, setUser] = useState<User | null>(null);
  const [addresses, setAddressList] = useState<ShippingAddress[]>([]);
  const [form, setForm] = useState<AddressForm>(emptyForm);
  const [provinces, setProvinces] = useState<Region[]>([]);
  const [wards, setWards] = useState<Region[]>([]);
  const [regionsError, setRegionsError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    const stored = getStoredUser();
    setUser(stored);
    if (stored) setAddressList(getAddresses(stored));
    fetch("/api/address-regions?level=provinces")
      .then(async (response) => {
        if (!response.ok) throw new Error("Không tải được danh sách tỉnh/thành.");
        return response.json() as Promise<Region[]>;
      })
      .then(setProvinces)
      .catch((cause: unknown) => setRegionsError(cause instanceof Error ? cause.message : "Không tải được danh mục địa chỉ."));
  }, []);

  useEffect(() => {
    if (!form.provinceCode) { setWards([]); return; }
    const controller = new AbortController();
    setWards([]);
    fetch(`/api/address-regions?level=wards&provinceCode=${encodeURIComponent(form.provinceCode)}`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("Không tải được danh sách phường/xã.");
        return response.json() as Promise<Region[]>;
      })
      .then(setWards)
      .catch((cause: unknown) => { if (!controller.signal.aborted) setRegionsError(cause instanceof Error ? cause.message : "Không tải được danh mục địa chỉ."); });
    return () => controller.abort();
  }, [form.provinceCode]);

  function persist(next: ShippingAddress[]) {
    if (!user) return;
    setAddressList(next);
    saveAddresses(user.UserID, next);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2200);
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    if (!user) return;
    if (!form.recipientName.trim() || !form.phone.trim() || !form.address.trim() || !form.provinceCode || !form.wardCode) {
      setError("Vui lòng điền thông tin và chọn tỉnh/thành, phường/xã.");
      return;
    }
    if (form.latitude === null || form.longitude === null) {
      setError("Hãy ghim vị trí giao hàng trên bản đồ trước khi lưu.");
      return;
    }
    const addressData = {
      recipientName: form.recipientName.trim(), phone: form.phone.trim(), address: form.address.trim(),
      provinceCode: form.provinceCode, provinceName: form.provinceName, wardCode: form.wardCode, wardName: form.wardName,
      latitude: form.latitude, longitude: form.longitude,
    };
    const next = editingId
      ? addresses.map((item) => item.id === editingId ? { ...item, ...addressData } : item)
      : [...addresses, { id: crypto.randomUUID(), ...addressData, isDefault: addresses.length === 0 }];
    persist(next);
    setForm(emptyForm);
    setEditingId(null);
  }

  function editAddress(item: ShippingAddress) {
    setForm({
      recipientName: item.recipientName, phone: item.phone, address: item.address,
      provinceCode: item.provinceCode || "", provinceName: item.provinceName || "", wardCode: item.wardCode || "", wardName: item.wardName || "",
      latitude: item.latitude ?? null, longitude: item.longitude ?? null,
    });
    setEditingId(item.id);
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
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

  function useMyLocation() {
    if (!navigator.geolocation) { setError("Trình duyệt này không hỗ trợ định vị."); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => { setForm((current) => ({ ...current, latitude: coords.latitude, longitude: coords.longitude })); setLocating(false); setError(""); },
      () => { setLocating(false); setError("Không lấy được vị trí. Hãy cấp quyền định vị hoặc ghim trực tiếp trên bản đồ."); },
      { enableHighAccuracy: true, timeout: 12000 },
    );
  }

  if (!user) return <main className="mx-auto max-w-3xl px-4 py-10"><h1 className="text-3xl font-black">Sổ địa chỉ</h1><p className="mt-4">Đăng nhập để quản lý địa chỉ giao hàng.</p><Link className="mt-4 inline-block text-blue-700" href="/login">Đăng nhập →</Link></main>;

  return <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900"><div className="mx-auto max-w-5xl">
    <Link href="/customer/account" className="text-sm font-semibold text-blue-700">← Tài khoản</Link>
    <h1 className="mt-2 text-3xl font-black">Sổ địa chỉ</h1>
    <p className="mt-2 text-sm text-slate-600">Chọn địa giới hành chính hiện hành và ghim điểm giao hàng cụ thể trên bản đồ.</p>
    {saved && <p role="status" className="mt-4 rounded-xl bg-emerald-50 p-3 text-emerald-800">Đã lưu thay đổi.</p>}
    {regionsError && <p role="alert" className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">{regionsError} Thử tải lại trang sau.</p>}
    <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_440px]">
      <section className="space-y-3">
        {addresses.length === 0 && <div className="rounded-2xl bg-white p-6 text-slate-600 shadow-sm">Bạn chưa lưu địa chỉ nào.</div>}
        {addresses.map((item) => <article key={item.id} className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2"><div className="font-bold">{item.recipientName} <span className="font-normal text-slate-500">· {item.phone}</span></div>{item.isDefault && <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">Mặc định</span>}</div>
          <p className="mt-3 text-sm text-slate-700">{[item.address, item.wardName, item.provinceName].filter(Boolean).join(", ")}</p>
          {item.latitude !== undefined && item.longitude !== undefined && <a className="mt-2 inline-block text-xs font-semibold text-blue-700" href={`https://www.openstreetmap.org/?mlat=${item.latitude}&mlon=${item.longitude}#map=17/${item.latitude}/${item.longitude}`} target="_blank" rel="noreferrer">Xem vị trí trên bản đồ ↗ <span className="font-normal text-slate-500">({item.latitude.toFixed(6)}, {item.longitude.toFixed(6)})</span></a>}
          <div className="mt-4 flex flex-wrap gap-4 text-sm font-semibold"><button type="button" onClick={() => editAddress(item)} className="text-blue-700">Sửa</button><button type="button" onClick={() => remove(item.id)} className="text-red-600">Xóa</button>{!item.isDefault && <button type="button" onClick={() => makeDefault(item.id)} className="text-slate-700">Đặt mặc định</button>}</div>
        </article>)}
      </section>
      <form onSubmit={submit} className="h-fit space-y-4 rounded-2xl bg-white p-5 shadow-sm">
        <h2 className="text-lg font-black">{editingId ? "Sửa địa chỉ" : "Thêm địa chỉ"}</h2>
        {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <label className="block text-sm font-semibold">Tên người nhận<input required value={form.recipientName} onChange={(event) => setForm({ ...form, recipientName: event.target.value })} className="mt-1 w-full rounded-xl border p-3 font-normal" /></label>
        <label className="block text-sm font-semibold">Số điện thoại<input required type="tel" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} className="mt-1 w-full rounded-xl border p-3 font-normal" /></label>
        <label className="block text-sm font-semibold">Tỉnh / thành phố<select required value={form.provinceCode} onChange={(event) => {
          const selected = provinces.find((province) => province.code === event.target.value);
          setForm({ ...form, provinceCode: event.target.value, provinceName: selected?.name || "", wardCode: "", wardName: "" });
          setRegionsError("");
        }} className="mt-1 w-full rounded-xl border bg-white p-3 font-normal"><option value="">Chọn tỉnh/thành</option>{provinces.map((province) => <option key={province.code} value={province.code}>{province.name}</option>)}</select></label>
        <label className="block text-sm font-semibold">Phường / xã<select required disabled={!form.provinceCode || wards.length === 0} value={form.wardCode} onChange={(event) => {
          const selected = wards.find((ward) => ward.code === event.target.value);
          setForm({ ...form, wardCode: event.target.value, wardName: selected?.name || "" });
        }} className="mt-1 w-full rounded-xl border bg-white p-3 font-normal disabled:bg-slate-100"><option value="">{!form.provinceCode ? "Chọn tỉnh/thành trước" : wards.length ? "Chọn phường/xã" : "Đang tải danh sách…"}</option>{wards.map((ward) => <option key={ward.code} value={ward.code}>{ward.name}</option>)}</select></label>
        <label className="block text-sm font-semibold">Số nhà, tên đường<input required value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} className="mt-1 w-full rounded-xl border p-3 font-normal" placeholder="Ví dụ: 123 Nguyễn Trãi" /></label>
        <div>
          <div className="mb-2 flex items-center justify-between gap-2"><span className="text-sm font-semibold">Ghim vị trí giao hàng</span><button type="button" onClick={useMyLocation} disabled={locating} className="text-xs font-semibold text-blue-700 disabled:opacity-50">{locating ? "Đang lấy vị trí…" : "Dùng vị trí hiện tại"}</button></div>
          <MapPicker latitude={form.latitude} longitude={form.longitude} onPick={(latitude, longitude) => setForm((current) => ({ ...current, latitude, longitude }))} />
          {form.latitude !== null && form.longitude !== null && <p className="mt-2 text-xs text-slate-600">Tọa độ đã ghim: {form.latitude.toFixed(6)}, {form.longitude.toFixed(6)}</p>}
        </div>
        <button className="w-full rounded-xl bg-blue-700 py-3 font-bold text-white">{editingId ? "Lưu địa chỉ" : "Thêm vào sổ"}</button>
        {editingId && <button type="button" onClick={() => { setEditingId(null); setForm(emptyForm); setError(""); }} className="w-full rounded-xl border py-3 font-semibold">Hủy sửa</button>}
      </form>
    </div>
  </div></main>;
}
