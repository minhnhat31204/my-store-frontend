import { api, type User, type UserAddressRecord } from "@/lib/api";

export type ShippingAddress = {
  id: string;
  recipientName: string;
  phone: string;
  address: string;
  provinceCode?: string;
  provinceName?: string;
  wardCode?: string;
  wardName?: string;
  latitude?: number;
  longitude?: number;
  isDefault: boolean;
};

export function formatShippingAddress(address: Pick<ShippingAddress, "address" | "wardName" | "provinceName">) {
  return [address.address, address.wardName, address.provinceName].filter(Boolean).join(", ");
}

const key = (userId: number) => `manb-addresses-${userId}`;

export function fromAddressRecord(record: UserAddressRecord): ShippingAddress {
  const latitude = record.Latitude == null ? undefined : Number(record.Latitude);
  const longitude = record.Longitude == null ? undefined : Number(record.Longitude);
  return {
    id: String(record.AddressID),
    recipientName: record.RecipientName,
    phone: record.RecipientPhone,
    address: record.AddressLine,
    provinceCode: record.ProvinceCode || undefined,
    provinceName: record.ProvinceName || undefined,
    wardCode: record.WardCode || undefined,
    wardName: record.WardName || undefined,
    latitude: Number.isFinite(latitude) ? latitude : undefined,
    longitude: Number.isFinite(longitude) ? longitude : undefined,
    isDefault: Boolean(record.IsDefault),
  };
}

export function getLegacyAddresses(user: User): ShippingAddress[] {
  if (typeof window === "undefined") return [];
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(key(user.UserID)) || "[]");
    if (Array.isArray(saved) && saved.length) return saved as ShippingAddress[];
  } catch { /* Fall back to the address on the account profile. */ }
  if (!user.Address) return [];
  return [{
    id: `profile-${user.UserID}`,
    recipientName: user.FullName || "",
    phone: user.Phone || "",
    address: user.Address,
    isDefault: true,
  }];
}

export async function loadAddresses(user: User): Promise<ShippingAddress[]> {
  const savedOnServer = await api.getUserAddresses(user.UserID);
  if (savedOnServer.length) return savedOnServer.map(fromAddressRecord);

  const legacy = getLegacyAddresses(user);
  if (!legacy.length) return [];
  const imported = await api.importUserAddresses(user.UserID, legacy);
  return imported.map(fromAddressRecord);
}

export function getSelectedAddressId(userId: number) {
  return localStorage.getItem(`manb-selected-address-${userId}`);
}

export function saveSelectedAddressId(userId: number, addressId: string) {
  localStorage.setItem(`manb-selected-address-${userId}`, addressId);
}
