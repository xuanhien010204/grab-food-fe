import { Minus, Plus, Trash2, MapPin, ShoppingBag, CreditCard, Tag, Ticket, ChevronRight, Loader2, Wallet, Banknote, ArrowLeft } from 'lucide-react';
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
    { id: 2, name: 'Tiền mặt', icon: Banknote, desc: 'Thanh toán khi nhận hàng' },
    { id: 1, name: 'Ví GrabFood', icon: Wallet, desc: 'Thanh toán bằng số dư ví' },
];

export default function CartPage() {
    const navigate = useNavigate();
    const [cartItems, setCartItems] = useState<any[]>([]);
    const [vouchers, setVouchers] = useState<any[]>([]);
    const [selectedVoucher, setSelectedVoucher] = useState<any>(null);
    const [voucherCode, setVoucherCode] = useState('');
    const [voucherError, setVoucherError] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isCheckingOut, setIsCheckingOut] = useState(false);
    const [defaultAddress, setDefaultAddress] = useState<any>(null);
    const [paymentMethod, setPaymentMethod] = useState(2);
    const [walletBalance, setWalletBalance] = useState(0);
    const [orderNote, setOrderNote] = useState('');
    const [showConfirm, setShowConfirm] = useState(false);

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

        fetchVouchers();
        fetchDefaultAddress();
        fetchWalletBalance();
    }, [navigate]);

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
            const res = await voucherApi.getActive().catch(() => ({ data: [] }));
            const data = res.data;
            setVouchers(Array.isArray(data) ? data : (data as any)?.vouchers || []);
        } catch { }
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
        <div className="bg-gray-50 min-h-screen pb-40">
            {/* Header */}
            <div className="bg-white sticky top-0 z-30 border-b border-gray-100 px-4 py-3 flex items-center gap-3">
                <button onClick={() => navigate(-1)} className="p-1">
                    <ArrowLeft className="w-5 h-5 text-gray-700" />
                </button>
                <div className="flex-1">
                    <h1 className="text-lg font-bold text-gray-900">Giỏ hàng</h1>
                    <p className="text-xs text-gray-400">{storeName} · {cartItems.length} món</p>
                </div>
                <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
                    <ShoppingBag className="w-5 h-5 text-orange-500" />
                </div>
            </div>

            <div className="p-4 space-y-6">
                {/* Cart Items */}
                <div className="space-y-3">
                    {cartItems.map((item) => (
                        <Card key={item.id} className="p-3 border-none shadow-sm hover:shadow-md transition-all duration-300">
                            <div className="flex space-x-3">
                                <div className="relative">
                                    <img src={item.image} alt={item.name} className="w-20 h-20 rounded-2xl object-cover shadow-sm"
                                        onError={e => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&q=80'; }}
                                    />
                                    <Badge className="absolute -top-2 -right-2 bg-orange-600 border-2 border-white text-xs">{item.quantity}</Badge>
                                </div>
                                <div className="flex-1 flex flex-col justify-between min-w-0">
                                    <div>
                                        <div className="flex justify-between items-start">
                                            <h3 className="font-bold text-gray-900 text-sm leading-tight truncate pr-2">{item.name}</h3>
                                            <button className="text-gray-300 hover:text-red-500 transition-colors shrink-0" onClick={() => removeItem(item.id)}>
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                        {item.foodStore?.size && (
                                            <p className="text-[10px] text-gray-400 mt-0.5">Size: {item.foodStore.size?.name || ''}</p>
                                        )}
                                    </div>

                                    <div className="flex justify-between items-center mt-2">
                                        <span className="font-extrabold text-orange-600">{(item.price * item.quantity).toLocaleString()}đ</span>
                                        <div className="flex items-center bg-gray-50 rounded-xl p-1 border border-gray-100">
                                            <button onClick={() => updateQuantity(item.id, -1)} className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-orange-600 hover:bg-white transition-all">
                                                <Minus className="w-3.5 h-3.5" />
                                            </button>
                                            <span className="text-sm font-bold w-7 text-center text-gray-900">{item.quantity}</span>
                                            <button onClick={() => updateQuantity(item.id, 1)} className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-orange-600 hover:bg-white transition-all">
                                                <Plus className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>

                {/* Address Section */}
                <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-gray-900 font-bold">
                        <MapPin className="w-4 h-4 text-orange-600" />
                        <span className="text-sm">Địa chỉ giao hàng</span>
                    </div>
                    <Link to="/addresses" className="block">
                        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                <div className={cn(
                                    "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                                    defaultAddress ? "bg-orange-500 text-white" : "bg-gray-100 text-gray-400"
                                )}>
                                    <MapPin className="w-5 h-5" />
                                </div>
                                {defaultAddress ? (
                                    <div className="min-w-0">
                                        <p className="text-sm font-bold text-gray-900 truncate">
                                            {defaultAddress.recipientName}
                                            {defaultAddress.phone ? ` · ${defaultAddress.phone}` : ''}
                                        </p>
                                        <p className="text-xs text-gray-500 truncate">
                                            {defaultAddress.address}{defaultAddress.addressDetail ? `, ${defaultAddress.addressDetail}` : ''}
                                        </p>
                                    </div>
                                ) : (
                                    <div>
                                        <p className="text-sm font-medium text-red-500">Chưa có địa chỉ giao hàng</p>
                                        <p className="text-xs text-gray-400">Nhấn để thêm địa chỉ</p>
                                    </div>
                                )}
                            </div>
                            <ChevronRight className="w-5 h-5 text-gray-400 shrink-0" />
                        </div>
                    </Link>
                </div>

                {/* Payment Method */}
                <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-gray-900 font-bold">
                        <CreditCard className="w-4 h-4 text-orange-600" />
                        <span className="text-sm">Phương thức thanh toán</span>
                    </div>
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        {PAYMENT_METHODS.map((method) => {
                            const Icon = method.icon;
                            const isSelected = paymentMethod === method.id;
                            return (
                                <button
                                    key={method.id}
                                    onClick={() => setPaymentMethod(method.id)}
                                    className={cn(
                                        "w-full flex items-center gap-3 p-4 text-left transition-colors border-b border-gray-50 last:border-b-0",
                                        isSelected ? "bg-orange-50" : "hover:bg-gray-50"
                                    )}
                                >
                                    <div className={cn(
                                        "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                                        isSelected ? "bg-orange-500 text-white shadow-md" : "bg-gray-100 text-gray-400"
                                    )}>
                                        <Icon className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={cn("text-sm font-bold", isSelected ? "text-orange-600" : "text-gray-900")}>
                                            {method.name}
                                        </p>
                                        <p className="text-xs text-gray-400">{method.desc}</p>
                                        {method.id === 1 && (
                                            <p className="text-xs text-emerald-500 font-medium mt-0.5">
                                                Số dư: {walletBalance.toLocaleString()}đ
                                            </p>
                                        )}
                                    </div>
                                    <div className={cn(
                                        "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0",
                                        isSelected ? "border-orange-500 bg-orange-500" : "border-gray-300"
                                    )}>
                                        {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Voucher Section */}
                <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-gray-900 font-bold">
                        <Tag className="w-4 h-4 text-orange-600" />
                        <span className="text-sm">Ưu đãi giảm giá</span>
                    </div>

                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 space-y-3">
                        <div className="flex gap-2">
                            <Input
                                placeholder="Nhập mã giảm giá..."
                                value={voucherCode}
                                onChange={(e) => { setVoucherCode(e.target.value); setVoucherError(''); }}
                                className="rounded-xl text-sm flex-1"
                            />
                            <Button size="sm" className="rounded-xl px-4 shrink-0" onClick={handleApplyVoucherCode}>
                                Áp dụng
                            </Button>
                        </div>
                        {voucherError && <p className="text-xs text-red-500">{voucherError}</p>}

                        {selectedVoucher && (
                            <div className="flex items-center justify-between p-3 rounded-xl border border-orange-200 bg-orange-50">
                                <div className="flex items-center gap-2">
                                    <Ticket className="w-4 h-4 text-orange-500" />
                                    <span className="text-sm font-bold text-orange-600">
                                        {selectedVoucher.code || selectedVoucher.title || 'Voucher'}
                                    </span>
                                </div>
                                <button onClick={() => setSelectedVoucher(null)} className="text-xs text-gray-400 hover:text-red-500">
                                    Bỏ
                                </button>
                            </div>
                        )}

                        {!selectedVoucher && vouchers.length > 0 && (
                            <div className="space-y-2">
                                <p className="text-xs text-gray-400">Voucher có sẵn:</p>
                                {vouchers.slice(0, 3).map(v => (
                                    <button
                                        key={v.id}
                                        onClick={() => setSelectedVoucher(v)}
                                        className="w-full flex items-center justify-between p-3 rounded-xl border border-gray-100 bg-gray-50/50 hover:border-orange-300 hover:bg-orange-50 transition-all text-left"
                                    >
                                        <div className="flex items-center space-x-3">
                                            <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center shadow-sm">
                                                <Ticket className="w-4 h-4 text-orange-600" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-gray-900">{v.title || v.code || v.name}</p>
                                                <p className="text-[10px] text-gray-500">
                                                    Giảm {(v.discountValue || v.value)?.toLocaleString()}{(v.voucherType === 1 || v.discountType === 'percentage') ? '%' : 'đ'}
                                                </p>
                                            </div>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-gray-300" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Order Note */}
                <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-gray-900 font-bold">
                        <span className="text-sm">💬 Ghi chú đơn hàng</span>
                    </div>
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                        <textarea
                            className="w-full text-sm resize-none outline-none placeholder-gray-300"
                            rows={2}
                            value={orderNote}
                            onChange={e => setOrderNote(e.target.value)}
                            placeholder="Ghi chú cho tài xế hoặc cửa hàng..."
                        />
                    </div>
                </div>

                {/* Price Summary */}
                <Card className="p-5 border-none shadow-sm space-y-3 bg-white rounded-2xl">
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-400 font-medium">Tạm tính ({cartItems.reduce((s, i) => s + i.quantity, 0)} món)</span>
                        <span className="font-bold text-gray-900">{subtotal.toLocaleString()}đ</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-400 font-medium">Phí giao hàng</span>
                        <span className="font-bold text-gray-900">{shippingFee.toLocaleString()}đ</span>
                    </div>
                    {discount > 0 && (
                        <div className="flex justify-between text-sm text-emerald-600">
                            <span className="font-medium flex items-center">
                                <Ticket className="w-3 h-3 mr-1" /> Giảm giá
                            </span>
                            <span className="font-bold">-{discount.toLocaleString()}đ</span>
                        </div>
                    )}
                    <div className="pt-3 border-t border-dashed border-gray-100 flex justify-between items-center">
                        <div>
                            <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Tổng thanh toán</p>
                            <span className="text-2xl font-black text-orange-600">{total.toLocaleString()}đ</span>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] text-gray-400">{PAYMENT_METHODS.find(m => m.id === paymentMethod)?.name}</p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Checkout Button */}
            <div className="fixed bottom-20 left-4 right-4 z-40">
                <Button
                    className="w-full py-6 text-lg font-bold rounded-2xl shadow-2xl shadow-orange-300 transform active:scale-95 transition-transform"
                    onClick={handleProceedToCheckout}
                    disabled={isCheckingOut}
                >
                    {isCheckingOut ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                    ĐẶT HÀNG · {total.toLocaleString()}đ
                </Button>
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
        </div>
    );
}
