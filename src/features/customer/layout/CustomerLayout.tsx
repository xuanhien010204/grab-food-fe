import { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { 
  Home, 
  ShoppingCart, 
  UserCircle, 
  Clock, 
  ChevronRight, 
  Menu, 
  X, 
  LayoutGrid, 
  History, 
  Wallet,
  MessageCircle,
  Bell
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { authStorage } from '../../../utils/auth';
import { notificationApi, chatApi } from '../../../api/api';

const CustomerLayout = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [cartCount, setCartCount] = useState(() => {
        const cached = localStorage.getItem('cartCount');
        return cached ? parseInt(cached) : 0;
    });
    const [notifCount, setNotifCount] = useState(0);
    const [chatUnread, setChatUnread] = useState(0);

    useEffect(() => {
        const token = authStorage.getToken();
        if (!token) return;

        const handleCartUpdate = (e: any) => {
            setCartCount(e.detail.count);
        };

        window.addEventListener('cartUpdate', handleCartUpdate);
        return () => window.removeEventListener('cartUpdate', handleCartUpdate);
    }, []);

    useEffect(() => {
        const token = authStorage.getToken();
        if (!token) return;

        const fetchCounts = async () => {
            try {
                const [notifRes, chatRes] = await Promise.all([
                    notificationApi.getUnreadCount(),
                    chatApi.getUnreadCount()
                ]);
                setNotifCount(notifRes.data);
                setChatUnread(chatRes.data);
            } catch (error) {
                console.error('Failed to fetch counts', error);
            }
        };

        fetchCounts();
        const interval = setInterval(fetchCounts, 30000);
        return () => clearInterval(interval);
    }, []);

    const isActive = (path: string) => path === '/'
        ? location.pathname === '/'
        : location.pathname.startsWith(path);

    const navItems = [
        { to: '/', icon: Home, label: 'Trang chủ' },
        { to: '/cart', icon: ShoppingCart, label: 'Giỏ hàng', badge: cartCount },
        { to: '/chat', icon: MessageCircle, label: 'Nhắn tin', badge: chatUnread },
        { to: '/notifications', icon: Bell, label: 'Thông báo', badge: notifCount },
        { to: '/wallet', icon: Wallet, label: 'Ví tiền' },
        { to: '/orders', icon: Clock, label: 'Đơn hàng' },
        { to: '/profile', icon: UserCircle, label: 'Tài khoản' },
    ];

    const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

    return (
        <div className="min-h-screen bg-[#FDFCFB]">
            {/* Desktop Sidebar */}
            <aside className="fixed left-0 top-0 h-screen w-20 lg:w-64 bg-white border-r border-orange-100/50 hidden md:flex flex-col z-50">
                <div className="p-6 flex items-center justify-center lg:justify-start gap-3">
                    <div className="w-10 h-10 bg-[#C76E00] rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20">
                        <LayoutGrid className="text-white w-6 h-6" />
                    </div>
                    <span className="text-xl font-black text-charcoal tracking-tighter uppercase italic hidden lg:block">
                        Grab<span className="text-[#C76E00]">Food</span>
                    </span>
                </div>

                <nav className="flex-1 px-4 py-6 space-y-2">
                    {navItems.map((item) => (
                        <Link
                            key={item.to}
                            to={item.to}
                            className={cn(
                                "flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 group relative",
                                isActive(item.to)
                                    ? "bg-[#FFF7ED] text-[#C76E00] shadow-sm shadow-orange-100"
                                    : "text-charcoal/40 hover:bg-orange-50/50 hover:text-charcoal/60"
                            )}
                        >
                            <item.icon className={cn(
                                "w-6 h-6 transition-transform duration-300 group-hover:scale-110",
                                isActive(item.to) ? "text-[#C76E00]" : ""
                            )} />
                            <span className="font-bold text-sm hidden lg:block">{item.label}</span>
                            
                            {item.badge !== undefined && item.badge > 0 && (
                                <span className="absolute top-2 right-2 lg:right-4 w-5 h-5 bg-[#C76E00] text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white lg:static lg:ml-auto">
                                    {item.badge}
                                </span>
                            )}

                            {isActive(item.to) && (
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-[#C76E00] rounded-r-full hidden lg:block" />
                            )}
                        </Link>
                    ))}
                </nav>

                <div className="p-4 border-t border-orange-100/30">
                    <button 
                        onClick={() => {
                            authStorage.clear();
                            navigate('/login');
                        }}
                        className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-rose-500 hover:bg-rose-50 transition-colors group"
                    >
                        <History className="w-6 h-6 group-hover:rotate-12 transition-transform" />
                        <span className="font-bold text-sm hidden lg:block">Đăng xuất</span>
                    </button>
                </div>
            </aside>

            {/* Mobile Header */}
            <header className="md:hidden fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-orange-100/50 z-50 transition-all duration-300">
                <div className="flex items-center justify-between px-6 py-4">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-[#C76E00] rounded-lg flex items-center justify-center shadow-lg shadow-orange-500/20">
                            <LayoutGrid className="text-white w-5 h-5" />
                        </div>
                        <span className="text-lg font-black text-charcoal tracking-tighter uppercase italic">
                            Grab<span className="text-[#C76E00]">Food</span>
                        </span>
                    </div>
                    <button 
                        onClick={toggleMenu}
                        className="p-2 rounded-xl bg-orange-50 text-[#C76E00]"
                    >
                        {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </div>

                {/* Mobile Menu Overlay */}
                <div className={cn(
                    "fixed inset-0 top-[68px] bg-white transition-all duration-500 ease-in-out md:hidden",
                    isMenuOpen ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
                )}>
                    <nav className="p-6 space-y-4">
                        {navItems.map((item) => (
                            <Link
                                key={item.to}
                                to={item.to}
                                onClick={() => setIsMenuOpen(false)}
                                className={cn(
                                    "flex items-center justify-between p-4 rounded-2xl transition-all",
                                    isActive(item.to)
                                        ? "bg-[#FFF7ED] text-[#C76E00]"
                                        : "text-charcoal/40 hover:bg-orange-50/50"
                                )}
                            >
                                <div className="flex items-center gap-4">
                                    <item.icon className="w-6 h-6" />
                                    <span className="font-bold">{item.label}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    {item.badge !== undefined && item.badge > 0 && (
                                        <span className="px-2 py-0.5 bg-[#C76E00] text-white text-[10px] font-black rounded-lg">
                                            {item.badge}
                                        </span>
                                    )}
                                    <ChevronRight className="w-5 h-5 opacity-30" />
                                </div>
                            </Link>
                        ))}
                        <button 
                            onClick={() => {
                                authStorage.clear();
                                navigate('/login');
                            }}
                            className="w-full flex items-center gap-4 p-4 rounded-2xl text-rose-500 hover:bg-rose-50 transition-colors mt-8"
                        >
                            <History className="w-6 h-6" />
                            <span className="font-bold">Đăng xuất</span>
                        </button>
                    </nav>
                </div>
            </header>

            {/* Main Content */}
            <main className="md:pl-20 lg:pl-64 pt-[68px] md:pt-0 min-h-screen">
                <div className="max-w-7xl mx-auto p-4 md:p-8 lg:p-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <Outlet />
                </div>
            </main>

            {/* Mobile Bottom Nav */}
            <nav className="md:hidden fixed bottom-0 w-full bg-white/95 backdrop-blur-lg border-t border-orange-100/50 px-6 py-3 pb-6 flex justify-between items-center z-50">
                {navItems.filter(item => ['/', '/cart', '/chat', '/profile'].includes(item.to)).map((item) => (
                    <Link
                        key={item.to}
                        to={item.to}
                        className={cn(
                            "flex flex-col items-center gap-1 relative",
                            isActive(item.to) ? "text-[#C76E00]" : "text-charcoal/30"
                        )}
                    >
                        <div className={cn(
                            "p-2 rounded-xl transition-all",
                            isActive(item.to) ? "bg-[#FFF7ED] shadow-sm shadow-orange-100 -translate-y-1" : ""
                        )}>
                            <item.icon className="w-6 h-6" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest">{item.label}</span>
                        {item.badge !== undefined && item.badge > 0 && (
                            <span className="absolute top-0 right-0 w-4 h-4 bg-[#C76E00] text-white text-[8px] font-black rounded-full flex items-center justify-center border-2 border-white">
                                {item.badge}
                            </span>
                        )}
                    </Link>
                ))}
            </nav>
        </div>
    );
};

export default CustomerLayout;
