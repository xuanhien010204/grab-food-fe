import { Outlet, Link, useLocation } from 'react-router-dom';
import { Home, ShoppingCart, Clock, UserCircle, Bell, MessageCircle } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { useEffect, useState } from 'react';
import { userApi, notificationApi, chatApi } from '../../../api/api';
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
    const [notifCount, setNotifCount] = useState(0);
    const [chatUnread, setChatUnread] = useState(0);

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

    useEffect(() => {
        const token = authStorage.getToken();
        if (!token) return;
        const fetchCount = () => {
            notificationApi.getUnreadCount()
                .then(res => {
                    const data = res.data as any;
                    setNotifCount(typeof data === 'number' ? data : (data?.count || data?.unreadCount || 0));
                })
                .catch(() => { });
        };
        fetchCount();
        const interval = setInterval(fetchCount, 60_000); // refresh every 60s
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const token = authStorage.getToken();
        if (!token) return;
        const fetchChatUnread = () => {
            chatApi.getUnreadCount()
                .then(res => {
                    const data = res.data as any;
                    setChatUnread(typeof data === 'number' ? data : (data?.count || data?.unreadCount || 0));
                })
                .catch(() => { });
        };
        fetchChatUnread();
        const interval = setInterval(fetchChatUnread, 30_000);
        return () => clearInterval(interval);
    }, []);

    const isActive = (path: string) => path === '/'
        ? location.pathname === '/'
        : location.pathname.startsWith(path);

    const navItems = [
        { to: '/', icon: Home, label: 'Trang chủ' },
        { to: '/cart', icon: ShoppingCart, label: 'Giỏ hàng', badge: cartCount },
        { to: '/chat', icon: MessageCircle, label: 'Chat', badge: chatUnread },
        { to: '/notifications', icon: Bell, label: 'Thông báo', badge: notifCount },
        { to: '/orders', icon: Clock, label: 'Đơn hàng' },
        { to: '/profile', icon: UserCircle, label: 'Tài khoản' },
    ];

    return (
        <div className="pb-20 min-h-screen bg-gray-50">
            <Outlet />

            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 h-16 flex items-center justify-around z-40 shadow-[0_-4px_24px_rgba(0,0,0,0.06)]">
                {navItems.map(({ to, icon: Icon, label, badge }) => {
                    const active = isActive(to);
                    return (
                        <Link
                            key={to}
                            to={to}
                            className={cn(
                                'flex flex-col items-center justify-center flex-1 h-full space-y-0.5 relative transition-colors',
                                active ? 'text-orange-500' : 'text-gray-400 hover:text-gray-600'
                            )}
                        >
                            <div className="relative">
                                <Icon className={cn('w-6 h-6 transition-transform', active && 'scale-110')} />
                                {badge != null && badge > 0 && (
                                    <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5 leading-none">
                                        {badge > 99 ? '99+' : badge}
                                    </span>
                                )}
                            </div>
                            <span className={cn('text-[10px] font-medium', active && 'font-bold')}>{label}</span>
                            {active && (
                                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-orange-500 rounded-t-full" />
                            )}
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
