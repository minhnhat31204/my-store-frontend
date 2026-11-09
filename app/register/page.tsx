'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
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

type RegisterStep = 'phone_otp' | 'password' | 'user_id';

export default function RegisterPage() {
  const [step, setStep] = useState<RegisterStep>('phone_otp');

  // Step 1: Phone & OTP
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [displayedOtp, setDisplayedOtp] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);

  // Step 2: Password
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Step 3: ID người dùng & Tên hiển thị
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<{
    checked: boolean;
    available: boolean;
    message: string;
  }>({ checked: false, available: false, message: '' });

  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const checkTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Countdown timer cho gửi lại OTP
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = window.setTimeout(() => setCountdown((v) => v - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [countdown]);

  // Real-time check username availability
  useEffect(() => {
    if (step !== 'user_id') return;

    if (checkTimerRef.current) {
      clearTimeout(checkTimerRef.current);
    }

    const clean = username.trim().toLowerCase().replace(/^@/, '');
    if (!clean) {
      setUsernameStatus({ checked: false, available: false, message: '' });
      return;
    }

    if (!/^[a-z0-9_]{3,30}$/.test(clean)) {
      setUsernameStatus({
        checked: true,
        available: false,
        message: 'ID chỉ được chứa chữ cái thường, số và dấu gạch dưới (3 - 30 ký tự, không dấu cách).',
      });
      return;
    }

    setCheckingUsername(true);
    checkTimerRef.current = setTimeout(async () => {
      try {
        const res = await api.checkUsername(clean);
        setUsernameStatus({
          checked: true,
          available: Boolean(res.available),
          message: res.message || (res.available ? 'ID người dùng hợp lệ và có thể sử dụng.' : 'ID người dùng này đã có người sử dụng.'),
        });
      } catch (err: any) {
        setUsernameStatus({
          checked: true,
          available: false,
          message: err?.message || 'Không thể kiểm tra ID người dùng.',
        });
      } finally {
        setCheckingUsername(false);
      }
    }, 400);

    return () => {
      if (checkTimerRef.current) clearTimeout(checkTimerRef.current);
    };
  }, [username, step]);

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
      setDisplayedOtp(null);
      setMessage('');
      // Tự động chuyển sang bước 2: Tạo mật khẩu
      setStep('password');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Mã OTP không đúng hoặc đã hết hạn.');
    } finally {
      setVerifyingOtp(false);
    }
  }

  function handleGoToStep3() {
    setError('');
    if (password.length < 8) return setError('Mật khẩu phải có ít nhất 8 ký tự.');
    if (password !== confirmPassword) return setError('Mật khẩu nhập lại không khớp.');
    setStep('user_id');
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!otpVerified) {
      setStep('phone_otp');
      return setError('Vui lòng hoàn tất xác nhận OTP trước.');
    }
    if (password.length < 8 || password !== confirmPassword) {
      setStep('password');
      return setError('Mật khẩu không hợp lệ hoặc không khớp.');
    }

    const cleanUsername = username.trim().toLowerCase().replace(/^@/, '');
    if (!cleanUsername) return setError('Vui lòng nhập ID người dùng.');
    if (!/^[a-z0-9_]{3,30}$/.test(cleanUsername)) {
      return setError('ID người dùng chỉ được chứa chữ thường (a-z), số (0-9) và dấu gạch dưới (3 - 30 ký tự).');
    }
    if (usernameStatus.checked && !usernameStatus.available) {
      return setError('ID người dùng này đã có người sử dụng. Vui lòng chọn ID khác.');
    }

    setLoading(true);
    try {
      await api.register({
        phone: phone.trim(),
        otp,
        password,
        username: cleanUsername,
        fullName: fullName.trim() || undefined,
      });
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
          {/* Header */}
          <div className="mb-6 text-center">
            <div className="flex items-center justify-center gap-2.5 text-3xl font-black text-blue-700">
              <img src="/devora-icon.png" alt="DEVORA" className="h-10 w-10 object-cover rounded-xl shadow-md border border-blue-500/20" />
              <span>DEVORA<span className="text-blue-500">.VN</span></span>
            </div>
            <h1 className="mt-4 text-2xl font-black">Tạo tài khoản</h1>
            <p className="mt-1 text-sm text-slate-500">
              {step === 'phone_otp' && 'Bước 1/3: Xác thực số điện thoại qua OTP'}
              {step === 'password' && 'Bước 2/3: Thiết lập mật khẩu bảo mật'}
              {step === 'user_id' && 'Bước 3/3: Đặt ID người dùng & Tên hiển thị'}
            </p>
          </div>

          {/* Stepper Dots */}
          <div className="mb-6 flex items-center justify-center gap-2">
            <div className={`h-2 rounded-full transition-all ${step === 'phone_otp' ? 'w-8 bg-blue-600' : 'w-2 bg-emerald-500'}`} />
            <div className={`h-2 rounded-full transition-all ${step === 'password' ? 'w-8 bg-blue-600' : step === 'user_id' ? 'w-2 bg-emerald-500' : 'w-2 bg-slate-200'}`} />
            <div className={`h-2 rounded-full transition-all ${step === 'user_id' ? 'w-8 bg-blue-600' : 'w-2 bg-slate-200'}`} />
          </div>

          {error && <div role="alert" className="mb-4 rounded-xl bg-red-50 p-3 text-center text-sm font-semibold text-red-700">{error}</div>}
          {message && <div role="status" className="mb-4 rounded-xl bg-emerald-50 p-3 text-center text-sm font-semibold text-emerald-700">{message}</div>}

          {/* ========================================================= */}
          {/* BƯỚC 1: SỐ ĐIỆN THOẠI & XÁC THỰC OTP                      */}
          {/* ========================================================= */}
          {step === 'phone_otp' && (
            <div className="space-y-4">
              {displayedOtp && (
                <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                  <span className="text-xl">📩</span>
                  <div>
                    <p className="text-xs font-semibold text-amber-700">Mã OTP của bạn:</p>
                    <p className="text-2xl font-black tracking-[0.3em] text-amber-900">{displayedOtp}</p>
                  </div>
                </div>
              )}

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
                      ? `Đã gửi mã OTP. Vui lòng nhập mã OTP và đợi ${countdown}s trước khi gửi lại (Mã có hiệu lực 5 phút).`
                      : `Mã OTP có hiệu lực trong 5 phút. Bạn có thể nhấn 'Gửi lại mã' nếu chưa nhận được.`}
                  </p>
                </div>
              )}

              {otpVerified && (
                <button
                  type="button"
                  onClick={() => setStep('password')}
                  className="w-full rounded-xl bg-blue-600 py-3.5 font-bold text-white transition hover:bg-blue-700 shadow-md cursor-pointer"
                >
                  Tiếp tục thiết lập mật khẩu ➔
                </button>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* BƯỚC 2: TẠO MẬT KHẨU & XÁC NHẬN MẬT KHẨU                 */}
          {/* ========================================================= */}
          {step === 'password' && (
            <div className="space-y-4">
              <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
                <span className="font-bold text-slate-800">Số điện thoại:</span> {phone} (Đã xác thực OTP ✓)
              </div>

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
                    placeholder="Nhập lại mật khẩu giống phía trên"
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
                {confirmPassword && password !== confirmPassword && (
                  <p className="mt-1 text-xs text-red-500">Mật khẩu nhập lại chưa khớp.</p>
                )}
                {confirmPassword && password === confirmPassword && (
                  <p className="mt-1 text-xs text-emerald-600 font-semibold">✓ Mật khẩu khớp.</p>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setStep('phone_otp')}
                  className="w-1/3 rounded-xl border border-slate-200 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  ⬅ Quay lại
                </button>
                <button
                  type="button"
                  onClick={handleGoToStep3}
                  disabled={password.length < 8 || password !== confirmPassword}
                  className="flex-1 rounded-xl bg-blue-600 py-3 font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300 shadow-md cursor-pointer"
                >
                  Tiếp tục thiết lập ID ➔
                </button>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* BƯỚC 3: NHẬP ID NGƯỜI DÙNG (DUY NHẤT) & TÊN HIỂN THỊ     */}
          {/* ========================================================= */}
          {step === 'user_id' && (
            <form onSubmit={handleRegister} className="space-y-4">
              {/* ID người dùng */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="register-username" className="block text-sm font-bold text-slate-900">
                    ID người dùng <span className="text-red-500">*</span>
                  </label>
                  <span className="rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-800 border border-amber-200">
                    Cố định & Duy nhất
                  </span>
                </div>

                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-base font-bold text-slate-400">
                    @
                  </span>
                  <input
                    id="register-username"
                    type="text"
                    required
                    maxLength={30}
                    value={username}
                    onChange={(e) => {
                      const val = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
                      setUsername(val);
                    }}
                    placeholder="nguyenvana_2026"
                    className={`w-full rounded-xl border py-3 pl-9 pr-10 text-sm font-bold text-slate-900 outline-none transition ${
                      usernameStatus.checked && !usernameStatus.available
                        ? 'border-red-400 bg-red-50/40 focus:border-red-500 focus:ring-2 focus:ring-red-100'
                        : usernameStatus.checked && usernameStatus.available
                        ? 'border-emerald-500 bg-emerald-50/30 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100'
                        : 'border-slate-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
                    }`}
                  />
                  {checkingUsername ? (
                    <span className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-xs text-slate-400 animate-spin">
                      ⏳
                    </span>
                  ) : usernameStatus.checked ? (
                    <span className={`absolute inset-y-0 right-0 flex items-center pr-3.5 text-base font-bold ${usernameStatus.available ? 'text-emerald-600' : 'text-red-500'}`}>
                      {usernameStatus.available ? '✓' : '✗'}
                    </span>
                  ) : null}
                </div>

                {/* Feedback message */}
                {usernameStatus.message && (
                  <p className={`mt-1 text-xs font-semibold ${usernameStatus.available ? 'text-emerald-600' : 'text-red-600'}`}>
                    {usernameStatus.message}
                  </p>
                )}

                <p className="mt-1.5 text-[11px] text-slate-500 leading-relaxed">
                  ⚠️ <strong className="text-slate-700">Lưu ý quan trọng:</strong> ID người dùng là định danh duy nhất của tài khoản và <span className="text-red-600 font-bold">không thể thay đổi</span> sau khi đăng ký. Bạn có thể dùng ID này để đăng nhập.
                </p>
              </div>

              {/* Tên hiển thị */}
              <div className="pt-1">
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="register-fullname" className="block text-sm font-semibold text-slate-900">
                    Tên hiển thị
                  </label>
                  <span className="text-[11px] text-slate-400">
                    (Có thể sửa sau)
                  </span>
                </div>
                <input
                  id="register-fullname"
                  type="text"
                  maxLength={50}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Nguyễn Văn A (hoặc để trống)"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
                <p className="mt-1 text-[11px] text-slate-400">
                  Tên hiển thị trên hồ sơ, bình luận và đơn hàng. Tên này có thể trùng lặp và bạn có thể thay đổi bất cứ lúc nào trong cài đặt tài khoản.
                </p>
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setStep('password')}
                  className="w-1/3 rounded-xl border border-slate-200 py-3.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  ⬅ Quay lại
                </button>
                <button
                  type="submit"
                  disabled={loading || !username.trim() || checkingUsername || (usernameStatus.checked && !usernameStatus.available)}
                  className="flex-1 rounded-xl bg-blue-600 py-3.5 font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300 shadow-md cursor-pointer"
                >
                  {loading ? 'Đang tạo tài khoản…' : 'Hoàn tất đăng ký'}
                </button>
              </div>
            </form>
          )}

          <p className="mt-6 text-center text-sm text-slate-500">
            Đã có tài khoản?{' '}
            <Link href="/login" className="font-bold text-blue-600 hover:underline">
              Đăng nhập
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
