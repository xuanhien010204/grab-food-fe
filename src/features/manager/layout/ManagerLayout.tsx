import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  BarChart3, 
  ClipboardList, 
  Store, 
  LogOut, 
  Menu, 
  MessageSquare, 
  Building2, 
  TrendingUp, 
  Ticket, 
  Wallet, 
  MessageCircle, 
  Receipt, 
  Banknote, 
  Tag, 
  User,
  X,
  LayoutGrid
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { authStorage } from '../../../utils/auth';
import { userApi, chatApi } from '../../../api/api';
import { cn } from '../../../lib/utils';

const ManagerLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [unreadChatCount, setUnreadChatCount] = useState(0);

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const res = await chatApi.getUnreadCount();
        setUnreadChatCount(res.data);
      } catch (error) {
        console.error('Failed to fetch unread chat count', error);
      }
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, []);

  const menuItems = [
    { label: 'Bảng điều khiển', icon: BarChart3, path: '/manager' },
    { label: 'Đơn hàng', icon: ClipboardList, path: '/manager/orders' },
    { label: 'Doanh thu', icon: TrendingUp, path: '/manager/analytics' },
    { label: 'Loại thực phẩm', icon: Tag, path: '/manager/categories' },
    { label: 'Vouchers', icon: Ticket, path: '/manager/vouchers' },
    { label: 'Đánh giá', icon: MessageSquare, path: '/manager/reviews' },
    { label: 'Tin nhắn', icon: MessageCircle, path: '/manager/chat', badge: unreadChatCount },
    { label: 'Giao dịch', icon: Receipt, path: '/manager/transactions' },
    { label: 'Rút tiền', icon: Banknote, path: '/manager/withdraw' },
    { label: 'Hồ sơ cửa hàng', icon: Store, path: '/manager/store' },
    { label: 'Thông tin cá nhân', icon: User, path: '/manager/profile' },
  ];

  const handleLogout = () => {
    authStorage.clear();
    navigate('/login');
  };

  const isActive = (path: string) => {
    if (path === '/manager') return location.pathname === '/manager';
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-cream/20">
      {/* Sidebar - Desktop */}
      <aside className="fixed left-0 top-0 h-screen w-20 lg:w-72 bg-charcoal border-r border-white/5 hidden md:flex flex-col z-50">
        <div className="p-8 flex items-center justify-center lg:justify-start gap-4">
          <div className="w-12 h-12 bg-dark-orange rounded-2xl flex items-center justify-center shadow-2xl shadow-dark-orange/20 rotate-3 group-hover:rotate-0 transition-all">
            <LayoutGrid className="text-white w-7 h-7" />
          </div>
          <div className="hidden lg:block overflow-hidden transition-all">
            <span className="text-2xl font-black text-cream tracking-tighter uppercase italic block">MANAGER</span>
            <span className="text-[10px] font-black text-dark-orange/60 uppercase tracking-[0.2em] block">Admin Panel</span>
          </div>
        </div>

        <nav className="flex-1 px-4 py-8 space-y-1.5 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-500 group relative overflow-hidden",
                isActive(item.path)
                  ? "bg-dark-orange text-white shadow-2xl shadow-dark-orange/20 scale-[1.02]"
                  : "text-cream/40 hover:bg-white/5 hover:text-cream/80"
              )}
            >
              <item.icon className={cn(
                "w-6 h-6 transition-transform duration-500 group-hover:scale-110 shrink-0",
                isActive(item.path) ? "text-white" : ""
              )} />
              <span className="font-black text-sm uppercase tracking-wider hidden lg:block italic">{item.label}</span>
              
              {item.badge !== undefined && item.badge > 0 && (
                <span className="absolute top-3 right-3 lg:static lg:ml-auto px-2 py-0.5 bg-white text-charcoal text-[10px] font-black rounded-lg">
                  {item.badge}
                </span>
              )}

              {isActive(item.path) && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-10 bg-white rounded-r-full hidden lg:block" />
              )}
            </Link>
          ))}
        </nav>

        <div className="p-6 border-t border-white/5 bg-black/20">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-rose-400 hover:bg-rose-500/10 transition-all group font-black uppercase text-xs tracking-widest italic"
          >
            <LogOut className="w-6 h-6 group-hover:rotate-12 transition-transform" />
            <span className="hidden lg:block">Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* Header - Mobile */}
      <header className="md:hidden fixed top-0 w-full bg-charcoal/95 backdrop-blur-xl border-b border-white/5 z-50">
        <div className="flex items-center justify-between px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-dark-orange rounded-xl flex items-center justify-center shadow-lg shadow-dark-orange/20">
              <LayoutGrid className="text-white w-6 h-6" />
            </div>
            <span className="text-xl font-black text-cream tracking-tighter uppercase italic">MANAGER</span>
          </div>
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2.5 rounded-xl bg-white/5 text-dark-orange transition-all active:scale-95 border border-white/5"
          >
            {isMobileMenuOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
          </button>
        </div>

        {/* Mobile Menu Overlay */}
        <div className={cn(
          "fixed inset-0 top-[84px] bg-charcoal transition-all duration-500 ease-in-out md:hidden z-50 overflow-y-auto",
          isMobileMenuOpen ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
        )}>
          <nav className="p-6 space-y-2">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={cn(
                  "flex items-center justify-between p-5 rounded-2xl transition-all border border-transparent",
                  isActive(item.path)
                    ? "bg-dark-orange text-white shadow-lg shadow-dark-orange/20 italic font-black"
                    : "text-cream/40 bg-white/5"
                )}
              >
                <div className="flex items-center gap-4">
                  <item.icon className="w-6 h-6" />
                  <span className="uppercase tracking-widest text-sm">{item.label}</span>
                </div>
                <div className="flex items-center gap-3">
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="px-2 py-0.5 bg-white text-charcoal text-[10px] font-black rounded-lg">
                      {item.badge}
                    </span>
                  )}
                  <ChevronRight className="w-5 h-5 opacity-20" />
                </div>
              </Link>
            ))}
            <button 
              onClick={handleLogout}
              className="w-full flex items-center gap-4 p-5 rounded-2xl text-rose-400 bg-rose-500/10 transition-all mt-6 font-black uppercase text-xs tracking-widest italic"
            >
              <LogOut className="w-6 h-6" />
              <span>Đăng xuất</span>
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="md:pl-20 lg:pl-72 pt-[84px] md:pt-0 min-h-screen">
        <div className="max-w-7xl mx-auto p-4 md:p-8 lg:p-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default ManagerLayout;
