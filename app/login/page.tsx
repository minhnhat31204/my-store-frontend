'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

type Step = 'login' | 'forgot_contact' | 'forgot_otp' | 'forgot_new';

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

export default function LoginPage() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [lockCountdown, setLockCountdown] = useState(0);
  const [step, setStep] = useState<Step>('login');
  const [channel, setChannel] = useState<'phone' | 'email'>('phone');
  const [contact, setContact] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('deleted') === '1') {
      setMessage('Tài khoản của bạn đã được xóa thành công.');
    } else if (params.get('registered') === '1') {
      setMessage('Đăng ký tài khoản thành công! Vui lòng đăng nhập.');
    }

    const savedPhone = localStorage.getItem('remembered_phone');
    if (savedPhone) {
      setPhone(savedPhone);
      setRememberMe(true);
    }
  }, []);

  useEffect(() => {
    if (lockCountdown <= 0) return;
    const timer = window.setTimeout(() => setLockCountdown((val) => val - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [lockCountdown]);

  useEffect(() => {
    if (step !== 'forgot_otp' || countdown <= 0) return;
    const timer = window.setTimeout(() => setCountdown((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [step, countdown]);

  function resetNotice() { setError(''); setMessage(''); }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (lockCountdown > 0) return;
    resetNotice();
    setLoading(true);
    try {
      const data = await api.login(phone.trim(), password);
      const user = data.user ? {
        UserID: data.user.UserID,
        FullName: data.user.FullName,
        Email: data.user.Email,
        RecoveryEmail: data.user.RecoveryEmail,
        RecoveryEmailVerified: data.user.RecoveryEmailVerified,
        Phone: data.user.Phone,
        Address: data.user.Address,
        Role: data.user.Role,
        Avatar: data.user.Avatar,
      } : null;
      if (!user) throw new Error('Không nhận được thông tin người dùng từ backend.');
      
      if (rememberMe) {
        localStorage.setItem('remembered_phone', phone.trim());
        localStorage.setItem('user', JSON.stringify(user));
        sessionStorage.removeItem('user');
      } else {
        localStorage.removeItem('remembered_phone');
        localStorage.removeItem('user');
        sessionStorage.setItem('user', JSON.stringify(user));
      }
      localStorage.removeItem('sessionToken');
      window.dispatchEvent(new Event('user-updated'));
      router.push(String(user.Role || '').toLowerCase() === 'admin' ? '/admin/products' : '/');
    } catch (err: unknown) {
      const errorObj = err as { message?: string; retryAfter?: number; locked?: boolean };
      const msg = err instanceof Error ? err.message : 'Đăng nhập thất bại.';
      setError(msg);
      if (errorObj?.retryAfter) {
        setLockCountdown(Number(errorObj.retryAfter));
      } else {
        const match = msg.match(/(\d+)\s*giây/);
        if (match && msg.includes('khóa')) {
          setLockCountdown(Number(match[1]));
        }
      }
    } finally {
      setLoading(false);
    }
  }

  function resetContactPayload() {
    return channel === 'phone' ? { channel, phone: contact.trim() } : { channel, email: contact.trim() };
  }

  async function sendResetOtp() {
    resetNotice();
    setLoading(true);
    try {
      const result = await api.sendPasswordResetOtp(resetContactPayload());
      setStep('forgot_otp');
      setCountdown(60);
      setMessage(channel === 'phone' ? `${result.message} Mã OTP mặc định: 123456.` : result.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không gửi được mã OTP.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSendResetOtp(e: React.FormEvent) {
    e.preventDefault();
    await sendResetOtp();
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    resetNotice();
    if (!/^\d{6}$/.test(otp)) return setError('Mã OTP phải gồm 6 chữ số.');
    setLoading(true);
    try {
      await api.verifyPasswordResetOtp({ ...resetContactPayload(), otp });
      setStep('forgot_new');
      setMessage('Mã xác thực hợp lệ. Hãy đặt mật khẩu mới.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Mã OTP không đúng hoặc đã hết hạn.');
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    resetNotice();
    if (newPassword.length < 8) return setError('Mật khẩu phải có ít nhất 8 ký tự.');
    if (newPassword !== confirmPassword) return setError('Mật khẩu nhập lại không khớp.');
    setLoading(true);
    try {
      await api.resetPassword({ ...resetContactPayload(), newPassword });
      setStep('login');
      setPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setOtp('');
      setMessage('Đặt lại mật khẩu thành công. Hãy đăng nhập lại.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không đặt lại được mật khẩu.');
    } finally {
      setLoading(false);
    }
  }

  const timeLabel = `${Math.floor(countdown / 60)}:${String(countdown % 60).padStart(2, '0')}`;
  const title: Record<Step, string> = {
    login: 'Đăng nhập',
    forgot_contact: 'Quên mật khẩu',
    forgot_otp: 'Xác thực OTP',
    forgot_new: 'Đặt mật khẩu mới',
  };

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-10 text-slate-900">
      <div className="mx-auto flex min-h-[80vh] max-w-md items-center">
        <div className="w-full rounded-3xl bg-white p-8 shadow-lg">
          <div className="mb-8 text-center">
            <div className="text-3xl font-black text-blue-700">MANB<span className="text-blue-400">.VN</span></div>
            <h1 className="mt-4 text-2xl font-black">{title[step]}</h1>
            <p className="mt-2 text-sm text-slate-500">
              {step === 'login' && 'Đăng nhập bằng số điện thoại của bạn.'}
              {step === 'forgot_contact' && 'Chọn cách nhận mã xác thực để khôi phục tài khoản.'}
              {step === 'forgot_otp' && 'Nhập mã OTP 6 số vừa được gửi.'}
              {step === 'forgot_new' && 'Tạo mật khẩu mới cho tài khoản.'}
            </p>
          </div>

          {error && <div role="alert" className="mb-4 rounded-xl bg-red-50 p-3 text-center text-sm text-red-700">{error}</div>}
          {message && <div role="status" className="mb-4 rounded-xl bg-blue-50 p-3 text-center text-sm text-blue-800">{message}</div>}

          {step === 'login' && <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="login-phone" className="mb-1 block text-sm font-semibold">Số điện thoại</label>
              <input id="login-phone" type="tel" inputMode="tel" autoComplete="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0901234567" className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500" />
            </div>
            <div>
              <div className="mb-1 flex items-center justify-between">
                <label htmlFor="login-password" className="text-sm font-semibold">Mật khẩu</label>
              </div>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nhập mật khẩu"
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

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer select-none text-slate-600 hover:text-slate-900">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="font-medium text-xs sm:text-sm">Ghi nhớ đăng nhập</span>
              </label>
              <button
                type="button"
                onClick={() => { setStep('forgot_contact'); setContact(phone); resetNotice(); }}
                className="text-xs sm:text-sm font-bold text-blue-600 hover:underline"
              >
                Quên mật khẩu?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading || lockCountdown > 0}
              className="w-full rounded-xl bg-blue-600 py-3 font-bold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Đang đăng nhập…' : lockCountdown > 0 ? `Tài khoản tạm khóa (${lockCountdown}s)` : 'Đăng nhập'}
            </button>
            <p className="pt-2 text-center text-sm text-slate-500">Chưa có tài khoản? <Link href="/register" className="font-bold text-blue-600 hover:underline">Đăng ký ngay</Link></p>
          </form>}

          {step === 'forgot_contact' && <form onSubmit={handleSendResetOtp} className="space-y-4">
            <fieldset className="space-y-2">
              <legend className="mb-2 text-sm font-semibold">Phương thức nhận OTP</legend>
              <label className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 ${channel === 'phone' ? 'border-blue-600 bg-blue-50' : 'border-slate-200'}`}>
                <input type="radio" name="reset-channel" value="phone" checked={channel === 'phone'} onChange={() => { setChannel('phone'); setContact(''); }} />
                <span className="font-medium">OTP số điện thoại (mã mặc định 123456)</span>
              </label>
              <label className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 ${channel === 'email' ? 'border-blue-600 bg-blue-50' : 'border-slate-200'}`}>
                <input type="radio" name="reset-channel" value="email" checked={channel === 'email'} onChange={() => { setChannel('email'); setContact(''); }} />
                <span className="font-medium">Email tài khoản</span>
              </label>
            </fieldset>
            <div>
              <label htmlFor="reset-contact" className="mb-1 block text-sm font-semibold">{channel === 'phone' ? 'Số điện thoại tài khoản' : 'Email khôi phục'}</label>
              <input id="reset-contact" type={channel === 'phone' ? 'tel' : 'email'} inputMode={channel === 'phone' ? 'tel' : 'email'} required value={contact} onChange={(e) => setContact(e.target.value)} placeholder={channel === 'phone' ? '0901234567' : 'email@example.com'} className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500" />
            </div>
            <button type="submit" disabled={loading || !contact.trim()} className="w-full rounded-xl bg-blue-600 py-3 font-bold text-white hover:bg-blue-700 disabled:opacity-50">{loading ? 'Đang gửi…' : 'Gửi'}</button>
            <button
              type="button"
              onClick={() => { setStep('login'); resetNotice(); }}
              className="mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-bold text-slate-700 shadow-xs transition hover:border-slate-300 hover:bg-slate-50 hover:text-blue-600"
            >
              <svg className="h-4 w-4 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              <span>Quay lại</span>
            </button>
          </form>}

          {step === 'forgot_otp' && <form onSubmit={handleVerifyOtp} className="space-y-4">
            <p className="text-center text-sm font-semibold text-blue-700">Mã hết hạn sau 5 phút · Gửi lại sau {timeLabel}</p>
            <div>
              <label htmlFor="reset-otp" className="mb-1 block text-center text-sm font-semibold">Mã OTP</label>
              <input id="reset-otp" type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={6} required value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} placeholder={channel === 'phone' ? '123456' : '000000'} className="w-full rounded-xl border border-slate-200 px-4 py-3 text-center text-2xl font-black tracking-[0.35em] outline-none focus:border-blue-500" />
            </div>
            <button type="submit" disabled={loading || otp.length !== 6} className="w-full rounded-xl bg-blue-600 py-3 font-bold text-white hover:bg-blue-700 disabled:opacity-50">{loading ? 'Đang xác thực…' : 'Xác nhận mã OTP'}</button>
            <div className="flex justify-between text-sm">
              <button type="button" onClick={() => { setStep('forgot_contact'); resetNotice(); }} className="font-semibold text-slate-600 hover:underline">Đổi phương thức</button>
              <button type="button" disabled={loading || countdown > 0} onClick={sendResetOtp} className="font-bold text-blue-700 disabled:text-slate-400">Gửi lại mã</button>
            </div>
          </form>}

          {step === 'forgot_new' && <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label htmlFor="new-password" className="mb-1 block text-sm font-semibold">Mật khẩu mới</label>
              <div className="relative">
                <input
                  id="new-password"
                  type={showNewPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  minLength={8}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Ít nhất 8 ký tự"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 pr-11 outline-none focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  aria-label={showNewPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  {showNewPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>
            <div>
              <label htmlFor="confirm-password" className="mb-1 block text-sm font-semibold">Nhập lại mật khẩu mới</label>
              <div className="relative">
                <input
                  id="confirm-password"
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
            <button type="submit" disabled={loading} className="w-full rounded-xl bg-blue-600 py-3 font-bold text-white hover:bg-blue-700 disabled:opacity-50">{loading ? 'Đang cập nhật…' : 'Đặt lại mật khẩu'}</button>
          </form>}
        </div>
      </div>
    </main>
  );
}
