'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

function EyeIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
      <line x1="2" y1="2" x2="22" y2="22" />
    </svg>
  );
}

export default function RegisterPage() {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
              <div className="relative">
                <input
                  id="register-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  minLength={8}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Ít nhất 8 ký tự"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 pr-11 outline-none focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>
            <div>
              <label htmlFor="register-confirm-password" className="mb-1 block text-sm font-semibold">Nhập lại mật khẩu</label>
              <div className="relative">
                <input
                  id="register-confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  minLength={8}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Nhập lại mật khẩu"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 pr-11 outline-none focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading || !otpSent || otp.length !== 6} className="w-full rounded-xl bg-blue-600 py-3 font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300">{loading ? 'Đang tạo tài khoản…' : 'Đăng ký'}</button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">Đã có tài khoản? <Link href="/login" className="font-bold text-blue-600 hover:underline">Đăng nhập</Link></p>
        </div>
      </div>
    </main>
  );
}
