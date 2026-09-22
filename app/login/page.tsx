'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

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
        Role: data.user.Role,
        Avatar: data.user.Avatar,
      } : null;
      if (!user) throw new Error('Không nhận được thông tin người dùng từ Backend.');
      localStorage.setItem('user', JSON.stringify(user));
      router.push(user.Role === 'Admin' ? '/admin/products' : '/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đăng nhập thất bại');
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
            <h1 className="mt-4 text-2xl font-black">Đăng nhập</h1>
            <p className="mt-2 text-sm text-slate-500">Đăng nhập để tiếp tục mua sắm.</p>
          </div>
          {error && <div className="mb-5 rounded-xl bg-red-50 p-3 text-center text-sm text-red-600">{error}</div>}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-semibold">Email</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="example@gmail.com" className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold">Mật khẩu</label>
              <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Nhập mật khẩu" className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500" />
            </div>
            <button type="submit" disabled={loading} className="w-full rounded-xl bg-blue-600 py-3 font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300">
              {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </button>
          </form>
          <p className="mt-6 text-center text-sm text-slate-500">Chưa có tài khoản? <Link href="/register" className="font-bold text-blue-600 hover:underline">Đăng ký ngay</Link></p>
        </div>
      </div>
    </main>
  );
}
