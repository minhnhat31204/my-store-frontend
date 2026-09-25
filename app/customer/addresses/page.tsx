"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { api, getStoredUser, type User } from "@/lib/api";
import { fromAddressRecord, getLegacyAddresses, loadAddresses, saveSelectedAddressId, type ShippingAddress } from "@/lib/addresses";

const MapPicker = dynamic(() => import("./MapPicker"), { ssr: false, loading: () => <div className="h-72 animate-pulse rounded-xl bg-slate-100" /> });
type Region = { code: string; name: string; provinceCode?: string };
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
  const [wardCatalog, setWardCatalog] = useState<Region[]>([]);
  const [provinceSearch, setProvinceSearch] = useState("");
  const [wardSearch, setWardSearch] = useState("");
  const [regionsLoading, setRegionsLoading] = useState(false);
  const [regionsError, setRegionsError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [locating, setLocating] = useState(false);
  const [addressesLoading, setAddressesLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const stored = getStoredUser();
    setUser(stored);
    if (stored) {
      setAddressList(getLegacyAddresses(stored));
      loadAddresses(stored)
        .then(setAddressList)
        .catch((cause: unknown) => setError(cause instanceof Error ? `Không đồng bộ được sổ địa chỉ: ${cause.message}` : "Không đồng bộ được sổ địa chỉ."))
        .finally(() => setAddressesLoading(false));
    } else {
      setAddressesLoading(false);
    }
    setRegionsLoading(true);
    Promise.all([
      fetch("/api/address-regions?level=provinces"),
      fetch("/api/address-regions?level=wards"),
    ])
      .then(async ([provinceResponse, wardResponse]) => {
        if (!provinceResponse.ok || !wardResponse.ok) throw new Error("Không tải được danh mục địa chỉ.");
        const [provinceData, wardData] = await Promise.all([
          provinceResponse.json() as Promise<Region[]>,
          wardResponse.json() as Promise<Region[]>,
        ]);
        setProvinces(provinceData);
        setWardCatalog(wardData);
      })
      .catch((cause: unknown) => setRegionsError(cause instanceof Error ? cause.message : "Không tải được danh mục địa chỉ."))
      .finally(() => setRegionsLoading(false));
  }, []);

  const wards = useMemo(
    () => wardCatalog.filter((ward) => ward.provinceCode === form.provinceCode),
    [wardCatalog, form.provinceCode],
  );

  async function refreshAddresses(userId: number) {
    const records = await api.getUserAddresses(userId);
    const next = records.map(fromAddressRecord);
    setAddressList(next);
    return next;
  }

  async function submit(event: React.FormEvent) {
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
      RecipientName: form.recipientName.trim(), RecipientPhone: form.phone.trim(), AddressLine: form.address.trim(),
      ProvinceCode: form.provinceCode, ProvinceName: form.provinceName, WardCode: form.wardCode, WardName: form.wardName,
      Latitude: form.latitude, Longitude: form.longitude,
    };
    setSaving(true);
    try {
      if (editingId) {
        await api.updateUserAddress(user.UserID, Number(editingId), addressData);
      } else {
        await api.createUserAddress(user.UserID, { ...addressData, IsDefault: addresses.length === 0 });
      }
      const next = await refreshAddresses(user.UserID);
      const preferred = next.find((item) => item.isDefault) || next[0];
      if (preferred) saveSelectedAddressId(user.UserID, preferred.id);
      setForm(emptyForm);
      setProvinceSearch("");
      setWardSearch("");
      setEditingId(null);
      setError("");
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2200);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không lưu được địa chỉ vào tài khoản.");
    } finally {
      setSaving(false);
    }
  }

  function editAddress(item: ShippingAddress) {
    setForm({
      recipientName: item.recipientName, phone: item.phone, address: item.address,
      provinceCode: item.provinceCode || "", provinceName: item.provinceName || "", wardCode: item.wardCode || "", wardName: item.wardName || "",
      latitude: item.latitude ?? null, longitude: item.longitude ?? null,
    });
    setProvinceSearch(item.provinceName || "");
    setWardSearch(item.wardName || "");
    setEditingId(item.id);
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function makeDefault(id: string) {
    if (!user) return;
    setSaving(true);
    try {
      await api.setDefaultUserAddress(user.UserID, Number(id));
      await refreshAddresses(user.UserID);
      saveSelectedAddressId(user.UserID, id);
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không đổi được địa chỉ mặc định.");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    if (!user) return;
    setSaving(true);
    try {
      await api.deleteUserAddress(user.UserID, Number(id));
      const next = await refreshAddresses(user.UserID);
      const preferred = next.find((item) => item.isDefault) || next[0];
      if (preferred) saveSelectedAddressId(user.UserID, preferred.id);
      if (editingId === id) { setEditingId(null); setForm(emptyForm); setProvinceSearch(""); setWardSearch(""); }
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không xóa được địa chỉ.");
    } finally {
      setSaving(false);
    }
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
    {addressesLoading && <p className="mt-3 text-sm text-slate-500">Đang đồng bộ địa chỉ với tài khoản…</p>}
    {saved && <p role="status" className="mt-4 rounded-xl bg-emerald-50 p-3 text-emerald-800">Đã lưu thay đổi.</p>}
    {regionsError && <p role="alert" className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">{regionsError} Thử tải lại trang sau.</p>}
    <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_440px]">
      <section className="space-y-3">
        {addresses.length === 0 && !addressesLoading && <div className="rounded-2xl bg-white p-6 text-slate-600 shadow-sm">Bạn chưa lưu địa chỉ nào.</div>}
        {addresses.map((item) => <article key={item.id} className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2"><div className="font-bold">{item.recipientName} <span className="font-normal text-slate-500">· {item.phone}</span></div>{item.isDefault && <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">Mặc định</span>}</div>
          <p className="mt-3 text-sm text-slate-700">{[item.address, item.wardName, item.provinceName].filter(Boolean).join(", ")}</p>
          {item.latitude !== undefined && item.longitude !== undefined && <a className="mt-2 inline-block text-xs font-semibold text-blue-700" href={`https://www.openstreetmap.org/?mlat=${item.latitude}&mlon=${item.longitude}#map=17/${item.latitude}/${item.longitude}`} target="_blank" rel="noreferrer">Xem vị trí trên bản đồ ↗ <span className="font-normal text-slate-500">({item.latitude.toFixed(6)}, {item.longitude.toFixed(6)})</span></a>}
          <div className="mt-4 flex flex-wrap gap-4 text-sm font-semibold"><button type="button" disabled={saving} onClick={() => editAddress(item)} className="text-blue-700 disabled:opacity-50">Sửa</button><button type="button" disabled={saving} onClick={() => remove(item.id)} className="text-red-600 disabled:opacity-50">Xóa</button>{!item.isDefault && <button type="button" disabled={saving} onClick={() => makeDefault(item.id)} className="text-slate-700 disabled:opacity-50">Đặt mặc định</button>}</div>
        </article>)}
      </section>
      <form onSubmit={submit} className="h-fit space-y-4 rounded-2xl bg-white p-5 shadow-sm">
        <h2 className="text-lg font-black">{editingId ? "Sửa địa chỉ" : "Thêm địa chỉ"}</h2>
        {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <label className="block text-sm font-semibold">Tên người nhận<input required value={form.recipientName} onChange={(event) => setForm({ ...form, recipientName: event.target.value })} className="mt-1 w-full rounded-xl border p-3 font-normal" /></label>
        <label className="block text-sm font-semibold">Số điện thoại<input required type="tel" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} className="mt-1 w-full rounded-xl border p-3 font-normal" /></label>
        <label className="block text-sm font-semibold">Tỉnh / thành phố
          <input required list="address-provinces" autoComplete="off" value={provinceSearch} onChange={(event) => {
            const value = event.target.value;
            const selected = provinces.find((province) => province.name.toLocaleLowerCase("vi") === value.trim().toLocaleLowerCase("vi"));
            setProvinceSearch(value);
            setWardSearch("");
            setForm((current) => ({ ...current, provinceCode: selected?.code || "", provinceName: selected?.name || "", wardCode: "", wardName: "" }));
            setRegionsError("");
          }} className="mt-1 w-full rounded-xl border p-3 font-normal" placeholder={regionsLoading ? "Đang tải danh mục lần đầu…" : "Nhập để tìm tỉnh/thành…"} />
          <datalist id="address-provinces">{provinces.map((province) => <option key={province.code} value={province.name} />)}</datalist>
        </label>
        <label className="block text-sm font-semibold">Phường / xã
          <input required list="address-wards" autoComplete="off" disabled={!form.provinceCode || regionsLoading} value={wardSearch} onChange={(event) => {
            const value = event.target.value;
            const selected = wards.find((ward) => ward.name.toLocaleLowerCase("vi") === value.trim().toLocaleLowerCase("vi"));
            setWardSearch(value);
            setForm((current) => ({ ...current, wardCode: selected?.code || "", wardName: selected?.name || "" }));
          }} className="mt-1 w-full rounded-xl border p-3 font-normal disabled:bg-slate-100" placeholder={!form.provinceCode ? "Chọn tỉnh/thành trước" : regionsLoading ? "Đang tải danh mục lần đầu…" : "Nhập để tìm phường/xã…"} />
          <datalist id="address-wards">{wards.map((ward) => <option key={ward.code} value={ward.name} />)}</datalist>
        </label>
        <label className="block text-sm font-semibold">Số nhà, tên đường<input required value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} className="mt-1 w-full rounded-xl border p-3 font-normal" placeholder="Ví dụ: 123 Nguyễn Trãi" /></label>
        <div>
          <div className="mb-2 flex items-center justify-between gap-2"><span className="text-sm font-semibold">Ghim vị trí giao hàng</span><button type="button" onClick={useMyLocation} disabled={locating} className="text-xs font-semibold text-blue-700 disabled:opacity-50">{locating ? "Đang lấy vị trí…" : "Dùng vị trí hiện tại"}</button></div>
          <MapPicker latitude={form.latitude} longitude={form.longitude} onPick={(latitude, longitude) => setForm((current) => ({ ...current, latitude, longitude }))} />
          {form.latitude !== null && form.longitude !== null && <p className="mt-2 text-xs text-slate-600">Tọa độ đã ghim: {form.latitude.toFixed(6)}, {form.longitude.toFixed(6)}</p>}
        </div>
        <button disabled={saving} className="w-full rounded-xl bg-blue-700 py-3 font-bold text-white disabled:opacity-60">{saving ? "Đang lưu…" : editingId ? "Lưu địa chỉ" : "Thêm vào sổ"}</button>
        {editingId && <button type="button" onClick={() => { setEditingId(null); setForm(emptyForm); setProvinceSearch(""); setWardSearch(""); setError(""); }} className="w-full rounded-xl border py-3 font-semibold">Hủy sửa</button>}
      </form>
    </div>
  </div></main>;
}
