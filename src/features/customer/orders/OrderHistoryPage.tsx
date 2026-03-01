import { MapPin, Package2, Calendar, Clock } from 'lucide-react';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { orderApi } from '../../../api/api';

const STATUS_MAP: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' | 'success' | 'warning' | 'info' }> = {
    '0': { label: 'Chờ xử lý', variant: 'warning' },
    '1': { label: 'Đã xác nhận', variant: 'info' },
    '2': { label: 'Đang chuẩn bị', variant: 'info' },
    '3': { label: 'Đang giao', variant: 'info' },
    '4': { label: 'Đã giao', variant: 'success' },
    '5': { label: 'Hoàn thành', variant: 'success' },
    '6': { label: 'Đã hủy', variant: 'destructive' },
};

export default function OrderHistoryPage() {
    const navigate = useNavigate();
    const [orders, setOrders] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            toast.error('Vui lòng đăng nhập để xem đơn hàng');
            navigate('/login');
            return;
        }

        const fetchOrders = async () => {
            try {
                const res = await orderApi.getHistory();
                // Swagger doesn't define exact shape, assuming Array.isArray(res.data)
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
        <div className="p-4 bg-gray-50 min-h-screen pb-24">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Lịch sử</h1>
                    <p className="text-sm text-gray-500">Xem lại các món ngon bạn đã dùng</p>
                </div>
                <div className="bg-orange-100 p-2 rounded-xl">
                    <Clock className="w-6 h-6 text-orange-600" />
                </div>
            </div>

            <div className="space-y-4">
                {orders.map((order) => {
                    const status = STATUS_MAP[String(order.status)] || { label: 'Chờ xử lý', variant: 'secondary' };

                    return (
                        <Card key={order.id} className="p-0 overflow-hidden border-none shadow-sm hover:shadow-xl transition-all duration-300 group">
                            <div className="p-4 bg-white">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center">
                                            <Package2 className="w-5 h-5 text-gray-400" />
                                        </div>
                                        <div>
                                            <span className="font-bold text-gray-900 block truncate max-w-[150px]">Đơn #{String(order.id || '').slice(-6).toUpperCase()}</span>
                                            <div className="flex items-center text-[10px] text-gray-400">
                                                <Calendar className="w-3 h-3 mr-1" />
                                                {new Date(order.purchaseDate || Date.now()).toLocaleDateString('vi-VN')}
                                            </div>
                                        </div>
                                    </div>
                                    <Badge variant={status.variant} className="rounded-lg px-2 py-1 uppercase text-[10px] tracking-wider">
                                        {status.label}
                                    </Badge>
                                </div>

                                {order.items && order.items.length > 0 ? (
                                    <div className="space-y-2 mb-4">
                                        {order.items.map((line: any, idx: number) => (
                                            <div key={idx} className="flex justify-between text-sm">
                                                <span className="text-gray-600 truncate mr-2">
                                                    {line.foodName || 'Sản phẩm'} <span className="text-gray-400">x{line.quantity}</span>
                                                </span>
                                                <span className="text-gray-900 font-medium whitespace-nowrap">{(line.total || (line.price || 0) * (line.quantity || 0)).toLocaleString()}đ</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="mb-4 text-sm text-gray-500">
                                        {order.totalItems || 0} món · {order.storeName || 'Cửa hàng'}
                                    </div>
                                )}

                                <div className="flex items-start text-xs text-gray-400 mb-4 bg-gray-50 p-2 rounded-lg">
                                    <MapPin className="w-3 h-3 mr-1 mt-0.5 shrink-0 text-orange-400" />
                                    <span className="line-clamp-1">{order.deliveryAddress || order.storeAddress || 'Địa chỉ đã lưu'}</span>
                                </div>

                                <div className="flex items-center justify-between pt-4 border-t border-gray-100 bg-gray-50/30">
                                    <div>
                                        <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Tổng cộng</p>
                                        <span className="text-xl font-extrabold text-orange-600">{(order.total || 0).toLocaleString()}đ</span>
                                    </div>
                                    <div className="flex space-x-2">
                                        <Link to={`/orders/${order.id}`}>
                                            <Button variant="ghost" size="sm" className="h-10 px-4 rounded-xl text-xs hover:bg-gray-100">
                                                Chi tiết
                                            </Button>
                                        </Link>
                                        <Button size="sm" className="h-10 px-4 rounded-xl text-xs shadow-md shadow-orange-100">
                                            Đặt lại
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}
