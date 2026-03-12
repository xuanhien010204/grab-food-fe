import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Store,
  Tag,
  Receipt,
  Menu,
  X,
  Search,
  Bell,
  Settings2,
  Ticket,
  LogOut,
  Banknote
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

  // B04: Fetch pending store count for badge
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
    { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'User Management', path: '/admin/users', icon: Users },
    { name: 'Store Management', path: '/admin/stores', icon: Store, badge: pendingStoreCount },
    { name: 'Category Management', path: '/admin/categories', icon: Tag },
    { name: 'Voucher Management', path: '/admin/vouchers', icon: Ticket },
    { name: 'Transactions', path: '/admin/transactions', icon: Receipt },
    { name: 'Rút tiền Manager', path: '/admin/withdrawals', icon: Banknote, badge: pendingWithdrawalCount },
  ];

  return (
    <div className="flex min-h-screen bg-background-light dark:bg-background-dark">
      {/* SIDEBAR */}
      <aside
        className={cn(
          "w-72 bg-[#1d140c] text-white flex flex-col shrink-0 border-r border-[#3d2f21] transition-all duration-300",
          !isSidebarOpen && "hidden md:flex"
        )}
      >
        <div className="p-6 flex flex-col gap-8">
          <div className="flex items-center gap-3">
            <div className="bg-orange-600 rounded-lg p-2 flex items-center justify-center">
              <span className="text-white text-2xl">🍜</span>
            </div>
            <div>
              <h1 className="text-lg font-bold leading-none">DelivAdmin</h1>
              <p className="text-xs text-gray-400 mt-1 uppercase tracking-widest">Management Portal</p>
            </div>
          </div>

          <nav className="flex flex-col gap-2">
            {MENU_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors relative",
                    isActive(item.path)
                      ? "bg-orange-600 text-white"
                      : "text-gray-400 hover:bg-white/10 hover:text-white"
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-sm font-medium">{item.name}</span>
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

        <div className="mt-auto p-6 border-t border-white/10">
          <div className="flex items-center gap-3 mb-4">
            <div className="size-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold">
              AD
            </div>
            <div>
              <p className="text-sm font-semibold">Admin</p>
              <p className="text-xs text-gray-400">Super Admin</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-lg font-semibold text-sm transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* TOP NAV BAR */}
        <header className="h-20 bg-white dark:bg-[#2d2114] border-b border-[#f4ede6] dark:border-[#3d2f21] px-8 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!isSidebarOpen)}
              className="md:hidden text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            <h2 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
              {MENU_ITEMS.find((i) => isActive(i.path))?.name || 'Dashboard'}
            </h2>
          </div>

          <div className="flex items-center gap-6">
            <div className="relative hidden lg:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                className="pl-10 pr-4 py-2 bg-background-light dark:bg-background-dark border-none rounded-lg text-sm w-64 focus:ring-2 focus:ring-orange-600/50 text-gray-900 dark:text-white placeholder:text-gray-500"
                placeholder="Search data..."
                type="text"
              />
            </div>

            <div className="flex items-center gap-2">
              <button className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg relative">
                <Bell className="w-5 h-5" />
                <span className="absolute top-2 right-2 size-2 bg-orange-600 rounded-full border-2 border-white dark:border-[#2d2114]"></span>
              </button>
              <button className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg">
                <Settings2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>

        <div className="p-8 flex-1">
          <Outlet />
        </div>
      </main>

      {/* Mobile overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}
    </div>
  );
}
