import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, BellOff, Check, CheckCheck, Trash2, Clock, Loader2, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { notificationApi } from '../../../api/api';
import type { NotificationDto } from '../../../types/swagger';

const TYPE_ICONS: Record<number, { emoji: string; color: string; bg: string }> = {
    0: { emoji: '🔔', color: 'text-gray-600', bg: 'bg-gray-100' },           // System
    1: { emoji: '🛍️', color: 'text-blue-600', bg: 'bg-blue-100' },           // Order
    2: { emoji: '🎁', color: 'text-orange-600', bg: 'bg-orange-100' },        // Promotion
    3: { emoji: '💰', color: 'text-green-600', bg: 'bg-green-100' },          // Wallet
    4: { emoji: '⭐', color: 'text-yellow-600', bg: 'bg-yellow-100' },        // Review
    5: { emoji: '✨', color: 'text-purple-600', bg: 'bg-purple-100' },        // Feature
};

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState<NotificationDto[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [pageNumber, setPageNumber] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    const PAGE_SIZE = 20;

    const fetchNotifications = useCallback(async (page = 1, append = false) => {
        try {
            if (page === 1) setIsLoading(true);
            else setIsLoadingMore(true);

            const res = await notificationApi.getAll({ pageNumber: page, pageSize: PAGE_SIZE });
            const d = res.data as any;

            // Backend returns NotificationListResponse: { notifications[], unreadCount, pageNumber, pageSize }
            // Interceptor unwraps { result: NotificationListResponse } → d IS NotificationListResponse
            let items: NotificationDto[] = [];
            if (Array.isArray(d)) {
                items = d;
            } else if (Array.isArray(d?.notifications)) {
                items = d.notifications;
                setUnreadCount(d.unreadCount ?? 0);
                // If returned less than page size, no more pages
                setHasMore(items.length === PAGE_SIZE);
            }

            setNotifications(prev => append ? [...prev, ...items] : items);
            setPageNumber(page);
        } catch (err) {
            console.error('Failed to fetch notifications', err);
            if (page === 1) toast.error('Không thể tải thông báo');
        } finally {
            setIsLoading(false);
            setIsLoadingMore(false);
        }
    }, []);

    useEffect(() => { fetchNotifications(1); }, [fetchNotifications]);

    const handleMarkRead = async (id: string) => {
        try {
            await notificationApi.markRead(id);      // PUT /api/notifications/{id}/read
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
            setUnreadCount(c => Math.max(0, c - 1));
        } catch {
            toast.error('Không thể đánh dấu đã đọc');
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await notificationApi.markAllRead();     // PUT /api/notifications/read-all
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
            toast.success('Đã đánh dấu tất cả là đã đọc');
        } catch {
            toast.error('Lỗi khi đánh dấu tất cả đã đọc');
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await notificationApi.delete(id);        // DELETE /api/notifications/{id}
            setNotifications(prev => {
                const removed = prev.find(n => n.id === id);
                if (removed && !removed.isRead) setUnreadCount(c => Math.max(0, c - 1));
                return prev.filter(n => n.id !== id);
            });
            toast.success('Đã xoá thông báo');
        } catch {
            toast.error('Không thể xoá thông báo');
        }
    };

    const handleLoadMore = () => fetchNotifications(pageNumber + 1, true);

    const getTypeStyle = (type: number) => TYPE_ICONS[type] ?? TYPE_ICONS[0];

    const formatTime = (dateStr: string | undefined, timeAgo: string | undefined) => {
        if (timeAgo) return timeAgo;
        if (!dateStr) return '';
        try {
            return new Date(dateStr).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' });
        } catch { return ''; }
    };

    return (
        <div className="pb-24 bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="bg-gradient-to-br from-orange-500 via-orange-600 to-red-500 rounded-b-[2rem] shadow-xl p-6 pt-10 text-white">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                        <Link to="/" className="bg-white/20 backdrop-blur-md p-2 rounded-full hover:bg-white/30 transition-colors">
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <h1 className="text-xl font-bold">Thông báo</h1>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => fetchNotifications(1)}
                            className="bg-white/20 backdrop-blur-md p-2 rounded-full hover:bg-white/30 transition-colors"
                            title="Làm mới"
                        >
                            <RefreshCw className="w-4 h-4" />
                        </button>
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
                </div>
                <p className="text-xs text-white/75 ml-12">
                    {unreadCount > 0 ? `${unreadCount} thông báo chưa đọc` : 'Không có thông báo mới'}
                </p>
            </div>

            {/* Notification List */}
            <div className="px-4 mt-5 space-y-3">
                {isLoading ? (
                    <div className="space-y-3">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="bg-white rounded-2xl h-24 animate-pulse shadow-sm" />
                        ))}
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="text-center py-20">
                        <BellOff className="w-14 h-14 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 font-medium">Chưa có thông báo nào</p>
                        <p className="text-gray-400 text-sm mt-1">Các thông báo mới sẽ hiển thị ở đây</p>
                    </div>
                ) : (
                    <>
                        {notifications.map(n => {
                            const style = getTypeStyle(n.type);
                            return (
                                <div
                                    key={n.id}
                                    className={`relative bg-white rounded-2xl shadow-sm p-4 flex items-start gap-3 group transition-all hover:shadow-md ${!n.isRead ? 'border-l-4 border-l-orange-500' : ''}`}
                                >
                                    {/* Type Icon */}
                                    <div className={`w-11 h-11 flex-shrink-0 rounded-xl ${style.bg} flex items-center justify-center text-xl`}>
                                        {style.emoji}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0 pr-2">
                                        <h3 className={`text-sm font-bold leading-tight ${n.isRead ? 'text-gray-600' : 'text-gray-900'}`}>
                                            {n.title || 'Thông báo'}
                                        </h3>
                                        <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                                            {n.content}
                                        </p>
                                        <p className="text-[10px] text-gray-400 mt-2 flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {formatTime(n.createdAt, n.timeAgo)}
                                        </p>
                                    </div>

                                    {!n.isRead && (
                                        <span className="absolute top-3 right-3 w-2 h-2 bg-orange-500 rounded-full" />
                                    )}

                                    {/* Hover Actions */}
                                    <div className="absolute top-3 right-5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white rounded-lg shadow-sm border border-gray-100 p-1">
                                        {!n.isRead && (
                                            <button
                                                onClick={() => handleMarkRead(n.id)}
                                                className="p-1 hover:bg-blue-50 rounded-lg"
                                                title="Đánh dấu đã đọc"
                                            >
                                                <Check className="w-4 h-4 text-blue-500" />
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleDelete(n.id)}
                                            className="p-1 hover:bg-red-50 rounded-lg"
                                            title="Xoá thông báo"
                                        >
                                            <Trash2 className="w-4 h-4 text-red-400" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}

                        {/* Load More */}
                        {hasMore && (
                            <button
                                onClick={handleLoadMore}
                                disabled={isLoadingMore}
                                className="w-full py-3 text-sm font-medium text-orange-600 hover:text-orange-700 flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {isLoadingMore ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                                {isLoadingMore ? 'Đang tải...' : 'Tải thêm thông báo'}
                            </button>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
