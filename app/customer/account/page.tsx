'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { api, getStoredUser, resolveApiAssetUrl, type User } from '@/lib/api';

export default function AccountPage() {
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [profileName, setProfileName] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMessage, setProfileMessage] = useState('');
  const [profileError, setProfileError] = useState('');
  const avatarInput = useRef<HTMLInputElement>(null);
  const avatarPreviewUrl = useRef<string | null>(null);

  useEffect(() => {
    const stored = getStoredUser();
    setUser(stored);
    setProfileName(stored?.FullName || '');
    setEmail(stored?.RecoveryEmail || '');
  }, []);

  useEffect(() => () => {
    if (avatarPreviewUrl.current) URL.revokeObjectURL(avatarPreviewUrl.current);
  }, []);

  function chooseAvatar(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
      setProfileError('Chọn ảnh JPG, PNG, WEBP hoặc GIF.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setProfileError('Ảnh đại diện tối đa 5 MB.');
      return;
    }
    if (avatarPreviewUrl.current) URL.revokeObjectURL(avatarPreviewUrl.current);
    const preview = URL.createObjectURL(file);
    avatarPreviewUrl.current = preview;
    setAvatarPreview(preview);
    setAvatarFile(file);
    setProfileError('');
    setProfileMessage('');
  }

  async function saveProfile(event: React.FormEvent) {
    event.preventDefault();
    if (!user) return;
    setProfileLoading(true);
    setProfileError('');
    setProfileMessage('');
    try {
      const result = await api.updateUserProfile(user.UserID, profileName.trim(), avatarFile || undefined);
      const updated = { ...user, ...result.user };
      setUser(updated);
      setProfileName(updated.FullName || '');
      localStorage.setItem('user', JSON.stringify(updated));
      window.dispatchEvent(new Event('user-updated'));
      setAvatarFile(null);
      setAvatarPreview('');
      if (avatarPreviewUrl.current) URL.revokeObjectURL(avatarPreviewUrl.current);
      avatarPreviewUrl.current = null;
      setProfileMessage('Đã lưu thay đổi hồ sơ.');
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : 'Không lưu được hồ sơ.');
    } finally {
      setProfileLoading(false);
    }
  }

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
    localStorage.removeItem('sessionToken');
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
              {avatarPreview || user.Avatar ? <img src={avatarPreview || resolveApiAssetUrl(user.Avatar)} alt="Ảnh đại diện" className="h-16 w-16 rounded-full border border-slate-200 object-cover" /> : <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-2xl font-black text-blue-700">{(user.FullName || user.Phone || 'K').charAt(0).toUpperCase()}</div>}
              <div>
                <h2 className="text-xl font-bold">{user.FullName || 'Khách hàng'}</h2>
                <p className="text-slate-500">{user.Phone || 'Chưa có số điện thoại'}</p>
              </div>
            </div>

            <section className="mt-7 border-t border-slate-100 pt-6">
              <h3 className="text-lg font-black">Thông tin hiển thị</h3>
              <p className="mt-1 text-sm text-slate-600">Đổi tên hiển thị và ảnh đại diện của bạn.</p>
              <form onSubmit={saveProfile} className="mt-4 space-y-4">
                <div>
                  <label htmlFor="profile-name" className="mb-1 block text-sm font-semibold">Tên hiển thị</label>
                  <input id="profile-name" type="text" autoComplete="name" maxLength={100} required value={profileName} onChange={(event) => setProfileName(event.target.value)} className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500" />
                </div>
                <div>
                  <span className="mb-2 block text-sm font-semibold">Ảnh đại diện</span>
                  <input ref={avatarInput} type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={chooseAvatar} className="hidden" />
                  <button type="button" onClick={() => avatarInput.current?.click()} className="rounded-xl border border-blue-700 px-4 py-2.5 font-bold text-blue-700 hover:bg-blue-50">Chọn ảnh từ máy</button>
                  <span className="ml-3 text-sm text-slate-500">{avatarFile ? avatarFile.name : 'JPG, PNG, WEBP hoặc GIF · tối đa 5 MB'}</span>
                </div>
                {profileError && <p role="alert" className="text-sm font-semibold text-red-700">{profileError}</p>}
                {profileMessage && <p role="status" className="text-sm font-semibold text-emerald-700">{profileMessage}</p>}
                <button type="submit" disabled={profileLoading || !profileName.trim()} className="rounded-xl bg-blue-700 px-5 py-3 font-bold text-white disabled:opacity-50">{profileLoading ? 'Đang lưu…' : 'Lưu thay đổi'}</button>
              </form>
            </section>

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
              <Link href="/customer/addresses" className="rounded-xl border px-4 py-3 font-semibold hover:bg-slate-50">Sổ địa chỉ giao hàng →</Link>
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
