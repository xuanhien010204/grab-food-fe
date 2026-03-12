import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    ArrowLeft, 
    Clock, 
    MapPin, 
    Phone, 
    ChevronRight, 
    Star, 
    Utensils, 
    CreditCard, 
    ShieldCheck, 
    ReceiptText,
    Loader2,
    CheckCircle2,
    Truck,
    Package,
    Store
} from 'lucide-react';
import { orderApi, reviewApi } from '../../../api/api';
import type { OrderDto } from '../../../types/swagger';
import { OrderStatus, OrderStatusName } from '../../../types/swagger';
import { toast } from 'sonner';

const OrderDetailPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [order, setOrder] = useState<OrderDto | null>(null);
    const [loading, setLoading] = useState(true);
    const [canReview, setCanReview] = useState(false);

    useEffect(() => {
        const fetchOrder = async () => {
            if (!id) return;
            try {
                const res = await orderApi.getById(id);
                setOrder(res.data);
                
                // Check if can review
                const reviewRes = await reviewApi.canReview(id);
                setCanReview(reviewRes.data);
            } catch (error) {
                console.error('Failed to fetch order', error);
                toast.error('Không thể tải thông tin đơn hàng');
            } finally {
                setLoading(false);
            }
        };
        fetchOrder();
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-12 h-12 text-[#C76E00] animate-spin" />
                <p className="text-charcoal/40 font-black uppercase tracking-[0.2em] italic">Đang tải chi tiết đơn hàng...</p>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6">
                <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center text-[#C76E00]">
                    <Utensils className="w-10 h-10" />
                </div>
                <h2 className="text-2xl font-black text-charcoal italic tracking-tight uppercase">Không tìm thấy đơn hàng</h2>
                <button 
                    onClick={() => navigate('/orders')}
                    className="px-8 py-3 bg-[#C76E00] text-white font-black rounded-2xl shadow-lg shadow-orange-500/20 active:scale-95 transition-all text-sm uppercase tracking-widest"
                >
                    Quay lại danh sách
                </button>
            </div>
        );
    }

    const getStatusStep = () => {
        const status = order.status;
        if (status === OrderStatus.Cancelled) return -1;
        if (status === OrderStatus.Pending) return 1;
        if (status === OrderStatus.Confirmed) return 2;
        if (status === OrderStatus.Preparing) return 3;
        if (status === OrderStatus.Ready) return 4;
        if (status === OrderStatus.Delivering) return 5;
        if (status === OrderStatus.Completed) return 6;
        return 1;
    };

    const statusSteps = [
        { icon: ReceiptText, label: 'Đã đặt' },
        { icon: Store, label: 'Xác nhận' },
        { icon: Package, label: 'Chuẩn bị' },
        { icon: Truck, label: 'Đang giao' },
        { icon: CheckCircle2, label: 'Hoàn tất' }
    ];

    const currentStep = getStatusStep();

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2">
                    <button 
                        onClick={() => navigate('/orders')}
                        className="group flex items-center gap-2 text-charcoal/40 hover:text-[#C76E00] transition-colors mb-4"
                    >
                        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                        <span className="text-xs font-black uppercase tracking-widest">Quay lại đơn hàng</span>
                    </button>
                    <div className="flex items-center gap-3">
                        <h1 className="text-4xl font-black text-charcoal italic tracking-tighter uppercase tabular-nums">
                            #{order.id.slice(-6).toUpperCase()}
                        </h1>
                        <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-[0.1em] ${
                            order.status === OrderStatus.Completed ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200' :
                            order.status === OrderStatus.Cancelled ? 'bg-rose-500 text-white shadow-lg shadow-rose-200' :
                            'bg-[#C76E00] text-white shadow-lg shadow-orange-200'
                        }`}>
                            {OrderStatusName[order.status]}
                        </span>
                    </div>
                    <div className="flex items-center gap-4 text-charcoal/40 font-bold text-xs">
                        <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> {new Date(order.purchaseDate).toLocaleString('vi-VN')}</span>
                        <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4" /> {order.paymentStatusName}</span>
                    </div>
                </div>

                <div className="flex flex-wrap gap-3">
                    {canReview && order.status === OrderStatus.Completed && (
                        <button 
                            onClick={() => navigate(`/reviews/create/${order.id}`)}
                            className="px-8 py-4 bg-charcoal text-white font-black rounded-3xl shadow-xl shadow-charcoal/20 flex items-center gap-3 group active:scale-95 transition-all text-sm italic"
                        >
                            <Star className="w-5 h-5 group-hover:rotate-[72deg] transition-transform text-amber-400 fill-amber-400" />
                            ĐÁNH GIÁ NGAY
                        </button>
                    )}
                </div>
            </div>

            {/* Status Timeline */}
            {order.status !== OrderStatus.Cancelled && (
                <div className="bg-white border border-orange-100/50 rounded-[2.5rem] p-8 md:p-12 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50/50 -mr-16 -mt-16 rounded-full blur-3xl" />
                    <div className="flex justify-between relative z-10">
                        {statusSteps.map((step, idx) => {
                            const isCompleted = currentStep >= (idx + 1);
                            const isCurrent = currentStep === (idx + 1);
                            return (
                                <div key={idx} className="flex flex-col items-center gap-4 relative z-10">
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 ${
                                        isCompleted ? 'bg-[#C76E00] text-white shadow-xl shadow-orange-500/20' : 
                                        'bg-cream/50 text-charcoal/20'
                                    }`}>
                                        <step.icon className={`w-6 h-6 ${isCurrent ? 'animate-bounce' : ''}`} />
                                    </div>
                                    <span className={`text-[10px] font-black uppercase tracking-widest hidden md:block ${
                                        isCompleted ? 'text-charcoal' : 'text-charcoal/20'
                                    }`}>
                                        {step.label}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Store & Items */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Store Card */}
                    <Link 
                        to={`/store/${order.storeId}`}
                        className="flex items-center justify-between p-6 bg-cream/30 hover:bg-cream/50 border border-orange-100/50 rounded-3xl transition-all group"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-2xl bg-white p-1 shadow-sm overflow-hidden border border-orange-50 group-hover:scale-105 transition-transform">
                                <img src={order.storeImage || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4'} alt="" className="w-full h-full object-cover rounded-xl" />
                            </div>
                            <div>
                                <h3 className="font-black text-charcoal uppercase italic group-hover:text-[#C76E00] transition-colors">{order.storeName}</h3>
                                <p className="text-xs font-bold text-charcoal/40 flex items-center gap-1 mt-1">
                                    <MapPin className="w-3 h-3 text-[#C76E00]" /> {order.storeAddress}
                                </p>
                            </div>
                        </div>
                        <ChevronRight className="w-6 h-6 text-[#C76E00] group-hover:translate-x-1 transition-transform" />
                    </Link>

                    {/* Items Section */}
                    <div className="bg-white border border-orange-100/50 rounded-[2.5rem] overflow-hidden shadow-sm">
                        <div className="p-8 border-b border-orange-100/50 flex items-center justify-between">
                            <h2 className="text-xl font-black text-charcoal uppercase italic tracking-tighter">Chi tiết món ăn</h2>
                            <span className="px-3 py-1 bg-cream/50 text-charcoal text-[10px] font-black rounded-lg uppercase tracking-widest">
                                {order.totalItems} món
                            </span>
                        </div>
                        <div className="divide-y divide-orange-100/30">
                            {order.items?.map((item, idx) => (
                                <div key={idx} className="p-8 flex items-center gap-6 group hover:bg-[#FFF7ED]/30 transition-colors">
                                    <div className="w-20 h-20 rounded-2xl overflow-hidden bg-cream shrink-0 border border-orange-50 ring-4 ring-[#FFF7ED] shadow-sm group-hover:rotate-3 transition-transform">
                                        <img src={item.foodImage || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c'} alt="" className="w-full h-full object-cover" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h4 className="font-black text-charcoal uppercase italic tracking-tight mb-1 group-hover:text-[#C76E00] transition-colors">{item.foodName}</h4>
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs font-black text-charcoal/30 flex items-center gap-2">
                                                ₫{item.price.toLocaleString()} <X className="w-3 h-3" /> {item.quantity}
                                            </span>
                                        </div>
                                    </div>
                                    <span className="text-lg font-black text-charcoal italic tabular-nums">
                                        ₫{item.total.toLocaleString()}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* Receipt Summary */}
                        <div className="bg-cream/50 dark:bg-charcoal/50 p-6 space-y-4">
                            <div className="flex justify-between text-sm font-bold text-charcoal/60 dark:text-cream/60 uppercase tracking-widest">
                                <span>Tạm tính</span>
                                <span>₫{order.subTotal?.toLocaleString('vi-VN')}</span>
                            </div>

                            {((order.deliveryFee || 0) > 0) && (
                                <div className="flex justify-between text-sm font-bold text-emerald-600 uppercase tracking-widest">
                                    <span>Phí giao hàng</span>
                                    <span>+₫{order.deliveryFee?.toLocaleString('vi-VN')}</span>
                                </div>
                            )}

                            {((order.discount || 0) > 0) && (
                                <div className="flex justify-between text-sm font-bold text-rose-500 uppercase tracking-widest">
                                    <span>Giảm giá</span>
                                    <span>-₫{order.discount?.toLocaleString('vi-VN')}</span>
                                </div>
                            )}

                            <div className="pt-4 border-t-2 border-dashed border-orange-100 dark:border-gray-800 flex justify-between items-baseline">
                                <span className="text-xs font-black text-charcoal dark:text-cream uppercase tracking-[0.2em]">Tổng cộng</span>
                                <span className="text-3xl font-black text-[#C76E00] italic tabular-nums">₫{order.total?.toLocaleString('vi-VN')}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Delivery Info */}
                <div className="space-y-8">
                    {/* Recipient Info */}
                    <div className="bg-white border border-orange-100/50 rounded-[2.5rem] p-8 shadow-sm space-y-6">
                        <h2 className="text-sm font-black text-charcoal uppercase italic tracking-widest border-b border-orange-100 pb-4">Thông tin nhận hàng</h2>
                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-orange-50 rounded-lg text-[#C76E00]">
                                    <Star className="w-4 h-4 fill-current" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-[10px] font-black text-charcoal/20 uppercase tracking-widest mb-1">Người nhận</p>
                                    <p className="font-black text-charcoal uppercase italic truncate tracking-tight">{order.recipientName}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-orange-50 rounded-lg text-[#C76E00]">
                                    <Phone className="w-4 h-4" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10px] font-black text-charcoal/20 uppercase tracking-widest mb-1">SĐT liên hệ</p>
                                    <p className="font-black text-charcoal italic tabular-nums">{order.recipientPhone}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-orange-50 rounded-lg text-[#C76E00]">
                                    <MapPin className="w-4 h-4" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10px] font-black text-charcoal/20 uppercase tracking-widest mb-1">Địa chỉ giao</p>
                                    <p className="font-bold text-charcoal/60 text-sm leading-relaxed">{order.deliveryAddress}</p>
                                </div>
                            </div>
                            {order.note && (
                                <div className="pt-4 mt-4 border-t border-orange-100/30">
                                    <p className="text-[10px] font-black text-rose-500/40 uppercase tracking-widest mb-2 italic">Ghi chú chú đơn hàng:</p>
                                    <p className="text-sm font-bold text-charcoal/80 italic bg-cream/50 p-4 rounded-2xl">"{order.note}"</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Payment Info */}
                    <div className="bg-charcoal text-white rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 -mr-16 -mt-16 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-1000" />
                        <h2 className="text-sm font-black uppercase italic tracking-widest border-b border-white/10 pb-4 mb-6 relative z-10">Phương thức thanh toán</h2>
                        <div className="flex items-center gap-4 relative z-10">
                            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-orange-400 border border-white/10">
                                <CreditCard className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="font-black italic tracking-tight uppercase">{order.paymentMethodName}</p>
                                <p className={`text-[10px] font-black uppercase tracking-widest mt-1 ${
                                    order.paymentStatusName.includes('Đã') || order.paymentStatusName.includes('Paid') ? 'text-emerald-400' : 'text-amber-400'
                                }`}>
                                    {order.paymentStatusName}
                                </p>
                            </div>
                        </div>
                    </div>
                    
                    {order.status === OrderStatus.Cancelled && (
                        <div className="bg-rose-50 border border-rose-100 rounded-[2.5rem] p-8">
                            <h2 className="text-sm font-black text-rose-600 uppercase italic tracking-widest mb-4">Đơn hàng bị hủy</h2>
                            <p className="text-sm font-bold text-rose-800 italic leading-relaxed">
                                Lý do: {order.cancelReason || 'Người dùng hủy đơn'}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default OrderDetailPage;
