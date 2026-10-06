'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, getPrimaryProductImage, getStoredUser, type User } from '@/lib/api';
import type { Voucher } from '@/lib/api';
import { formatShippingAddress, getLegacyAddresses, getSelectedAddressId, loadAddresses, saveSelectedAddressId, type ShippingAddress } from '@/lib/addresses';
import { getSelectedVoucherId, saveSelectedVoucher, voucherDiscount } from '@/lib/vouchers';

const SHIPPING_FEE = 40000;

function itemPrice(item: any) {
  return Number(item.DiscountPrice ?? item.Product?.DiscountPrice ?? item.Price ?? item.Product?.Price ?? 0);
}

function itemName(item: any) {
  return item.ProductName || item.Product?.ProductName || 'Sản phẩm';
}

function itemImage(item: any) {
  return getPrimaryProductImage(item.ImageUrl || item.Product?.ImageUrl || item.ProductImage || '');
}

export default function CheckoutPage() {
  const router = useRouter();
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [cartLoading, setCartLoading] = useState(true);
  const [addressLoading, setAddressLoading] = useState(true);
  const [error, setError] = useState('');

  // Form thông tin giao hàng
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [note, setNote] = useState('');
  const [addresses, setAddresses] = useState<ShippingAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [voucher, setVoucher] = useState<Voucher | null>(null);
  const [couponInput, setCouponInput] = useState('');
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [voucherFeedback, setVoucherFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    const user = getStoredUser();
    if (!user) {
      alert('Vui lòng đăng nhập để thanh toán!');
      router.push('/login');
      return;
    }

    loadAddresses(user)
      .catch((error) => {
        console.error('Lỗi khi tải sổ địa chỉ:', error);
        return getLegacyAddresses(user);
      })
      .then((savedAddresses) => {
        setAddresses(savedAddresses);
        const preferredId = getSelectedAddressId(user.UserID);
        const selectedAddress = savedAddresses.find((item) => item.id === preferredId)
          || savedAddresses.find((item) => item.isDefault)
          || savedAddresses[0];
        if (selectedAddress) {
          setSelectedAddressId(selectedAddress.id);
          setFullName(selectedAddress.recipientName);
          setPhone(selectedAddress.phone);
          setShippingAddress(formatShippingAddress(selectedAddress));
        } else {
          setFullName(user.FullName || '');
          setPhone((user as User).Phone || '');
          setShippingAddress((user as User).Address || '');
        }
      })
      .finally(() => setAddressLoading(false));

    const voucherId = getSelectedVoucherId(user.UserID);
    if (voucherId) {
      api.getVouchers()
        .then((items) => setVoucher(items.find((item) => item.VoucherID === voucherId) || null))
        .catch(() => {});
    }

    // Gọi API lấy giỏ hàng từ Backend dựa vào UserID
    api.getCart(user.UserID)
      .then((data) => {
        setCartItems(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        console.error('Lỗi khi tải giỏ hàng:', err);
        setError('Không thể tải dữ liệu giỏ hàng từ hệ thống.');
      })
      .finally(() => setCartLoading(false));
  }, [router]);

  const subtotal = cartItems.reduce(
    (sum, item) => sum + itemPrice(item) * Number(item.Quantity || 1),
    0
  );
  const discountAmount = voucherDiscount(voucher, subtotal);
  const totalAmount = Math.max(0, subtotal - discountAmount) + SHIPPING_FEE;

  async function applyVoucherCode(e?: React.FormEvent) {
    if (e) e.preventDefault();
    const code = couponInput.trim();
    if (!code) {
      setVoucherFeedback({ type: 'error', message: 'Vui lòng nhập mã giảm giá.' });
      return;
    }
    setApplyingCoupon(true);
    setVoucherFeedback(null);
    try {
      const res = await api.validateVoucher(code, subtotal);
      if (res.valid && res.voucher) {
        setVoucher(res.voucher);
        const user = getStoredUser();
        saveSelectedVoucher(user?.UserID, res.voucher.VoucherID);
        setVoucherFeedback({ type: 'success', message: res.message || `Đã áp dụng mã "${res.voucher.Code}"!` });
        setCouponInput('');
      } else {
        setVoucherFeedback({ type: 'error', message: res.message || 'Mã giảm giá không hợp lệ.' });
      }
    } catch (err) {
      setVoucherFeedback({ type: 'error', message: err instanceof Error ? err.message : 'Mã giảm giá không hợp lệ hoặc đã hết hạn.' });
    } finally {
      setApplyingCoupon(false);
    }
  }

  function handleRemoveVoucher() {
    const user = getStoredUser();
    saveSelectedVoucher(user?.UserID, null);
    setVoucher(null);
    setVoucherFeedback(null);
    setCouponInput('');
  }

  function selectAddress(id: string) {
    setSelectedAddressId(id);
    const item = addresses.find((address) => address.id === id);
    if (item) {
      setFullName(item.recipientName);
      setPhone(item.phone);
        setShippingAddress(formatShippingAddress(item));
      const user = getStoredUser();
      if (user) saveSelectedAddressId(user.UserID, id);
    }
  }

  async function handleCheckout(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (cartItems.length === 0) {
      setError('Giỏ hàng của bạn đang trống.');
      return;
    }
    const user = getStoredUser();
    if (!user) {
      alert('Vui lòng đăng nhập trước khi thanh toán!');
      router.push('/login');
      return;
    }

    setLoading(true);
    let createdOrderId: number | null = null;

    try {
      // 1. Gọi API tạo đơn hàng
      const result = await api.createOrder({
        UserID: user.UserID,
        RecipientName: fullName,
        RecipientPhone: phone,
        ShippingAddress: shippingAddress,
        Note: note,
        TotalAmount: totalAmount,
        PaymentMethod: 'PayOS',
        Status: 'Pending',
        DiscountAmount: discountAmount,
        VoucherCode: discountAmount > 0 ? voucher?.Code : undefined,
        VoucherID: discountAmount > 0 ? voucher?.VoucherID : undefined,
        Items: cartItems.map((item) => ({
          ProductID: item.ProductID || item.Product?.ProductID,
          Quantity: Number(item.Quantity || 1),
          Price: itemPrice(item),
        })),
      });
      createdOrderId = result.order.OrderID;
      saveSelectedVoucher(user.UserID, null);
      window.dispatchEvent(new Event('cart-updated'));
      const payment = await api.createPayOSPayment(result.order.OrderID, user.UserID);
      window.location.assign(payment.checkoutUrl);
    } catch (err) {
      if (createdOrderId) {
        router.push(`/customer/orders/${createdOrderId}?payment=retry`);
      } else {
        setError(err instanceof Error ? err.message : 'Không thể tạo đơn hàng.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-10 text-slate-900">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-6 text-3xl font-black">Xác nhận thanh toán</h1>

        {error && (
          <div className="mb-4 rounded-xl bg-red-50 p-4 text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          {/* Form thông tin giao hàng */}
          <form onSubmit={handleCheckout} className="rounded-3xl bg-white p-6 shadow-sm space-y-4">
            <h2 className="text-xl font-bold mb-4">Thông tin nhận hàng</h2>

            <div className="rounded-xl border border-blue-100 bg-blue-50 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2"><label htmlFor="saved-address" className="text-sm font-bold">Địa chỉ đã lưu</label><Link href="/customer/addresses" className="text-sm font-bold text-blue-700">Quản lý sổ địa chỉ →</Link></div>
                {addresses.length ? <select id="saved-address" value={selectedAddressId} onChange={(e) => selectAddress(e.target.value)} className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm"><option value="">Nhập địa chỉ khác</option>{addresses.map((item) => <option key={item.id} value={item.id}>{item.recipientName} · {item.phone} · {formatShippingAddress(item)}</option>)}</select> : <p className="mt-2 text-xs text-slate-600">Bạn chưa lưu địa chỉ. <Link href="/customer/addresses" className="font-bold text-blue-700">Thêm địa chỉ</Link></p>}
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold">Họ và tên</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 outline-none focus:border-blue-500"
                placeholder="Nhập họ tên người nhận"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold">Số điện thoại</label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 outline-none focus:border-blue-500"
                placeholder="Nhập số điện thoại"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold">Địa chỉ giao hàng</label>
              <textarea
                required
                rows={3}
                value={shippingAddress}
                onChange={(e) => setShippingAddress(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 outline-none focus:border-blue-500"
                placeholder="Số nhà, tên đường, phường/xã, quận/huyện..."
              />
            </div>

            <fieldset className="space-y-3">
              <legend className="mb-2 text-sm font-semibold">Phương thức thanh toán</legend>
              <div className="flex items-center gap-3 rounded-xl border border-blue-600 bg-blue-50 p-3 text-sm">
                <span aria-hidden="true" className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-700 text-xs font-bold text-white">✓</span>
                <span className="font-semibold">PayOS · Chuyển khoản QR / ngân hàng</span>
              </div>
              <p className="text-xs leading-5 text-slate-500">Sau khi xác nhận đơn, bạn sẽ được chuyển đến trang thanh toán PayOS bảo mật.</p>
            </fieldset>

            <div>
              <label className="mb-1 block text-sm font-semibold">Ghi chú (tuỳ chọn)</label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 outline-none focus:border-blue-500"
                placeholder="Ghi chú cho shipper..."
              />
            </div>

            <button
              type="submit"
              disabled={loading || cartLoading || addressLoading || cartItems.length === 0}
              className="w-full rounded-xl bg-blue-600 py-3 font-bold text-white transition hover:bg-blue-700 disabled:bg-blue-300"
            >
              {loading ? 'Đang chuyển đến PayOS...' : 'Đặt hàng và thanh toán'}
            </button>

            <div className="text-center mt-4">
              <Link
                href="/customer/cart"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-xs transition hover:border-slate-300 hover:bg-slate-50 hover:text-blue-600"
              >
                <svg className="h-4 w-4 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
                <span>Quay lại</span>
              </Link>
            </div>
          </form>

          {/* Tóm tắt đơn hàng */}
          <div className="rounded-3xl bg-white p-6 shadow-sm h-fit">
            <h2 className="text-xl font-bold mb-4">Đơn hàng của bạn</h2>
            
            <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto mb-4 pr-1">
              {cartLoading ? (
                <p className="py-4 text-center text-sm text-slate-500">Đang tải giỏ hàng...</p>
              ) : cartItems.length === 0 ? (
                <p className="py-4 text-center text-sm text-slate-500">Giỏ hàng trống</p>
              ) : (
                cartItems.map((item, idx) => {
                  const imageUrl = itemImage(item);
                  const productName = itemName(item);
                  const price = itemPrice(item);
                  const itemQty = Number(item.Quantity || 1);

                  return (
                    <div key={idx} className="py-3 flex items-center gap-3 text-sm">
                      {imageUrl ? (
                        <img 
                          src={imageUrl} 
                          alt={productName} 
                          className="w-14 h-14 object-cover rounded-xl border border-slate-200 flex-shrink-0 bg-slate-50"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-xl border border-slate-200 bg-slate-100 flex items-center justify-center text-xs text-slate-400 flex-shrink-0">
                          Ảnh
                        </div>
                      )}
                      
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-800 break-words">{productName}</p>
                        <p className="text-slate-500 text-xs mt-0.5">SL: {itemQty}</p>
                      </div>

                      <span className="font-bold text-blue-600 whitespace-nowrap ml-2">
                        {(price * itemQty).toLocaleString('vi-VN')} ₫
                      </span>
                    </div>
                  );
                })
              )}
            </div>

            {/* Khối nhập mã giảm giá */}
            <div className="mb-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-3.5">
              <div className="flex items-center justify-between gap-2 mb-2.5">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                  </svg>
                  Mã ưu đãi / giảm giá
                </span>
                <Link href="/customer/vouchers" className="text-[11px] font-bold text-blue-700 hover:underline">
                  Chọn voucher →
                </Link>
              </div>

              {voucher ? (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/90 p-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs font-black uppercase text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                          {voucher.Code}
                        </span>
                        <span className="text-xs font-bold text-emerald-700">
                          -{Number(voucher.DiscountPercentage) || 0}%
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-emerald-900 font-medium">
                        {voucher.Name}
                      </p>
                      {voucher.MaxDiscountAmount && (
                        <p className="text-[11px] text-emerald-700">
                          Giảm tối đa {Number(voucher.MaxDiscountAmount).toLocaleString('vi-VN')} ₫
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveVoucher}
                      className="text-xs font-bold text-rose-600 hover:text-rose-700 underline shrink-0"
                    >
                      Bỏ mã
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={applyVoucherCode} className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                      placeholder="Nhập mã voucher..."
                      className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium uppercase placeholder-slate-400 focus:border-blue-500 focus:outline-none"
                    />
                    <button
                      type="submit"
                      disabled={applyingCoupon || !couponInput.trim()}
                      className="rounded-xl bg-blue-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-blue-700 disabled:bg-slate-300 shrink-0"
                    >
                      {applyingCoupon ? '...' : 'Áp dụng'}
                    </button>
                  </div>
                </form>
              )}

              {voucherFeedback && (
                <div
                  className={`mt-2 rounded-lg p-2 text-xs font-medium ${
                    voucherFeedback.type === 'success'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-rose-100 text-rose-700'
                  }`}
                >
                  {voucherFeedback.message}
                </div>
              )}
            </div>

            <div className="border-t border-slate-200 pt-4 flex justify-between items-center text-sm">
              <span>Tạm tính:</span><span>{subtotal.toLocaleString('vi-VN')} ₫</span>
            </div>
            {discountAmount > 0 && <div className="mt-2 flex justify-between text-sm font-semibold text-emerald-700"><span>Voucher {voucher?.Code ? `(${voucher.Code})` : ''}</span><span>−{discountAmount.toLocaleString('vi-VN')} ₫</span></div>}
            <div className="mt-2 flex justify-between text-sm text-slate-600">
              <span>Phí vận chuyển</span><span>{SHIPPING_FEE.toLocaleString('vi-VN')} ₫</span>
            </div>
            <div className="mt-3 border-t border-slate-200 pt-4 flex justify-between items-center text-lg font-black">
              <span>Tổng thanh toán:</span>
              <span className="text-blue-600 whitespace-nowrap">{totalAmount.toLocaleString('vi-VN')} ₫</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
