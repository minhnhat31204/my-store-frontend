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
    <div className="max-w-7xl mx-auto space-y-6 animate-fadeIn">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-900/90 p-6 sm:p-7 rounded-3xl border border-slate-800/80 shadow-2xl">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-bold mb-2">
            👥 Phân hệ Người dùng & Tài khoản
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Quản Lý Người Dùng & Phân Quyền
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Tổng cộng {users.length} tài khoản ({adminCount} Quản trị viên, {customerCount} Khách hàng).
          </p>
        </div>

        <button
          onClick={() => void loadUsers()}
          className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 hover:bg-slate-800 border border-slate-700/80 px-4 py-2.5 text-xs font-bold text-slate-300 transition active:scale-95"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Làm Mới</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/80 p-4 rounded-2xl border border-slate-800/80 shadow-lg">
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
            className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
          />
        </div>

        {/* Role filter */}
        <div className="flex items-center gap-2">
          {[
            { key: 'all', label: 'Tất cả' },
            { key: 'admin', label: 'Quản trị (Admin)' },
            { key: 'customer', label: 'Khách hàng' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setRoleFilter(tab.key as typeof roleFilter)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                roleFilter === tab.key
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                  : 'text-slate-400 hover:text-white bg-slate-950 hover:bg-slate-800'
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
        <div className="p-16 text-center text-slate-400 font-medium">
          <div className="inline-block w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-3" />
          <p>Đang tải danh sách người dùng...</p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="p-16 text-center border border-dashed border-slate-800 rounded-3xl text-slate-400 bg-slate-900/30">
          Không tìm thấy tài khoản người dùng phù hợp.
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-slate-800/80 bg-slate-900/90 shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/80 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-5 py-4">ID</th>
                  <th className="px-5 py-4">Họ và tên</th>
                  <th className="px-5 py-4">Email liên hệ</th>
                  <th className="px-5 py-4">Số điện thoại</th>
                  <th className="px-5 py-4">Vai trò / Phân quyền</th>
                  <th className="px-5 py-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredUsers.map((user) => {
                  const isAdmin = (user.Role || '').toLowerCase() === 'admin';
                  const isUpdating = updatingId === user.UserID;

                  return (
                    <tr key={user.UserID} className="hover:bg-slate-800/40 transition">
                      <td className="px-5 py-4 font-mono font-bold text-slate-400 text-xs">
                        #{user.UserID}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-2xl flex items-center justify-center text-xs font-black shadow-inner ${
                            isAdmin ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30' : 'bg-slate-800 text-slate-300 border border-slate-700'
                          }`}>
                            {(user.FullName || 'U').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-white text-sm">
                              {user.FullName || 'Chưa đặt tên'}
                            </p>
                            <p className="text-[11px] text-slate-500">
                              Tài khoản đăng ký
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-slate-300 text-xs font-medium">
                        {user.Email || '—'}
                      </td>
                      <td className="px-5 py-4 text-slate-300 text-xs font-mono">
                        {user.Phone || '—'}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <select
                          disabled={isUpdating}
                          value={isAdmin ? 'Admin' : 'Customer'}
                          onChange={(e) => void handleRoleChange(user.UserID, e.target.value)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold border outline-none cursor-pointer transition ${
                            isAdmin
                              ? 'bg-purple-500/10 text-purple-300 border-purple-500/30'
                              : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                          } ${isUpdating ? 'opacity-50' : ''}`}
                        >
                          <option value="Customer" className="bg-slate-900 text-white">Khách hàng</option>
                          <option value="Admin" className="bg-slate-900 text-purple-300">Quản trị viên (Admin)</option>
                        </select>
                      </td>
                      <td className="px-5 py-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => void handleDelete(user.UserID)}
                          className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold transition active:scale-95"
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
