import { ArrowLeft, MapPin, Phone, ReceiptText, Store, XCircle, Clock, CheckCircle2, Package2, Receipt, MessageSquare, Star, Loader2 } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { orderApi, reviewApi } from '../../../api/api';
import { cn } from '../../../lib/utils';

const STATUS_STEPS = [
    { label: 'Chờ xử lý', icon: Clock, desc: 'Đơn hàng đã được gửi' },
    { label: 'Xác nhận', icon: CheckCircle2, desc: 'Nhà hàng đã nhận đơn' },
    { label: 'Chuẩn bị', icon: Store, desc: 'Đang chế biến món ăn' },
    { label: 'Sẵn sàng', icon: Package2, desc: 'Đang đợi tài xế' },
    { label: 'Đang giao', icon: Package2, desc: 'Tài xế đang trên đường' },
    { label: 'Hoàn thành', icon: CheckCircle2, desc: 'Giao hàng thành công' }
];

export default function OrderDetailPage() {
    const navigate = useNavigate();
    const location = useLocation();
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
    const [isConfirmingReceived, setIsConfirmingReceived] = useState(false);

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
            const d = res.data as any;
            const canReview = !!(d?.canReview ?? d?.CanReview ?? d);
            setCanReviewOrder(canReview);
            
            // Auto-open if coming from history page with state
            if (canReview && location.state?.openReview) {
                setShowReviewModal(true);
            }
        }).catch(() => setCanReviewOrder(false));
    }, [id, location.state]);

    const handleSubmitReview = async () => {
        if (!id) return;
        try {
            setIsSubmittingReview(true);
            const firstFoodId = order?.items?.[0]?.foodId;
            await reviewApi.create({
                orderId: id,
                storeId: order?.storeId,
                foodId: firstFoodId,
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
    const canConfirmReceived = currentStatus === 4; // Delivering -> user confirms received
    const isCancelled = currentStatus === 6;

    const handleConfirmReceived = async () => {
        if (!id) return;
        try {
            setIsConfirmingReceived(true);
            await orderApi.updateStatus(id, { status: 5 }); // 5 = Completed
            toast.success('Xác nhận đã nhận hàng thành công! 🎉');
            await fetchOrder();
            // Automatically open review modal after confirming
            setShowReviewModal(true);
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Không thể xác nhận nhận hàng');
        } finally {
            setIsConfirmingReceived(false);
        }
    };

    return (
        <div className="bg-[#FCF9F5] min-h-screen pb-40 font-sans">
            {/* Header */}
            <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-orange-100/50 px-4 py-4 mb-8">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate('/orders')} className="p-2 hover:bg-orange-50 rounded-xl transition-colors">
                            <ArrowLeft className="w-5 h-5 text-[#C76E00]" />
                        </button>
                        <div>
                            <h1 className="text-xl font-black text-gray-900 tracking-tight uppercase italic flex items-center gap-2">
                                <ReceiptText className="w-5 h-5 text-[#C76E00]" />
                                Chi tiết đơn
                            </h1>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em] mt-0.5">
                                #{String(order.id).slice(-8).toUpperCase()} · {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-8">

                {/* TRACKER CARD */}
                {isCancelled ? (
                    <Card className="p-8 border-none shadow-2xl rounded-3xl bg-red-50 text-center border border-red-100">
                        <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4 animate-pulse" />
                        <h2 className="text-xl font-black text-red-700 uppercase italic">Đơn hàng đã bị huỷ</h2>
                        <p className="text-xs text-red-400 font-bold uppercase tracking-widest mt-2">{order.cancelReason || 'Lý do không xác định'}</p>
                    </Card>
                ) : (
                    <Card className="p-6 bg-white/80 backdrop-blur-xl border border-orange-100/50 shadow-2xl shadow-orange-900/5 rounded-3xl overflow-hidden relative">
                        <div className="flex justify-between relative z-10 mb-8 overflow-x-auto pb-4 hide-scrollbar">
                            {STATUS_STEPS.map((step, idx) => (
                                <div key={idx} className="flex flex-col items-center flex-1 min-w-[70px]">
                                    <div className={cn(
                                        "w-12 h-12 rounded-2xl flex items-center justify-center mb-3 transition-all duration-700",
                                        idx <= currentStatus ? "bg-gradient-to-br from-[#C76E00] to-[#E67E00] text-white shadow-xl shadow-orange-200 scale-110" : "bg-gray-50 text-gray-200 border border-gray-100"
                                    )}>
                                        <step.icon className="w-6 h-6" />
                                    </div>
                                    <span className={cn(
                                        "text-[9px] uppercase tracking-widest font-black text-center mb-1",
                                        idx <= currentStatus ? "text-[#C76E00]" : "text-gray-300"
                                    )}>
                                        {step.label}
                                    </span>
                                    {idx === currentStatus && (
                                        <span className="text-[7px] font-bold text-gray-400 uppercase text-center max-w-[60px] leading-tight italic animate-pulse">
                                            {step.desc}
                                        </span>
                                    )}
                                </div>
                            ))}
                            {/* Connecting Line Backdrop */}
                            <div className="absolute top-6 left-0 right-0 h-1 bg-gray-50 -z-10 rounded-full" style={{ left: '8%', right: '8%' }} />
                            {/* Active Connecting Line */}
                            <div
                                className="absolute top-6 left-0 h-1 bg-gradient-to-r from-[#C76E00] to-[#E67E00] -z-10 transition-all duration-[1500ms] rounded-full shadow-[0_0_10px_rgba(199,110,0,0.3)]"
                                style={{
                                    left: '8%',
                                    width: `${(Math.min(currentStatus, 5) / 5) * 84}%`
                                }}
                            />
                        </div>
                    </Card>
                )}

                {/* STORE INFO SECTION */}
                <div className="space-y-4">
                    <div className="flex items-center space-x-2 text-gray-900 font-black ml-2 uppercase text-xs tracking-widest italic animate-fade-in">
                        <Store className="w-4 h-4 text-[#C76E00]" />
                        <span>Thông tin nhà hàng</span>
                    </div>
                    <Card className="p-5 bg-white/80 backdrop-blur-xl border border-orange-100/50 shadow-xl shadow-orange-900/5 rounded-3xl flex items-center space-x-5 transition-all hover:scale-[1.02] border-l-4 border-l-[#C76E00]">
                        <div className="w-20 h-20 bg-orange-50 rounded-2xl flex items-center justify-center overflow-hidden border border-orange-100 shadow-inner group shrink-0">
                            <img src={order.storeImage || ''} className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-500" alt="store"
                                onError={(e) => (e.currentTarget.src = 'https://images.unsplash.com/photo-1517248135467-4c7ed9d42339?w=500&q=80')} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="font-black text-gray-900 text-lg leading-tight tracking-tight uppercase truncate">{order.storeName || 'Nhà hàng'}</h3>
                            <p className="text-[10px] text-gray-400 font-bold mt-2 flex items-center bg-orange-50/50 p-2 rounded-xl border border-orange-100/20">
                                <MapPin className="w-3.5 h-3.5 mr-2 text-[#C76E00] shrink-0" />
                                <span className="line-clamp-2 italic">{order.storeAddress || 'Địa chỉ lấy hàng'}</span>
                            </p>
                        </div>
                        <a href={`tel:${order.storePhone || '1900'}`} className="bg-orange-50 p-4 rounded-2xl hover:bg-orange-100 transition-all active:scale-90 border border-orange-100 shadow-sm shrink-0">
                            <Phone className="w-5 h-5 text-[#C76E00]" />
                        </a>
                    </Card>
                </div>

                {/* ORDER CONTENT */}
                <div className="space-y-4">
                    <div className="flex items-center space-x-2 text-gray-900 font-black ml-2 uppercase text-xs tracking-widest italic animate-fade-in">
                        <Receipt className="w-4 h-4 text-[#C76E00]" />
                        <span>Tóm tắt đơn hàng</span>
                    </div>
                    <Card className="p-6 bg-white/80 backdrop-blur-xl border border-orange-100/50 shadow-2xl shadow-orange-900/5 rounded-3xl space-y-6 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50/20 rounded-full -mr-16 -mt-16 blur-3xl pointer-events-none" />
                        <div className="space-y-4 relative z-10">
                            {order.items?.map((line: any, idx: number) => (
                                <div key={idx} className="flex justify-between items-center group">
                                    <div className="flex items-center space-x-4">
                                        <div className="w-10 h-10 bg-orange-50 rounded-2xl flex items-center justify-center font-black text-[#C76E00] border border-orange-100/50 text-xs shadow-sm group-hover:bg-[#C76E00] group-hover:text-white transition-all group-hover:rotate-6">
                                            {line.quantity}x
                                        </div>
                                        <div>
                                            <span className="font-black text-gray-800 text-sm tracking-tight group-hover:text-[#C76E00] transition-colors">{line.foodName || 'Sản phẩm'}</span>
                                            {line.note && <p className="text-[10px] text-gray-400 font-medium italic mt-0.5 opacity-60">" {line.note} "</p>}
                                        </div>
                                    </div>
                                    <span className="font-black text-gray-900 text-sm">{(line.total || line.price * line.quantity).toLocaleString()} ₫</span>
                                </div>
                            ))}
                        </div>

                        <div className="pt-6 border-t-2 border-dashed border-orange-100 flex justify-between items-end relative z-10">
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Chi tiết giao dịch</p>
                                <p className="text-[10px] text-gray-400 font-bold">
                                    Mã GD: <span className="text-gray-900 font-black">#{typeof order.id === 'string' ? order.id.slice(-8).toUpperCase() : order.id}</span>
                                </p>
                                <p className="text-[10px] text-gray-400 font-bold">
                                    {new Date(order.purchaseDate || order.orderDate || Date.now()).toLocaleString('vi-VN')}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-[9px] text-gray-400 uppercase tracking-widest font-black mb-1">Tổng cộng</p>
                                <span className="text-3xl font-black text-[#C76E00] tracking-tighter shadow-orange-100">{(order.total || order.totalAmount || 0).toLocaleString()} ₫</span>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* DELIVERY LOCATION */}
                <div className="space-y-4">
                    <div className="flex items-center space-x-2 text-gray-900 font-black ml-2 uppercase text-xs tracking-widest italic animate-fade-in">
                        <MapPin className="w-4 h-4 text-[#C76E00]" />
                        <span>Địa chỉ nhận hàng</span>
                    </div>
                    <Card className="p-6 bg-white/80 backdrop-blur-xl border border-orange-100/50 shadow-xl shadow-orange-900/5 rounded-3xl border-l-4 border-l-[#C76E00] transition-all hover:bg-white group">
                        <p className="text-sm text-gray-700 font-bold leading-relaxed italic group-hover:text-gray-900 transition-colors">
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

                {/* ACTION BUTTONS - Static at bottom of content */}
                <div className="pt-4 pb-12">
                    <div className="grid grid-cols-2 gap-3">
                        {canCancel && (
                            <Button
                                variant="outline"
                                className="py-3 rounded-xl font-black border-red-100 text-red-500 hover:bg-red-50 text-xs uppercase tracking-widest shadow-sm transition-all active:scale-95"
                                onClick={() => setShowCancelConfirm(true)}
                            >
                                HUỶ ĐƠN
                            </Button>
                        )}
                        {canConfirmReceived && (
                            <Button
                                className="py-3 rounded-xl font-black bg-emerald-600 hover:bg-emerald-700 text-white shadow-xl shadow-emerald-100 text-xs uppercase tracking-widest col-span-2 active:scale-95 transition-all"
                                onClick={handleConfirmReceived}
                                disabled={isConfirmingReceived}
                            >
                                {isConfirmingReceived ? (
                                    <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Đang xử lý...</>
                                ) : (
                                    'Xác nhận Đã nhận hàng'
                                )}
                            </Button>
                        )}
                        {canReviewOrder && (
                            <Button
                                variant="outline"
                                className="py-3 rounded-xl font-black border-amber-200 text-amber-600 hover:bg-amber-50 text-xs uppercase tracking-widest shadow-sm transition-all active:scale-95"
                                onClick={() => setShowReviewModal(true)}
                            >
                                Đánh giá ngay
                            </Button>
                        )}
                        <Button
                            className={`py-3 rounded-xl font-black bg-[#C76E00] hover:bg-[#A55B00] text-white shadow-xl shadow-[#C76E00]/20 text-xs uppercase tracking-widest active:scale-95 transition-all ${!canCancel && !canReviewOrder && !canConfirmReceived ? 'col-span-2' : ''}`}
                            onClick={() => navigate(order?.storeId ? `/store/${order.storeId}` : '/')}
                        >
                            Đặt tiếp đơn mới
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
