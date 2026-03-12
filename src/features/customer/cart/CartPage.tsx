import { Minus, Plus, Trash2, MapPin, ShoppingBag, CreditCard, Ticket, ChevronRight, Loader2, ArrowLeft, MessageSquare } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Input } from '../../../components/ui/Input';
import { Modal } from '../../../components/ui/Modal';
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { cn } from '../../../lib/utils';
import { orderApi, voucherApi, addressApi, walletApi } from '../../../api/api';
import { cartStore } from '../../../utils/cartStore';

const PAYMENT_METHODS = [
    { id: 3, name: 'MoMo', icon: CreditCard, desc: 'Thanh toán qua ứng dụng MoMo' },
];

export default function CartPage() {
    const navigate = useNavigate();
    const [cartItems, setCartItems] = useState<any[]>([]);
    const [selectedVoucher, setSelectedVoucher] = useState<any>(null);
    const [voucherCode, setVoucherCode] = useState('');
    const [voucherError, setVoucherError] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isCheckingOut, setIsCheckingOut] = useState(false);
    const [defaultAddress, setDefaultAddress] = useState<any>(null);
    const [paymentMethod, setPaymentMethod] = useState(3);
    const [walletBalance, setWalletBalance] = useState(0);
    const [orderNote, setOrderNote] = useState('');
    const [showConfirm, setShowConfirm] = useState(false);
    const [showVoucherModal, setShowVoucherModal] = useState(false);
    const [availableVouchers, setAvailableVouchers] = useState<any[]>([]);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            toast.error('Vui lòng đăng nhập để xem giỏ hàng');
            navigate('/login');
            return;
        }

        // Load cart from localStorage (instant)
        setCartItems(cartStore.getItemsArray());
        setIsLoading(false);

        // Also try to sync from API (background, non-blocking)
        cartStore.syncFromApi().then(() => {
            setCartItems(cartStore.getItemsArray());
        });

        if (cartItems.length > 0) {
            fetchVouchers();
        }
        fetchDefaultAddress();
        fetchWalletBalance();
    }, [navigate, cartItems.length]);

    const fetchWalletBalance = async () => {
        try {
            const res = await walletApi.getBalance();
            const d = res.data as any;
            setWalletBalance(d?.balance ?? d?.Balance ?? (typeof d === 'number' ? d : 0));
        } catch { }
    };

    const fetchDefaultAddress = async () => {
        try {
            const res = await addressApi.getDefault();
            setDefaultAddress(res.data);
        } catch {
            setDefaultAddress(null);
        }
    };

    const fetchVouchers = async () => {
        try {
            const firstItem = cartItems[0];
            const storeId = firstItem?.foodStore?.storeId || firstItem?.foodStore?.StoreId;
            if (!storeId) return;

            const res = await voucherApi.getAvailable({ 
                storeId: Number(storeId),
                orderAmount: subtotal 
            });
            const d = res.data as any;
            const vouchers = Array.isArray(d) ? d : (d?.vouchers || d?.Vouchers || []);
            setAvailableVouchers(vouchers);
        } catch (err) {
            console.error('Failed to fetch vouchers:', err);
        }
    };

    const refreshCart = () => {
        setCartItems(cartStore.getItemsArray());
    };

    const updateQuantity = (id: string, delta: number) => {
        const item = cartItems.find(i => i.id === id);
        if (!item) return;
        const newQty = item.quantity + delta;
        if (newQty <= 0) {
            cartStore.removeItem(id);
            toast.success('Đã xóa khỏi giỏ hàng');
        } else {
            cartStore.updateQuantity(id, newQty);
        }
        refreshCart();
    };

    const removeItem = (id: string) => {
        cartStore.removeItem(id);
        refreshCart();
        toast.success('Đã xóa khỏi giỏ hàng');
    };

    const handleApplyVoucherCode = async () => {
        if (!voucherCode.trim()) return;
        setVoucherError('');
        try {
            const res = await voucherApi.getByCode(voucherCode.trim());
            if (res.data) {
                setSelectedVoucher(res.data);
                toast.success('Áp dụng mã giảm giá thành công!');
                setVoucherCode('');
            } else {
                setVoucherError('Mã giảm giá không hợp lệ.');
            }
        } catch (err: any) {
            setVoucherError(err.response?.data?.message || 'Mã giảm giá không tồn tại hoặc đã hết hạn.');
        }
    };

    const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const shippingFee = cartItems.length > 0 ? 15000 : 0;

    const computeDiscount = () => {
        if (!selectedVoucher) return 0;
        const vType = selectedVoucher.voucherType ?? selectedVoucher.discountType;
        const value = selectedVoucher.discountValue ?? selectedVoucher.value ?? 0;
        if (vType === 1 || vType === 'percentage' || vType === 'Percent') {
            return Math.min(subtotal * value / 100, selectedVoucher.maxDiscount || Infinity);
        }
        if (vType === 3 || vType === 'FreeShipping') {
            return shippingFee;
        }
        return value;
    };
    const discount = computeDiscount();
    const total = Math.max(0, subtotal + shippingFee - discount);

    const handleProceedToCheckout = () => {
        if (cartItems.length === 0) {
            toast.error('Giỏ hàng trống');
            return;
        }
        if (!defaultAddress) {
            toast.error('Vui lòng thêm địa chỉ giao hàng trước khi đặt hàng');
            navigate('/addresses');
            return;
        }
        if (paymentMethod === 1 && walletBalance < total) {
            toast.error(`Số dư ví không đủ. Cần ${total.toLocaleString()}đ, hiện có ${walletBalance.toLocaleString()}đ`);
            return;
        }
        setShowConfirm(true);
    };

    const handleCheckout = async () => {
        try {
            setIsCheckingOut(true);
            setShowConfirm(false);

            const firstItem = cartItems[0];
            const storeId = firstItem?.foodStore?.storeId || firstItem?.foodStore?.StoreId;

            const fullAddress = [defaultAddress.address, defaultAddress.addressDetail]
                .filter(Boolean).join(', ');

            const orderPayload = {
                storeId: Number(storeId),
                paymentMethod: paymentMethod,
                deliveryAddress: fullAddress || 'Địa chỉ chưa cập nhật',
                recipientPhone: defaultAddress.phone || '',
                recipientName: defaultAddress.recipientName || defaultAddress.label || 'Khách hàng',
                note: orderNote || '',
                deliveryFee: shippingFee,
                discount: discount,
                items: cartItems.map(item => ({
                    foodStoreId: item.id,
                    quantity: item.quantity,
                })),
            };

            console.log('Order payload:', orderPayload);

            const res = await orderApi.create(orderPayload);
            // Clear cart
            cartStore.clear();
            refreshCart();

            toast.success('Đặt hàng thành công! 🎉');

            const orderId = (res.data as any)?.id || (res.data as any)?.Id;
            if (orderId) {
                navigate(`/orders/${orderId}`);
            } else {
                navigate('/orders');
            }
        } catch (error: any) {
            console.error('Checkout error:', error);
            const msg = error.response?.data?.message
                || error.response?.data?.Message
                || error.response?.data?.title
                || 'Đặt hàng thất bại. Vui lòng thử lại.';
            toast.error(msg);
        } finally {
            setIsCheckingOut(false);
        }
    };

    if (isLoading) {
        return (
            <div className="p-4 bg-gray-50 min-h-screen space-y-4">
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-24 bg-gray-200 animate-pulse rounded-xl" />
                ))}
            </div>
        );
    }

    if (cartItems.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[80vh] text-center p-6 bg-white rounded-t-[2.5rem] mt-4 shadow-2xl">
                <div className="w-32 h-32 bg-orange-50 rounded-full flex items-center justify-center mb-6">
                    <ShoppingBag className="w-16 h-16 text-orange-200" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Giỏ hàng đang đợi!</h2>
                <p className="text-gray-500 mb-8 max-w-[250px]">Hãy thêm những món ăn yêu thích vào giỏ hàng và thưởng thức ngay.</p>
                <Button onClick={() => navigate('/')} className="px-10 py-6 rounded-2xl text-lg shadow-lg shadow-orange-200">
                    Khám phá menu
                </Button>
            </div>
        );
    }

    const storeName = cartItems[0]?.foodStore?.store?.name || cartItems[0]?.foodStore?.Store?.Name || 'Cửa hàng';

    return (
        <div className="bg-[#FCF9F5] min-h-screen pb-20">
            {/* Header */}
            <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-orange-100/50 px-4 py-4 mb-6">
                <div className="max-w-6xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate(-1)} className="p-2 hover:bg-orange-50 rounded-xl transition-colors">
                            <ArrowLeft className="w-5 h-5 text-[#C76E00]" />
                        </button>
                        <div>
                            <h1 className="text-xl font-black text-gray-900 tracking-tight uppercase italic flex items-center gap-2">
                                <ShoppingBag className="w-5 h-5 text-[#C76E00]" />
                                Giỏ hàng
                            </h1>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em] mt-0.5">
                                {storeName} · {cartItems.length} món
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* LEFT COLUMN: Items */}
                    <div className="lg:col-span-7 space-y-6">
                        <div className="flex items-center gap-2 px-2">
                            <div className="w-1 h-4 bg-[#C76E00] rounded-full" />
                            <h2 className="text-sm font-black text-gray-900 uppercase tracking-widest italic">Danh sách món ăn</h2>
                        </div>
                        
                        <div className="space-y-4">
                            {cartItems.map((item) => (
                                <Card key={item.id} className="p-4 bg-white/80 backdrop-blur-xl border border-orange-100/50 shadow-xl shadow-orange-900/5 rounded-3xl transition-all hover:shadow-2xl hover:shadow-orange-900/10 group">
                                    <div className="flex gap-4">
                                        <div className="relative shrink-0">
                                            <div className="w-24 h-24 rounded-2xl overflow-hidden border border-orange-100/30 group-hover:rotate-2 transition-transform shadow-inner">
                                                <img src={item.image} alt={item.name} className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-500"
                                                    onError={e => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&q=80'; }}
                                                />
                                            </div>
                                            <div className="absolute -top-2 -right-2 bg-[#C76E00] text-white w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shadow-lg shadow-orange-200 border-2 border-white">
                                                {item.quantity}
                                            </div>
                                        </div>
                                        
                                        <div className="flex-1 flex flex-col justify-between min-w-0">
                                            <div>
                                                <div className="flex justify-between items-start">
                                                    <h3 className="font-black text-gray-900 text-sm tracking-tight truncate group-hover:text-[#C76E00] transition-colors">{item.name}</h3>
                                                    <button className="text-gray-300 hover:text-red-500 transition-colors p-1" onClick={() => removeItem(item.id)}>
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                                {item.foodStore?.size && (
                                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Size: {item.foodStore.size?.name || ''}</p>
                                                )}
                                            </div>

                                            <div className="flex justify-between items-center mt-3">
                                                <span className="font-black text-[#C76E00] text-base tracking-tight">{(item.price * item.quantity).toLocaleString()} ₫</span>
                                                <div className="flex items-center bg-orange-50/50 rounded-xl p-1 border border-orange-100/30">
                                                    <button onClick={() => updateQuantity(item.id, -1)} className="w-8 h-8 rounded-lg flex items-center justify-center text-[#C76E00] hover:bg-white hover:shadow-sm transition-all active:scale-95">
                                                        <Minus className="w-4 h-4" />
                                                    </button>
                                                    <span className="text-sm font-black w-8 text-center text-gray-900">{item.quantity}</span>
                                                    <button onClick={() => updateQuantity(item.id, 1)} className="w-8 h-8 rounded-lg flex items-center justify-center text-[#C76E00] hover:bg-white hover:shadow-sm transition-all active:scale-95">
                                                        <Plus className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>

                        {/* Order Note */}
                        <Card className="p-5 bg-white/80 backdrop-blur-xl border border-orange-100/50 shadow-xl shadow-orange-900/5 rounded-3xl space-y-3">
                            <div className="flex items-center gap-2">
                                <MessageSquare className="w-4 h-4 text-[#C76E00]" />
                                <span className="text-xs font-black text-gray-900 uppercase tracking-widest italic">Ghi chú đơn hàng</span>
                            </div>
                            <textarea
                                className="w-full bg-orange-50/30 border border-orange-100/50 rounded-2xl p-4 text-sm resize-none outline-none focus:ring-2 focus:ring-[#C76E00]/20 placeholder-gray-300 font-medium italic transition-all"
                                rows={2}
                                value={orderNote}
                                onChange={e => setOrderNote(e.target.value)}
                                placeholder="Dặn dò tài xế hoặc nhà hàng nhé..."
                            />
                        </Card>
                    </div>

                    {/* RIGHT COLUMN: Summary & Details */}
                    <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-28">
                        {/* Delivery Address */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 px-2 text-[#C76E00]">
                                <MapPin className="w-4 h-4" />
                                <span className="text-xs font-black uppercase tracking-widest italic">Địa chỉ giao hàng</span>
                            </div>
                            <Link to="/addresses">
                                <Card className="p-4 bg-white/80 backdrop-blur-xl border border-orange-100/50 shadow-xl shadow-orange-900/5 rounded-3xl group transition-all hover:bg-white hover:-translate-y-1">
                                    <div className="flex items-center gap-4">
                                        <div className={cn(
                                            "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:rotate-6",
                                            defaultAddress ? "bg-orange-50 text-[#C76E00]" : "bg-gray-50 text-gray-300"
                                        )}>
                                            <MapPin className="w-6 h-6" />
                                        </div>
                                        {defaultAddress ? (
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-black text-gray-900 truncate uppercase tracking-tight">
                                                    {defaultAddress.recipientName}
                                                    {defaultAddress.phone ? ` · ${defaultAddress.phone}` : ''}
                                                </p>
                                                <p className="text-[11px] text-gray-500 font-medium italic truncate mt-0.5 opacity-80">
                                                    {defaultAddress.address}{defaultAddress.addressDetail ? `, ${defaultAddress.addressDetail}` : ''}
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="flex-1">
                                                <p className="text-sm font-black text-red-500 uppercase tracking-tight italic">Chưa có địa chỉ</p>
                                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Nhấp để thêm ngay</p>
                                            </div>
                                        )}
                                        <ChevronRight className="w-5 h-5 text-gray-300" />
                                    </div>
                                </Card>
                            </Link>
                        </div>

                        {/* Payment Method */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 px-2 text-[#C76E00]">
                                <CreditCard className="w-4 h-4" />
                                <span className="text-xs font-black uppercase tracking-widest italic">Thanh toán</span>
                            </div>
                            <Card className="bg-white/80 backdrop-blur-xl border border-orange-100/50 shadow-xl shadow-orange-900/5 rounded-3xl overflow-hidden">
                                {PAYMENT_METHODS.map((method) => {
                                    const Icon = method.icon;
                                    const isSelected = paymentMethod === method.id;
                                    return (
                                        <button
                                        key={method.id}
                                        onClick={() => setPaymentMethod(method.id)}
                                        className={cn(
                                            "w-full flex items-center gap-4 p-5 text-left transition-all border-[#C76E00] bg-orange-50/70",
                                            isSelected ? "border-l-4" : ""
                                        )}
                                    >
                                            <div className={cn(
                                                "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 bg-[#C76E00] text-white shadow-lg shadow-orange-200"
                                            )}>
                                                <Icon className="w-6 h-6" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-black uppercase tracking-tight text-[#C76E00]">
                                                    {method.name}
                                                </p>
                                                <p className="text-[10px] text-gray-400 font-bold italic opacity-70">{method.desc}</p>
                                            </div>
                                            <div className="w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 border-[#C76E00] bg-[#C76E00]">
                                                <div className="w-2.5 h-2.5 bg-white rounded-full" />
                                            </div>
                                        </button>
                                    );
                                })}
                            </Card>
                        </div>

                        {/* Order Summary Card */}
                        <Card className="p-6 bg-white/80 backdrop-blur-xl border border-orange-100/50 shadow-2xl shadow-orange-900/10 rounded-3xl space-y-5 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-100/20 rounded-full -mr-16 -mt-16 blur-2xl pointer-events-none" />
                            
                            <div className="space-y-3 relative z-10">
                                <div className="flex justify-between items-center group">
                                    <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Tạm tính ({cartItems.reduce((s, i) => s + i.quantity, 0)} món)</span>
                                    <span className="text-sm font-black text-gray-900">{subtotal.toLocaleString()} ₫</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Phí giao hàng</span>
                                    <span className="text-sm font-black text-gray-900">{shippingFee.toLocaleString()} ₫</span>
                                </div>

                                {/* Voucher Select Component integrated more beautifully */}
                                <div className="pt-2">
                                    <button onClick={() => setShowVoucherModal(true)} className="w-full flex items-center justify-between p-3 rounded-2xl bg-orange-50/50 border border-orange-100/50 hover:bg-orange-100/50 transition-all group">
                                        <div className="flex items-center gap-2">
                                            <Ticket className="w-4 h-4 text-[#C76E00]" />
                                            <span className="text-[10px] font-black text-[#C76E00] uppercase tracking-widest">Ưu đãi giảm giá</span>
                                        </div>
                                        {selectedVoucher ? (
                                            <div className="flex items-center gap-2">
                                                <Badge className="bg-[#C76E00] text-white text-[9px] font-black px-2">{selectedVoucher.code}</Badge>
                                                <button onClick={(e) => { e.stopPropagation(); setSelectedVoucher(null); }} className="text-gray-300 hover:text-red-500">
                                                    <Trash2 className="w-3 h-3" />
                                                </button>
                                            </div>
                                        ) : (
                                            <ChevronRight className="w-4 h-4 text-gray-300 group-hover:translate-x-1 transition-transform" />
                                        )}
                                    </button>
                                    
                                    {!selectedVoucher && (
                                        <div className="mt-3 flex gap-2">
                                            <Input
                                                placeholder="Nhập mã..."
                                                value={voucherCode}
                                                onChange={(e) => { setVoucherCode(e.target.value); setVoucherError(''); }}
                                                className="h-9 text-[11px] rounded-xl bg-white/50 border-orange-100 focus:ring-[#C76E00] transition-all"
                                            />
                                            <Button size="sm" className="h-9 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest bg-[#C76E00]" onClick={handleApplyVoucherCode}>
                                                Dùng
                                            </Button>
                                        </div>
                                    )}
                                    {voucherError && <p className="text-[9px] text-red-500 font-bold mt-1 px-1">{voucherError}</p>}
                                </div>

                                {discount > 0 && (
                                    <div className="flex justify-between items-center pt-2 text-emerald-600 animate-fade-in">
                                        <span className="text-[11px] font-black uppercase tracking-widest flex items-center gap-1">
                                            <Ticket className="w-3.5 h-3.5" /> Giảm giá
                                        </span>
                                        <span className="text-sm font-black">-{discount.toLocaleString()} ₫</span>
                                    </div>
                                )}
                            </div>

                            <div className="pt-5 border-t-2 border-dashed border-orange-100/50 relative z-10">
                                <div className="flex justify-between items-center mb-6">
                                    <div>
                                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Tổng thanh toán</p>
                                        <p className="text-3xl font-black text-[#C76E00] tracking-tighter shadow-orange-100">{total.toLocaleString()} ₫</p>
                                    </div>
                                    <div className="text-right">
                                        <Badge variant="outline" className="text-[8px] font-black uppercase tracking-widest border-orange-200 text-[#C76E00]">
                                            {PAYMENT_METHODS.find(m => m.id === paymentMethod)?.name}
                                        </Badge>
                                    </div>
                                </div>

                                <Button
                                    className="w-full py-7 text-sm font-black uppercase tracking-[0.1em] rounded-2xl bg-[#C76E00] hover:bg-[#A55B00] shadow-xl shadow-orange-200 active:scale-95 transition-all text-white border-b-4 border-[#8B4D00]"
                                    onClick={handleProceedToCheckout}
                                    disabled={isCheckingOut}
                                >
                                    {isCheckingOut ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                                    Xác nhận và đặt hàng
                                </Button>
                                <p className="text-[9px] text-gray-400 font-bold text-center mt-4 uppercase tracking-[0.2em] italic opacity-60">
                                    Cam kết giao hàng đúng hẹn
                                </p>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Confirmation Modal */}
            <Modal
                isOpen={showConfirm}
                onClose={() => setShowConfirm(false)}
                title="Xác nhận đặt hàng"
            >
                <div className="space-y-4">
                    <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Cửa hàng</span>
                            <span className="font-bold text-gray-900">{storeName}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Số lượng</span>
                            <span className="font-bold text-gray-900">{cartItems.reduce((s, i) => s + i.quantity, 0)} món</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Giao đến</span>
                            <span className="font-bold text-gray-900 text-right max-w-[200px] truncate">
                                {defaultAddress?.recipientName}
                            </span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Thanh toán</span>
                            <span className="font-bold text-gray-900">
                                {PAYMENT_METHODS.find(m => m.id === paymentMethod)?.name}
                            </span>
                        </div>
                        <hr className="border-dashed" />
                        <div className="flex justify-between">
                            <span className="text-gray-500 font-medium">Tổng cộng</span>
                            <span className="text-xl font-black text-orange-600">{total.toLocaleString()}đ</span>
                        </div>
                    </div>

                    {paymentMethod === 1 && walletBalance < total && (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-600">
                            Số dư ví không đủ. Cần {total.toLocaleString()}đ, hiện có {walletBalance.toLocaleString()}đ.
                        </div>
                    )}

                    <div className="flex gap-3 pt-2">
                        <Button
                            variant="outline"
                            className="flex-1 rounded-xl"
                            onClick={() => setShowConfirm(false)}
                            disabled={isCheckingOut}
                        >
                            Huỷ
                        </Button>
                        <Button
                            className="flex-1 rounded-xl shadow-lg shadow-orange-200"
                            onClick={handleCheckout}
                            disabled={isCheckingOut || (paymentMethod === 1 && walletBalance < total)}
                        >
                            {isCheckingOut ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                            Xác nhận đặt hàng
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Voucher Selection Modal */}
            <Modal
                isOpen={showVoucherModal}
                onClose={() => setShowVoucherModal(false)}
                title="Chọn mã giảm giá"
            >
                <div className="space-y-4">
                    <div className="flex gap-2">
                        <Input
                            placeholder="Nhập mã ưu đãi..."
                            value={voucherCode}
                            onChange={(e) => { setVoucherCode(e.target.value); setVoucherError(''); }}
                            className="h-11 rounded-xl"
                        />
                        <Button className="h-11 px-6 font-black uppercase tracking-widest text-[10px] bg-[#C76E00]" onClick={handleApplyVoucherCode}>
                            Áp dụng
                        </Button>
                    </div>
                    {voucherError && <p className="text-[10px] text-red-500 font-bold px-1">{voucherError}</p>}

                    <div className="pt-4 border-t border-gray-100">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 italic">Mã giảm giá khả dụng</p>
                        
                        <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-orange-100">
                            {availableVouchers.length === 0 ? (
                                <div className="bg-orange-50/50 rounded-2xl p-8 text-center border-2 border-dashed border-orange-100">
                                    <Ticket className="w-8 h-8 text-orange-200 mx-auto mb-2" />
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic">Hiện không có mã giảm giá nào</p>
                                </div>
                            ) : (
                                availableVouchers.map((v) => (
                                    <button
                                        key={v.id}
                                        onClick={() => {
                                            setSelectedVoucher(v);
                                            setShowVoucherModal(false);
                                            toast.success('Đã áp dụng mã giảm giá!');
                                        }}
                                        className={cn(
                                            "w-full flex gap-4 p-4 rounded-2xl border-2 transition-all group text-left",
                                            selectedVoucher?.id === v.id
                                                ? "border-[#C76E00] bg-orange-50/30"
                                                : "border-gray-50 bg-gray-50/30 hover:border-orange-100 hover:bg-orange-50/20"
                                        )}
                                    >
                                        <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-orange-100 flex items-center justify-center shrink-0">
                                            <Ticket className="w-6 h-6 text-[#C76E00]" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start">
                                                <p className="font-black text-xs uppercase tracking-tight text-gray-900">{v.code}</p>
                                                <Badge className="bg-[#C76E00]/10 text-[#C76E00] border-none text-[8px] px-1.5">
                                                    {(v.voucherType === 1 || v.discountType === 1) ? `-${v.discountValue}%` : `-${(v.discountValue || 0).toLocaleString()}đ`}
                                                </Badge>
                                            </div>
                                            <p className="text-[10px] text-gray-500 font-medium mt-1 truncate">
                                                {v.description || `Giảm giá cho đơn từ ${(v.minOrderAmount || 0).toLocaleString()}đ`}
                                            </p>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>

                    <Button variant="ghost" className="w-full mt-2 text-[10px] font-black uppercase tracking-widest text-gray-400" onClick={() => setShowVoucherModal(false)}>
                        Đóng
                    </Button>
                </div>
            </Modal>
        </div>
    );
}
