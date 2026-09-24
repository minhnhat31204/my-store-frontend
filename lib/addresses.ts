import type { User } from "@/lib/api";

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

export function getAddresses(user: User): ShippingAddress[] {
  if (typeof window === "undefined") return [];
  try {
    const saved = JSON.parse(localStorage.getItem(key(user.UserID)) || "[]");
    if (Array.isArray(saved) && saved.length) return saved as ShippingAddress[];
  } catch { /* Recover using the profile's current address below. */ }
  if (!user.Address) return [];
  return [{
    id: `profile-${user.UserID}`,
    recipientName: user.FullName || "",
    phone: user.Phone || "",
    address: user.Address,
    isDefault: true,
  }];
}

export function saveAddresses(userId: number, addresses: ShippingAddress[]) {
  localStorage.setItem(key(userId), JSON.stringify(addresses));
}

export function getSelectedAddressId(userId: number) {
  return localStorage.getItem(`manb-selected-address-${userId}`);
}

export function saveSelectedAddressId(userId: number, addressId: string) {
  localStorage.setItem(`manb-selected-address-${userId}`, addressId);
}
