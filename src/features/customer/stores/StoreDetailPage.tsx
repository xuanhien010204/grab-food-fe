import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, MapPin, Star, Heart, Clock, Plus, ShoppingCart } from 'lucide-react';
import { storeApi, foodStoreApi, favoriteApi, reviewApi } from '../../../api/api';
import type { StoreDto, FoodStoreDto } from '../../../types/swagger';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { toast } from 'sonner';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { authStorage } from '../../../utils/auth';
import { cartStore } from '../../../utils/cartStore';

export default function StoreDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [store, setStore] = useState<StoreDto | null>(null);
    const [foods, setFoods] = useState<FoodStoreDto[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isFav, setIsFav] = useState(false);
    const [reviews, setReviews] = useState<any[]>([]);

    // Cart conflict dialog state
    const [differentStoreItem, setDifferentStoreItem] = useState<FoodStoreDto | null>(null);
    const [showConflictDialog, setShowConflictDialog] = useState(false);
    const [isAddingToCart, setIsAddingToCart] = useState<string | null>(null); // foodStoreId being added

    useEffect(() => {
        if (!id) return;
        favoriteApi.checkStore(Number(id)).then(res => setIsFav(!!res.data)).catch(() => { });
    }, [id]);

    const toggleFav = async () => {
        if (!id) return;
        try {
            if (isFav) {
                await favoriteApi.removeStore(Number(id));
                setIsFav(false);
                toast.success('Đã bỏ yêu thích');
            } else {
                await favoriteApi.addStore(Number(id));
                setIsFav(true);
                toast.success('Đã thêm yêu thích ♥');
            }
        } catch { toast.error('Lỗi khi thao tác yêu thích'); }
    };

    useEffect(() => {
        const fetchData = async () => {
            if (!id) return;
            try {
                setIsLoading(true);
                const [storeRes, foodStoreRes] = await Promise.all([
                    storeApi.getById(Number(id)),
                    foodStoreApi.getByStore(Number(id)),
                ]);
                setStore(storeRes.data as any);
                setFoods(Array.isArray(foodStoreRes.data) ? foodStoreRes.data : []);
                reviewApi.getByStore(Number(id)).then(r => {
                    const d = r.data as any;
                    setReviews(Array.isArray(d) ? d : (d?.reviews || d?.Reviews || []));
                }).catch(() => { });
            } catch (err) {
                console.error('Failed to fetch store detail:', err);
                setError('Không thể tải thông tin cửa hàng.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [id]);

    // Core add-to-cart logic using localStorage cartStore
    const addToCart = useCallback((item: FoodStoreDto) => {
        if (!authStorage.getToken()) {
            toast.error('Vui lòng đăng nhập để đặt hàng');
            navigate('/login');
            return;
        }

        setIsAddingToCart(item.id);
        const result = cartStore.addItem(item.id, item, 1);

        if (result === 'conflict') {
            setDifferentStoreItem(item);
            setShowConflictDialog(true);
            setIsAddingToCart(null);
            return;
        }

        toast.success(`${item.food?.name || 'Món ăn'} đã thêm vào giỏ 🛒`);
        setIsAddingToCart(null);
    }, [navigate]);

    const handleForceAddToCart = () => {
        if (!differentStoreItem) return;
        cartStore.forceAddItem(differentStoreItem.id, differentStoreItem, 1);
        toast.success(`${differentStoreItem.food?.name || 'Món ăn'} đã thêm vào giỏ 🛒`);
        setShowConflictDialog(false);
        setDifferentStoreItem(null);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (error || !store) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
                <p className="text-gray-500 mb-4">{error || 'Không tìm thấy cửa hàng.'}</p>
                <button onClick={() => navigate(-1)} className="text-orange-500 font-semibold">← Quay lại</button>
            </div>
        );
    }

    return (
        <div className="pb-24 bg-gray-50 min-h-screen">
            {/* Store Header Image */}
            <div className="relative h-[220px]">
                <img src={(store as any).imageSrc || ''} alt={(store as any).name} className="w-full h-full object-cover" />
                <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start bg-gradient-to-b from-black/60 to-transparent">
                    <button
                        onClick={() => navigate(-1)}
                        className="bg-white/20 backdrop-blur-md p-2 rounded-full text-white hover:bg-white/30 transition-colors"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <div className="flex gap-2">
                        <button
                            onClick={toggleFav}
                            className="bg-white/20 backdrop-blur-md p-2 rounded-full text-white hover:bg-white/30 transition-colors"
                        >
                            <Heart className={`w-6 h-6 ${isFav ? 'fill-red-500 text-red-500' : ''}`} />
                        </button>
                        <Link to="/cart" className="bg-white/20 backdrop-blur-md p-2 rounded-full text-white hover:bg-white/30 transition-colors">
                            <ShoppingCart className="w-6 h-6" />
                        </Link>
                    </div>
                </div>
            </div>

            {/* Store Info */}
            <div className="bg-white -mt-6 rounded-t-3xl relative z-10 p-5">
                <div className="flex justify-between items-start mb-2">
                    <h1 className="text-2xl font-bold text-gray-900">{(store as any).name}</h1>
                    <Badge variant="success" className="text-xs shrink-0 ml-2">OPEN</Badge>
                </div>

                <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500 mb-4">
                    <span className="flex items-center text-yellow-500 font-bold">
                        <Star className="w-4 h-4 fill-yellow-500 mr-1" />4.5
                    </span>
                    <span className="flex items-center">
                        <MapPin className="w-4 h-4 mr-1" />{(store as any).address}
                    </span>
                    <span className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />15-25p
                    </span>
                </div>

                <hr className="border-gray-100 mb-4" />

                {/* Food Items */}
                <h2 className="text-lg font-bold text-gray-900 mb-4">🍽️ Thực đơn ({foods.length} món)</h2>

                {foods.length === 0 ? (
                    <p className="text-gray-400 text-center py-8">Cửa hàng chưa có món ăn nào.</p>
                ) : (
                    <div className="space-y-3">
                        {foods.map((item) => (
                            <div key={item.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                <div className="flex items-center gap-3 p-3">
                                    {/* Food Image */}
                                    <Link to={`/product/${item.id}`} state={{ foodStore: item }} className="shrink-0">
                                        <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-100">
                                            <img
                                                src={item.food?.imageSrc || ''}
                                                alt={item.food?.name}
                                                className="w-full h-full object-cover"
                                                onError={e => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&q=80'; }}
                                            />
                                        </div>
                                    </Link>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <Link to={`/product/${item.id}`} state={{ foodStore: item }}>
                                            <h3 className="font-bold text-gray-900 text-sm truncate hover:text-orange-500 transition-colors">
                                                {item.food?.name}
                                            </h3>
                                        </Link>
                                        <p className="text-xs text-gray-400 mt-0.5 truncate">{item.food?.foodTypeName}</p>
                                        {item.size && (
                                            <p className="text-xs text-gray-400 mt-0.5">Size: {(item.size as any)?.name || ''}</p>
                                        )}
                                        <div className="flex items-center justify-between mt-2">
                                            <span className="text-base font-bold text-orange-600">
                                                {item.price.toLocaleString()}đ
                                            </span>
                                            <button
                                                onClick={() => addToCart(item)}
                                                disabled={isAddingToCart === item.id || item.isAvailable === false}
                                                className="flex items-center gap-1 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 text-white text-xs font-bold px-3 py-1.5 rounded-full transition-colors shadow-sm"
                                            >
                                                {isAddingToCart === item.id ? (
                                                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                ) : (
                                                    <Plus className="w-3.5 h-3.5" />
                                                )}
                                                Thêm
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Reviews Section */}
                <hr className="border-gray-100 my-6" />
                <h2 className="text-lg font-bold text-gray-900 mb-4">⭐ Đánh giá ({reviews.length})</h2>

                {reviews.length === 0 ? (
                    <p className="text-gray-400 text-center py-6">Chưa có đánh giá nào.</p>
                ) : (
                    <div className="space-y-3">
                        {reviews.slice(0, 10).map((r: any, idx: number) => (
                            <Card key={r.id || idx} className="p-4 border-none shadow-sm rounded-xl">
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-sm shrink-0">
                                        {(r.userName || r.user?.name || 'U').charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <span className="text-sm font-bold text-gray-900">{r.userName || r.user?.name || 'Người dùng'}</span>
                                            <span className="text-yellow-500 text-xs flex items-center">
                                                {Array.from({ length: r.rating || r.star || 0 }).map((_, i) => (
                                                    <Star key={i} className="w-3 h-3 fill-yellow-500" />
                                                ))}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-600">{r.comment || r.content}</p>
                                        {r.reply && (
                                            <div className="mt-2 bg-gray-50 rounded-lg p-2">
                                                <p className="text-[10px] text-gray-400 font-bold">Phản hồi:</p>
                                                <p className="text-xs text-gray-600">{r.reply}</p>
                                            </div>
                                        )}
                                        <p className="text-[10px] text-gray-400 mt-1">
                                            {new Date(r.createdAt || r.date || Date.now()).toLocaleDateString('vi-VN')}
                                        </p>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* Cross-store conflict dialog - same as Flutter */}
            <Modal
                isOpen={showConflictDialog}
                onClose={() => { setShowConflictDialog(false); setDifferentStoreItem(null); }}
                title="Đổi cửa hàng?"
            >
                <div className="text-sm text-gray-600 mb-6">
                    Bạn đã có đơn hàng ở quán khác. Tạo mới đơn hàng với món <strong>{differentStoreItem?.food?.name}</strong> từ cửa hàng này?
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" className="flex-1" onClick={() => { setShowConflictDialog(false); setDifferentStoreItem(null); }}>
                        Hủy
                    </Button>
                    <Button className="flex-1" onClick={handleForceAddToCart}>
                        Đồng ý
                    </Button>
                </div>
            </Modal>
        </div>
    );
}

