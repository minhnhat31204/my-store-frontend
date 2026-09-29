"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api, getStoredUser, type User } from "@/lib/api";
import { fromAddressRecord, getLegacyAddresses, loadAddresses, saveSelectedAddressId, type ShippingAddress } from "@/lib/addresses";

const MapPicker = dynamic(() => import("./MapPicker"), { ssr: false, loading: () => <div className="h-72 animate-pulse rounded-xl bg-slate-100" /> });
type Region = { code: string; name: string; provinceCode?: string };
type GeocodeFeature = { geometry?: { coordinates?: [number, number] }; properties?: Record<string, unknown> };
type AddressForm = {
  recipientName: string; phone: string; address: string;
  provinceCode: string; provinceName: string; wardCode: string; wardName: string;
  latitude: number | null; longitude: number | null;
};
const emptyForm: AddressForm = { recipientName: "", phone: "", address: "", provinceCode: "", provinceName: "", wardCode: "", wardName: "", latitude: null, longitude: null };

function normalizeVietnamese(value: unknown) {
  return String(value || "").toLocaleLowerCase("vi").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").trim();
}

function normalizeRegion(value: unknown) {
  return normalizeVietnamese(value)
    .replace(/^(thanh pho|tp|tinh|province|city|municipality|district|quan|phuong|ward|xa|commune|village)\s+/i, "")
    .replace(/\s+(city|province|district|municipality)$/i, "").trim();
}

function regionCandidate(properties: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = properties[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

function matchRegion(regions: Region[], candidates: string[]) {
  const normalized = candidates.map(normalizeRegion).filter(Boolean);
  const exact = regions.find((region) => normalized.includes(normalizeRegion(region.name)));
  if (exact) return exact;
  return regions.find((region) => normalized.some((candidate) => candidate.length >= 5
    && (candidate.includes(normalizeRegion(region.name)) || normalizeRegion(region.name).includes(candidate))));
}

function addressLookupText(address: string, ward: string, province: string) {
  return [address.trim(), ward.trim(), province.trim()].filter(Boolean).join(", ");
}

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
  const [geocoding, setGeocoding] = useState(false);
  const [mapAddressStatus, setMapAddressStatus] = useState("");
  const requestId = useRef(0);
  const lastGeocodedAddress = useRef("");

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

  const applyGeocodedFeature = useCallback((feature: GeocodeFeature, pickedPoint?: { latitude: number; longitude: number }) => {
    const properties = feature.properties || {};
    const coordinates = feature.geometry?.coordinates;
    const longitude = pickedPoint?.longitude ?? coordinates?.[0];
    const latitude = pickedPoint?.latitude ?? coordinates?.[1];
    if (typeof latitude !== "number" || typeof longitude !== "number") return false;

    const provinceValue = regionCandidate(properties, ["province", "state", "city", "municipality"]);
    const province = matchRegion(provinces, [provinceValue, String(properties.county || "")]);
    const wardValue = regionCandidate(properties, ["ward", "suburb", "district", "city_district", "locality", "quarter", "neighbourhood", "village", "town"]);
    const wardsForProvince = province ? wardCatalog.filter((ward) => ward.provinceCode === province.code) : wardCatalog;
    const ward = matchRegion(wardsForProvince, [wardValue]);
    const houseNumber = String(properties.housenumber || "").trim();
    const street = String(properties.street || "").trim();
    const placeName = String(properties.name || properties.locality || properties.road || "").trim();
    const address = [houseNumber, street].filter(Boolean).join(" ") || placeName || String(properties.label || "").trim();
    const provinceText = province?.name || provinceValue;
    const wardText = ward?.name || wardValue;
    lastGeocodedAddress.current = normalizeVietnamese(addressLookupText(address, wardText, provinceText));
    setProvinceSearch(provinceText);
    setWardSearch(wardText);
    setForm((current) => ({
      ...current,
      ...(address ? { address } : {}),
      provinceCode: province?.code || "",
      provinceName: province?.name || "",
      wardCode: ward?.code || "",
      wardName: ward?.name || "",
      latitude,
      longitude,
    }));
    return true;
  }, [provinces, wardCatalog]);

  const geocodeAddress = useCallback(async (query: string, force = false) => {
    const key = normalizeVietnamese(query);
    if (!key || (!force && key === lastGeocodedAddress.current)) return;
    lastGeocodedAddress.current = key;
    const currentRequest = ++requestId.current;
    setGeocoding(true);
    setMapAddressStatus("Đang tìm vị trí theo địa chỉ…");
    try {
      const params = new URLSearchParams({ q: query });
      if (form.latitude !== null && form.longitude !== null) {
        params.set("lat", String(form.latitude));
        params.set("lon", String(form.longitude));
      }
      const response = await fetch(`/api/address-geocode?${params.toString()}`);
      const data = await response.json() as { feature?: GeocodeFeature | null; exact?: boolean; error?: string };
      if (currentRequest !== requestId.current) return;
      const coordinates = data.feature?.geometry?.coordinates;
      if (!response.ok || !coordinates) throw new Error(data.error || "Không tìm thấy địa chỉ trên bản đồ.");
      lastGeocodedAddress.current = key;
      setForm((current) => ({ ...current, latitude: coordinates[1], longitude: coordinates[0] }));
      setMapAddressStatus(data.exact
        ? "Đã ghim bản đồ theo địa chỉ. Hãy kiểm tra lại vị trí trước khi lưu."
        : "Không tìm thấy chính xác số nhà/tên đường; đã ghim gần khu vực phường/xã. Hãy kéo ghim đến đúng vị trí.");
    } catch (cause) {
      if (currentRequest === requestId.current) setMapAddressStatus(cause instanceof Error ? cause.message : "Không tra được vị trí từ địa chỉ.");
    } finally {
      if (currentRequest === requestId.current) setGeocoding(false);
    }
  }, [form.latitude, form.longitude]);

  const reverseGeocode = useCallback(async (latitude: number, longitude: number) => {
    const currentRequest = ++requestId.current;
    setGeocoding(true);
    setMapAddressStatus("Đang lấy thông tin địa chỉ tại vị trí ghim…");
    try {
      const response = await fetch(`/api/address-geocode?lat=${latitude}&lon=${longitude}`);
      const data = await response.json() as { feature?: GeocodeFeature | null; error?: string };
      if (currentRequest !== requestId.current) return;
      if (!response.ok || !data.feature) throw new Error(data.error || "Không tìm thấy thông tin địa chỉ ở vị trí này.");
      if (!applyGeocodedFeature(data.feature, { latitude, longitude })) throw new Error("Bản đồ chưa trả về đủ thông tin địa chỉ.");
      setMapAddressStatus("Đã điền địa chỉ gần vị trí ghim. Kiểm tra lại phường/xã và số nhà trước khi lưu.");
    } catch (cause) {
      if (currentRequest === requestId.current) setMapAddressStatus(cause instanceof Error ? cause.message : "Không lấy được địa chỉ từ vị trí ghim.");
    } finally {
      if (currentRequest === requestId.current) setGeocoding(false);
    }
  }, [applyGeocodedFeature]);

  const completeAddressQuery = addressLookupText(form.address, form.wardName, form.provinceName);
  const handleMapPick = useCallback((latitude: number, longitude: number) => {
    lastGeocodedAddress.current = normalizeVietnamese(completeAddressQuery);
    setForm((current) => ({ ...current, latitude, longitude }));
    void reverseGeocode(latitude, longitude);
  }, [completeAddressQuery, reverseGeocode]);

  useEffect(() => {
    if (!form.address.trim() || !form.provinceCode || !form.wardCode) return;
    const key = normalizeVietnamese(completeAddressQuery);
    if (key === lastGeocodedAddress.current) return;
    const timer = window.setTimeout(() => { void geocodeAddress(completeAddressQuery); }, 1200);
    return () => window.clearTimeout(timer);
  }, [completeAddressQuery, form.provinceCode, form.wardCode, geocodeAddress]);

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
      ({ coords }) => { handleMapPick(coords.latitude, coords.longitude); setLocating(false); setError(""); },
      () => { setLocating(false); setError("Không lấy được vị trí. Hãy cấp quyền định vị hoặc ghim trực tiếp trên bản đồ."); },
      { enableHighAccuracy: true, timeout: 12000 },
    );
  }

  if (!user) return <main className="mx-auto max-w-3xl px-4 py-10"><h1 className="text-3xl font-black">Sổ địa chỉ</h1><p className="mt-4">Đăng nhập để quản lý địa chỉ giao hàng.</p><Link className="mt-4 inline-block text-blue-700" href="/login">Đăng nhập →</Link></main>;

  return <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900"><div className="mx-auto max-w-5xl">
    <Link
      href="/customer/account"
      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-xs transition hover:border-slate-300 hover:bg-slate-50 hover:text-blue-600"
    >
      <svg className="h-4 w-4 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path d="M19 12H5M12 19l-7-7 7-7" />
      </svg>
      <span>Quay lại</span>
    </Link>
    <h1 className="mt-4 text-2xl sm:text-3xl font-black">Sổ địa chỉ</h1>
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
            requestId.current += 1; setGeocoding(false); setMapAddressStatus("");
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
            requestId.current += 1; setGeocoding(false); setMapAddressStatus("");
            const value = event.target.value;
            const selected = wards.find((ward) => ward.name.toLocaleLowerCase("vi") === value.trim().toLocaleLowerCase("vi"));
            setWardSearch(value);
            setForm((current) => ({ ...current, wardCode: selected?.code || "", wardName: selected?.name || "" }));
          }} className="mt-1 w-full rounded-xl border p-3 font-normal disabled:bg-slate-100" placeholder={!form.provinceCode ? "Chọn tỉnh/thành trước" : regionsLoading ? "Đang tải danh mục lần đầu…" : "Nhập để tìm phường/xã…"} />
          <datalist id="address-wards">{wards.map((ward) => <option key={ward.code} value={ward.name} />)}</datalist>
        </label>
        <label className="block text-sm font-semibold">Số nhà, tên đường<input required value={form.address} onChange={(event) => { requestId.current += 1; setGeocoding(false); lastGeocodedAddress.current = ""; setMapAddressStatus(""); setForm({ ...form, address: event.target.value }); }} onBlur={() => { if (form.provinceCode && form.wardCode) void geocodeAddress(completeAddressQuery, true); }} className="mt-1 w-full rounded-xl border p-3 font-normal" placeholder="Ví dụ: 123 Nguyễn Trãi" /></label>
        <div>
          <div className="mb-2 flex items-center justify-between gap-2"><span className="text-sm font-semibold">Ghim vị trí giao hàng</span><div className="flex gap-3"><button type="button" onClick={() => void geocodeAddress(completeAddressQuery, true)} disabled={geocoding || !form.address.trim() || !form.provinceCode || !form.wardCode} className="text-xs font-semibold text-blue-700 disabled:opacity-50">Tìm địa chỉ trên bản đồ</button><button type="button" onClick={useMyLocation} disabled={locating} className="text-xs font-semibold text-blue-700 disabled:opacity-50">{locating ? "Đang lấy vị trí…" : "Dùng vị trí hiện tại"}</button></div></div>
          <MapPicker latitude={form.latitude} longitude={form.longitude} onPick={handleMapPick} />
          {mapAddressStatus && <p role="status" className={`mt-2 text-xs ${mapAddressStatus.startsWith("Không") || mapAddressStatus.startsWith("Chưa") ? "text-amber-700" : "text-emerald-700"}`}>{geocoding ? "Đang xử lý… " : ""}{mapAddressStatus}</p>}
          <p className="mt-1 text-[11px] text-slate-500">Tra địa chỉ dùng dịch vụ Photon/OpenStreetMap; tên người nhận và số điện thoại không được gửi đi.</p>
          {form.latitude !== null && form.longitude !== null && <p className="mt-2 text-xs text-slate-600">Tọa độ đã ghim: {form.latitude.toFixed(6)}, {form.longitude.toFixed(6)}</p>}
        </div>
        <button disabled={saving} className="w-full rounded-xl bg-blue-700 py-3 font-bold text-white disabled:opacity-60">{saving ? "Đang lưu…" : editingId ? "Lưu địa chỉ" : "Thêm vào sổ"}</button>
        {editingId && <button type="button" onClick={() => { setEditingId(null); setForm(emptyForm); setProvinceSearch(""); setWardSearch(""); setError(""); }} className="w-full rounded-xl border py-3 font-semibold">Hủy sửa</button>}
      </form>
    </div>
  </div></main>;
}
