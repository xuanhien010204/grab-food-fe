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
    // Backend doesn't have a dedicated user list API
    // We'll try to fetch from a general endpoint or show a message
    const fetchUsers = async () => {
      try {
        // Try fetching from any available endpoint
        const res = await fetch('/api/users', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
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
      // Refresh
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, isLocked: !u.isLocked } : u));
    } catch {
      toast.error('Thao tác thất bại');
    } finally {
      setLockingId(null);
    }
  };

  const getStatusBadge = (user: any) => {
    const baseStyles = 'inline-flex items-center px-3 py-1 rounded-full text-xs font-bold';
    const isLocked = user.isLocked || user.lockoutEnabled;
    if (isLocked) return `${baseStyles} bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400 border border-red-200 dark:border-red-900/50`;
    return `${baseStyles} bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400`;
  };

  const getStatusText = (user: any) => {
    return user.isLocked || user.lockoutEnabled ? 'Bị khoá' : 'Hoạt động';
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      (user.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(user.id).includes(searchTerm);
    const matchesFilter = !filterStatus ||
      (filterStatus === 'Active' && !user.isLocked) ||
      (filterStatus === 'Banned' && user.isLocked);
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-4xl font-black text-gray-900 dark:text-white leading-tight tracking-tight">
            Quản lý người dùng
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Quản lý tài khoản người dùng trên nền tảng.
          </p>
        </div>
      </div>

      {/* Filters & Search Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center bg-white dark:bg-[#2d2217] p-4 rounded-2xl shadow-sm border border-[#eadbcd] dark:border-[#3d2d1d]">
        <div className="flex-1 w-full relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 dark:text-gray-400 w-5 h-5" />
          <input
            className="w-full h-12 pl-12 pr-4 rounded-xl border-none bg-gray-100 dark:bg-[#23190f] text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-600/50 placeholder:text-gray-500/60 text-sm font-medium"
            placeholder="Search by name, email, or user ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="w-full md:w-64 relative">
          <select
            className="appearance-none h-12 w-full rounded-xl border border-[#eadbcd] dark:border-[#3d2d1d] bg-gray-100 dark:bg-[#23190f] text-gray-900 dark:text-white px-4 text-sm font-medium focus:ring-2 focus:ring-orange-600/50 focus:border-orange-600"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">Filter by Status: All</option>
            <option value="Active">Active Only</option>
            <option value="Inactive">Inactive</option>
            <option value="Banned">Banned</option>
          </select>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-600 dark:text-gray-400">
            ⌄
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white dark:bg-[#2d2217] rounded-2xl border border-[#eadbcd] dark:border-[#3d2d1d] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-100 dark:bg-[#1f160d] border-b border-[#eadbcd] dark:border-[#3d2d1d]">
                <th className="px-6 py-4 text-gray-900 dark:text-white text-xs font-bold uppercase tracking-wider w-20">Avatar</th>
                <th className="px-6 py-4 text-gray-900 dark:text-white text-xs font-bold uppercase tracking-wider">Full Name</th>
                <th className="px-6 py-4 text-gray-900 dark:text-white text-xs font-bold uppercase tracking-wider">Email Address</th>
                <th className="px-6 py-4 text-gray-900 dark:text-white text-xs font-bold uppercase tracking-wider w-40 text-center">Status</th>
                <th className="px-6 py-4 text-orange-600 dark:text-orange-500 text-xs font-bold uppercase tracking-wider w-24 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eadbcd] dark:divide-[#3d2d1d]">
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-orange-500" /></td></tr>
              ) : filteredUsers.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">Không có người dùng nào</td></tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="size-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-sm border border-[#eadbcd] dark:border-[#3d2d1d]">
                        {(user.name || 'U').charAt(0).toUpperCase()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{user.name || 'N/A'}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">{user.roleName || 'User'} ID: #{user.id}</p>
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300 text-sm">{user.email || 'N/A'}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={getStatusBadge(user)}>{getStatusText(user)}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleLockUser(user.id)}
                        disabled={lockingId === user.id}
                        className="text-gray-600 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-500 transition-colors p-1"
                        title="Khóa/Mở khóa"
                      >
                        {lockingId === user.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <Lock className="w-5 h-5" />}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[#eadbcd] dark:border-[#3d2d1d]">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Showing <span className="font-bold text-gray-900 dark:text-white">1</span> to{' '}
            <span className="font-bold text-gray-900 dark:text-white">5</span> of{' '}
            <span className="font-bold text-gray-900 dark:text-white">{filteredUsers.length}</span> results
          </p>
          <div className="flex gap-2">
            <button className="flex items-center justify-center size-10 rounded-xl border border-[#eadbcd] dark:border-[#3d2d1d] hover:bg-gray-100 dark:hover:bg-[#23190f] transition-colors disabled:opacity-50" disabled>
              ‹
            </button>
            <button className="flex items-center justify-center size-10 rounded-xl bg-orange-600 text-white font-bold text-sm shadow-sm">
              1
            </button>
            <button className="flex items-center justify-center size-10 rounded-xl border border-[#eadbcd] dark:border-[#3d2d1d] hover:bg-gray-100 dark:hover:bg-[#23190f] transition-colors text-sm font-medium">
              2
            </button>
            <button className="flex items-center justify-center size-10 rounded-xl border border-[#eadbcd] dark:border-[#3d2d1d] hover:bg-gray-100 dark:hover:bg-[#23190f] transition-colors text-sm font-medium">
              3
            </button>
            <span className="flex items-center px-2 text-gray-600 dark:text-gray-400">...</span>
            <button className="flex items-center justify-center size-10 rounded-xl border border-[#eadbcd] dark:border-[#3d2d1d] hover:bg-gray-100 dark:hover:bg-[#23190f] transition-colors">
              ›
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;
