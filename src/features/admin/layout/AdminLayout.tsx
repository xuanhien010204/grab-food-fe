import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Store,
  Tag,
  Receipt,
  Menu,
  X,
  Ticket,
  LogOut,
  Banknote,
  Users
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { authStorage } from '../../../utils/auth';
import { userApi, adminApi } from '../../../api/api';

export default function AdminLayout() {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [pendingStoreCount, setPendingStoreCount] = useState(0);
  const [pendingWithdrawalCount, setPendingWithdrawalCount] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) => location.pathname === path;

  useEffect(() => {
    adminApi.getPendingStores()
      .then(res => {
        const data = Array.isArray(res.data) ? res.data : [];
        setPendingStoreCount(data.length);
      })
      .catch(() => { });
    // Load pending withdrawal count from localStorage
    try {
      const reqs = JSON.parse(localStorage.getItem('withdrawal_requests') || '[]');
      setPendingWithdrawalCount(reqs.filter((r: any) => r.status === 'pending').length);
    } catch { }
  }, [location.pathname]);

  const handleLogout = async () => {
    try { await userApi.signOut(); } catch { }
    authStorage.clear();
    localStorage.removeItem('bypass_user');
    navigate('/login', { replace: true });
  };

  const MENU_ITEMS = [
    { name: 'Bảng điều khiển', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Quản lý người dùng', path: '/admin/users', icon: Users },
    { name: 'Quản lý cửa hàng', path: '/admin/stores', icon: Store, badge: pendingStoreCount },
    { name: 'Quản lý loại thực phẩm', path: '/admin/categories', icon: Tag },
    { name: 'Quản lý voucher', path: '/admin/vouchers', icon: Ticket },
    { name: 'Lịch sử giao dịch', path: '/admin/transactions', icon: Receipt },
    { name: 'Rút tiền Manager', path: '/admin/withdrawals', icon: Banknote, badge: pendingWithdrawalCount },
  ];

  const getPageTitle = () => {
    const path = location.pathname;
    if (path.startsWith('/admin/dashboard')) return 'Bảng điều khiển';
    if (path.startsWith('/admin/stores/')) return 'Chi tiết cửa hàng';
    if (path.startsWith('/admin/stores')) return 'Quản lý cửa hàng';
    if (path.startsWith('/admin/categories')) return 'Quản lý loại thực phẩm';
    if (path.startsWith('/admin/vouchers')) return 'Quản lý voucher';
    if (path.startsWith('/admin/transactions')) return 'Lịch sử giao dịch';
    return '';
  };

  return (
    <div className="flex min-h-screen bg-[#FFFBF0] font-sans text-charcoal selection:bg-[#C76E00]/30 transition-colors">

      {/* SIDEBAR */}
      <aside
        className={cn(
          "w-72 bg-[#C76E00] border-r border-white/10 shadow-xl flex flex-col shrink-0 transition-all duration-300",
          !isSidebarOpen && "hidden md:flex"
        )}
      >

        <div className="p-6 flex flex-col gap-8">

          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="bg-white/10 rounded-xl p-2 flex items-center justify-center border border-white/20 backdrop-blur-md">
              <span className="text-white text-2xl">🍜</span>
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-white uppercase italic leading-none">FoodDelivery</h1>
              <p className="text-[9px] font-bold text-white/80 mt-1 uppercase tracking-[0.2em]">
                Admin Portal
              </p>
            </div>
          </div>

          {/* Menu */}
          <nav className="flex flex-col gap-2">

            {MENU_ITEMS.map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 relative text-sm font-bold",
                    isActive(item.path)
                      ? "bg-white text-[#C76E00] shadow-lg scale-[1.02]"
                      : "text-white/70 hover:bg-white/10 hover:text-white"
                  )}
                >
                  <Icon className="w-5 h-5" />

                  {item.name}

                  {(item as any).badge > 0 && (
                    <span className="ml-auto bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1">
                      {(item as any).badge}
                    </span>
                  )}
                </Link>
              );
            })}

          </nav>
        </div>

        {/* Admin Profile */}
        <div className="mt-auto p-6 border-t border-white/10">

          <div className="flex items-center gap-3 mb-4">
            <div className="size-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white font-bold backdrop-blur-md">
              AD
            </div>

            <div>
              <p className="text-sm font-bold text-white">Admin</p>
              <p className="text-[10px] font-black text-white/60 uppercase tracking-widest">Super Admin</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-bold text-sm transition-all active:scale-[0.98]"
          >
            <LogOut className="w-4 h-4" />
            Đăng xuất
          </button>

        </div>

      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">

        {/* HEADER */}
        <header className="h-16 bg-[#C76E00] px-8 flex items-center justify-between sticky top-0 z-50 shadow-lg shrink-0">

          <div className="flex items-center gap-4">

            <button
              onClick={() => setSidebarOpen(!isSidebarOpen)}
              className="md:hidden text-white/80 hover:text-white transition-colors"
            >
              {isSidebarOpen
                ? <X className="w-6 h-6" />
                : <Menu className="w-6 h-6" />
              }
            </button>

            <h2 className="text-white font-black uppercase italic tracking-widest text-sm">
              {getPageTitle()}
            </h2>

          </div>

        </header>

        {/* PAGE CONTENT */}
        <div className="p-8 flex-1">
          <Outlet />
        </div>

      </main>

      {/* Mobile overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

    </div>
  );
}