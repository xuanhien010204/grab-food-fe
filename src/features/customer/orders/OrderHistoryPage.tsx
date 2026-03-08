import { ArrowLeft, History, Package2, Store } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { orderApi } from '../../../api/api';
import { cartStore } from '../../../utils/cartStore';
import { cn } from '../../../lib/utils';
import { authStorage } from '../../../utils/auth';

const getStatusConfig = (status: any) => {
    const s = String(status);
    switch (s) {
        case '0': return { label: 'Chờ xử lý', color: 'text-amber-700', bgColor: 'bg-orange-50' };
        case '1': return { label: 'Đã xác nhận', color: 'text-blue-700', bgColor: 'bg-blue-50' };
        case '2': return { label: 'Đang chuẩn bị', color: 'text-indigo-700', bgColor: 'bg-indigo-50' };
        case '3': return { label: 'Đang giao', color: 'text-purple-700', bgColor: 'bg-purple-50' };
        case '4': return { label: 'Đã giao', color: 'text-emerald-700', bgColor: 'bg-emerald-50' };
        case '5': return { label: 'Hoàn thành', color: 'text-green-700', bgColor: 'bg-green-50' };
        case '6': return { label: 'Đã hủy', color: 'text-red-700', bgColor: 'bg-red-100' };
        default: return { label: 'Chờ xử lý', color: 'text-gray-500', bgColor: 'bg-gray-50' };
    }
};

export default function OrderHistoryPage() {
    const navigate = useNavigate();
    const [orders, setOrders] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const token = authStorage.getToken();
        if (!token) {
            toast.error('Vui lòng đăng nhập để xem đơn hàng');
            navigate('/login');
            return;
        }

        const fetchOrders = async () => {
            try {
                const res = await orderApi.getHistory();
                setOrders(Array.isArray(res.data) ? res.data : []);
            } catch (error) {
                console.error("Failed to fetch orders", error);
                toast.error("Không thể tải lịch sử đơn hàng");
            } finally {
                setIsLoading(false);
            }
        };
        fetchOrders();
    }, [navigate]);

    const handleReorder = async (order: any) => {
        let itemsToReorder = order.items;

        // If items are missing (common in list view), fetch full details
        if (!itemsToReorder || itemsToReorder.length === 0) {
            const loadingToast = toast.loading("Đang tải chi tiết đơn hàng...");
            try {
                const res = await orderApi.getById(order.id);
                const fullOrder = res.data;
                itemsToReorder = fullOrder.items;
                
                if (!itemsToReorder || itemsToReorder.length === 0) {
                    toast.error("Không tìm thấy chi tiết món ăn. Không thể đặt lại.", { id: loadingToast });
                    return;
                }
                toast.dismiss(loadingToast);
            } catch (error) {
                console.error("Failed to fetch order details for reorder", error);
                toast.error("Không thể tải thông tin đơn hàng.", { id: loadingToast });
                return;
            }
        }

        cartStore.clear();
        for (const item of itemsToReorder) {
            const mockFoodStore = {
                id: item.foodStoreId,
                storeId: item.storeId || order.storeId,
                price: item.price || (item.total / item.quantity),
                food: {
                    name: item.foodName,
                    imageSrc: item.foodImage || item.imageSrc || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&q=80'
                },
                store: {
                    name: order.storeName
                }
            };
            cartStore.forceAddItem(String(item.foodStoreId), mockFoodStore, item.quantity);
        }
        toast.success("Đã thêm các món vào giỏ hàng!");
        navigate('/cart');
    };

    if (isLoading) {
        return (
            <div className="p-4 bg-gray-50 min-h-screen space-y-4">
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-32 bg-gray-200 animate-pulse rounded-xl" />
                ))}
            </div>
        );
    }

    if (orders.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[80vh] text-center p-6 bg-white rounded-t-[2.5rem] mt-4 shadow-2xl">
                <div className="w-24 h-24 bg-orange-50 rounded-full flex items-center justify-center mb-6 animate-bounce">
                    <Package2 className="w-12 h-12 text-orange-500" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Hộp cơm đang đợi bạn!</h2>
                <p className="text-gray-500 mb-8 max-w-[250px]">Lịch sử đơn hàng hiện đang trống. Hãy bắt đầu hành trình ẩm thực của bạn ngay.</p>
                <Link to="/">
                    <Button className="px-10 py-6 rounded-2xl text-lg shadow-lg shadow-orange-200">
                        Đặt món ngay
                    </Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="bg-[#FCF9F5] min-h-screen pb-32">
            {/* Header */}
            <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-orange-100/50 px-4 py-4 mb-8">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate(-1)} className="p-2 hover:bg-orange-50 rounded-xl transition-colors">
                            <ArrowLeft className="w-5 h-5 text-[#C76E00]" />
                        </button>
                        <div>
                            <h1 className="text-xl font-black text-gray-900 tracking-tight uppercase italic flex items-center gap-2">
                                <History className="w-5 h-5 text-[#C76E00]" />
                                Đơn hàng
                            </h1>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em] mt-0.5">
                                Lịch sử mua sắm của bạn
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-8">

                <div className="grid grid-cols-1 gap-6">
                    {orders.map((order) => {
                        const status = getStatusConfig(order.status);
                        return (
                            <Card
                                key={order.id}
                                className="bg-white/80 backdrop-blur-xl border border-orange-100/50 rounded-3xl overflow-hidden shadow-xl shadow-orange-900/5 transition-all hover:shadow-2xl hover:shadow-orange-900/10 hover:-translate-y-1 group border-l-4 border-l-[#C76E00]"
                            >
                                <div className="p-6">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center border border-orange-100 group-hover:rotate-6 transition-transform shadow-sm">
                                                <Package2 className="w-6 h-6 text-[#C76E00]" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-0.5">Mã đơn hàng</p>
                                                <p className="text-sm font-black text-gray-900 uppercase tracking-tight">#{order.id.toString().slice(-8).toUpperCase()}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className={cn("px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border", status.bgColor, status.color)}>
                                                {status.label}
                                            </div>
                                            <p className="text-[10px] text-gray-400 font-bold mt-2 uppercase tracking-widest">
                                                {new Date(order.orderDate).toLocaleDateString('vi-VN')}
                                            </p>
                                        </div>
                                    </div>

                                    {order.items && order.items.length > 0 ? (
                                        <div className="bg-orange-50/30 rounded-2xl p-4 mb-6 border border-orange-100/30">
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center gap-3">
                                                    <Store className="w-4 h-4 text-[#C76E00]" />
                                                    <span className="text-xs font-black text-gray-900 uppercase tracking-tight">{order.storeName || 'Cửa hàng'}</span>
                                                </div>
                                                <span className="text-[9px] font-black text-[#C76E00] uppercase tracking-widest bg-orange-100/50 px-2 py-1 rounded-lg">
                                                    {order.totalItems || order.items.length} món
                                                </span>
                                            </div>
                                            <div className="space-y-2">
                                                {order.items.slice(0, 2).map((line: any, idx: number) => (
                                                    <div key={idx} className="flex justify-between text-[11px] text-gray-600 font-medium">
                                                        <span className="flex items-center gap-2">
                                                            <span className="w-1 h-1 rounded-full bg-[#C76E00]/30" />
                                                            {line.foodName || 'Sản phẩm'} x{line.quantity}
                                                        </span>
                                                        <span className="font-bold">{(line.total || (line.price || 0) * (line.quantity || 0)).toLocaleString()} ₫</span>
                                                    </div>
                                                ))}
                                                {order.items.length > 2 && (
                                                    <p className="text-[9px] text-[#C76E00] font-black uppercase tracking-widest pt-1 italic pl-3">
                                                        + {order.items.length - 2} món khác
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="mb-6 p-4 bg-orange-50/30 rounded-2xl border border-orange-100/30 flex items-center justify-between">
                                            <div className="flex items-center gap-3 text-[11px] font-bold text-gray-500">
                                                <Store className="w-4 h-4 text-[#C76E00]/50" />
                                                <span className="truncate max-w-[150px]">{order.storeName || 'Cửa hàng'}</span>
                                            </div>
                                            <span className="text-[10px] font-black text-[#C76E00] uppercase tracking-widest">
                                                {order.totalItems || 0} món ăn đã đặt
                                            </span>
                                        </div>
                                    )}

                                    <div className="flex items-center justify-between pt-4 border-t border-orange-100/50">
                                        <div>
                                            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-0.5">Tổng thanh toán</p>
                                            <p className="text-lg font-black text-[#C76E00] tracking-tight">
                                                {(order.totalAmount || order.total || 0).toLocaleString('vi-VN')} ₫
                                            </p>
                                        </div>
                                        <div className="flex gap-2">
                                            <Link to={`/orders/${order.id}`}>
                                                <Button
                                                    variant="outline"
                                                    className="h-10 px-5 rounded-xl text-[10px] font-black uppercase tracking-widest border-orange-100 text-[#C76E00] hover:bg-orange-50 active:scale-95 transition-all"
                                                >
                                                    Chi tiết
                                                </Button>
                                            </Link>
                                            <Button
                                                onClick={() => handleReorder(order)}
                                                className="bg-[#C76E00] hover:bg-[#A55B00] text-white px-6 py-2.5 rounded-xl font-bold transition-all text-[10px] uppercase tracking-widest active:scale-95 shadow-md shadow-orange-200"
                                            >
                                                Đặt món lại
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
