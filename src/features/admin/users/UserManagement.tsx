import { useState, useEffect } from 'react';
import { Search, Lock, Loader2 } from 'lucide-react';
import { adminApi } from '../../../api/api';
import { toast } from 'sonner';

const UserManagement = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [lockingId, setLockingId] = useState<number | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch('/api/users', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });

        if (res.ok) {
          const data = await res.json();
          const result = data?.result || data;
          setUsers(Array.isArray(result) ? result : []);
        }
      } catch {
        console.log('User list API not available');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const handleLockUser = async (userId: number) => {
    if (!confirm('Bạn có chắc muốn khóa/mở khóa user này?')) return;

    setLockingId(userId);

    try {
      await adminApi.lockUser(userId);

      toast.success('Đã cập nhật trạng thái user');

      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, isLocked: !u.isLocked } : u
        )
      );
    } catch {
      toast.error('Thao tác thất bại');
    } finally {
      setLockingId(null);
    }
  };

  const getStatusBadge = (user: any) => {
    const base =
      'inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold';

    const isLocked = user.isLocked || user.lockoutEnabled;

    if (isLocked)
      return `${base} bg-red-50 text-red-600`;

    return `${base} bg-green-50 text-green-700`;
  };

  const getStatusText = (user: any) => {
    return user.isLocked || user.lockoutEnabled ? 'Bị khoá' : 'Hoạt động';
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      (user.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(user.id).includes(searchTerm);

    const matchesFilter =
      !filterStatus ||
      (filterStatus === 'Active' && !user.isLocked) ||
      (filterStatus === 'Banned' && user.isLocked);

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#1F2937]">
          Quản lý người dùng
        </h1>
        <p className="text-sm text-[#6B7280]">
          Quản lý toàn bộ tài khoản người dùng trong hệ thống.
        </p>
      </div>

      {/* Search + Filter */}
      <div className="bg-white border border-[#FED7AA] rounded-2xl p-5 shadow-sm flex flex-wrap items-center gap-4">

        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />

          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm tên, email hoặc ID..."
            className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-[#FED7AA] bg-[#FFF7ED] text-[#1F2937] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#F97316]"
          />
        </div>

        <select
          className="h-10 px-3 rounded-xl border border-[#FED7AA] bg-[#FFF7ED] text-sm text-[#1F2937] focus:ring-2 focus:ring-[#F97316]"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="">Tất cả</option>
          <option value="Active">Hoạt động</option>
          <option value="Banned">Bị khoá</option>
        </select>

      </div>

      {/* Table */}
      <div className="bg-white border border-[#FED7AA] rounded-2xl shadow-sm overflow-hidden">

        <div className="overflow-x-auto">

          <table className="w-full text-sm">

            <thead className="bg-[#FFF7ED] border-b border-[#FED7AA]">

              <tr className="text-xs uppercase text-[#6B7280] tracking-wider">
                <th className="px-6 py-4 text-left">Avatar</th>
                <th className="px-6 py-4 text-left">Người dùng</th>
                <th className="px-6 py-4 text-left">Email</th>
                <th className="px-6 py-4 text-center">Trạng thái</th>
                <th className="px-6 py-4 text-right">Hành động</th>
              </tr>

            </thead>

            <tbody className="divide-y divide-[#FED7AA]">

              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-orange-500" />
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-500">
                    Không có người dùng nào
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-[#FFF7ED] transition"
                  >

                    {/* Avatar */}
                    <td className="px-6 py-4">

                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-sm font-semibold">
                        {(user.name || 'U').charAt(0).toUpperCase()}
                      </div>

                    </td>

                    {/* Name */}
                    <td className="px-6 py-4">

                      <p className="font-medium text-[#1F2937]">
                        {user.name || 'N/A'}
                      </p>

                      <p className="text-xs text-gray-500">
                        ID #{user.id}
                      </p>

                    </td>

                    {/* Email */}
                    <td className="px-6 py-4 text-gray-500">
                      {user.email || 'N/A'}
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4 text-center">

                      <span className={getStatusBadge(user)}>
                        {getStatusText(user)}
                      </span>

                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right">

                      <button
                        onClick={() => handleLockUser(user.id)}
                        disabled={lockingId === user.id}
                        className="p-2 rounded-lg hover:bg-[#FFF7ED] transition"
                      >
                        {lockingId === user.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Lock className="w-4 h-4 text-gray-600 hover:text-orange-600" />
                        )}
                      </button>

                    </td>

                  </tr>
                ))
              )}

            </tbody>

          </table>

        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[#FED7AA]">

          <p className="text-sm text-gray-500">
            Tổng người dùng: {filteredUsers.length}
          </p>

        </div>

      </div>
    </div>
  );
};

export default UserManagement;