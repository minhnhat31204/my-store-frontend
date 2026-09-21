'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'email' | 'otp'>('email'); // đăng nhập
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // BÆ°á»›c 1: Gá»­i mÃ£ OTP
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.sendLoginOtp(email);

      setStep('otp');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // BÆ°á»›c 2: XÃ¡c nháº­n OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await api.verifyLoginOtp(email, otp);

      localStorage.setItem('user', JSON.stringify(data.user || data));

      if (data.user?.Role === 'Admin') {
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
          {step === 'email' ? 'ÄÄƒng Nháº­p OTP' : 'XÃ¡c Nháº­n MÃ£ OTP'}
        </h1>

        {error && (
          <div className="bg-red-100 text-red-600 p-3 rounded-lg mb-4 text-sm text-center">
            {error}
          </div>
        )}

        {step === 'email' ? (
          /* FORM NHáº¬P EMAIL */
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email cá»§a báº¡n</label>
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
              {loading ? 'Äang gá»­i mÃ£...' : 'Gá»­i mÃ£ OTP'}
            </button>
          </form>
        ) : (
          /* FORM NHáº¬P OTP */
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <p className="text-sm text-slate-600 text-center">
              MÃ£ OTP Ä‘Ã£ Ä‘Æ°á»£c gá»­i Ä‘áº¿n <span className="font-semibold text-slate-800">{email}</span>
            </p>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nháº­p mÃ£ OTP</label>
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
              {loading ? 'Äang xÃ¡c thá»±c...' : 'XÃ¡c nháº­n & ÄÄƒng nháº­p'}
            </button>
            <button
              type="button"
              onClick={() => setStep('email')}
              className="w-full text-sm text-slate-500 hover:underline text-center block"
            >
              Quay láº¡i nháº­p Email khÃ¡c
            </button>
          </form>
        )}
      </div>
    </div>
  );
}


