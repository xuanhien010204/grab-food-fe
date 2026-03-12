import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { BarChart3, ClipboardList, Store, LogOut, Menu, MessageSquare, Building2, TrendingUp, Ticket } from 'lucide-react';
import { useState } from 'react';
import { authStorage } from '../../../utils/auth';
import { userApi } from '../../../api/api';

const ManagerLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isActive = (path: string) => location.pathname.includes(path);

  const menuItems = [
    { label: 'Dashboard', icon: BarChart3, path: '/manager' },
    { label: 'Orders', icon: ClipboardList, path: '/manager/orders' },
    { label: 'Menu', icon: ClipboardList, path: '/manager/menu' },
    { label: 'Revenue', icon: TrendingUp, path: '/manager/analytics' },
    { label: 'Vouchers', icon: Ticket, path: '/manager/vouchers' },
    { label: 'Reviews', icon: MessageSquare, path: '/manager/reviews' },
    { label: 'Tenants', icon: Building2, path: '/manager/tenants' },
    { label: 'Store Profile', icon: Store, path: '/manager/store' }
  ];

  return (
    <div className="min-h-screen bg-cream dark:bg-charcoal font-sans text-charcoal dark:text-cream selection:bg-[#C76E00]/30">
      {/* Top Navigation Bar */}
      <div className="sticky top-0 z-50 bg-[#C76E00] shadow-lg">
        <div className="px-4 lg:px-8 py-4 flex items-center justify-between">
          {/* Left: Logo */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 hover:bg-white/10 rounded-lg"
            >
              <Menu className="w-5 h-5 text-white" />
            </button>
            <div>
              <h1 className="text-xl font-black tracking-tight text-white uppercase italic">FoodDelivery</h1>
              <p className="text-[9px] font-bold text-white/80 uppercase tracking-widest">Manager Portal</p>
            </div>
          </div>

          {/* Center: Removed Search as requested */}
          <div className="hidden md:flex flex-1 mx-8" />

          {/* Right: Actions */}
          <div className="flex items-center gap-4">
            <button
              onClick={async () => {
                try { await userApi.signOut(); } catch { }
                authStorage.clear();
                localStorage.removeItem('bypass_user');
                navigate('/login', { replace: true });
              }}
              className="flex items-center gap-2 px-4 py-2 text-white hover:bg-white/10 rounded-xl font-bold text-sm transition-colors"
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
        <div className="hidden lg:flex lg:w-68 flex-col bg-[#C76E00] border-r border-white/10 min-h-screen sticky top-20 shadow-xl">
          <nav className="flex-1 p-4 space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all duration-200 ${isActive(item.path)
                    ? 'bg-white text-[#C76E00] shadow-lg scale-[1.02]'
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                    }`}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="p-4 border-t border-white/10">
            <div className="bg-white/10 rounded-2xl p-4 border border-white/10">
              <p className="text-xs font-black text-white uppercase tracking-wider mb-3">Quick Stats</p>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-white/70 font-medium">Orders Today</span>
                  <span className="font-bold text-white bg-white/20 px-2 py-0.5 rounded-md">24</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-white/70 font-medium">Revenue</span>
                  <span className="font-bold text-emerald-400">₫2.4M</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Sidebar */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-30 lg:hidden">
            <div className="absolute inset-0 bg-black/50" onClick={() => setIsMobileMenuOpen(false)}></div>
            <div className="absolute left-0 top-20 bottom-0 w-72 bg-[#C76E00] border-r border-white/10 shadow-2xl animate-in slide-in-from-left duration-300">
              <nav className="p-4 space-y-2">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${isActive(item.path)
                        ? 'bg-white text-[#C76E00] shadow-lg'
                        : 'text-white/70 hover:bg-white/10 hover:text-white'
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
