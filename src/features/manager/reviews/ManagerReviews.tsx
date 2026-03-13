import { useState, useEffect } from 'react';
import { Star, MessageCircle, Send, Trash2, Loader2, Filter, ShoppingBag, User, Phone, MapPin, CreditCard, StickyNote, X, ChevronRight, RefreshCw, Clock } from 'lucide-react';
import { reviewApi, storeApi, userApi, orderApi } from '../../../api/api';
import { toast } from 'sonner';
import { cn } from '../../../lib/utils';
import type { OrderDto } from '../../../types/swagger';

export default function ManagerReviews() {
    const [reviews, setReviews] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [replyText, setReplyText] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [filterRating, setFilterRating] = useState<number | null>(null);
    const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'highest' | 'lowest'>('newest');

    // Order detail state
    const [selectedOrder, setSelectedOrder] = useState<OrderDto | null>(null);
    const [isLoadingOrderDetail, setIsLoadingOrderDetail] = useState(false);

    useEffect(() => {
        fetchReviews();
    }, []);

    const fetchReviews = async () => {
        setIsLoading(true);
        try {
            const profileRes = await userApi.profile();
            const profile = profileRes.data as any;
            const storesRes = await storeApi.getAll();
            const stores = Array.isArray(storesRes.data) ? storesRes.data : [];
            const myStore = stores.find((s: any) => s.managerId === profile.id) || stores[0];
            if (myStore) {
                const storeId = (myStore as any).id;
                const reviewsRes = await reviewApi.getByStore(storeId);
                const d = reviewsRes.data as any;
                const items = Array.isArray(d) ? d : (d?.reviews || d?.Reviews || d?.items || d?.Items || []);
                setReviews(items);
            }
        } catch {
            console.error('Failed to fetch reviews');
        } finally {
            setIsLoading(false);
        }
    };

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

    const viewOrderDetail = async (orderId: string) => {
        if (!orderId) return;
        setIsLoadingOrderDetail(true);
        try {
            const res = await orderApi.getById(orderId);
            setSelectedOrder(res.data);
        } catch {
            toast.error("Không thể tải chi tiết đơn hàng");
        } finally {
            setIsLoadingOrderDetail(false);
        }
    };

    // Filter and sort
    const filteredReviews = reviews
        .filter(r => filterRating === null || r.rating === filterRating)
        .sort((a, b) => {
            const dateB = new Date(b.createdAt || b.date || 0).getTime();
            const dateA = new Date(a.createdAt || a.date || 0).getTime();
            if (sortOrder === 'newest') return dateB - dateA;
            if (sortOrder === 'oldest') return dateA - dateB;
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
                                <div className="w-12 h-12 rounded-2xl bg-dark-orange/10 flex items-center justify-center text-dark-orange font-black shrink-0 border border-dark-orange/20 shadow-sm shadow-dark-orange/10">
                                    {(r.userName || r.user?.name || 'U').charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex flex-col">
                                            <span className="font-black text-charcoal dark:text-cream leading-tight">{r.userName || r.user?.name || 'Khách hàng'}</span>
                                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">
                                                {new Date(r.createdAt || r.date || Date.now()).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {renderStars(r.rating || 0)}
                                            <button
                                                onClick={() => handleDelete(r.id)}
                                                disabled={deletingId === r.id}
                                                className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                                                title="Xoá đánh giá"
                                            >
                                                {deletingId === r.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-4 bg-white/50 dark:bg-gray-800/20 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 italic font-medium leading-relaxed">
                                        "{r.comment || r.content || 'Không có nhận xét.'}"
                                    </p>

                                    <div className="flex flex-wrap gap-2 items-center mb-4">
                                        {r.foodName && (
                                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl text-[10px] font-black uppercase tracking-wider border border-emerald-100 dark:border-emerald-500/20 shadow-sm">
                                                <span>🍱</span> {r.foodName}
                                            </div>
                                        )}
                                        {r.orderId && (
                                            <button 
                                                onClick={() => viewOrderDetail(r.orderId)}
                                                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl text-[10px] font-black uppercase tracking-wider border border-blue-100 dark:border-blue-500/20 shadow-sm hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 transition-all active:scale-95 group/order"
                                            >
                                                <ShoppingBag className="w-3 h-3 group-hover/order:animate-bounce" /> Đơn: #{r.orderId.slice(-6).toUpperCase()}
                                            </button>
                                        )}
                                    </div>

                                    {/* Existing reply */}
                                    {r.reply && (
                                        <div className="mt-4 bg-emerald-50 dark:bg-emerald-500/5 border border-emerald-100 dark:border-emerald-500/20 rounded-[2rem] p-5 relative">
                                            <div className="absolute -top-3 left-6 bg-emerald-600 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter shadow-sm">Phản hồi của bạn</div>
                                            <p className="text-sm text-emerald-800 dark:text-emerald-200 font-medium leading-relaxed italic">"{r.reply}"</p>
                                        </div>
                                    )}

                                    {/* Reply form */}
                                    {!r.reply && (
                                        replyingTo === r.id ? (
                                            <div className="mt-4 flex gap-2 animate-in slide-in-from-top-2 duration-300">
                                                <input
                                                    type="text"
                                                    value={replyText}
                                                    onChange={e => setReplyText(e.target.value)}
                                                    placeholder="Gửi phản hồi cho khách hàng..."
                                                    className="flex-1 px-5 py-3 border border-dark-orange/20 dark:border-gray-700 rounded-2xl text-sm bg-white dark:bg-gray-900 dark:text-white focus:ring-4 focus:ring-dark-orange/10 focus:outline-none transition-all shadow-inner"
                                                    onKeyDown={e => e.key === 'Enter' && handleReply(r.id)}
                                                    autoFocus
                                                />
                                                <button
                                                    onClick={() => handleReply(r.id)}
                                                    disabled={isSending || !replyText.trim()}
                                                    className="px-6 bg-dark-orange hover:bg-amber-600 text-white font-black rounded-2xl flex items-center gap-2 disabled:opacity-50 transition-all active:scale-95 shadow-lg shadow-dark-orange/20"
                                                >
                                                    {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                                                </button>
                                                <button
                                                    onClick={() => { setReplyingTo(null); setReplyText(''); }}
                                                    className="p-3 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-2xl transition-all"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => setReplyingTo(r.id)}
                                                className="mt-4 px-6 py-2.5 bg-dark-orange/5 text-dark-orange border border-dark-orange/20 text-xs font-black uppercase tracking-widest rounded-xl hover:bg-dark-orange hover:text-white transition-all duration-300 flex items-center gap-2 active:scale-95 italic"
                                            >
                                                <MessageCircle className="w-4 h-4" />
                                                Gửi phản hồi nhà hàng
                                            </button>
                                        )
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ORDER DETAIL MODAL */}
            {selectedOrder && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setSelectedOrder(null)}>
                <div className="bg-white dark:bg-[#1a0f0d] w-full max-w-3xl rounded-[3rem] shadow-2xl overflow-hidden border border-dark-orange/10 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                    {/* Modal Header */}
                    <div className="p-8 bg-cream/30 dark:bg-gray-900/50 border-b border-dark-orange/10 flex justify-between items-center relative overflow-hidden">
                    <div className="absolute right-0 top-0 w-32 h-32 bg-dark-orange/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                    <div className="relative z-10">
                        <h2 className="text-3xl font-black text-charcoal dark:text-cream tracking-tighter italic uppercase">Chi tiết đơn hàng</h2>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-dark-orange font-black text-xs uppercase tracking-[0.2em] bg-dark-orange/10 px-2 py-0.5 rounded-lg border border-dark-orange/20">#{selectedOrder.id.toUpperCase()}</span>
                            <span className="text-charcoal/40 dark:text-cream/40 text-[10px] font-black uppercase tracking-[0.1em]">
                                {new Date(selectedOrder.purchaseDate).toLocaleString('vi-VN')}
                            </span>
                        </div>
                    </div>
                    <button 
                        onClick={() => setSelectedOrder(null)}
                        className="p-3 bg-gray-100 dark:bg-gray-800 hover:bg-rose-50 dark:hover:bg-rose-900/20 text-charcoal/60 dark:text-cream/60 hover:text-rose-500 rounded-2xl transition-all active:scale-95 relative z-10"
                    >
                        <X className="w-6 h-6" />
                    </button>
                    </div>

                    {/* Modal Body */}
                    <div className="p-8 overflow-y-auto space-y-8 custom-scrollbar relative bg-[#FDFCFB] dark:bg-[#1a0f0d]">
                    {isLoadingOrderDetail && (
                        <div className="absolute inset-0 z-10 bg-white/60 dark:bg-charcoal/60 backdrop-blur-[2px] flex items-center justify-center">
                        <div className="flex flex-col items-center gap-3">
                            <RefreshCw className="w-10 h-10 text-dark-orange animate-spin" />
                            <p className="text-sm font-black text-dark-orange uppercase tracking-widest">Đang tải chi tiết...</p>
                        </div>
                        </div>
                    )}
                    
                    {/* Info Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                        <div>
                            <p className="text-[10px] font-black text-charcoal/40 dark:text-cream/40 uppercase tracking-[0.2em] mb-4">Thông tin khách hàng</p>
                            <div className="flex items-center gap-4 bg-white dark:bg-gray-900/50 p-5 rounded-[2rem] border border-dark-orange/10 shadow-sm">
                            <div className="w-14 h-14 rounded-2xl bg-dark-orange/10 flex items-center justify-center shrink-0 border border-dark-orange/20">
                                <User className="w-7 h-7 text-dark-orange" />
                            </div>
                            <div className="min-w-0">
                                <p className="font-black text-charcoal dark:text-cream text-lg leading-tight truncate uppercase italic">{selectedOrder.recipientName || 'Khách hàng'}</p>
                                {selectedOrder.recipientPhone && (
                                <a href={`tel:${selectedOrder.recipientPhone}`} className="text-blue-500 font-extrabold text-xs mt-1.5 hover:underline flex items-center gap-2 uppercase tracking-wide">
                                    <Phone className="w-3.5 h-3.5" /> {selectedOrder.recipientPhone}
                                </a>
                                )}
                            </div>
                            </div>
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-charcoal/40 dark:text-cream/40 uppercase tracking-[0.2em] mb-4">Địa chỉ giao tới</p>
                            <div className="flex items-start gap-3 bg-white dark:bg-gray-900/50 p-5 rounded-[2rem] border border-dark-orange/10 shadow-sm">
                            <MapPin className="w-6 h-6 text-dark-orange shrink-0 mt-0.5 opacity-60" />
                            <p className="text-xs font-bold text-charcoal/80 dark:text-cream/80 leading-relaxed italic">"{selectedOrder.deliveryAddress}"</p>
                            </div>
                        </div>
                        </div>

                        <div className="space-y-6">
                        <p className="text-[10px] font-black text-charcoal/40 dark:text-cream/40 uppercase tracking-[0.2em] mb-4">Giao dịch & Ghi chú</p>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white dark:bg-gray-900 p-5 rounded-[2rem] border border-dark-orange/10 shadow-sm group hover:border-dark-orange/30 transition-all">
                            <p className="text-[9px] font-black text-dark-orange/60 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><CreditCard className="w-3 h-3" /> PTTT</p>
                            <p className="text-xs font-black text-charcoal dark:text-cream uppercase tracking-tighter truncate italic">
                                {selectedOrder.paymentMethodName || 'Tiền mặt'}
                            </p>
                            </div>
                            <div className="bg-white dark:bg-gray-900 p-5 rounded-[2rem] border border-dark-orange/10 shadow-sm group hover:border-dark-orange/30 transition-all">
                            <p className="text-[9px] font-black text-dark-orange/60 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><Clock className="w-3 h-3" /> Trạng thái</p>
                            <p className={`text-xs font-black uppercase tracking-tighter truncate italic ${selectedOrder.paymentStatus === 1 ? 'text-emerald-500' : 'text-amber-500'}`}>
                                {selectedOrder.paymentStatusName}
                            </p>
                            </div>
                        </div>
                        {selectedOrder.note && (
                            <div className="bg-amber-50/50 dark:bg-amber-900/5 border border-amber-200/50 dark:border-amber-900/20 p-5 rounded-[2rem] shadow-sm italic">
                            <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest mb-2 flex items-center gap-1.5"><StickyNote className="w-3 h-3" /> Lời nhắn</p>
                            <p className="text-xs font-bold text-amber-800 dark:text-amber-400 italic leading-relaxed">"{selectedOrder.note}"</p>
                            </div>
                        )}
                        </div>
                    </div>

                    {/* Items Table */}
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <p className="text-[10px] font-black text-charcoal/40 dark:text-cream/40 uppercase tracking-[0.2em]">Danh sách chi tiết ({selectedOrder.totalItems} món)</p>
                            <span className="text-[10px] font-black text-dark-orange uppercase tracking-widest bg-dark-orange/10 px-3 py-1 rounded-full border border-dark-orange/20">MÃ ĐƠN: {selectedOrder.id.slice(-6).toUpperCase()}</span>
                        </div>
                        <div className="bg-white dark:bg-gray-900 border border-dark-orange/5 dark:border-gray-800 rounded-[2.5rem] overflow-hidden shadow-xl shadow-dark-orange/[0.02]">
                        <table className="w-full text-left">
                            <thead className="bg-[#FFF8F0] dark:bg-gray-800/80 text-[10px] font-black text-charcoal/50 dark:text-cream/50 uppercase tracking-widest border-b border-dark-orange/5">
                            <tr>
                                <th className="px-8 py-5">Tên món & Quy cách</th>
                                <th className="px-8 py-5 text-center">SL</th>
                                <th className="px-8 py-5 text-right">Đơn giá</th>
                                <th className="px-8 py-5 text-right">Thành tiền</th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-dark-orange/[0.03] dark:divide-gray-800">
                            {selectedOrder.items?.map((item: any, idx: number) => (
                                <tr key={idx} className="group hover:bg-dark-orange/[0.02] dark:hover:bg-gray-800/40 transition-all">
                                <td className="px-8 py-5">
                                    <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-gray-50 dark:bg-gray-800 overflow-hidden shrink-0 border border-gray-100 dark:border-gray-700 p-0.5 group-hover:scale-110 transition-transform duration-500">
                                        {item.foodImage ? (
                                        <img src={item.foodImage} alt={item.foodName} className="w-full h-full object-cover rounded-[0.8rem]" />
                                        ) : (
                                        <div className="w-full h-full flex items-center justify-center text-xl grayscale opacity-30 mt-1">🥘</div>
                                        )
                                        }
                                    </div>
                                    <div>
                                        <p className="font-black text-charcoal dark:text-cream text-sm uppercase italic tracking-tight">{item.foodName}</p>
                                        <p className="text-[10px] font-bold text-charcoal/40 dark:text-cream/40 uppercase tracking-widest mt-0.5">{item.sizeName || 'Mặc định'}</p>
                                    </div>
                                    </div>
                                </td>
                                <td className="px-8 py-5 text-center">
                                    <span className="px-4 py-1.5 bg-gray-50 dark:bg-gray-800 text-charcoal dark:text-cream rounded-xl font-black text-sm border border-gray-100 dark:border-gray-700 shadow-inner">{item.quantity}</span>
                                </td>
                                <td className="px-8 py-5 text-right">
                                    <p className="text-sm font-bold text-charcoal/60 dark:text-cream/60 tabular-nums">₫{item.price.toLocaleString('vi-VN')}</p>
                                </td>
                                <td className="px-8 py-5 text-right">
                                    <p className="text-sm font-black text-dark-orange tabular-nums italic">₫{item.total.toLocaleString('vi-VN')}</p>
                                </td>
                                </tr>
                            ))}
                            </tbody>
                            <tfoot className="bg-[#FFF8F0]/30 dark:bg-gray-800/10 border-t border-dark-orange/10">
                            <tr>
                                <td colSpan={3} className="px-8 py-4 text-right text-[9px] font-black text-charcoal/40 dark:text-cream/40 uppercase tracking-widest italic">Tạm tính chi phí</td>
                                <td className="px-8 py-4 text-right font-black text-sm text-charcoal dark:text-cream tabular-nums">₫{(selectedOrder.subTotal || 0).toLocaleString('vi-VN')}</td>
                            </tr>
                            {(selectedOrder.deliveryFee || 0) > 0 && (
                                <tr>
                                <td colSpan={3} className="px-8 py-2 text-right text-[9px] font-black text-emerald-600/80 uppercase tracking-widest italic">Phí vận chuyển hàng</td>
                                <td className="px-8 py-2 text-right font-bold text-sm text-emerald-600 tabular-nums">+₫{selectedOrder.deliveryFee!.toLocaleString('vi-VN')}</td>
                                </tr>
                            )}
                            {(selectedOrder.discount || 0) > 0 && (
                                <tr>
                                <td colSpan={3} className="px-8 py-2 text-right text-[9px] font-black text-rose-500/80 uppercase tracking-widest italic">Ưu đãi giảm giá</td>
                                <td className="px-8 py-2 text-right font-bold text-sm text-rose-500 tabular-nums">-₫{selectedOrder.discount!.toLocaleString('vi-VN')}</td>
                                </tr>
                            )}
                            <tr className="bg-dark-orange/[0.04]">
                                <td colSpan={2} className="px-8 py-8 text-right text-sm font-black text-dark-orange uppercase tracking-tighter italic">Tổng hoá đơn thực nhận</td>
                                <td colSpan={2} className="px-8 py-8 text-right font-black text-4xl text-dark-orange tabular-nums tracking-tighter shadow-sm whitespace-nowrap">
                                ₫{(selectedOrder.total || 0).toLocaleString('vi-VN')}
                                </td>
                            </tr>
                            </tfoot>
                        </table>
                        </div>
                    </div>
                    </div>

                    {/* Modal Footer */}
                    <div className="p-8 border-t border-dark-orange/10 bg-white dark:bg-[#1a0f0d] flex justify-end">
                    <button 
                        onClick={() => setSelectedOrder(null)}
                        className="px-12 py-4 rounded-[1.5rem] font-black text-white bg-dark-orange hover:bg-amber-600 transition-all uppercase text-xs tracking-[0.2em] shadow-lg shadow-dark-orange/30 active:scale-95 flex items-center gap-2 group italic"
                    >
                        Xác nhận & Đóng <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                    </div>
                </div>
                </div>
            )}
        </div>
    );
}
