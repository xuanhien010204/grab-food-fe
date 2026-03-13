import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  ChevronRight,
  Menu, 
  X
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { authStorage } from '../../../utils/auth';
import { chatApi } from '../../../api/api';
import { cn } from '../../../lib/utils';

const ManagerLayout = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [unreadChatCount, setUnreadChatCount] = useState(0);

    useEffect(() => {
        const fetchUnread = async () => {
            try {
                const res = await (chatApi as any).getUnreadCount({ silent: true });
                console.log('[DEBUG] ManagerLayout Unread Count:', res.data);
                
                // Robust extraction of count
                let count = 0;
                if (typeof res.data === 'number') count = res.data;
                else if (res.data && typeof res.data === 'object') {
                    count = res.data.count ?? res.data.unreadCount ?? res.data.result ?? 0;
                }
                
                setUnreadChatCount(count);
                // Also cache it to localStorage to survive refreshes like cartCount
                localStorage.setItem('managerUnreadChatCount', String(count));
            } catch (error) {
                console.error('Failed to fetch unread chat count', error);
            }
        };
        fetchUnread();

        // Listen for both event names just in case
        window.addEventListener('chatUpdate', fetchUnread);
        window.addEventListener('chatUnreadUpdate', fetchUnread);
        const interval = setInterval(fetchUnread, 10000); // 10s is better
        
        return () => {
            window.removeEventListener('chatUpdate', fetchUnread);
            window.removeEventListener('chatUnreadUpdate', fetchUnread);
            clearInterval(interval);
        };
    }, []);

    const navItems = [
        { label: 'Bảng điều khiển', to: '/manager' },
        { label: 'Đơn hàng', to: '/manager/orders' },
        { label: 'Thực đơn', to: '/manager/menu' },
        { label: 'Doanh thu', to: '/manager/analytics' },
        { label: 'Vouchers', to: '/manager/vouchers' },
        { label: 'Đánh giá', to: '/manager/reviews' },
        { label: 'Tin nhắn', to: '/manager/chat', badge: unreadChatCount || parseInt(localStorage.getItem('managerUnreadChatCount') || '0') },
        { label: 'Rút tiền', to: '/manager/withdraw' },
        { label: 'Hồ sơ cửa hàng', to: '/manager/store' },
        { label: 'Thông tin cá nhân', to: '/manager/profile' },
    ];

    const handleLogout = () => {
        authStorage.clear();
        navigate('/login');
    };

    const isActive = (path: string) => {
        if (path === '/manager') return location.pathname === '/manager';
        return location.pathname.startsWith(path);
    };

    const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

    return (
        <div className="min-h-screen bg-[#FDFCFB]">
            {/* Desktop Sidebar */}
            <aside className="fixed left-0 top-0 h-screen w-20 lg:w-64 bg-white border-r border-orange-100/50 hidden md:flex flex-col z-50">
                <div className="p-6 flex items-center gap-3">
                    {/* ICON REMOVED AS PER USER REQUEST */}
                    <div>
                        <span className="text-xl font-black text-charcoal tracking-tighter uppercase italic hidden lg:block leading-none">
                            Food<span className="text-[#C76E00]"> Delivery</span>
                        </span>
                        <span className="text-[9px] font-black text-[#C76E00]/60 uppercase tracking-[0.2em] hidden lg:block mt-1">
                            Manager Panel
                        </span>
                    </div>
                </div>

                <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto custom-scrollbar">
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
                                "font-bold text-sm hidden lg:block italic uppercase tracking-tight transition-all",
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
                        onClick={handleLogout}
                        className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-rose-500 hover:bg-rose-50 transition-colors group px-6"
                    >
                        <span className="font-bold text-sm hidden lg:block uppercase tracking-widest italic">Đăng xuất</span>
                    </button>
                </div>
            </aside>

            {/* Mobile Header */}
            <header className="md:hidden fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-orange-100/50 z-50 transition-all duration-300">
                <div className="flex items-center justify-between px-6 py-4">
                    <div className="flex items-center gap-2">
                            <span className="text-lg font-black text-charcoal tracking-tighter uppercase italic">
                                Food<span className="text-[#C76E00]"> Delivery</span>
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
                                <span className="font-black uppercase tracking-widest text-sm italic">{item.label}</span>
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
                            onClick={handleLogout}
                            className="w-full flex items-center justify-center p-4 rounded-2xl text-rose-500 hover:bg-rose-50 transition-colors mt-8 font-black uppercase text-xs tracking-widest italic border border-rose-100"
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
        </div>
    );
};

export default ManagerLayout;
