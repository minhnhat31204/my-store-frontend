'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, getStoredUser, type User } from '@/lib/api';

const SHIPPING_FEE = 40000;

function itemPrice(item: any) {
  return Number(item.DiscountPrice ?? item.Product?.DiscountPrice ?? item.Price ?? item.Product?.Price ?? 0);
}

function itemName(item: any) {
  return item.ProductName || item.Product?.ProductName || 'Sản phẩm';
}

function itemImage(item: any) {
  return item.ImageUrl || item.Product?.ImageUrl || item.ProductImage || '';
}

export default function CheckoutPage() {
  const router = useRouter();
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [cartLoading, setCartLoading] = useState(true);
  const [error, setError] = useState('');

  // Form thông tin giao hàng
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => {
    const user = getStoredUser();
    if (!user) {
      alert('Vui lòng đăng nhập để thanh toán!');
      router.push('/login');
      return;
    }

    if (user.FullName) {
      setFullName(user.FullName);
    }
    setPhone((user as User).Phone || '');
    setShippingAddress((user as User).Address || '');

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
  const totalAmount = subtotal + SHIPPING_FEE;

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
        Items: cartItems.map((item) => ({
          ProductID: item.ProductID || item.Product?.ProductID,
          Quantity: Number(item.Quantity || 1),
          Price: itemPrice(item),
        })),
      });
      createdOrderId = result.order.OrderID;
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
              disabled={loading || cartLoading || cartItems.length === 0}
              className="w-full rounded-xl bg-blue-600 py-3 font-bold text-white transition hover:bg-blue-700 disabled:bg-blue-300"
            >
              {loading ? 'Đang chuyển đến PayOS...' : 'Đặt hàng và thanh toán'}
            </button>

            <div className="text-center mt-4">
              <Link href="/customer/cart" className="text-sm font-semibold text-blue-600 hover:underline">
                ← Quay lại giỏ hàng
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

            <div className="border-t border-slate-200 pt-4 flex justify-between items-center text-lg font-black">
              <span>Tạm tính:</span>
              <span className="text-blue-600 whitespace-nowrap">{subtotal.toLocaleString('vi-VN')} ₫</span>
            </div>
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
