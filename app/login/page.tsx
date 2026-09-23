'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

type Step = 'login' | 'forgot_contact' | 'forgot_otp' | 'forgot_new';

export default function LoginPage() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [step, setStep] = useState<Step>('login');
  const [channel, setChannel] = useState<'phone' | 'email'>('phone');
  const [contact, setContact] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (step !== 'forgot_otp' || countdown <= 0) return;
    const timer = window.setTimeout(() => setCountdown((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [step, countdown]);

  function resetNotice() { setError(''); setMessage(''); }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
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
      localStorage.setItem('user', JSON.stringify(user));
      window.dispatchEvent(new Event('user-updated'));
      router.push(user.Role === 'Admin' ? '/admin/products' : '/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đăng nhập thất bại.');
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
      await api.sendPasswordResetOtp(resetContactPayload());
      setStep('forgot_otp');
      setCountdown(60);
      setMessage(channel === 'phone' ? 'Nếu số điện thoại khớp tài khoản, mã OTP sẽ được gửi qua SMS.' : 'Nếu email khớp tài khoản, mã OTP sẽ được gửi đến email đó.');
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
                <button type="button" onClick={() => { setStep('forgot_contact'); setContact(phone); resetNotice(); }} className="text-sm font-bold text-blue-600 hover:underline">Quên mật khẩu?</button>
              </div>
              <input id="login-password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Nhập mật khẩu" className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500" />
            </div>
            <button type="submit" disabled={loading} className="w-full rounded-xl bg-blue-600 py-3 font-bold text-white hover:bg-blue-700 disabled:opacity-50">{loading ? 'Đang đăng nhập…' : 'Đăng nhập'}</button>
            <p className="pt-2 text-center text-sm text-slate-500">Chưa có tài khoản? <Link href="/register" className="font-bold text-blue-600 hover:underline">Đăng ký ngay</Link></p>
          </form>}

          {step === 'forgot_contact' && <form onSubmit={handleSendResetOtp} className="space-y-4">
            <fieldset className="space-y-2">
              <legend className="mb-2 text-sm font-semibold">Phương thức nhận OTP</legend>
              <label className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 ${channel === 'phone' ? 'border-blue-600 bg-blue-50' : 'border-slate-200'}`}>
                <input type="radio" name="reset-channel" value="phone" checked={channel === 'phone'} onChange={() => { setChannel('phone'); setContact(''); }} />
                <span className="font-medium">Tin nhắn SMS đến số điện thoại</span>
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
            <button type="submit" disabled={loading} className="w-full rounded-xl bg-blue-600 py-3 font-bold text-white hover:bg-blue-700 disabled:opacity-50">{loading ? 'Đang gửi mã…' : 'Gửi mã OTP'}</button>
            <button type="button" onClick={() => { setStep('login'); resetNotice(); }} className="w-full py-2 text-sm font-semibold text-slate-600 hover:underline">← Quay lại đăng nhập</button>
          </form>}

          {step === 'forgot_otp' && <form onSubmit={handleVerifyOtp} className="space-y-4">
            <p className="text-center text-sm font-semibold text-blue-700">Mã hết hạn sau 5 phút · Gửi lại sau {timeLabel}</p>
            <div>
              <label htmlFor="reset-otp" className="mb-1 block text-center text-sm font-semibold">Mã OTP</label>
              <input id="reset-otp" type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={6} required value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} placeholder="000000" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-center text-2xl font-black tracking-[0.35em] outline-none focus:border-blue-500" />
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
              <input id="new-password" type="password" autoComplete="new-password" minLength={8} required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Ít nhất 8 ký tự" className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500" />
            </div>
            <div>
              <label htmlFor="confirm-password" className="mb-1 block text-sm font-semibold">Nhập lại mật khẩu mới</label>
              <input id="confirm-password" type="password" autoComplete="new-password" minLength={8} required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Nhập lại mật khẩu" className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500" />
            </div>
            <button type="submit" disabled={loading} className="w-full rounded-xl bg-blue-600 py-3 font-bold text-white hover:bg-blue-700 disabled:opacity-50">{loading ? 'Đang cập nhật…' : 'Đặt lại mật khẩu'}</button>
          </form>}
        </div>
      </div>
    </main>
  );
}
