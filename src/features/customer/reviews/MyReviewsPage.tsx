import { useState, useEffect } from 'react';
import { ArrowLeft, Star, MessageSquare, Clock, Store, Trash2, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { reviewApi } from '../../../api/api';
import { Card } from '../../../components/ui/Card';
import { toast } from 'sonner';

export default function MyReviewsPage() {
    const [reviews, setReviews] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const fetchReviews = async () => {
        try {
            const res = await reviewApi.getMyReviews();
            // API returns { reviews: [], pageNumber, pageSize }
            const d = res.data as any;
            setReviews(Array.isArray(d) ? d : (d?.reviews || d?.Reviews || []));
        } catch (err) {
            console.error('Failed to fetch reviews:', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchReviews();
    }, []);

    const handleDelete = async (id: string) => {
        try {
            setDeletingId(id);
            await reviewApi.delete(id);
            toast.success('Đã xoá đánh giá');
            setReviews(prev => prev.filter(r => r.id !== id));
        } catch (err) {
            toast.error('Không thể xoá đánh giá');
        } finally {
            setDeletingId(null);
        }
    };

    const renderStars = (rating: number) => (
        <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((s) => (
                <Star
                    key={s}
                    className={`w-4 h-4 ${s <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`}
                />
            ))}
        </div>
    );

    return (
        <div className="pb-24 bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="bg-gradient-to-br from-yellow-500 via-orange-500 to-red-500 rounded-b-[2rem] shadow-xl p-6 pt-10 text-white">
                <div className="flex items-center gap-3 mb-2">
                    <Link to="/" className="bg-white/20 backdrop-blur-md p-2 rounded-full hover:bg-white/30 transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <h1 className="text-xl font-bold">Đánh giá của tôi</h1>
                </div>
                <p className="text-xs text-white/70 ml-12">Xem lại tất cả đánh giá bạn đã viết</p>
            </div>

            <div className="px-4 mt-6">
                <p className="text-sm text-gray-500 mb-4">{reviews.length} đánh giá</p>

                {isLoading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="bg-white rounded-xl h-32 animate-pulse shadow-sm" />
                        ))}
                    </div>
                ) : reviews.length === 0 ? (
                    <div className="text-center py-16">
                        <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 mb-1">Bạn chưa có đánh giá nào.</p>
                        <p className="text-xs text-gray-400">Hãy đặt hàng và chia sẻ trải nghiệm của bạn!</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {reviews.map((review) => (
                            <Card key={review.id} className="border-none shadow-sm rounded-2xl bg-white overflow-hidden">
                                <div className="p-4 space-y-3">
                                    {/* Store/Food info */}
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center shrink-0">
                                            <Store className="w-5 h-5 text-orange-500" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-bold text-gray-900 text-sm truncate">
                                                {review.storeName || review.foodName || review.food?.name || 'Đơn hàng'}
                                            </h3>
                                            <p className="text-[10px] text-gray-400 flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {new Date(review.createdAt || review.reviewDate || Date.now()).toLocaleDateString('vi-VN')}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Rating */}
                                    <div className="flex items-center gap-2">
                                        {renderStars(review.rating || review.star || 0)}
                                        <span className="text-xs text-gray-500 font-medium">
                                            ({review.rating || review.star || 0}/5)
                                        </span>
                                    </div>

                                    {/* Comment */}
                                    {(review.comment || review.content) && (
                                        <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 rounded-xl p-3 italic">
                                            "{review.comment || review.content}"
                                        </p>
                                    )}

                                    {/* Reply from store */}
                                    {review.reply && (
                                        <div className="ml-4 pl-3 border-l-2 border-orange-200">
                                            <p className="text-[10px] font-bold text-orange-500 uppercase tracking-wider mb-1">Phản hồi từ cửa hàng</p>
                                            <p className="text-xs text-gray-600 italic">"{review.reply}"</p>
                                        </div>
                                    )}

                                    {/* Delete button */}
                                    <div className="flex justify-end pt-2">
                                        <button
                                            onClick={() => handleDelete(String(review.id))}
                                            disabled={deletingId === String(review.id)}
                                            className="flex items-center gap-1 text-xs font-medium text-red-500 hover:text-red-600 transition-colors disabled:opacity-50"
                                        >
                                            {deletingId === String(review.id) ? (
                                                <Loader2 className="w-3 h-3 animate-spin" />
                                            ) : (
                                                <Trash2 className="w-3 h-3" />
                                            )}
                                            Xoá
                                        </button>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
