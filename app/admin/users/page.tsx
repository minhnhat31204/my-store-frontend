'use client';

import { useMemo, useState } from 'react';
import { api, User } from '@/lib/api';
import Pagination from '@/app/admin/components/Pagination';
import ConfirmDeleteModal from '@/app/admin/components/ConfirmDeleteModal';
import { useAdminData } from '@/lib/useAdminData';
import { exportToExcel } from '@/lib/exportExcel';

export default function AdminUsers() {
  const { data: usersData, loading, error, reload } = useAdminData<User[]>(
    'admin:users',
    () => api.getUsers(),
  );
  const users = usersData ?? [];
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'customer'>('all');
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const filteredUsers = useMemo(() => {
    const query = searchTerm.toLowerCase().trim();
    return users.filter((u) => {
      const name = (u.FullName || '').toLowerCase();
      const username = (u.Username || '').toLowerCase();
      const email = (u.Email || '').toLowerCase();
      const recoveryEmail = (u.RecoveryEmail || '').toLowerCase();
      const phone = (u.Phone || '').toLowerCase();
      const id = String(u.UserID);

      // Tìm kiếm theo: Tên (họ tên, username), Email (email chính, email liên kết/khôi phục), Số điện thoại, Mã người dùng
      const matchSearch =
        !query ||
        name.includes(query) ||
        username.includes(query) ||
        email.includes(query) ||
        recoveryEmail.includes(query) ||
        phone.includes(query) ||
        id === query ||
        id.includes(query) ||
        `#${id}`.includes(query);

      const userRole = (u.Role || 'customer').toLowerCase();
      const matchRole = roleFilter === 'all' || userRole === roleFilter;

      return matchSearch && matchRole;
    });
  }, [users, searchTerm, roleFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / 20));
  const currentPage = Math.min(page, totalPages);
  const visibleUsers = filteredUsers.slice((currentPage - 1) * 20, currentPage * 20);

  const adminCount = useMemo(() => users.filter((u) => (u.Role || '').toLowerCase() === 'admin').length, [users]);
  const customerCount = useMemo(() => users.length - adminCount, [users, adminCount]);


  const handleExportExcel = () => {
    exportToExcel<User>({
      filename: 'Danh_Sach_Nguoi_Dung',
      sheetName: 'NguoiDung',
      data: filteredUsers,
      columns: [
        { header: 'STT', transform: (_, idx) => idx + 1, width: 8 },
        { header: 'Mã người dùng', key: 'UserID', width: 14 },
        { header: 'Tên đăng nhập', key: 'Username', width: 18 },
        { header: 'Họ và tên', key: 'FullName', width: 22 },
        { 
          header: 'Email liên hệ', 
          transform: (u) => {
            const isInternal = u.Email?.includes('@phone.');
            return (!isInternal && u.Email) ? u.Email : (u.RecoveryEmail || '');
          }, 
          width: 26 
        },
        { header: 'Số điện thoại', key: 'Phone', width: 16 },
        { header: 'Vai trò', transform: (u) => (u.Role || 'customer') === 'admin' ? 'Quản trị viên' : 'Khách hàng', width: 16 },
      ],
    });
  };

  async function handleRoleChange(userId: number, newRole: string) {
    setUpdatingId(userId);
    try {
      await api.updateUserRole(userId, newRole);
      // Reload từ cache sau khi cập nhật
      void reload(true);
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
      void reload(true);
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
            👥 Phân hệ Người dùng &amp; Tài khoản
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Quản Lý Người Dùng &amp; Phân Quyền
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Tổng cộng {users.length} tài khoản ({adminCount} Quản trị viên, {customerCount} Khách hàng).
          </p>
        </div>


        <div className="flex items-center gap-2">
          <button
            onClick={handleExportExcel}
            className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600/10 hover:bg-emerald-600/20 border border-emerald-500/30 px-4 py-2.5 text-xs font-bold text-emerald-300 transition active:scale-95 cursor-pointer shadow-sm"
          >
            <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Xuất Excel</span>
          </button>
          <button
            onClick={() => void reload(true)}
            className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 hover:bg-slate-800 border border-slate-700/80 px-4 py-2.5 text-xs font-bold text-slate-300 transition active:scale-95 cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Làm Mới</span>
          </button>
        </div>

      </div>

      {/* Filter and Search Bar */}
      <div className="space-y-3 bg-slate-900/80 p-4 rounded-2xl border border-slate-800/80 shadow-lg">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <svg className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Tìm theo họ tên, email liên hệ, số điện thoại hoặc mã ID (#12)..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-10 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs font-bold p-1"
                title="Xóa tìm kiếm"
              >
                ✕
              </button>
            )}
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
                onClick={() => { setRoleFilter(tab.key as typeof roleFilter); setPage(1); }}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
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

        {/* Quick Filter Search Indicators */}
        <div className="flex items-center gap-2 text-[11px] text-slate-400 flex-wrap pt-1 border-t border-slate-800/60">
          <span className="font-semibold text-slate-500">Hỗ trợ tìm kiếm theo:</span>
          <span className="px-2 py-0.5 rounded-md bg-slate-950 text-slate-300 border border-slate-800">👤 Họ và tên</span>
          <span className="px-2 py-0.5 rounded-md bg-slate-950 text-slate-300 border border-slate-800">✉️ Email chính / liên kết</span>
          <span className="px-2 py-0.5 rounded-md bg-slate-950 text-slate-300 border border-slate-800">📞 Số điện thoại</span>
          <span className="px-2 py-0.5 rounded-md bg-slate-950 text-slate-300 border border-slate-800">🆔 Mã người dùng (#ID)</span>
          {searchTerm && (
            <span className="ml-auto text-blue-400 font-bold">
              Tìm thấy {filteredUsers.length} kết quả
            </span>
          )}
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
          Không tìm thấy tài khoản người dùng phù hợp với từ khóa &ldquo;{searchTerm}&rdquo;.
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-slate-800/80 bg-slate-900/90 shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/80 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-5 py-4 w-16 text-center">STT</th>
                  <th className="px-5 py-4">Mã tài khoản</th>
                  <th className="px-5 py-4">Họ và tên</th>
                  <th className="px-5 py-4">Email liên hệ</th>
                  <th className="px-5 py-4">Số điện thoại</th>
                  <th className="px-5 py-4">Vai trò / Phân quyền</th>
                  <th className="px-5 py-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {visibleUsers.map((user, index) => {
                  const stt = (currentPage - 1) * 20 + index + 1;
                  const isAdmin = (user.Role || '').toLowerCase() === 'admin';
                  const isUpdating = updatingId === user.UserID;

                  // Trích xuất email hiển thị: ưu tiên email thật, nếu không có lấy recoveryEmail
                  const isInternal = user.Email?.includes('@phone.');
                  const contactEmail = (!isInternal && user.Email) ? user.Email : (user.RecoveryEmail || null);

                  return (
                    <tr key={user.UserID} className="hover:bg-slate-800/40 transition">
                      <td className="px-5 py-4 text-center font-bold text-slate-400 text-xs w-16">
                        {stt}
                      </td>
                      <td className="px-5 py-4 font-mono font-bold text-purple-400 text-xs whitespace-nowrap">
                        <span className="px-2.5 py-1 rounded-lg bg-purple-500/10 border border-purple-500/20">#{user.UserID}</span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-2xl flex items-center justify-center text-xs font-black shadow-inner shrink-0 ${
                            isAdmin ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30' : 'bg-slate-800 text-slate-300 border border-slate-700'
                          }`}>
                            {(user.FullName || 'U').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-white text-sm">
                              {user.FullName || 'Chưa đặt tên'}
                            </p>
                            <p className="text-[11px] text-slate-500">
                              {user.Username ? `@${user.Username}` : 'Tài khoản thành viên'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-xs">
                        {contactEmail ? (
                          <div className="flex flex-col items-start gap-1">
                            <span className="font-semibold text-slate-200">{contactEmail}</span>
                            {user.RecoveryEmailVerified ? (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                ✓ Đã xác minh
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                                Email liên kết
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-500 italic">Chưa liên kết</span>
                        )}
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
                          onClick={() => setDeletingUser(user)}
                          className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold transition active:scale-95 cursor-pointer"
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

      <Pagination currentPage={currentPage} totalItems={filteredUsers.length} onPageChange={setPage} />
    </div>
  );
}
