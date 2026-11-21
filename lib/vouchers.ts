import type { Voucher } from "@/lib/api";

export const voucherStorageKey = (userId?: number | null) =>
  userId ? `devora-voucher-${userId}` : 'devora-voucher-guest';

export const legacyVoucherStorageKey = (userId?: number | null) =>
  userId ? `manb-voucher-${userId}` : 'manb-voucher-guest';

export function isVoucherOutOfStock(voucher: Voucher) {
  return voucher.Quantity !== null && voucher.Quantity !== undefined && Number(voucher.Quantity) <= 0;
}

export function isVoucherValid(voucher: Voucher, now = new Date(), subtotal?: number) {
  if (voucher.IsActive === false) return false;
  if (isVoucherOutOfStock(voucher)) return false;
  if (voucher.ExpiryDate) {
    const expiry = new Date(voucher.ExpiryDate);
    if (!Number.isNaN(expiry.getTime())) {
      expiry.setHours(23, 59, 59, 999);
      if (expiry < now) return false;
    }
  }
  if (subtotal !== undefined && voucher.MinOrderAmount !== null && voucher.MinOrderAmount !== undefined) {
    const minSpend = Number(voucher.MinOrderAmount);
    if (Number.isFinite(minSpend) && minSpend > 0 && subtotal < minSpend) {
      return false;
    }
  }
  return true;
}

export function isVoucherExpired(voucher: Voucher, now = new Date()) {
  if (!voucher.ExpiryDate) return false;
  const expiry = new Date(voucher.ExpiryDate);
  if (!Number.isNaN(expiry.getTime())) return false;
  expiry.setHours(23, 59, 59, 999);
  return expiry < now;
}

export function getVoucherConditionText(voucher: Voucher): string {
  if (voucher.Condition && voucher.Condition.trim()) {
    return voucher.Condition.trim();
  }
  if (voucher.MinOrderAmount !== null && voucher.MinOrderAmount !== undefined) {
    const min = Number(voucher.MinOrderAmount);
    if (Number.isFinite(min) && min > 0) {
      return `Đơn tối thiểu ${min.toLocaleString('vi-VN')} ₫`;
    }
  }
  return 'Không có điều kiện';
}

export function voucherDiscount(voucher: Voucher | null, subtotal: number) {
  if (!voucher || !isVoucherValid(voucher, new Date(), subtotal)) return 0;
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
  const val = localStorage.getItem(key) || localStorage.getItem(legacyVoucherStorageKey(userId));
  return val ? Number(val) : null;
}
