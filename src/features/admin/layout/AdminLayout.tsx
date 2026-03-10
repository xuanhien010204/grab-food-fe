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
  LogOut
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { authStorage } from '../../../utils/auth';
import { userApi, adminApi } from '../../../api/api';

export default function AdminLayout() {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [pendingStoreCount, setPendingStoreCount] = useState(0);
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
  ];

  return (
    <div className="flex min-h-screen bg-[#F5E6D3]">

      {/* SIDEBAR */}
      <aside
        className={cn(
          "w-72 bg-white border-r border-orange-100 shadow-lg flex flex-col shrink-0 transition-all duration-300",
          !isSidebarOpen && "hidden md:flex"
        )}
      >

        <div className="p-6 flex flex-col gap-8">

          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="bg-dark-orange rounded-lg p-2 flex items-center justify-center">
              <span className="text-white text-2xl">🍜</span>
            </div>
            <div>
              <h1 className="text-[1.3rem] font-black tracking-tight text-[#2E2E2E] uppercase italic leading-none">FoodDelivery</h1>
              <p className="text-[9px] font-bold text-[#C76E00] mt-1 uppercase tracking-[0.2em]">
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
                    "flex items-center gap-3 px-4 py-3 rounded-lg transition relative text-sm font-medium",
                    isActive(item.path)
                      ? "bg-[#C76E00] text-white shadow"
                      : "text-[#2E2E2E] hover:bg-orange-50 hover:text-[#C76E00]"
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
        <div className="mt-auto p-6 border-t border-orange-100">

          <div className="flex items-center gap-3 mb-4">
            <div className="size-10 rounded-full bg-[#C76E00] flex items-center justify-center text-white font-bold">
              AD
            </div>

            <div>
              <p className="text-sm font-semibold text-[#2E2E2E]">Admin</p>
              <p className="text-xs text-gray-500">Super Admin</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-red-500 hover:bg-red-50 rounded-lg font-semibold text-sm transition"
          >
            <LogOut className="w-4 h-4" />
            Đăng xuất
          </button>

        </div>

      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col min-w-0">

        {/* HEADER */}
        <header className="h-20 bg-white border-b border-orange-100 px-8 flex items-center justify-between sticky top-0 z-10 shadow-sm">

          <div className="flex items-center gap-4">

            <button
              onClick={() => setSidebarOpen(!isSidebarOpen)}
              className="md:hidden text-gray-600 hover:text-[#C76E00]"
            >
              {isSidebarOpen
                ? <X className="w-6 h-6" />
                : <Menu className="w-6 h-6" />
              }
            </button>

            <h2 className="text-xl font-bold text-[#2E2E2E]">
              {MENU_ITEMS.find((i) => isActive(i.path))?.name || 'Dashboard'}
            </h2>

          </div>

          {/* Right side */}
          <div className="flex items-center gap-6">

            {/* Search */}
            <div className="relative hidden lg:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm w-64 focus:ring-2 focus:ring-[#C76E00]/40 text-[#2E2E2E]"
                placeholder="Search data..."
                type="text"
              />
            </div>

            {/* Icons */}
            <div className="flex items-center gap-2">

              <button className="p-2 text-gray-500 hover:bg-orange-50 rounded-lg relative">
                <Bell className="w-5 h-5" />
                <span className="absolute top-2 right-2 size-2 bg-[#C76E00] rounded-full"></span>
              </button>

              <button className="p-2 text-gray-500 hover:bg-orange-50 rounded-lg">
                <Settings2 className="w-5 h-5" />
              </button>

            </div>

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