import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  ChevronRight,
  Menu, 
  X
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { authStorage } from '../../../utils/auth';
import { userApi, adminApi } from '../../../api/api';

export default function AdminLayout() {
    const location = useLocation();
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [pendingStoreCount, setPendingStoreCount] = useState(0);
    const [pendingWithdrawalCount, setPendingWithdrawalCount] = useState(0);

    useEffect(() => {
        adminApi.getPendingStores()
            .then(res => {
                const data = Array.isArray(res.data) ? res.data : [];
                setPendingStoreCount(data.length);
            })
            .catch(() => { });
        
        try {
            const reqs = JSON.parse(localStorage.getItem('withdrawal_requests') || '[]');
            setPendingWithdrawalCount(reqs.filter((r: any) => r.status === 'pending').length);
        } catch { }
    }, [location.pathname]);

    const navItems = [
        { label: 'Bảng điều khiển', to: '/admin/dashboard' },
        { label: 'Quản lý cửa hàng', to: '/admin/stores', badge: pendingStoreCount },
        { label: 'Quản lý loại thực phẩm', to: '/admin/categories' },
        { label: 'Quản lý voucher', to: '/admin/vouchers' },
        { label: 'Lịch sử giao dịch', to: '/admin/transactions' },
        { label: 'Rút tiền Manager', to: '/admin/withdrawals', badge: pendingWithdrawalCount },
    ];

    const handleLogout = async () => {
        try { await userApi.signOut(); } catch { }
        authStorage.clear();
        localStorage.removeItem('bypass_user');
        navigate('/login', { replace: true });
    };

    const isActive = (path: string) => {
        if (path === '/admin') return location.pathname === '/admin/dashboard';
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
                            Admin Portal
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
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-rose-500 bg-rose-50 hover:bg-rose-100 border border-rose-100 rounded-xl font-bold text-sm transition-all active:scale-[0.98] uppercase tracking-wider"
                    >
                        Đăng xuất
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
                        className="w-full flex items-center justify-center p-4 rounded-2xl text-rose-500 bg-rose-50 hover:bg-rose-100 border border-rose-100 rounded-xl font-bold text-sm transition-all active:scale-[0.98] uppercase tracking-widest italic"
                    >
                        Đăng xuất
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
}