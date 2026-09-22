'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, User } from '@/lib/api';

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Tải danh sách người dùng
  async function loadUsers() {
    setLoading(true);
    setError('');
    try {
      const data = await api.getUsers();
      setUsers(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không tải được danh sách người dùng');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadUsers();
  }, []);

  // Thay đổi Role của user (customer / admin)
  async function handleRoleChange(userId: number, newRole: string) {
    try {
      await api.updateUserRole(userId, newRole);
      setUsers(current =>
        current.map(u => (u.UserID === userId ? { ...u, Role: newRole } : u))
      );
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Cập nhật quyền thất bại');
    }
  }

  // Xóa tài khoản
  async function handleDelete(userId: number) {
    if (!window.confirm('Bạn có chắc chắn muốn xóa tài khoản này?')) return;
    try {
      await api.deleteUser(userId);
      setUsers(current => current.filter(u => u.UserID !== userId));
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Xóa tài khoản thất bại');
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6 text-slate-800">
      <div className="mx-auto max-w-6xl">
        {/* Nút quay lại Dashboard */}
        <div className="mb-6 flex items-center justify-between border-b border-slate-200 pb-4">
          <div className="flex items-center gap-4">
            <Link
              href="/admin"
              className="rounded-lg bg-slate-200 px-4 py-2 text-sm font-semibold hover:bg-slate-300 transition"
            >
              ← Dashboard
            </Link>
            <h1 className="text-2xl font-bold">Quản lý Tài khoản & Phân quyền</h1>
          </div>
          <button
            onClick={() => void loadUsers()}
            className="rounded-lg bg-slate-200 px-4 py-2 text-sm font-semibold hover:bg-slate-300 transition"
          >
            Làm mới
          </button>
        </div>

        {error && <p className="mb-4 rounded bg-red-100 p-3 text-red-700">{error}</p>}

        {loading ? (
          <p>Đang tải danh sách tài khoản...</p>
        ) : (
          <div className="overflow-x-auto rounded-lg bg-white shadow border border-slate-200">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-100 text-xs font-bold uppercase text-slate-600 border-b">
                <tr>
                  <th className="p-3">ID</th>
                  <th className="p-3">Họ tên</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Quyền hạn (Role)</th>
                  <th className="p-3 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {users.map(user => (
                  <tr key={user.UserID} className="hover:bg-slate-50">
                    <td className="p-3 font-semibold">{user.UserID}</td>
                    <td className="p-3">{user.FullName || 'Chưa cập nhật'}</td>
                    <td className="p-3 text-slate-600">{user.Email}</td>
                    <td className="p-3">
                      <select
                        value={user.Role || 'customer'}
                        onChange={e => void handleRoleChange(user.UserID, e.target.value)}
                        className="rounded border border-slate-300 bg-white px-3 py-1 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="customer">Customer</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => void handleDelete(user.UserID)}
                        className="rounded bg-red-100 px-3 py-1 text-xs font-bold text-red-600 hover:bg-red-200 transition"
                      >
                        Xóa tài khoản
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}