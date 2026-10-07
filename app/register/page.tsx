'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export default function RegisterPage() {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function sendOtp() {
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const result = await api.sendRegistrationOtp(phone.trim());
      setOtpSent(true);
      setMessage(result.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không gửi được mã xác thực.');
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!otpSent) return setError('Vui lòng nhận mã xác thực trước.');
    if (password.length < 8) return setError('Mật khẩu phải có ít nhất 8 ký tự.');
    if (password !== confirmPassword) return setError('Mật khẩu nhập lại không khớp.');
    setLoading(true);
    try {
      await api.register({ phone: phone.trim(), otp, password });
      router.push('/login?registered=1');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đăng ký thất bại.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-10 text-slate-900">
      <div className="mx-auto flex min-h-[80vh] max-w-md items-center">
        <div className="w-full rounded-3xl bg-white p-8 shadow-lg">
          <div className="mb-8 text-center">
            <div className="text-3xl font-black text-blue-700">MANB<span className="text-blue-400">.VN</span></div>
            <h1 className="mt-4 text-2xl font-black">Tạo tài khoản</h1>
            <p className="mt-2 text-sm text-slate-500">Đăng ký bằng số điện thoại và xác thực OTP.</p>
          </div>

          {error && <div role="alert" className="mb-4 rounded-xl bg-red-50 p-3 text-center text-sm text-red-700">{error}</div>}
          {message && <div role="status" className="mb-4 rounded-xl bg-emerald-50 p-3 text-center text-sm text-emerald-700">{message}</div>}

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label htmlFor="register-phone" className="mb-1 block text-sm font-semibold">Số điện thoại</label>
              <div className="flex gap-2">
                <input id="register-phone" type="tel" inputMode="tel" autoComplete="tel" required value={phone} onChange={(e) => { setPhone(e.target.value); setOtpSent(false); setOtp(''); }} placeholder="0901234567" className="min-w-0 flex-1 rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500" />
                <button type="button" onClick={sendOtp} disabled={loading || !phone.trim()} className="shrink-0 rounded-xl border border-blue-600 px-3 text-sm font-bold text-blue-700 disabled:opacity-50">{loading ? 'Đang gửi…' : otpSent ? 'Gửi lại mã' : 'Gửi OTP'}</button>
              </div>
            </div>

            {otpSent && <div>
              <label htmlFor="register-otp" className="mb-1 block text-sm font-semibold">Mã xác thực số điện thoại</label>
              <input id="register-otp" type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={6} required value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} placeholder="123456" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-center text-xl font-bold tracking-[0.35em] outline-none focus:border-blue-500" />
            </div>}

            <div>
              <label htmlFor="register-password" className="mb-1 block text-sm font-semibold">Mật khẩu</label>
              <input id="register-password" type="password" autoComplete="new-password" minLength={8} required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Ít nhất 8 ký tự" className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500" />
            </div>
            <div>
              <label htmlFor="register-confirm-password" className="mb-1 block text-sm font-semibold">Nhập lại mật khẩu</label>
              <input id="register-confirm-password" type="password" autoComplete="new-password" minLength={8} required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Nhập lại mật khẩu" className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500" />
            </div>

            <button type="submit" disabled={loading || !otpSent || otp.length !== 6} className="w-full rounded-xl bg-blue-600 py-3 font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300">{loading ? 'Đang tạo tài khoản…' : 'Đăng ký'}</button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">Đã có tài khoản? <Link href="/login" className="font-bold text-blue-600 hover:underline">Đăng nhập</Link></p>
        </div>
      </div>
    </main>
  );
}
