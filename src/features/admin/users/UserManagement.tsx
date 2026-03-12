import { useState, useEffect } from 'react';
import { Search, Lock, Loader2 } from 'lucide-react';
import { adminApi } from '../../../api/api';
import { toast } from 'sonner';
import { cn } from '../../../lib/utils';

const UserManagement = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [lockingId, setLockingId] = useState<number | null>(null);

  useEffect(() => {
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
            placeholder="Tìm tên, email hoặc ID..."
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
                <th className="px-8 py-5 text-left">Hồ sơ</th>
                <th className="px-8 py-5 text-left">Thông tin cơ bản</th>
                <th className="px-8 py-5 text-left">Email hệ thống</th>
                <th className="px-8 py-5 text-center">Trạng thái</th>
                <th className="px-8 py-5 text-right">Quản trị</th>
              </tr>

            </thead>

            <tbody className="divide-y divide-orange-100/30">

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

                      <p className="text-[10px] font-black text-charcoal/30 uppercase tracking-widest mt-0.5">
                        ID #{user.id}
                      </p>

                    </td>

                    {/* Email */}
                    <td className="px-8 py-5 text-xs font-bold text-charcoal/60">
                      {user.email || 'N/A'}
                    </td>

                    {/* Status */}
                    <td className="px-8 py-5 text-center">

                      <span className={cn(
                        "px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest",
                        (user.isLocked || user.lockoutEnabled)
                          ? "bg-rose-500 text-white shadow-lg shadow-rose-500/20"
                          : "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                      )}>
                        {getStatusText(user)}
                      </span>

                    </td>

                    {/* Actions */}
                    <td className="px-8 py-5 text-right">

                      <button
                        onClick={() => handleLockUser(user.id)}
                        disabled={lockingId === user.id}
                        className="p-3 rounded-xl hover:bg-orange-50 text-charcoal/30 hover:text-[#C76E00] transition-all active:scale-90"
                        title={user.isLocked ? "Mở khóa" : "Khóa tài khoản"}
                      >
                        {lockingId === user.id ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <Lock className="w-5 h-5" />
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
        <div className="flex items-center justify-between px-8 py-5 bg-cream/30 border-t border-orange-100/50">

          <p className="text-[10px] font-black text-charcoal/30 uppercase tracking-[0.2em]">
            Tổng số: {filteredUsers.length} tài khoản
          </p>

        </div>

      </div>
    </div>
  );
};

export default UserManagement;