import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { BarChart3, ClipboardList, Store, LogOut, Search, Bell, User, Menu, MessageSquare, Building2 } from 'lucide-react';
import { useState } from 'react';

const ManagerLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isActive = (path: string) => location.pathname.includes(path);

  const menuItems = [
    { label: 'Dashboard', icon: BarChart3, path: '/manager' },
    { label: 'Orders', icon: ClipboardList, path: '/manager/orders' },
    { label: 'Menu', icon: ClipboardList, path: '/manager/menu' },
    { label: 'Reviews', icon: MessageSquare, path: '/manager/reviews' },
    { label: 'Tenants', icon: Building2, path: '/manager/tenants' },
    { label: 'Store Profile', icon: Store, path: '/manager/store' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Top Navigation Bar */}
      <div className="sticky top-0 z-40 bg-white dark:bg-[#1d140c] border-b border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="px-4 lg:px-8 py-4 flex items-center justify-between">
          {/* Left: Logo */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-lg"
            >
              <Menu className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Gourmet Kitchen</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">Manager Dashboard</p>
            </div>
          </div>

          {/* Center: Search */}
          <div className="hidden md:flex flex-1 mx-8 max-w-sm">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-4">
            <button className="relative p-2 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-lg">
              <Bell className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-600 rounded-full"></span>
            </button>
            <button
              onClick={() => navigate('/profile')}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-lg"
            >
              <User className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            </button>
            <button
              onClick={() => navigate('/login')}
              className="flex items-center gap-2 px-4 py-2 text-orange-600 dark:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-500/10 rounded-lg font-bold text-sm"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Layout */}
      <div className="flex">
        {/* Sidebar - Desktop */}
        <div className="hidden lg:flex lg:w-64 flex-col bg-white dark:bg-[#2d1b15] border-r border-gray-200 dark:border-gray-800 min-h-screen sticky top-20">
          <nav className="flex-1 p-4 space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${isActive(item.path)
                      ? 'bg-orange-600 text-white shadow-lg'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="p-4 border-t border-gray-200 dark:border-gray-800">
            <div className="bg-orange-50 dark:bg-orange-500/10 rounded-xl p-4">
              <p className="text-xs font-bold text-orange-800 dark:text-orange-200 uppercase mb-2">Quick Stats</p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-700 dark:text-gray-300">Orders Today</span>
                  <span className="font-bold text-orange-600 dark:text-orange-500">24</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-700 dark:text-gray-300">Revenue</span>
                  <span className="font-bold text-green-600">₫2.4M</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Sidebar */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-30 lg:hidden">
            <div className="absolute inset-0 bg-black/50" onClick={() => setIsMobileMenuOpen(false)}></div>
            <div className="absolute left-0 top-20 bottom-0 w-64 bg-white dark:bg-[#2d1b15] border-r border-gray-200 dark:border-gray-800 shadow-lg">
              <nav className="p-4 space-y-2">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${isActive(item.path)
                          ? 'bg-orange-600 text-white shadow-lg'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                        }`}
                    >
                      <Icon className="w-5 h-5" />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1">
          <div className="p-4 lg:p-8">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerLayout;
