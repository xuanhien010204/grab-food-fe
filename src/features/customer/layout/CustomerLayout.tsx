import { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { 
  ChevronRight,
  Menu, 
  X
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { authStorage } from '../../../utils/auth';
import { chatApi } from '../../../api/api';

const CustomerLayout = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [cartCount, setCartCount] = useState(() => {
        const cached = localStorage.getItem('cartCount');
        return cached ? parseInt(cached) : 0;
    });
    const [chatUnread, setChatUnread] = useState(0);

    useEffect(() => {
        const token = authStorage.getToken();
        if (!token) return;

        const handleCartUpdate = (e: any) => {
            const count = e.detail?.count ?? 0;
            setCartCount(count);
            localStorage.setItem('cartCount', String(count));
        };

        window.addEventListener('cartUpdate', handleCartUpdate);
        return () => window.removeEventListener('cartUpdate', handleCartUpdate);
    }, []);

    useEffect(() => {
        const token = authStorage.getToken();
        if (!token) return;

        const fetchCounts = async () => {
            try {
                const [chatRes] = await Promise.all([
                    (chatApi as any).getUnreadCount({ silent: true })
                ]);
                
                let count = 0;
                const data = chatRes.data;
                if (typeof data === 'number') count = data;
                else if (data && typeof data === 'object') {
                    count = (data as any).count ?? (data as any).unreadCount ?? (data as any).result ?? 0;
                }
                
                setChatUnread(count);
                localStorage.setItem('customerUnreadChatCount', String(count));
            } catch (error) {
                console.error('Failed to fetch counts', error);
            }
        };

        const handleUnreadUpdate = () => {
            fetchCounts();
        };

        fetchCounts();
        const interval = setInterval(fetchCounts, 30000);
        window.addEventListener('chatUnreadUpdate', handleUnreadUpdate);
        return () => {
            clearInterval(interval);
            window.removeEventListener('chatUnreadUpdate', handleUnreadUpdate);
        };
    }, []);

    const isActive = (path: string) => path === '/'
        ? location.pathname === '/'
        : location.pathname.startsWith(path);

    const navItems = [
        { to: '/', label: 'Trang chủ' },
        { to: '/cart', label: 'Giỏ hàng', badge: cartCount },
        { to: '/chat', label: 'Nhắn tin', badge: chatUnread || parseInt(localStorage.getItem('customerUnreadChatCount') || '0') },
        { to: '/wallet', label: 'Ví tiền' },
        { to: '/orders', label: 'Đơn hàng' },
        { to: '/profile', label: 'Tài khoản' },
    ];

    const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

    return (
        <div className="min-h-screen bg-[#FDFCFB]">
            {/* Desktop Sidebar */}
            <aside className="fixed left-0 top-0 h-screen w-20 lg:w-64 bg-white border-r border-orange-100/50 hidden md:flex flex-col z-50">
                <div className="p-6">
                    <span className="text-xl font-black text-charcoal tracking-tighter uppercase italic hidden lg:block">
                        Food<span className="text-[#C76E00]"> Delivery</span>
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
                            <span className={cn(
                                "font-bold text-sm hidden lg:block transition-all",
                                isActive(item.to) ? "translate-x-1" : "group-hover:translate-x-1"
                            )}>{item.label}</span>
                            
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
                        className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-rose-500 hover:bg-rose-50 transition-colors group px-6"
                    >
                        <span className="font-bold text-sm hidden lg:block uppercase tracking-wider">Đăng xuất</span>
                    </button>
                </div>
            </aside>

            {/* Mobile Header */}
            <header className="md:hidden fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-orange-100/50 z-50 transition-all duration-300">
                <div className="flex items-center justify-between px-6 py-4">
                        <span className="text-lg font-black text-charcoal tracking-tighter uppercase italic">
                            Food<span className="text-[#C76E00]"> Delivery</span>
                        </span>
                    <button 
                        onClick={toggleMenu}
                        className="p-2 rounded-xl bg-orange-50 text-[#C76E00]"
                    >
                        {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </div>

                {/* Mobile Menu Overlay */}
                <div className={cn(
                    "fixed inset-0 top-[68px] bg-white transition-all duration-500 ease-in-out md:hidden z-50",
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
                                <span className="font-bold uppercase tracking-tight">{item.label}</span>
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
                            className="w-full flex items-center justify-center p-4 rounded-2xl text-rose-500 hover:bg-rose-50 transition-colors mt-8 font-black uppercase text-xs tracking-widest border border-rose-100"
                        >
                            <span>Đăng xuất</span>
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
                            <span className="text-[10px] font-black uppercase tracking-tight">{item.label}</span>
                        </div>
                        {item.badge !== undefined && item.badge > 0 && (
                            <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#C76E00] text-white text-[8px] font-black rounded-full flex items-center justify-center border-2 border-white">
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
