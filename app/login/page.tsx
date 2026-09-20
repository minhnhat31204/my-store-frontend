'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'email' | 'otp'>('email'); // Trạng thái: nhập email hoặc nhập OTP
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Bước 1: Gửi mã OTP
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('http://localhost:5000/api/auth/send-login-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email }), // Gửi 'email' viết thường
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Email không tồn tại trong hệ thống!');
      }

      setStep('otp');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Bước 2: Xác nhận OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('http://localhost:5000/api/auth/verify-login-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email, otp: otp }), // Gửi 'email', 'otp' viết thường
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Mã OTP không chính xác!');
      }

      localStorage.setItem('user', JSON.stringify(data.user || data));

      const userEmail = email.toLowerCase().trim();
      if (userEmail === 'admin@gmail.com' || data.user?.Role === 'Admin') {
        router.push('/admin/products');
      } else {
        router.push('/customer/products');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold text-center text-slate-800 mb-6">
          {step === 'email' ? 'Đăng Nhập OTP' : 'Xác Nhận Mã OTP'}
        </h1>

        {error && (
          <div className="bg-red-100 text-red-600 p-3 rounded-lg mb-4 text-sm text-center">
            {error}
          </div>
        )}

        {step === 'email' ? (
          /* FORM NHẬP EMAIL */
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email của bạn</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@gmail.com"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition disabled:bg-blue-300"
            >
              {loading ? 'Đang gửi mã...' : 'Gửi mã OTP'}
            </button>
          </form>
        ) : (
          /* FORM NHẬP OTP */
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <p className="text-sm text-slate-600 text-center">
              Mã OTP đã được gửi đến <span className="font-semibold text-slate-800">{email}</span>
            </p>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nhập mã OTP</label>
              <input
                type="text"
                required
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="123456"
                className="w-full px-4 py-2 text-center tracking-widest text-lg font-bold border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 rounded-lg transition disabled:bg-emerald-300"
            >
              {loading ? 'Đang xác thực...' : 'Xác nhận & Đăng nhập'}
            </button>
            <button
              type="button"
              onClick={() => setStep('email')}
              className="w-full text-sm text-slate-500 hover:underline text-center block"
            >
              Quay lại nhập Email khác
            </button>
          </form>
        )}
      </div>
    </div>
  );
}