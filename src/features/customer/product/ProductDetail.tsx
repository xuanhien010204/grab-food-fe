import { ArrowLeft, Heart, Minus, Plus, Star, MapPin, Clock, ShoppingCart } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { foodStoreApi, favoriteApi } from '../../../api/api';
import type { FoodStoreDto } from '../../../types/swagger';
import { authStorage } from '../../../utils/auth';
import { cartStore } from '../../../utils/cartStore';

export default function ProductDetail() {
    const navigate = useNavigate();
    const location = useLocation();
    const { id } = useParams();
    const [quantity, setQuantity] = useState(1);
    const [note, setNote] = useState('');
    const [product, setProduct] = useState<FoodStoreDto | null>(
        // Use passed state from StoreDetailPage if available (avoids extra API call)
        (location.state as any)?.foodStore || null
    );
    const [isLoading, setIsLoading] = useState(!(location.state as any)?.foodStore);
    const [isAdding, setIsAdding] = useState(false);
    const [isFav, setIsFav] = useState(false);

    useEffect(() => {
        // Only fetch if we don't have data from navigation state
        if (!product && id) {
            setIsLoading(true);
            // Try fetching from store context if storeId is known
            foodStoreApi.getAll()
                .then(res => {
                    const found = res.data.find(f => f.id === id);
                    setProduct(found || null);
                })
                .catch(() => toast.error('Không thể tải thông tin món ăn'))
                .finally(() => setIsLoading(false));
        }
    }, [id]);

    useEffect(() => {
        if (product?.food?.id) {
            favoriteApi.checkFood(product.food.id)
                .then(res => {
                    // API returns { isFavorited: bool }
                    const d = res.data as any;
                    setIsFav(!!(d?.isFavorited ?? d?.IsFavorited));
                })
                .catch(() => { });
        }
    }, [product?.food?.id]);

    const toggleFavFood = async () => {
        if (!product?.food?.id) return;
        try {
            if (isFav) {
                await favoriteApi.removeFood(product.food.id);
                setIsFav(false);
                toast.success('Đã bỏ yêu thích');
            } else {
                await favoriteApi.addFood(product.food.id);
                setIsFav(true);
                toast.success('Đã thêm yêu thích ♥');
            }
        } catch { toast.error('Lỗi yêu thích'); }
    };

    const handleAddToCart = () => {
        if (!product || !id) return;
        if (!authStorage.getToken()) {
            toast.error('Vui lòng đăng nhập để đặt hàng');
            navigate('/login');
            return;
        }

        setIsAdding(true);
        const result = cartStore.addItem(id, product, quantity);

        if (result === 'conflict') {
            if (window.confirm('Bạn đã có đơn từ quán khác. Tạo mới đơn hàng?')) {
                cartStore.forceAddItem(id, product, quantity);
                toast.success(`${product.food?.name} đã thêm vào giỏ 🛒`);
                navigate('/cart');
            }
            setIsAdding(false);
            return;
        }

        toast.success(`${product.food?.name} đã thêm vào giỏ 🛒`);
        setIsAdding(false);
        navigate('/cart');
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!product) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
                <p className="text-gray-500 mb-4">Không tìm thấy món ăn.</p>
                <button onClick={() => navigate(-1)} className="text-orange-500 font-semibold">← Quay lại</button>
            </div>
        );
    }

    const total = product.price * quantity;

    return (
        <div className="bg-gray-50 min-h-screen pb-28">
            {/* HEADER IMAGE */}
            <div className="relative h-[280px]">
                <img
                    src={product.food?.imageSrc || ''}
                    alt={product.food?.name}
                    className="w-full h-full object-cover"
                    onError={e => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&q=80'; }}
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-transparent" />
                <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start">
                    <button onClick={() => navigate(-1)} className="bg-white/20 backdrop-blur-md p-2 rounded-full text-white hover:bg-white/30 transition-colors">
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <div className="flex gap-2">
                        <button onClick={toggleFavFood} className="bg-white/20 backdrop-blur-md p-2 rounded-full text-white hover:bg-white/30 transition-colors">
                            <Heart className={`w-6 h-6 ${isFav ? 'fill-red-500 text-red-500' : ''}`} />
                        </button>
                        <Link to="/cart" className="bg-white/20 backdrop-blur-md p-2 rounded-full text-white hover:bg-white/30 transition-colors">
                            <ShoppingCart className="w-6 h-6" />
                        </Link>
                    </div>
                </div>
            </div>

            <div className="-mt-6 bg-white rounded-t-3xl relative z-10 p-5">
                {/* Food name & rating */}
                <h1 className="text-2xl font-bold text-gray-900">{product.food?.name}</h1>
                <div className="flex items-center gap-3 mt-2 text-sm text-gray-500">
                    <span className="flex items-center text-yellow-500 font-bold">
                        <Star className="w-4 h-4 fill-yellow-500 mr-1" />4.8
                    </span>
                    {product.food?.foodTypeName && (
                        <span className="bg-orange-50 text-orange-600 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                            {product.food.foodTypeName}
                        </span>
                    )}
                    {product.isAvailable === false && (
                        <span className="bg-red-50 text-red-500 text-xs font-semibold px-2.5 py-0.5 rounded-full">Hết hàng</span>
                    )}
                </div>

                {/* Store info */}
                {product.store && (
                    <Link to={`/store/${product.store.id}`} className="mt-4 flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                        <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center shrink-0">
                            🏪
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 text-sm truncate">{product.store.name}</h3>
                            <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                                <span className="flex items-center truncate"><MapPin className="w-3 h-3 mr-0.5 shrink-0" />{product.store.address}</span>
                                <span className="flex items-center shrink-0"><Clock className="w-3 h-3 mr-0.5" />15-20p</span>
                            </div>
                        </div>
                    </Link>
                )}

                {/* Price */}
                <div className="mt-5 p-4 bg-orange-50 rounded-xl flex items-center justify-between">
                    <div>
                        <p className="text-xs text-gray-500">Giá</p>
                        <p className="text-2xl font-black text-orange-600">{product.price.toLocaleString()}đ</p>
                    </div>
                    {product.size && (
                        <div className="text-right">
                            <p className="text-xs text-gray-500">Size</p>
                            <p className="font-bold text-gray-800">{(product.size as any)?.name || 'Thường'}</p>
                        </div>
                    )}
                </div>

                {/* Quantity */}
                <div className="mt-5">
                    <h3 className="font-bold text-gray-900 mb-3">Số lượng</h3>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setQuantity(q => Math.max(1, q - 1))}
                            className="w-10 h-10 rounded-full border-2 border-gray-200 flex items-center justify-center hover:border-orange-400 hover:text-orange-500 transition-colors"
                        >
                            <Minus className="w-4 h-4" />
                        </button>
                        <span className="text-xl font-bold w-8 text-center">{quantity}</span>
                        <button
                            onClick={() => setQuantity(q => q + 1)}
                            className="w-10 h-10 rounded-full bg-orange-500 hover:bg-orange-600 text-white flex items-center justify-center transition-colors shadow-md shadow-orange-200"
                        >
                            <Plus className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Note */}
                <div className="mt-5">
                    <h3 className="font-bold text-gray-900 mb-2">💬 Ghi chú</h3>
                    <textarea
                        className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-300 focus:border-orange-400 text-sm resize-none outline-none"
                        rows={2}
                        value={note}
                        onChange={e => setNote(e.target.value)}
                        placeholder="Ví dụ: Ít hành, không cay, thêm nước tương..."
                    />
                </div>
            </div>

            {/* Bottom bar */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 z-50 flex items-center justify-between shadow-[0_-4px_24px_rgba(0,0,0,0.08)]">
                <div>
                    <p className="text-xs text-gray-400">Tổng cộng</p>
                    <p className="text-2xl font-black text-orange-600">{total.toLocaleString()}đ</p>
                </div>
                <Button
                    onClick={handleAddToCart}
                    isLoading={isAdding}
                    disabled={isAdding || product.isAvailable === false}
                    className="px-8 py-3 rounded-2xl shadow-lg shadow-orange-200 text-base font-bold"
                >
                    🛒 Thêm vào giỏ
                </Button>
            </div>
        </div>
    );
}
