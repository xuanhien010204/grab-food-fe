import { useState, useEffect } from 'react';
import { Star, MessageCircle, Send, Trash2, Loader2, Filter } from 'lucide-react';
import { reviewApi, storeApi, userApi } from '../../../api/api';
import { toast } from 'sonner';
import { cn } from '../../../lib/utils';

export default function ManagerReviews() {
    const [reviews, setReviews] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [replyText, setReplyText] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [filterRating, setFilterRating] = useState<number | null>(null);
    const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'highest' | 'lowest'>('newest');

    useEffect(() => {
        const fetchReviews = async () => {
            try {
                // Get manager's own store
                const profileRes = await userApi.profile();
                const profile = profileRes.data as any;
                const storesRes = await storeApi.getAll();
                const stores = Array.isArray(storesRes.data) ? storesRes.data : [];
                const myStore = stores.find((s: any) => s.managerId === profile.id) || stores[0];
                if (myStore) {
                    const storeId = (myStore as any).id;
                    const reviewsRes = await reviewApi.getByStore(storeId);
                    setReviews(Array.isArray(reviewsRes.data) ? reviewsRes.data : []);
                }
            } catch {
                console.error('Failed to fetch reviews');
            } finally {
                setIsLoading(false);
            }
        };
        fetchReviews();
    }, []);

    const handleReply = async (reviewId: string) => {
        if (!replyText.trim()) return;
        setIsSending(true);
        try {
            await reviewApi.reply(reviewId, replyText.trim());
            toast.success('Đã gửi phản hồi');
            setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, reply: replyText.trim() } : r));
            setReplyingTo(null);
            setReplyText('');
        } catch {
            toast.error('Không thể gửi phản hồi');
        } finally {
            setIsSending(false);
        }
    };

    const handleDelete = async (reviewId: string) => {
        if (!confirm('Bạn có chắc muốn xoá đánh giá này?')) return;
        try {
            setDeletingId(reviewId);
            await reviewApi.delete(reviewId);
            setReviews(prev => prev.filter(r => r.id !== reviewId));
            toast.success('Đã xoá đánh giá');
        } catch {
            toast.error('Không thể xoá đánh giá');
        } finally {
            setDeletingId(null);
        }
    };

    // Filter and sort
    const filteredReviews = reviews
        .filter(r => filterRating === null || r.rating === filterRating)
        .sort((a, b) => {
            if (sortOrder === 'newest') return new Date(b.createdAt || b.date || 0).getTime() - new Date(a.createdAt || a.date || 0).getTime();
            if (sortOrder === 'oldest') return new Date(a.createdAt || a.date || 0).getTime() - new Date(b.createdAt || b.date || 0).getTime();
            if (sortOrder === 'highest') return (b.rating || 0) - (a.rating || 0);
            return (a.rating || 0) - (b.rating || 0);
        });

    const avgRating = reviews.length > 0 ? (reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length).toFixed(1) : '0';

    const renderStars = (rating: number) => (
        <div className="flex items-center gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className={cn("w-4 h-4", i < rating ? "fill-yellow-500 text-yellow-500" : "text-gray-300")} />
            ))}
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Quản lý đánh giá</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Phản hồi đánh giá từ khách hàng</p>
                </div>
                <div className="flex items-center gap-3">
                    <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-sm font-bold">⭐ {avgRating}</span>
                    <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm font-bold">{reviews.length} đánh giá</span>
                </div>
            </div>

            {/* Filter & Sort Bar */}
            <div className="flex flex-wrap gap-3 items-center bg-white dark:bg-[#2d1b15] rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-800">
                <Filter className="w-4 h-4 text-gray-400" />
                <select
                    value={filterRating ?? ''}
                    onChange={e => setFilterRating(e.target.value ? Number(e.target.value) : null)}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm dark:text-white focus:ring-2 focus:ring-orange-500"
                >
                    <option value="">Tất cả sao</option>
                    {[5, 4, 3, 2, 1].map(n => <option key={n} value={n}>{n} sao</option>)}
                </select>
                <select
                    value={sortOrder}
                    onChange={e => setSortOrder(e.target.value as any)}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm dark:text-white focus:ring-2 focus:ring-orange-500"
                >
                    <option value="newest">Mới nhất</option>
                    <option value="oldest">Cũ nhất</option>
                    <option value="highest">Sao cao nhất</option>
                    <option value="lowest">Sao thấp nhất</option>
                </select>
                <span className="text-xs text-gray-400 ml-auto">{filteredReviews.length}/{reviews.length} hiển thị</span>
            </div>

            {isLoading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="bg-white dark:bg-[#2d1b15] rounded-xl h-28 animate-pulse shadow-sm" />
                    ))}
                </div>
            ) : reviews.length === 0 ? (
                <div className="text-center py-16 bg-white dark:bg-[#2d1b15] rounded-xl shadow-sm">
                    <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">Chưa có đánh giá nào.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredReviews.map(r => (
                        <div key={r.id} className="bg-white dark:bg-[#2d1b15] rounded-xl border border-gray-200 dark:border-gray-800 p-5 shadow-sm">
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold shrink-0">
                                    {(r.userName || r.user?.name || 'U').charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="font-bold text-gray-900 dark:text-white">{r.userName || r.user?.name || 'Khách hàng'}</span>
                                        <div className="flex items-center gap-2">
                                            {renderStars(r.rating || 0)}
                                            <button
                                                onClick={() => handleDelete(r.id)}
                                                disabled={deletingId === r.id}
                                                className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                                title="Xoá đánh giá"
                                            >
                                                {deletingId === r.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">{r.comment || r.content}</p>
                                    {r.foodName && (
                                        <span className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-lg text-gray-500 dark:text-gray-400">
                                            🍽️ {r.foodName}
                                        </span>
                                    )}
                                    <p className="text-xs text-gray-400 mt-2">
                                        {new Date(r.createdAt || r.date || Date.now()).toLocaleDateString('vi-VN')}
                                    </p>

                                    {/* Existing reply */}
                                    {r.reply && (
                                        <div className="mt-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                                            <p className="text-xs font-bold text-green-700 dark:text-green-300 mb-1">💬 Phản hồi của bạn:</p>
                                            <p className="text-sm text-green-800 dark:text-green-200">{r.reply}</p>
                                        </div>
                                    )}

                                    {/* Reply form */}
                                    {!r.reply && (
                                        replyingTo === r.id ? (
                                            <div className="mt-3 flex gap-2">
                                                <input
                                                    type="text"
                                                    value={replyText}
                                                    onChange={e => setReplyText(e.target.value)}
                                                    placeholder="Nhập phản hồi..."
                                                    className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-gray-50 dark:bg-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:outline-none"
                                                    onKeyDown={e => e.key === 'Enter' && handleReply(r.id)}
                                                />
                                                <button
                                                    onClick={() => handleReply(r.id)}
                                                    disabled={isSending || !replyText.trim()}
                                                    className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-lg flex items-center gap-1 disabled:opacity-50 transition-colors"
                                                >
                                                    <Send className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => { setReplyingTo(null); setReplyText(''); }}
                                                    className="px-3 py-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => setReplyingTo(r.id)}
                                                className="mt-3 text-sm text-orange-600 font-bold hover:underline flex items-center gap-1"
                                            >
                                                <MessageCircle className="w-4 h-4" />
                                                Phản hồi
                                            </button>
                                        )
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
