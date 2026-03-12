import { useState, useEffect } from 'react';
import { Search, Lock, Loader2, Unlock } from 'lucide-react';
import { adminApi } from '../../../api/api';
import { toast } from 'sonner';
import { cn } from '../../../lib/utils';
import type { UserDto } from '../../../types/swagger';

const UserManagement = () => {
  const [users, setUsers] = useState<UserDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [lockingId, setLockingId] = useState<number | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getAllUsers();
      // Since api.ts auto-unwraps 'result', res.data should be the array
      setUsers(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      toast.error('Không thể tải danh sách người dùng');
    } finally {
      setLoading(false);
    }
  };

  const handleLockUser = async (userId: number, isCurrentlyLocked: boolean) => {
    const action = isCurrentlyLocked ? 'mở khóa' : 'khóa';
    if (!confirm(`Bạn có chắc muốn ${action} người dùng này?`)) return;
    setLockingId(userId);

    try {
      // PUT /api/users/lock/{userId}
      await adminApi.lockUser(userId);
      toast.success(`Đã ${action} người dùng thành công`);
      fetchUsers(); // Re-fetch to get updated lock status from server
    } catch {
      toast.error(`Thao tác ${action} thất bại`);
    } finally {
      setLockingId(null);
    }
  };

  const isUserLocked = (user: any): boolean =>
    !!(user.isLocked || user.lockoutEnabled || user.status === 0 || user.isBanned);

  const getStatusBadge = (user: any) => {
    const base = 'inline-flex items-center px-3 py-1 rounded-full text-xs font-bold';
    return isUserLocked(user)
      ? `${base} bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400 border border-red-200 dark:border-red-900/50`
      : `${base} bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400`;
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      (user.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.phone || '').includes(searchTerm) ||
      String(user.id).includes(searchTerm);
    const locked = isUserLocked(user);
    const matchesFilter =
      !filterStatus ||
      (filterStatus === 'Active' && !locked) ||
      (filterStatus === 'Banned' && locked);
    return matchesSearch && matchesFilter;
  });

  const getRoleBadge = (roleName: string) => {
    const base = 'text-xs font-semibold px-2 py-0.5 rounded-full';
    if (roleName === 'Admin') return `${base} bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400`;
    if (roleName === 'Manager') return `${base} bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400`;
    return `${base} bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-400`;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">

      {/* Header */}
      <div className="border-l-4 border-[#C76E00] pl-4">
        <h1 className="text-3xl font-black text-charcoal tracking-tighter uppercase italic">
          Quản lý người dùng
        </h1>
        <p className="text-[10px] font-black text-charcoal/40 uppercase tracking-[0.2em] mt-1">
          Giám sát và bảo trợ cộng đồng người dùng
        </p>
      </div>

      {/* Search + Filter */}
      <div className="bg-white/50 backdrop-blur-md border border-orange-100/50 rounded-2xl p-6 shadow-sm flex flex-wrap items-center gap-6">

        <div className="relative w-full md:w-96 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal/30 group-focus-within:text-[#C76E00] transition-colors" />

          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm tên, email, SĐT hoặc ID..."
            className="w-full pl-11 pr-4 py-3 text-sm font-bold rounded-xl border-2 border-orange-100/50 bg-white text-charcoal placeholder:text-charcoal/30 focus:outline-none focus:border-[#C76E00] focus:ring-4 focus:ring-[#C76E00]/10 transition-all"
          />
        </div>

        <select
          className="h-12 px-6 rounded-xl border-2 border-orange-100/50 bg-white text-xs font-black uppercase tracking-widest text-charcoal/60 focus:border-[#C76E00] focus:ring-4 focus:ring-[#C76E00]/10 outline-none transition-all cursor-pointer"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="">Tất cả trạng thái</option>
          <option value="Active">Hoạt động</option>
          <option value="Banned">Bị khoá</option>
        </select>

      </div>

      {/* Table */}
      <div className="bg-white border border-orange-100/50 rounded-2xl shadow-xl shadow-charcoal/5 overflow-hidden">

        <div className="overflow-x-auto">

          <table className="w-full text-sm">

            <thead className="bg-cream/50 border-b border-orange-100/50">

              <tr className="text-[10px] font-black uppercase text-charcoal/40 tracking-[0.2em]">
                <th className="px-8 py-5 text-left">Avatar</th>
                <th className="px-8 py-5 text-left">Tên người dùng</th>
                <th className="px-8 py-5 text-left">Email</th>
                <th className="px-8 py-5 text-left">SĐT</th>
                <th className="px-8 py-5 text-center">Trạng thái</th>
                <th className="px-8 py-5 text-right">Quản trị</th>
              </tr>

            </thead>

            <tbody className="divide-y divide-orange-100/30">

              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-500 font-bold italic uppercase tracking-widest">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-orange-500 mb-2" />
                    Đang tải dữ liệu...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    {users.length === 0
                      ? 'Chưa có dữ liệu người dùng hoặc API chưa hỗ trợ truy vấn danh sách.'
                      : 'Không tìm thấy người dùng phù hợp.'}
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const locked = isUserLocked(user);
                  return (
                    <tr
                      key={user.id}
                      className="hover:bg-[#FFF7ED] transition"
                    >

                      {/* Avatar */}
                      <td className="px-8 py-5">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#C76E00] to-[#FF8000] flex items-center justify-center text-white text-lg font-black italic shadow-lg shadow-orange-500/20">
                          {(user.name || 'U').charAt(0).toUpperCase()}
                        </div>
                      </td>

                      {/* Name */}
                      <td className="px-8 py-5">
                        <p className="font-black text-charcoal tracking-tight italic">
                          {user.name || 'N/A'}
                        </p>
                        <span className={getRoleBadge(user.roleName || '')}>{user.roleName || 'User'} #{user.id}</span>
                      </td>

                      {/* Email */}
                      <td className="px-8 py-5 text-xs font-bold text-charcoal/60">
                        {user.email || 'N/A'}
                      </td>

                      {/* Phone */}
                      <td className="px-8 py-5 text-xs font-bold text-gray-600">
                        {user.phone || '—'}
                      </td>

                      {/* Status */}
                      <td className="px-8 py-5 text-center">
                        <span className={cn(
                          "px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest",
                          locked
                            ? "bg-rose-500 text-white shadow-lg shadow-rose-500/20"
                            : "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                        )}>
                          {locked ? 'Bị khóa' : 'Hoạt động'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-8 py-5 text-right">
                        <button
                          onClick={() => handleLockUser(user.id, locked)}
                          disabled={lockingId === user.id}
                          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 ${
                            locked
                              ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/10'
                              : 'bg-rose-500 text-white shadow-lg shadow-rose-500/10'
                          }`}
                          title={locked ? "Mở khóa" : "Khóa tài khoản"}
                        >
                          {lockingId === user.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : locked ? (
                            <><Unlock className="w-4 h-4" /> Mở khóa</>
                          ) : (
                            <><Lock className="w-4 h-4" /> Khóa</>
                          )}
                        </button>
                      </td>

                    </tr>
                  );
                })
              )}

            </tbody>

          </table>

        </div>

        {/* Footer */}
        {!loading && filteredUsers.length > 0 && (
          <div className="flex items-center justify-between px-8 py-5 bg-cream/30 border-t border-orange-100/50">
            <p className="text-[10px] font-black text-charcoal/30 uppercase tracking-[0.2em]">
              Tổng số: {filteredUsers.length} tài khoản
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManagement;