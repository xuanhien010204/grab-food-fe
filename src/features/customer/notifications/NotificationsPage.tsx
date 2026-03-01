import { useState, useEffect } from 'react';
import { ArrowLeft, Bell, BellOff, Check, CheckCheck, Trash2, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { notificationApi } from '../../../api/api';
import { Card } from '../../../components/ui/Card';
import { cn } from '../../../lib/utils';
import { Badge } from '../../../components/ui/Badge';

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchNotifications = async () => {
        try {
            setIsLoading(true);
            const res = await notificationApi.getAll();
            // API returns { notifications: [], unreadCount, pageNumber, pageSize }
            const d = res.data as any;
            setNotifications(Array.isArray(d) ? d : (d?.notifications || d?.Notifications || []));
        } catch {
            console.error('Failed to fetch notifications');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchNotifications(); }, []);

    const handleMarkRead = async (id: number) => {
        try {
            await notificationApi.markRead(id);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
        } catch { toast.error('Lỗi khi đánh dấu đã đọc'); }
    };

    const handleMarkAllRead = async () => {
        try {
            await notificationApi.markAllRead();
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            toast.success('Đã đánh dấu tất cả là đã đọc');
        } catch { toast.error('Lỗi'); }
    };

    const handleDelete = async (id: number) => {
        try {
            await notificationApi.delete(id);
            setNotifications(prev => prev.filter(n => n.id !== id));
            toast.success('Đã xoá');
        } catch { toast.error('Không thể xoá'); }
    };

    const unreadCount = notifications.filter(n => !n.isRead).length;

    return (
        <div className="pb-24 bg-gray-50 min-h-screen">
            <div className="bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 rounded-b-[2rem] shadow-xl p-6 pt-10 text-white">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                        <Link to="/" className="bg-white/20 backdrop-blur-md p-2 rounded-full hover:bg-white/30 transition-colors">
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <h1 className="text-xl font-bold">Thông báo</h1>
                    </div>
                    {unreadCount > 0 && (
                        <button
                            onClick={handleMarkAllRead}
                            className="bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full hover:bg-white/30 transition-colors text-xs font-medium flex items-center gap-1"
                        >
                            <CheckCheck className="w-3.5 h-3.5" />
                            Đọc tất cả
                        </button>
                    )}
                </div>
                <p className="text-xs text-white/70 ml-12">
                    {unreadCount > 0 ? `${unreadCount} thông báo chưa đọc` : 'Không có thông báo mới'}
                </p>
            </div>

            <div className="px-4 mt-6">
                {isLoading ? (
                    <div className="space-y-3">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="bg-white rounded-xl h-20 animate-pulse shadow-sm" />
                        ))}
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="text-center py-16">
                        <BellOff className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">Chưa có thông báo nào.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {notifications.map(n => (
                            <Card
                                key={n.id}
                                className={cn(
                                    "p-4 border-none shadow-sm rounded-2xl bg-white transition-all hover:shadow-md relative group",
                                    !n.isRead && "border-l-4 border-l-blue-500 bg-blue-50/30"
                                )}
                            >
                                <div className="flex items-start gap-3">
                                    <div className={cn(
                                        "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm",
                                        n.isRead ? "bg-gray-100 text-gray-400" : "bg-blue-100 text-blue-600"
                                    )}>
                                        <Bell className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className={cn("text-sm font-bold truncate", n.isRead ? "text-gray-600" : "text-gray-900")}>
                                            {n.title || 'Thông báo'}
                                        </h3>
                                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{n.message || n.content || n.body}</p>
                                        <p className="text-[10px] text-gray-400 mt-2 flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {new Date(n.createdAt || n.date || Date.now()).toLocaleString('vi-VN')}
                                        </p>
                                    </div>
                                    <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {!n.isRead && (
                                            <button onClick={() => handleMarkRead(n.id)} className="p-1 hover:bg-blue-100 rounded-lg" title="Đánh dấu đã đọc">
                                                <Check className="w-4 h-4 text-blue-500" />
                                            </button>
                                        )}
                                        <button onClick={() => handleDelete(n.id)} className="p-1 hover:bg-red-100 rounded-lg" title="Xoá">
                                            <Trash2 className="w-4 h-4 text-red-400" />
                                        </button>
                                    </div>
                                </div>
                                {!n.isRead && (
                                    <Badge className="absolute top-2 right-2 bg-blue-500 text-white text-[8px] px-1.5 py-0 h-4">MỚI</Badge>
                                )}
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
