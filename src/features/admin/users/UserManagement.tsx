import { useState, useEffect } from 'react';
import { Search, Lock, Loader2, Unlock } from 'lucide-react';
import { adminApi } from '../../../api/api';
import { toast } from 'sonner';
import type { UserDto } from '../../../types/swagger';

const UserManagement = () => {
  const [users, setUsers] = useState<UserDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [lockingId, setLockingId] = useState<number | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      // GET /api/users — fetch user list (admin privilege required)
      const res = await fetch('/api/users', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });
      if (res.ok) {
        const data = await res.json();
        // Handle wrapped response: { result: [...] } or plain array
        const result = data?.result ?? data?.items ?? data?.data ?? data;
        setUsers(Array.isArray(result) ? result : []);
      } else {
        console.warn(`GET /api/users returned ${res.status}`);
        setUsers([]);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
      toast.error('Không thể tải danh sách người dùng');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-4xl font-black text-gray-900 dark:text-white leading-tight tracking-tight">
            Quản lý người dùng
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Xem và khóa/mở khóa tài khoản người dùng trên nền tảng.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-center bg-white dark:bg-[#2d2217] p-4 rounded-2xl shadow-sm border border-[#eadbcd] dark:border-[#3d2d1d]">
        <div className="flex-1 w-full relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            className="w-full h-12 pl-12 pr-4 rounded-xl border-none bg-gray-100 dark:bg-[#23190f] text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-600/50 placeholder:text-gray-500/60 text-sm font-medium"
            placeholder="Tìm theo tên, email, SĐT hoặc ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="w-full md:w-56">
          <select
            className="h-12 w-full rounded-xl border border-[#eadbcd] dark:border-[#3d2d1d] bg-gray-100 dark:bg-[#23190f] text-gray-900 dark:text-white px-4 text-sm font-medium focus:ring-2 focus:ring-orange-600/50"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="Active">Đang hoạt động</option>
            <option value="Banned">Bị khóa</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-[#2d2217] rounded-2xl border border-[#eadbcd] dark:border-[#3d2d1d] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-100 dark:bg-[#1f160d] border-b border-[#eadbcd] dark:border-[#3d2d1d]">
                <th className="px-6 py-4 text-gray-900 dark:text-white text-xs font-bold uppercase tracking-wider w-16">Avatar</th>
                <th className="px-6 py-4 text-gray-900 dark:text-white text-xs font-bold uppercase tracking-wider">Tên người dùng</th>
                <th className="px-6 py-4 text-gray-900 dark:text-white text-xs font-bold uppercase tracking-wider">Email</th>
                <th className="px-6 py-4 text-gray-900 dark:text-white text-xs font-bold uppercase tracking-wider">SĐT</th>
                <th className="px-6 py-4 text-gray-900 dark:text-white text-xs font-bold uppercase tracking-wider text-center">Trạng thái</th>
                <th className="px-6 py-4 text-orange-600 dark:text-orange-500 text-xs font-bold uppercase tracking-wider text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eadbcd] dark:divide-[#3d2d1d]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-orange-500" />
                    <p className="text-gray-500 text-sm mt-2">Đang tải...</p>
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
                    <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4">
                        <div className="size-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-sm">
                          {(user.name || 'U').charAt(0).toUpperCase()}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{user.name || 'N/A'}</p>
                        <span className={getRoleBadge(user.roleName)}>{user.roleName || 'User'} #{user.id}</span>
                      </td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-300 text-sm">{user.email || 'N/A'}</td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-300 text-sm">{user.phone || '—'}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={getStatusBadge(user)}>
                          {locked ? 'Bị khóa' : 'Hoạt động'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleLockUser(user.id, locked)}
                          disabled={lockingId === user.id}
                          title={locked ? 'Mở khóa người dùng' : 'Khóa người dùng'}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 ${
                            locked
                              ? 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400'
                          }`}
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
          <div className="px-6 py-4 border-t border-[#eadbcd] dark:border-[#3d2d1d]">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Hiển thị <span className="font-bold text-gray-900 dark:text-white">{filteredUsers.length}</span> người dùng
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManagement;
