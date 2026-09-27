'use client';

import { useEffect, useMemo, useState } from 'react';
import { api, User } from '@/lib/api';

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'customer'>('all');
  const [updatingId, setUpdatingId] = useState<number | null>(null);

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

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const name = (u.FullName || '').toLowerCase();
      const email = (u.Email || '').toLowerCase();
      const phone = (u.Phone || '').toLowerCase();
      const id = String(u.UserID);
      const query = searchTerm.toLowerCase().trim();

      const matchSearch = !query || name.includes(query) || email.includes(query) || phone.includes(query) || id.includes(query);
      const userRole = (u.Role || 'customer').toLowerCase();
      const matchRole = roleFilter === 'all' || userRole === roleFilter;

      return matchSearch && matchRole;
    });
  }, [users, searchTerm, roleFilter]);

  const adminCount = useMemo(() => users.filter((u) => (u.Role || '').toLowerCase() === 'admin').length, [users]);
  const customerCount = useMemo(() => users.length - adminCount, [users, adminCount]);

  async function handleRoleChange(userId: number, newRole: string) {
    setUpdatingId(userId);
    try {
      await api.updateUserRole(userId, newRole);
      setUsers((current) =>
        current.map((u) => (u.UserID === userId ? { ...u, Role: newRole } : u))
      );
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Cập nhật quyền thất bại');
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleDelete(userId: number) {
    if (!window.confirm('Bạn có chắc chắn muốn xóa tài khoản này khỏi hệ thống?')) return;
    try {
      await api.deleteUser(userId);
      setUsers((current) => current.filter((u) => u.UserID !== userId));
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Xóa tài khoản thất bại');
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-950/60 p-6 rounded-3xl border border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Quản lý Người dùng & Phân quyền
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Tổng cộng {users.length} tài khoản ({adminCount} Quản trị viên, {customerCount} Khách hàng).
          </p>
        </div>

        <button
          onClick={() => void loadUsers()}
          className="inline-flex items-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 px-4 py-2 text-xs font-bold text-slate-200 transition"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Làm mới dữ liệu</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-950/40 p-4 rounded-2xl border border-slate-800">
        {/* Search */}
        <div className="relative flex-1">
          <svg className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Tìm theo ID, họ tên, email hoặc số điện thoại..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
          />
        </div>

        {/* Role filter */}
        <div className="flex items-center gap-1.5">
          {[
            { key: 'all', label: 'Tất cả' },
            { key: 'admin', label: 'Quản trị (Admin)' },
            { key: 'customer', label: 'Khách hàng' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setRoleFilter(tab.key as typeof roleFilter)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                roleFilter === tab.key
                  ? 'bg-slate-800 text-white border border-slate-700'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm font-semibold">
          {error}
        </div>
      )}

      {/* Users Table */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 font-medium">
          Đang tải danh sách người dùng...
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-slate-800 rounded-3xl text-slate-400">
          Không tìm thấy tài khoản người dùng phù hợp.
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-950/60 shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-900/90 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-5 py-3.5">ID</th>
                  <th className="px-5 py-3.5">Người dùng</th>
                  <th className="px-5 py-3.5">Email / SĐT</th>
                  <th className="px-5 py-3.5">Phân quyền (Role)</th>
                  <th className="px-5 py-3.5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredUsers.map((user) => {
                  const isAdmin = (user.Role || '').toLowerCase() === 'admin';
                  return (
                    <tr key={user.UserID} className="hover:bg-slate-900/50 transition">
                      <td className="px-5 py-4 font-mono font-bold text-slate-400">
                        #{user.UserID}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                            isAdmin
                              ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                              : 'bg-slate-800 text-slate-300 border border-slate-700'
                          }`}>
                            {user.FullName ? user.FullName.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div>
                            <p className="font-bold text-white">
                              {user.FullName || 'Chưa cập nhật'}
                            </p>
                            <p className="text-[11px] text-slate-500">
                              Tham gia hệ thống
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-xs text-slate-200">{user.Email}</p>
                        {user.Phone && <p className="text-[11px] text-slate-400 mt-0.5">{user.Phone}</p>}
                      </td>
                      <td className="px-5 py-4">
                        <select
                          disabled={updatingId === user.UserID}
                          value={(user.Role || 'customer').toLowerCase()}
                          onChange={(e) => void handleRoleChange(user.UserID, e.target.value)}
                          className={`rounded-xl px-3 py-1.5 text-xs font-bold border transition cursor-pointer outline-none ${
                            isAdmin
                              ? 'bg-purple-500/10 text-purple-300 border-purple-500/30 focus:border-purple-500'
                              : 'bg-slate-900 text-slate-300 border-slate-700 focus:border-blue-500'
                          }`}
                        >
                          <option value="customer" className="bg-slate-900 text-slate-300">Khách hàng (Customer)</option>
                          <option value="admin" className="bg-slate-900 text-purple-300 font-bold">Quản trị viên (Admin)</option>
                        </select>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => void handleDelete(user.UserID)}
                          className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold transition"
                        >
                          Xóa
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
