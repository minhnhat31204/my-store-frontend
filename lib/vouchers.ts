import type { Voucher } from "@/lib/api";

export const voucherStorageKey = (userId?: number | null) =>
  userId ? `manb-voucher-${userId}` : 'manb-voucher-guest';

export function isVoucherValid(voucher: Voucher, now = new Date()) {
  if (voucher.IsActive === false) return false;
  if (!voucher.ExpiryDate) return true;
  const expiry = new Date(voucher.ExpiryDate);
  if (Number.isNaN(expiry.getTime())) return false;
  expiry.setHours(23, 59, 59, 999);
  return expiry >= now;
}

export function voucherDiscount(voucher: Voucher | null, subtotal: number) {
  if (!voucher || !isVoucherValid(voucher)) return 0;
  const percentage = Math.max(0, Number(voucher.DiscountPercentage) || 0);
  const max = Number(voucher.MaxDiscountAmount);
  const uncapped = (subtotal * percentage) / 100;
  const discount = Math.min(subtotal, Number.isFinite(max) && max > 0 ? Math.min(uncapped, max) : uncapped);
  return Math.round(discount);
}

export function saveSelectedVoucher(userId: number | undefined | null, voucherId: number | null) {
  if (typeof window === 'undefined') return;
  const key = voucherStorageKey(userId);
  if (voucherId) {
    localStorage.setItem(key, String(voucherId));
  } else {
    localStorage.removeItem(key);
  }
  window.dispatchEvent(new Event('voucher-updated'));
}

export function getSelectedVoucherId(userId?: number | null): number | null {
  if (typeof window === 'undefined') return null;
  const key = voucherStorageKey(userId);
  const val = localStorage.getItem(key);
  return val ? Number(val) : null;
}
