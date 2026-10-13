'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

function EyeIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
      <line x1="2" y1="2" x2="22" y2="22" />
    </svg>
  );
}

const OTP_RESEND_SECONDS = 60;

export default function RegisterPage() {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [displayedOtp, setDisplayedOtp] = useState<string | null>(null); // mã OTP hiển thị cho người dùng
  const [countdown, setCountdown] = useState(0);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Countdown timer – đếm ngược 60s sau khi gửi OTP
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = window.setTimeout(() => setCountdown((v) => v - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [countdown]);

  async function sendOtp() {
    setError('');
    setMessage('');
    if (!phone.trim()) return setError('Vui lòng nhập số điện thoại.');
    setLoading(true);
    try {
      const result = await api.sendRegistrationOtp(phone.trim());
      setOtpSent(true);
      setOtp('');
      setOtpVerified(false);
      setCountdown(OTP_RESEND_SECONDS);
      // Lưu OTP để hiển thị phía trên ô nhập số điện thoại
      if (result.otp) setDisplayedOtp(result.otp);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không gửi được mã xác thực.');
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp() {
    if (otp.length !== 6) return setError('Mã OTP phải gồm 6 chữ số.');
    setError('');
    setVerifyingOtp(true);
    try {
      await api.verifyRegistrationOtp(phone.trim(), otp);
      setOtpVerified(true);
      setDisplayedOtp(null); // Ẩn mã OTP sau khi đã xác thực thành công
      setMessage('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Mã OTP không đúng hoặc đã hết hạn.');
    } finally {
      setVerifyingOtp(false);
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!otpSent) return setError('Vui lòng nhận mã xác thực trước.');
    if (!otpVerified) return setError('Vui lòng xác nhận mã OTP trước khi đăng ký.');
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
            <div className="flex items-center justify-center gap-2.5 text-3xl font-black text-blue-700">
              <img src="/devora-icon.png" alt="DEVORA" className="h-10 w-10 object-cover rounded-xl shadow-md border border-blue-500/20" />
              <span>DEVORA<span className="text-blue-500">.VN</span></span>
            </div>
            <h1 className="mt-4 text-2xl font-black">Tạo tài khoản</h1>
            <p className="mt-2 text-sm text-slate-500">Đăng ký bằng số điện thoại và xác thực OTP.</p>
          </div>

          {error && <div role="alert" className="mb-4 rounded-xl bg-red-50 p-3 text-center text-sm text-red-700">{error}</div>}
          {message && <div role="status" className="mb-4 rounded-xl bg-emerald-50 p-3 text-center text-sm text-emerald-700">{message}</div>}

          <form onSubmit={handleRegister} className="space-y-4">

            {/* Hiển thị mã OTP ngay phía trên ô số điện thoại */}
            {displayedOtp && (
              <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                <span className="text-xl">📩</span>
                <div>
                  <p className="text-xs font-semibold text-amber-700">Mã OTP của bạn:</p>
                  <p className="text-2xl font-black tracking-[0.3em] text-amber-900">{displayedOtp}</p>
                </div>
              </div>
            )}

            {/* Số điện thoại + nút Gửi OTP */}
            <div>
              <label htmlFor="register-phone" className="mb-1 block text-sm font-semibold">Số điện thoại</label>
              <div className="flex gap-2">
                <input
                  id="register-phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  required
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    setOtpSent(false);
                    setOtp('');
                    setOtpVerified(false);
                    setCountdown(0);
                    setDisplayedOtp(null);
                  }}
                  placeholder="0901234567"
                  className="min-w-0 flex-1 rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={sendOtp}
                  disabled={loading || !phone.trim() || countdown > 0}
                  className="shrink-0 rounded-xl border border-blue-600 px-3.5 text-sm font-bold text-blue-700 disabled:opacity-50 hover:bg-blue-50 transition cursor-pointer"
                >
                  {loading ? 'Đang gửi…' : countdown > 0 ? `Gửi lại (${countdown}s)` : otpSent ? 'Gửi lại mã' : 'Gửi OTP'}
                </button>
              </div>
            </div>

            {/* Ô nhập OTP (hiện sau khi đã gửi) */}
            {otpSent && (
              <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <label htmlFor="register-otp" className="block text-sm font-semibold text-slate-800">
                    Mã xác thực OTP
                  </label>
                  {otpVerified && (
                    <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800">
                      ✓ Đã xác thực
                    </span>
                  )}
                </div>

                <div className="flex gap-2">
                  <input
                    id="register-otp"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    required
                    disabled={otpVerified}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="......"
                    className="w-full flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-center text-xl font-bold tracking-[0.3em] outline-none focus:border-blue-500 disabled:bg-slate-100"
                  />
                  {!otpVerified && (
                    <button
                      type="button"
                      onClick={handleVerifyOtp}
                      disabled={verifyingOtp || otp.length !== 6}
                      className="shrink-0 rounded-xl bg-blue-600 px-4 text-xs font-bold text-white transition hover:bg-blue-700 disabled:bg-slate-300 cursor-pointer shadow-xs"
                    >
                      {verifyingOtp ? 'Đang kiểm tra…' : 'Xác nhận OTP'}
                    </button>
                  )}
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  {countdown > 0
                    ? `Đã gửi mã OTP. Vui lòng nhập mã OTP hiện tại và đợi ${countdown}s trước khi nhấn gửi OTP mới. (Mã OTP có hiệu lực trong 5 phút).`
                    : `Mã OTP hiện tại có hiệu lực trong 5 phút. Bạn có thể nhấn 'Gửi lại mã' nếu chưa nhận được.`}
                </p>
              </div>
            )}

            {/* Mật khẩu – chỉ hiển thị và cho nhập sau khi OTP đã xác thực */}
            {otpVerified && (
              <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                <p className="text-xs font-bold text-slate-700">Số điện thoại đã xác thực. Hãy tạo mật khẩu tài khoản:</p>

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
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 pr-11 outline-none focus:border-blue-500"
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
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 pr-11 outline-none focus:border-blue-500"
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
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !otpVerified || password.length < 8 || password !== confirmPassword}
              className="w-full rounded-xl bg-blue-600 py-3.5 font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300 shadow-md cursor-pointer"
            >
              {loading ? 'Đang tạo tài khoản…' : 'Đăng ký tài khoản'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">Đã có tài khoản? <Link href="/login" className="font-bold text-blue-600 hover:underline">Đăng nhập</Link></p>
        </div>
      </div>
    </main>
  );
}
