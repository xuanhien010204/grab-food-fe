import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart, Star, Loader2, Plus, Minus } from 'lucide-react';
import { foodApi, userApi } from '../../../api/api';
import type { FoodDto } from '../../../types/swagger';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { toast } from 'sonner';

export default function FoodDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [food, setFood] = useState<FoodDto | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [quantity, setQuantity] = useState(1);
    const [isAddingToCart, setIsAddingToCart] = useState(false);

    useEffect(() => {
        const fetchFood = async () => {
            if (!id) return;
            try {
                setIsLoading(true);
                const res = await foodApi.getById(Number(id));
                setFood(res.data as any);
            } catch (err) {
                console.error('Failed to fetch food:', err);
                setError('Không thể tải thông tin món ăn.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchFood();
    }, [id]);

    const handleAddToCart = async () => {
        if (!food || !id || !food.isAvailable) {
            toast.error('Món ăn hiện không có sẵn');
            return;
        }

        try {
            setIsAddingToCart(true);
            const cartRes = await userApi.getCart().catch(() => ({ data: { orderList: {} } }));
            const currentOrderList = (cartRes.data as any)?.orderList || {};

            // Create FoodStore-like object for cart compatibility
            const cartItem = {
                id: `food-${food.id}`,
                foodId: food.id,
                food: food,
                price: food.price || 0,
                isAvailable: food.isAvailable
            };

            const newOrderList = {
                ...currentOrderList,
                [`food-${food.id}`]: {
                    quantity: ((currentOrderList[`food-${food.id}`] as any)?.quantity || 0) + quantity,
                    foodStore: cartItem
                }
            };

            await userApi.updateCart({ orderList: newOrderList });
            toast.success(`Đã thêm ${quantity} ${food.name} vào giỏ hàng`);
            navigate('/cart');
        } catch (error) {
            console.error('Cart error:', error);
            toast.error('Không thể thêm vào giỏ hàng. Vui lòng đăng nhập.');
        } finally {
            setIsAddingToCart(false);
        }
    };

    const updateQuantity = (delta: number) => {
        setQuantity(prev => Math.max(1, prev + delta));
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
            </div>
        );
    }

    if (error || !food) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
                <p className="text-gray-500 mb-4">{error || 'Không tìm thấy món ăn.'}</p>
                <button onClick={() => navigate(-1)} className="text-orange-500 font-semibold">
                    ← Quay lại
                </button>
            </div>
        );
    }

    return (
        <div className="pb-24 bg-white min-h-screen">
            {/* Header Image */}
            <div className="relative h-[280px]">
                <img
                    src={food.imageSrc || ''}
                    alt={food.name}
                    className="w-full h-full object-cover"
                />
                <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start bg-gradient-to-b from-black/50 to-transparent">
                    <button
                        onClick={() => navigate(-1)}
                        className="bg-white/20 backdrop-blur-md p-2 rounded-full text-white hover:bg-white/30 transition-colors"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <button className="bg-white/20 backdrop-blur-md p-2 rounded-full text-white hover:bg-white/30 transition-colors">
                        <Heart className="w-6 h-6" />
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="p-5 -mt-6 bg-white rounded-t-3xl relative z-10">
                <div className="flex justify-between items-start mb-3">
                    <h1 className="text-2xl font-bold text-gray-900">{food.name}</h1>
                    <Badge
                        variant={food.isAvailable ? 'success' : 'destructive'}
                        className="shrink-0 ml-2"
                    >
                        {food.isAvailable ? 'Còn hàng' : 'Hết hàng'}
                    </Badge>
                </div>

                <div className="flex items-center space-x-3 text-sm text-gray-500 mb-4">
                    <span className="flex items-center text-yellow-500 font-bold">
                        <Star className="w-4 h-4 fill-yellow-500 mr-1" />
                        4.8
                    </span>
                    <span>•</span>
                    <span>{food.foodTypeName}</span>
                </div>

                <div className="bg-orange-50 rounded-xl p-4 mb-6">
                    <p className="text-xs text-orange-600 font-medium mb-1">Giá</p>
                    <p className="text-2xl font-bold text-orange-600">
                        {food.price != null ? food.price.toLocaleString('vi-VN') + ' ₫' : 'Liên hệ'}
                    </p>
                </div>

                {/* QUANTITY SELECTOR & ORDER */}
                {food.isAvailable ? (
                    <div className="space-y-6">
                        <div>
                            <h3 className="font-bold text-gray-900 mb-3">📦 Số lượng</h3>
                            <div className="flex items-center justify-between bg-gray-50 rounded-xl p-4">
                                <div className="flex items-center space-x-4">
                                    <button
                                        onClick={() => updateQuantity(-1)}
                                        disabled={quantity <= 1}
                                        className="w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                                    >
                                        <Minus className="w-5 h-5" />
                                    </button>
                                    <span className="text-xl font-bold text-gray-900 min-w-[2rem] text-center">
                                        {quantity}
                                    </span>
                                    <button
                                        onClick={() => updateQuantity(1)}
                                        className="w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors"
                                    >
                                        <Plus className="w-5 h-5" />
                                    </button>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-gray-500">Tổng cộng</p>
                                    <p className="text-lg font-bold text-orange-600">
                                        {((food.price || 0) * quantity).toLocaleString('vi-VN')} ₫
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="sticky bottom-4 bg-white pt-4 border-t">
                            <Button
                                onClick={handleAddToCart}
                                isLoading={isAddingToCart}
                                disabled={!food.isAvailable}
                                className="w-full h-12 text-lg font-semibold"
                            >
                                🛒 Thêm vào giỏ hàng
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
                        <p className="text-red-600 font-medium">Món ăn hiện không có sẵn</p>
                    </div>
                )}

                <div className="space-y-4">
                    <div>
                        <h3 className="font-bold text-gray-900 mb-2">📝 Thông tin</h3>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-gray-50 rounded-lg p-3">
                                <p className="text-xs text-gray-400">Mã món</p>
                                <p className="text-sm font-semibold text-gray-800">#{food.id}</p>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-3">
                                <p className="text-xs text-gray-400">Loại món</p>
                                <p className="text-sm font-semibold text-gray-800">{food.foodTypeName || 'N/A'}</p>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-3">
                                <p className="text-xs text-gray-400">Trạng thái</p>
                                <p className={`text-sm font-semibold ${food.isAvailable ? 'text-green-600' : 'text-red-500'}`}>
                                    {food.isAvailable ? 'Đang bán' : 'Ngừng bán'}
                                </p>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-3">
                                <p className="text-xs text-gray-400">Mã loại</p>
                                <p className="text-sm font-semibold text-gray-800">#{food.foodTypeId}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
