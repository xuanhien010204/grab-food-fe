import { ArrowLeft, MapPin, Package2, Clock, Phone, Store, Receipt, CheckCircle2, XCircle, Star, MessageSquare, Loader2 } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { orderApi, reviewApi } from '../../../api/api';
import { cn } from '../../../lib/utils';

const STATUS_STEPS = [
    { label: 'Chờ xử lý', icon: Clock },
    { label: 'Đã xác nhận', icon: CheckCircle2 },
    { label: 'Đang chuẩn bị', icon: Store },
    { label: 'Đang giao', icon: Package2 },
    { label: 'Đã giao', icon: CheckCircle2 },
    { label: 'Hoàn thành', icon: CheckCircle2 }
];

export default function OrderDetailPage() {
    const navigate = useNavigate();
    const { id } = useParams();
    const [order, setOrder] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isCancelling, setIsCancelling] = useState(false);
    const [showCancelConfirm, setShowCancelConfirm] = useState(false);
    const [cancelReason, setCancelReason] = useState('');
    const [canReviewOrder, setCanReviewOrder] = useState(false);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [reviewRating, setReviewRating] = useState(5);
    const [reviewComment, setReviewComment] = useState('');
    const [isSubmittingReview, setIsSubmittingReview] = useState(false);

    const fetchOrder = async () => {
        if (!id) return;
        try {
            const res = await orderApi.getById(id);
            setOrder(res.data);
        } catch (error) {
            console.error(error);
            toast.error("Không thể tải chi tiết đơn hàng");
            navigate('/orders');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchOrder();
    }, [id, navigate]);

    useEffect(() => {
        if (!id) return;
        reviewApi.canReview(id).then(res => {
            // API returns { canReview: bool }
            const d = res.data as any;
            setCanReviewOrder(!!(d?.canReview ?? d?.CanReview ?? d));
        }).catch(() => setCanReviewOrder(false));
    }, [id]);

    const handleSubmitReview = async () => {
        if (!id) return;
        try {
            setIsSubmittingReview(true);
            await reviewApi.create({
                orderId: id,
                rating: reviewRating,
                star: reviewRating,
                comment: reviewComment,
                content: reviewComment,
            });
            toast.success('Đánh giá thành công! ⭐');
            setShowReviewModal(false);
            setCanReviewOrder(false);
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Không thể gửi đánh giá');
        } finally {
            setIsSubmittingReview(false);
        }
    };

    const handleCancel = async () => {
        if (!id) return;
        if (!cancelReason.trim()) {
            toast.error('Vui lòng nhập lý do huỷ đơn');
            return;
        }
        try {
            setIsCancelling(true);
            await orderApi.cancel(id, { reason: cancelReason.trim() });
            toast.success('Đã huỷ đơn hàng thành công');
            setShowCancelConfirm(false);
            setCancelReason('');
            await fetchOrder();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Không thể huỷ đơn hàng');
        } finally {
            setIsCancelling(false);
        }
    };

    if (isLoading) return <div className="min-h-screen flex items-center justify-center p-4"><div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>;
    if (!order) return null;

    const currentStatus = order.status || 0;
    const canCancel = currentStatus === 0; // Only pending orders can be cancelled
    const isCancelled = currentStatus === 6;

    return (
        <div className="bg-gray-50 min-h-screen pb-52">
            {/* HEADER */}
            <div className="bg-white p-4 sticky top-0 z-40 shadow-sm flex items-center space-x-4">
                <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <h1 className="text-xl font-bold text-gray-900">Chi tiết đơn hàng</h1>
            </div>

            <div className="p-4 space-y-6">
                {/* STATUS TRACKER */}
                {isCancelled ? (
                    <Card className="p-6 border-none shadow-sm rounded-3xl bg-red-50 text-center">
                        <XCircle className="w-12 h-12 text-red-500 mx-auto mb-2" />
                        <p className="font-bold text-red-600">Đơn hàng đã bị huỷ</p>
                    </Card>
                ) : (
                    <Card className="p-6 border-none shadow-sm rounded-3xl bg-white overflow-hidden relative">
                        <div className="flex justify-between relative z-10">
                            {STATUS_STEPS.map((step, idx) => (
                                <div key={idx} className="flex flex-col items-center flex-1">
                                    <div className={cn(
                                        "w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-all duration-500",
                                        idx <= currentStatus ? "bg-orange-500 text-white shadow-lg shadow-orange-100" : "bg-gray-100 text-gray-300"
                                    )}>
                                        <step.icon className="w-5 h-5" />
                                    </div>
                                    <span className={cn(
                                        "text-[8px] uppercase tracking-widest font-black text-center",
                                        idx <= currentStatus ? "text-orange-500" : "text-gray-300"
                                    )}>
                                        {step.label}
                                    </span>
                                </div>
                            ))}
                            {/* Connecting Line */}
                            <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-100 -z-0" style={{ left: '12.5%', right: '12.5%' }} />
                            <div
                                className="absolute top-5 left-0 h-0.5 bg-orange-500 -z-0 transition-all duration-1000"
                                style={{
                                    left: '12.5%',
                                    width: `${(Math.min(currentStatus, 5) / 5) * 75}%`
                                }}
                            />
                        </div>
                    </Card>
                )}

                {/* STORE INFO */}
                <Card className="p-4 border-none shadow-sm rounded-3xl bg-white flex items-center space-x-4">
                    <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center overflow-hidden">
                        <img src={order.storeImage || ''} className="w-full h-full object-cover" alt="store" />
                    </div>
                    <div className="flex-1">
                        <h3 className="font-bold text-gray-900 leading-tight">{order.storeName || 'Nhà hàng'}</h3>
                        <p className="text-xs text-gray-500 mt-1 flex items-center">
                            <MapPin className="w-3 h-3 mr-1 text-orange-500" />
                            {order.storeAddress || 'Địa chỉ lấy hàng'}
                        </p>
                    </div>
                    <Button variant="ghost" size="icon" className="bg-gray-50 rounded-xl">
                        <Phone className="w-4 h-4 text-orange-600" />
                    </Button>
                </Card>

                {/* ORDER DETAILS */}
                <div className="space-y-3">
                    <div className="flex items-center space-x-2 text-gray-900 font-bold ml-1">
                        <Receipt className="w-4 h-4 text-orange-600" />
                        <span className="text-sm">Tóm tắt đơn hàng</span>
                    </div>
                    <Card className="p-6 border-none shadow-sm rounded-3xl bg-white space-y-4">
                        <div className="space-y-3">
                            {order.items?.map((line: any, idx: number) => (
                                <div key={idx} className="flex justify-between items-center text-sm">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center font-bold text-gray-400">
                                            {line.quantity}x
                                        </div>
                                        <span className="font-medium text-gray-700">{line.foodName || 'Sản phẩm'}</span>
                                    </div>
                                    <span className="font-bold text-gray-900">{(line.total || line.price * line.quantity).toLocaleString()}đ</span>
                                </div>
                            ))}
                        </div>

                        <div className="pt-4 border-t border-dashed border-gray-100 flex justify-between items-center mt-4">
                            <div className="text-xs text-gray-400 font-medium">
                                ID: #{typeof order.id === 'string' ? order.id.slice(-8).toUpperCase() : order.id} <br />
                                Ngày: {new Date(order.purchaseDate || Date.now()).toLocaleString('vi-VN')}
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] text-gray-400 uppercase tracking-widest font-black">Tổng cộng</p>
                                <span className="text-2xl font-black text-orange-600">{(order.total || 0).toLocaleString()}đ</span>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* DELIVERY ADDRESS */}
                <div className="space-y-3">
                    <div className="flex items-center space-x-2 text-gray-900 font-bold ml-1">
                        <MapPin className="w-4 h-4 text-orange-600" />
                        <span className="text-sm">Địa chỉ giao hàng</span>
                    </div>
                    <Card className="p-4 border-none shadow-sm rounded-3xl bg-white">
                        <p className="text-sm text-gray-600 leading-relaxed italic">
                            {order.deliveryAddress || 'Không có thông tin địa chỉ'}
                        </p>
                    </Card>
                </div>

                {/* Cancel Confirmation Modal */}
                {showCancelConfirm && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6">
                        <Card className="p-6 border-none shadow-2xl rounded-3xl bg-white max-w-sm w-full space-y-4">
                            <div className="text-center">
                                <XCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
                                <h3 className="font-bold text-gray-900 text-lg">Huỷ đơn hàng?</h3>
                                <p className="text-sm text-gray-500 mt-1">Vui lòng nhập lý do huỷ đơn.</p>
                            </div>
                            <textarea
                                value={cancelReason}
                                onChange={e => setCancelReason(e.target.value)}
                                placeholder="Nhập lý do huỷ đơn..."
                                className="w-full border border-gray-200 rounded-xl p-3 text-sm resize-none h-20 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                            />
                            <div className="flex gap-3">
                                <Button variant="outline" className="flex-1 rounded-xl" onClick={() => { setShowCancelConfirm(false); setCancelReason(''); }} disabled={isCancelling}>
                                    Không
                                </Button>
                                <Button className="flex-1 rounded-xl bg-red-500 hover:bg-red-600 shadow-md" onClick={handleCancel} disabled={isCancelling || !cancelReason.trim()}>
                                    {isCancelling ? 'Đang huỷ...' : 'Huỷ đơn'}
                                </Button>
                            </div>
                        </Card>
                    </div>
                )}

                {/* Review Modal */}
                {showReviewModal && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6">
                        <Card className="p-6 border-none shadow-2xl rounded-3xl bg-white max-w-sm w-full space-y-5">
                            <div className="text-center">
                                <MessageSquare className="w-12 h-12 text-orange-500 mx-auto mb-3" />
                                <h3 className="font-bold text-gray-900 text-lg">Đánh giá đơn hàng</h3>
                                <p className="text-sm text-gray-500 mt-1">Chia sẻ trải nghiệm của bạn</p>
                            </div>

                            {/* Star Rating */}
                            <div className="flex justify-center gap-2">
                                {[1, 2, 3, 4, 5].map((s) => (
                                    <button
                                        key={s}
                                        onClick={() => setReviewRating(s)}
                                        className="transition-transform hover:scale-110 active:scale-95"
                                    >
                                        <Star
                                            className={cn(
                                                "w-10 h-10 transition-colors",
                                                s <= reviewRating ? "fill-yellow-400 text-yellow-400" : "text-gray-200"
                                            )}
                                        />
                                    </button>
                                ))}
                            </div>
                            <p className="text-center text-sm text-gray-500 font-medium">
                                {reviewRating === 1 && 'Rất tệ 😞'}
                                {reviewRating === 2 && 'Tệ 😕'}
                                {reviewRating === 3 && 'Bình thường 😐'}
                                {reviewRating === 4 && 'Tốt 😊'}
                                {reviewRating === 5 && 'Tuyệt vời! 🤩'}
                            </p>

                            {/* Comment */}
                            <textarea
                                value={reviewComment}
                                onChange={(e) => setReviewComment(e.target.value)}
                                placeholder="Nhận xét của bạn (tuỳ chọn)..."
                                className="w-full border border-gray-200 rounded-xl p-3 text-sm resize-none h-24 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            />

                            <div className="flex gap-3">
                                <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setShowReviewModal(false)} disabled={isSubmittingReview}>
                                    Huỷ
                                </Button>
                                <Button
                                    className="flex-1 rounded-xl shadow-md shadow-orange-200"
                                    onClick={handleSubmitReview}
                                    disabled={isSubmittingReview}
                                >
                                    {isSubmittingReview ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                    Gửi đánh giá
                                </Button>
                            </div>
                        </Card>
                    </div>
                )}
            </div>

            {/* FLOATING ACTION */}
            <div className="fixed bottom-[68px] left-4 right-4 z-30 bg-white/90 backdrop-blur-lg p-3 rounded-3xl border border-gray-100 shadow-2xl">
                <div className="grid grid-cols-2 gap-2">
                    {canCancel && (
                        <Button
                            variant="outline"
                            className="py-4 rounded-2xl font-bold border-red-200 text-red-500 hover:bg-red-50 text-sm"
                            onClick={() => setShowCancelConfirm(true)}
                        >
                            HUỶ ĐƠN
                        </Button>
                    )}
                    {canReviewOrder && (
                        <Button
                            variant="outline"
                            className="py-4 rounded-2xl font-bold border-yellow-300 text-yellow-600 hover:bg-yellow-50 text-sm"
                            onClick={() => setShowReviewModal(true)}
                        >
                            ⭐ ĐÁNH GIÁ
                        </Button>
                    )}
                    <Button
                        className={`py-4 rounded-2xl font-bold shadow-lg shadow-orange-100 text-sm ${!canCancel && !canReviewOrder ? 'col-span-2' : ''}`}
                        onClick={() => navigate('/')}
                    >
                        ĐẶT LẠI
                    </Button>
                </div>
            </div>
        </div>
    );
}
