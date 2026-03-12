import { Outlet, Link, useLocation } from 'react-router-dom';
import { Home, ShoppingCart, Wallet, Clock, UserCircle } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { useEffect, useState } from 'react';
import { userApi } from '../../../api/api';
import { authStorage } from '../../../utils/auth';

function countCartItems(orderList: Record<string, any>): number {
    return Object.values(orderList).reduce((acc: number, item: any) => acc + (item.quantity || 0), 0);
}

export default function CustomerLayout() {
    const location = useLocation();
    const [cartCount, setCartCount] = useState(() => {
        const cached = localStorage.getItem('cartCount');
        return cached ? parseInt(cached) : 0;
    });

    useEffect(() => {
        const token = authStorage.getToken();
        if (!token) return;
        userApi.getCart()
            .then(res => {
                const orderList = (res.data as any)?.orderList || {};
                const count = countCartItems(orderList);
                setCartCount(count);
                localStorage.setItem('cartCount', String(count));
            })
            .catch(() => { });
    }, []);

    useEffect(() => {
        const handleCartUpdate = () => {
            const cached = localStorage.getItem('cartCount');
            setCartCount(cached ? parseInt(cached) : 0);
        };
        window.addEventListener('cartUpdate', handleCartUpdate);
        return () => window.removeEventListener('cartUpdate', handleCartUpdate);
    }, []);

    const isActive = (path: string) => path === '/'
        ? location.pathname === '/'
        : location.pathname.startsWith(path);

    const navItems = [
        { to: '/', icon: Home, label: 'Trang chủ' },
        { to: '/cart', icon: ShoppingCart, label: 'Giỏ hàng', badge: cartCount },
        { to: '/wallet', icon: Wallet, label: 'Ví' },
        { to: '/orders', icon: Clock, label: 'Đơn hàng' },
        { to: '/profile', icon: UserCircle, label: 'Tài khoản' },
    ];

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* WEB HEADER - Force Brand Color */}
            <header className="bg-[#C76E00] sticky top-0 z-50 shadow-lg">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
                    <Link to="/" className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-md">
                            <ShoppingCart className="w-5 h-5 text-[#C76E00]" />
                        </div>
                        <span className="text-lg sm:text-xl font-black tracking-tighter text-white">FoodDelivery</span>
                    </Link>

                    <nav className="hidden md:flex items-center space-x-6">
                        {navItems.map(({ to, icon: Icon, label, badge }) => (
                            <Link
                                key={to}
                                to={to}
                                className={cn(
                                    "flex items-center space-x-1.5 text-xs font-bold transition-all hover:text-white",
                                    isActive(to) ? "text-white scale-105" : "text-white/70"
                                )}
                            >
                                <div className="relative">
                                    <Icon className="w-4 h-4" />
                                    {badge != null && badge > 0 && (
                                        <span className="absolute -top-1.5 -right-1.5 min-w-[14px] h-3.5 bg-red-600 text-white text-[8px] font-bold rounded-full flex items-center justify-center px-0.5 border border-[#C76E00]">
                                            {badge}
                                        </span>
                                    )}
                                </div>
                                <span>{label}</span>
                            </Link>
                        ))}
                    </nav>

                    <div className="flex items-center space-x-3">
                        <Link to="/cart" className="relative p-1.5 text-white/70 hover:text-white transition-colors">
                            <ShoppingCart className="w-5 h-5" />
                            {cartCount > 0 && (
                                <span className="absolute top-0 right-0 w-4 h-4 bg-red-600 text-white text-[8px] font-bold rounded-full flex items-center justify-center border border-[#C76E00] shadow-sm">
                                    {cartCount}
                                </span>
                            )}
                        </Link>
                        <Link to="/profile" className="hidden sm:flex items-center space-x-2 p-1 pl-2 bg-white/10 rounded-full border border-white/20 hover:bg-white/20 transition-all">
                            <span className="text-[10px] font-bold text-white">Tài khoản</span>
                            <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-sm">
                                <UserCircle className="w-4 h-4 text-[#C76E00]" />
                            </div>
                        </Link>
                    </div>
                </div>
            </header>

            {/* MAIN CONTENT */}
            <main className="flex-1">
                <Outlet />
            </main>

            {/* WEB FOOTER - Brand Colored */}
            <footer className="bg-[#C76E00] pt-12 pb-8 text-white/80">
                <div className="max-w-7xl mx-auto px-4 sm:px-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                        <div className="space-y-4">
                            <div className="flex items-center space-x-2">
                                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-lg">
                                    <ShoppingCart className="w-5 h-5 text-[#C76E00]" />
                                </div>
                                <span className="text-xl font-black tracking-tighter text-white">FoodDelivery</span>
                            </div>
                            <p className="text-sm font-medium leading-relaxed text-white/90">
                                Nền tảng đặt thức ăn hàng đầu, mang đến những bữa ăn ngon tận tay bạn nhanh chóng và an toàn.
                            </p>
                        </div>
                        <div>
                            <h4 className="font-black text-white mb-6 uppercase text-xs tracking-widest">Khám phá</h4>
                            <ul className="space-y-4 text-sm font-bold">
                                <li><Link to="/stores" className="text-white hover:text-white/70 transition-colors">Cửa hàng gần đây</Link></li>
                                <li><Link to="/favorites" className="text-white hover:text-white/70 transition-colors">Món yêu thích</Link></li>
                                <li><Link to="/orders" className="text-white hover:text-white/70 transition-colors">Theo dõi đơn hàng</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-black text-white mb-6 uppercase text-xs tracking-widest">Hỗ trợ</h4>
                            <ul className="space-y-4 text-sm font-bold">
                                <li className="text-white hover:text-white/70 cursor-pointer transition-colors">Trung tâm trợ giúp</li>
                                <li className="text-white hover:text-white/70 cursor-pointer transition-colors">Câu hỏi thường gặp</li>
                                <li className="text-white hover:text-white/70 cursor-pointer transition-colors">Liên hệ chúng tôi</li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-black text-white mb-6 uppercase text-xs tracking-widest">Tải ứng dụng</h4>
                            <div className="space-y-3">
                                <div className="bg-white/10 text-white px-4 py-2 rounded-xl flex items-center space-x-3 cursor-pointer hover:bg-white/20 transition-colors border border-white/20">
                                    <div className="w-6 h-6 bg-white rounded flex items-center justify-center font-black text-[#C76E00]">A</div>
                                    <div className="leading-none">
                                        <p className="text-[10px] font-bold opacity-70">Available on</p>
                                        <p className="font-black">App Store</p>
                                    </div>
                                </div>
                                <div className="bg-white/10 text-white px-4 py-2 rounded-xl flex items-center space-x-3 cursor-pointer hover:bg-white/20 transition-colors border border-white/20">
                                    <div className="w-6 h-6 bg-white rounded flex items-center justify-center font-black text-[#C76E00]">G</div>
                                    <div className="leading-none">
                                        <p className="text-[10px] font-bold opacity-70">Get it on</p>
                                        <p className="font-black">Google Play</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
                        <p className="text-[10px] font-bold uppercase tracking-widest opacity-60 text-white">
                            © 2026 FOODDELIVERY. ALL RIGHTS RESERVED.
                        </p>
                        <div className="flex space-x-6 text-[10px] font-black tracking-widest uppercase opacity-60">
                            <span className="text-white hover:text-white/70 cursor-pointer transition-colors">Security</span>
                            <span className="text-white hover:text-white/70 cursor-pointer transition-colors">Privacy Policy</span>
                            <span className="text-white hover:text-white/70 cursor-pointer transition-colors">Terms of Service</span>
                        </div>
                    </div>
                </div>
            </footer>

            {/* MOBILE NAVIGATION - Bottom stick */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 bg-brand border-t border-brand/20 h-16 flex items-center justify-around z-50 shadow-[0_-4px_12px_rgba(0,0,0,0.1)]">
                {navItems.map(({ to, icon: Icon, label, badge }) => {
                    const active = isActive(to);
                    return (
                        <Link
                            key={to}
                            to={to}
                            className={cn(
                                'flex flex-col items-center justify-center flex-1 h-full space-y-0.5 relative transition-colors',
                                active ? 'text-white' : 'text-white/60'
                            )}
                        >
                            <div className="relative">
                                <Icon className={cn('w-6 h-6 transition-transform', active && 'scale-110')} />
                                {badge != null && badge > 0 && (
                                    <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5 border border-brand">
                                        {badge}
                                    </span>
                                )}
                            </div>
                            <span className={cn('text-[9px] font-bold uppercase tracking-tighter', active && 'text-white')}>{label}</span>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
