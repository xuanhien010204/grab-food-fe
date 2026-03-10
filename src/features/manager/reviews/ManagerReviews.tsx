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
                    <h1 className="text-3xl font-black tracking-tight text-charcoal dark:text-cream">Quản lý đánh giá</h1>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1">Phản hồi đánh giá từ khách hàng</p>
                </div>
                <div className="flex items-center gap-3">
                    <span className="bg-amber-50 dark:bg-amber-500/10 text-amber-600 px-4 py-2 rounded-2xl text-sm font-black border border-amber-200/50">⭐ {avgRating} / 5.0</span>
                    <span className="bg-dark-orange/10 text-dark-orange px-4 py-2 rounded-2xl text-sm font-black border border-dark-orange/20">{reviews.length} đánh giá</span>
                </div>
            </div>

            {/* Filter & Sort Bar */}
            <div className="flex flex-wrap gap-6 items-center bg-cream/40 dark:bg-charcoal rounded-[2rem] p-6 shadow-sm border border-dark-orange/10 dark:border-gray-800 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                   <Filter className="w-5 h-5 text-dark-orange/40" />
                   <span className="text-[10px] font-black text-charcoal/40 uppercase tracking-widest hidden sm:inline">Bộ lọc:</span>
                </div>
                <select
                    value={filterRating ?? ''}
                    onChange={e => setFilterRating(e.target.value ? Number(e.target.value) : null)}
                    className="px-5 py-3 rounded-2xl border border-dark-orange/10 bg-white/50 dark:bg-gray-900 text-sm font-bold text-charcoal dark:text-cream focus:ring-4 focus:ring-dark-orange/10 focus:border-dark-orange appearance-none cursor-pointer"
                >
                    <option value="">Tất cả mức sao</option>
                    {[5, 4, 3, 2, 1].map(n => <option key={n} value={n}>{n} sao</option>)}
                </select>
                <select
                    value={sortOrder}
                    onChange={e => setSortOrder(e.target.value as any)}
                    className="px-5 py-3 rounded-2xl border border-dark-orange/10 bg-white/50 dark:bg-gray-900 text-sm font-bold text-charcoal dark:text-cream focus:ring-4 focus:ring-dark-orange/10 focus:border-dark-orange appearance-none cursor-pointer"
                >
                    <option value="newest">Mới nhất trước</option>
                    <option value="oldest">Cũ nhất trước</option>
                    <option value="highest">Sao cao nhất</option>
                    <option value="lowest">Sao thấp nhất</option>
                </select>
                <span className="text-[10px] font-black text-charcoal/30 ml-auto uppercase tracking-tighter italic">{filteredReviews.length} trên tổng {reviews.length} đánh giá</span>
            </div>

            {isLoading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="bg-white dark:bg-[#2d1b15] rounded-xl h-28 animate-pulse shadow-sm" />
                    ))}
                </div>
            ) : reviews.length === 0 ? (
                <div className="text-center py-24 bg-cream/40 dark:bg-charcoal rounded-[3rem] border border-dark-orange/10">
                    <MessageCircle className="w-20 h-20 text-dark-orange/20 mx-auto mb-4 stroke-[1px]" />
                    <p className="text-charcoal/40 dark:text-cream/40 font-black uppercase tracking-[0.2em] italic">Chưa có đánh giá nào từ khách hàng.</p>
                </div>
            ) : (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    {filteredReviews.map(r => (
                        <div key={r.id} className="bg-cream/40 dark:bg-charcoal rounded-[2.5rem] border border-dark-orange/10 dark:border-gray-800 p-8 shadow-sm hover:shadow-xl hover:shadow-dark-orange/5 transition-all duration-500 group relative overflow-hidden">
                            <div className="absolute right-0 top-0 w-32 h-32 bg-dark-orange/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-dark-orange/10 transition-all"></div>
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-dark-orange/10 flex items-center justify-center text-dark-orange font-black shrink-0 border border-dark-orange/20">
                                    {(r.userName || r.user?.name || 'U').charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="font-black text-charcoal dark:text-cream leading-tight">{r.userName || r.user?.name || 'Khách hàng'}</span>
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
                                        <div className="mt-4 bg-emerald-50 dark:bg-emerald-500/5 border border-emerald-100 dark:border-emerald-500/20 rounded-2xl p-4 relative">
                                            <div className="absolute -top-3 left-4 bg-emerald-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter">Phản hồi của bạn</div>
                                            <p className="text-sm text-emerald-800 dark:text-emerald-200 font-medium leading-relaxed">{r.reply}</p>
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
