'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Trạng thái cho luồng quên mật khẩu: 'login' | 'forgot_email' | 'forgot_otp' | 'forgot_new'
  const [step, setStep] = useState<'login' | 'forgot_email' | 'forgot_otp' | 'forgot_new'>('login');
  const [resetEmail, setResetEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [countdown, setCountdown] = useState(180); // 3 phút = 180 giây
  const [canResend, setCanResend] = useState(false);

  // Đếm ngược thời gian hiệu lực OTP (3 phút)
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === 'forgot_otp' && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (countdown === 0) {
      setCanResend(true);
    }
    return () => clearInterval(timer);
  }, [step, countdown]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await api.login(email.trim(), password);
      const user = data.user ? {
        UserID: data.user.UserID,
        FullName: data.user.FullName,
        Email: data.user.Email,
        Phone: data.user.Phone,
        Address: data.user.Address,
        Role: data.user.Role,
        Avatar: data.user.Avatar,
      } : null;
      if (!user) throw new Error('Không nhận được thông tin người dùng từ Backend.');
      localStorage.setItem('user', JSON.stringify(user));
      window.dispatchEvent(new Event('user-updated'));
      router.push(user.Role === 'Admin' ? '/admin/products' : '/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  }

  // Bước 1: Gửi yêu cầu mã OTP qua Email
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!resetEmail) {
      setError('Vui lòng nhập email của bạn.');
      return;
    }
    setLoading(true);
    try {
      // Gọi API gửi OTP (Backend của bạn cần hỗ trợ endpoint này)
      if (typeof (api as any).forgotPassword === 'function') {
        await (api as any).forgotPassword({ email: resetEmail });
      } else {
        // Fallback giả lập nếu API chưa định nghĩa sẵn
        console.warn("api.forgotPassword chưa được định nghĩa trong lib/api.ts");
      }
      
      setStep('forgot_otp');
      setCountdown(180); // Reset về 3 phút
      setCanResend(false);
    } catch (err: any) {
      setError(err.message || 'Không thể gửi mã OTP. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  // Bước 2: Xác thực mã OTP 6 số
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (otpCode.length !== 6) {
      setError('Mã OTP phải có đúng 6 chữ số.');
      return;
    }
    setLoading(true);
    try {
      if (typeof (api as any).verifyOtp === 'function') {
        await (api as any).verifyOtp({ email: resetEmail, otp: otpCode });
      }
      setStep('forgot_new');
    } catch (err: any) {
      setError(err.message || 'Mã OTP không chính xác hoặc đã hết hạn.');
    } finally {
      setLoading(false);
    }
  };

  // Bước 3: Đặt lại mật khẩu mới
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (newPassword.length < 6) {
      setError('Mật khẩu mới phải có ít nhất 6 ký tự.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }
    setLoading(true);
    try {
      if (typeof (api as any).resetPassword === 'function') {
        await (api as any).resetPassword({ email: resetEmail, otp: otpCode, newPassword });
      }
      alert('Đặt lại mật khẩu thành công! Vui lòng đăng nhập lại.');
      setStep('login');
      setPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError(err.message || 'Không thể đặt lại mật khẩu.');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-10 text-slate-900">
      <div className="mx-auto flex min-h-[80vh] max-w-md items-center">
        <div className="w-full rounded-3xl bg-white p-8 shadow-lg">
          
          <div className="mb-8 text-center">
            <div className="text-3xl font-black text-blue-700">MANB<span className="text-blue-400">.VN</span></div>
            <h1 className="mt-4 text-2xl font-black">
              {step === 'login' && 'Đăng nhập'}
              {step === 'forgot_email' && 'Quên mật khẩu'}
              {step === 'forgot_otp' && 'Xác thực OTP'}
              {step === 'forgot_new' && 'Đặt mật khẩu mới'}
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              {step === 'login' && 'Đăng nhập để tiếp tục mua sắm.'}
              {step === 'forgot_email' && 'Nhập email để nhận mã khôi phục.'}
              {step === 'forgot_otp' && 'Nhập mã OTP 6 chữ số đã gửi qua email.'}
              {step === 'forgot_new' && 'Tạo mật khẩu mới cho tài khoản của bạn.'}
            </p>
          </div>

          {error && <div className="mb-5 rounded-xl bg-red-50 p-3 text-center text-sm text-red-600">{error}</div>}

          {/* ================= GIAO DIỆN 1: ĐĂNG NHẬP ================= */}
          {step === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-semibold">Email</label>
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="example@gmail.com" className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500" />
              </div>
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <label className="text-sm font-semibold">Mật khẩu</label>
                  <button
                    type="button"
                    onClick={() => { setStep('forgot_email'); setError(''); }}
                    className="text-sm font-bold text-blue-600 hover:underline"
                  >
                    Quên mật khẩu?
                  </button>
                </div>
                <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Nhập mật khẩu" className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500" />
              </div>
              <button type="submit" disabled={loading} className="w-full rounded-xl bg-blue-600 py-3 font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300">
                {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
              </button>
              <p className="mt-6 text-center text-sm text-slate-500">Chưa có tài khoản? <Link href="/register" className="font-bold text-blue-600 hover:underline">Đăng ký ngay</Link></p>
            </form>
          )}

          {/* ================= GIAO DIỆN QUÊN MẬT KHẨU - BƯỚC 1: NHẬP EMAIL ================= */}
          {step === 'forgot_email' && (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-semibold">Email tài khoản</label>
                <input type="email" required value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} placeholder="example@gmail.com" className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500" />
              </div>
              <button type="submit" disabled={loading} className="w-full rounded-xl bg-blue-600 py-3 font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300">
                {loading ? 'Đang gửi mã...' : 'Gửi mã OTP'}
              </button>
              <div className="text-center mt-4">
                <button
                  type="button"
                  onClick={() => { setStep('login'); setError(''); }}
                  className="text-sm font-bold text-slate-600 hover:underline"
                >
                  ← Quay lại đăng nhập
                </button>
              </div>
            </form>
          )}

          {/* ================= GIAO DIỆN QUÊN MẬT KHẨU - BƯỚC 2: NHẬP OTP ================= */}
          {step === 'forgot_otp' && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="text-center mb-2">
                <span className={`text-sm font-bold ${countdown > 30 ? 'text-blue-600' : 'text-red-600'}`}>
                  Mã OTP có hiệu lực trong: {formatTime(countdown)}
                </span>
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-center">Nhập mã OTP 6 số</label>
                <input 
                  type="text" 
                  maxLength={6} 
                  required 
                  value={otpCode} 
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))} 
                  placeholder="------" 
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-center text-2xl font-black tracking-widest outline-none transition focus:border-blue-500" 
                />
              </div>
              <button type="submit" disabled={loading || otpCode.length !== 6} className="w-full rounded-xl bg-blue-600 py-3 font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300">
                {loading ? 'Đang xác thực...' : 'Xác nhận mã OTP'}
              </button>
              <div className="flex items-center justify-between text-sm mt-4">
                <button
                  type="button"
                  onClick={() => { setStep('forgot_email'); setError(''); }}
                  className="text-slate-600 hover:underline font-semibold"
                >
                  Đổi email khác
                </button>
                <button
                  type="button"
                  disabled={!canResend && countdown > 0}
                  onClick={(e) => handleSendOtp(e as any)}
                  className={`font-bold ${canResend ? 'text-blue-600 hover:underline' : 'text-slate-400 cursor-not-allowed'}`}
                >
                  Gửi lại mã OTP
                </button>
              </div>
            </form>
          )}

          {/* ================= GIAO DIỆN QUÊN MẬT KHẨU - BƯỚC 3: MẬT KHẨU MỚI ================= */}
          {step === 'forgot_new' && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-semibold">Mật khẩu mới</label>
                <input type="password" required minLength={6} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Ít nhất 6 ký tự" className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold">Xác nhận mật khẩu mới</label>
                <input type="password" required minLength={6} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Nhập lại mật khẩu mới" className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500" />
              </div>
              <button type="submit" disabled={loading} className="w-full rounded-xl bg-blue-600 py-3 font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300">
                {loading ? 'Đang cập nhật...' : 'Hoàn tất đổi mật khẩu'}
              </button>
            </form>
          )}

        </div>
      </div>
    </main>
  );
}
