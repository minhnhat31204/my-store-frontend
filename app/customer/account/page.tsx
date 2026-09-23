'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api, getStoredUser, type User } from '@/lib/api';

export default function AccountPage() {
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const stored = getStoredUser();
    setUser(stored);
    setEmail(stored?.RecoveryEmail || '');
  }, []);

  async function sendOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const result = await api.sendEmailVerificationOtp(user.UserID, email.trim(), currentPassword);
      setOtpSent(true);
      setMessage(result.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không gửi được mã email.');
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const result = await api.verifyEmailOtp(user.UserID, email.trim(), otp);
      const updated = { ...user, RecoveryEmail: result.user.RecoveryEmail, RecoveryEmailVerified: true };
      setUser(updated);
      localStorage.setItem('user', JSON.stringify(updated));
      window.dispatchEvent(new Event('user-updated'));
      setOtpSent(false);
      setOtp('');
      setCurrentPassword('');
      setMessage('Email đã được xác minh và gắn với tài khoản.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Mã OTP không hợp lệ.');
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    localStorage.removeItem('user');
    setUser(null);
    window.dispatchEvent(new Event('user-updated'));
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <h1 className="text-4xl font-black">Tài khoản</h1>
        <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
          {user ? <>
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-2xl font-black text-blue-700">{(user.FullName || user.Phone || 'K').charAt(0).toUpperCase()}</div>
              <div>
                <h2 className="text-xl font-bold">{user.FullName || 'Khách hàng'}</h2>
                <p className="text-slate-500">{user.Phone || 'Chưa có số điện thoại'}</p>
              </div>
            </div>

            <section className="mt-7 border-t border-slate-100 pt-6">
              <h3 className="text-lg font-black">Email khôi phục</h3>
              <p className="mt-1 text-sm text-slate-600">Thêm email để có thể nhận mã OTP khi quên mật khẩu.</p>
              {user.RecoveryEmailVerified && <p className="mt-3 rounded-lg bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">Đã xác minh: {user.RecoveryEmail}</p>}

              {!user.RecoveryEmailVerified && <form onSubmit={otpSent ? verifyOtp : sendOtp} className="mt-4 space-y-3">
                <div>
                  <label htmlFor="recovery-email" className="mb-1 block text-sm font-semibold">Email</label>
                  <input id="recovery-email" type="email" required value={email} onChange={(e) => { setEmail(e.target.value); setOtpSent(false); setOtp(''); }} placeholder="email@example.com" className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500" />
                </div>
                {!otpSent && <div>
                  <label htmlFor="email-current-password" className="mb-1 block text-sm font-semibold">Mật khẩu hiện tại</label>
                  <input id="email-current-password" type="password" autoComplete="current-password" required value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Xác nhận bạn là chủ tài khoản" className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500" />
                </div>}
                {otpSent && <div>
                  <label htmlFor="email-otp" className="mb-1 block text-sm font-semibold">Mã OTP gửi đến email</label>
                  <input id="email-otp" type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={6} required value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} placeholder="Nhập mã 6 số" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-center text-xl font-bold tracking-[0.35em] outline-none focus:border-blue-500" />
                </div>}
                {error && <p role="alert" className="text-sm font-semibold text-red-700">{error}</p>}
                {message && <p role="status" className="text-sm font-semibold text-blue-700">{message}</p>}
                <button type="submit" disabled={loading || (otpSent && otp.length !== 6)} className="rounded-xl bg-blue-700 px-5 py-3 font-bold text-white disabled:opacity-50">{loading ? 'Đang xử lý…' : otpSent ? 'Xác minh email' : 'Gửi mã xác minh'}</button>
              </form>}
              {user.RecoveryEmailVerified && message && <p role="status" className="mt-3 text-sm font-semibold text-emerald-700">{message}</p>}
              {user.RecoveryEmailVerified && error && <p role="alert" className="mt-3 text-sm font-semibold text-red-700">{error}</p>}
            </section>

            <div className="mt-6 grid gap-3 border-t border-slate-100 pt-6">
              <Link href="/customer/orders" className="rounded-xl border px-4 py-3 font-semibold hover:bg-slate-50">Lịch sử đơn hàng →</Link>
              <button onClick={logout} className="rounded-xl bg-red-600 px-4 py-3 font-bold text-white">Đăng xuất</button>
            </div>
          </> : <>
            <p className="text-slate-600">Bạn chưa đăng nhập.</p>
            <Link href="/login" className="mt-5 inline-block rounded-xl bg-blue-700 px-5 py-3 font-bold text-white">Đăng nhập</Link>
          </>}
        </div>
      </div>
    </main>
  );
}
