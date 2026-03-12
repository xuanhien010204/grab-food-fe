import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, MapPin, Star, Heart, Clock, Plus, ShoppingCart } from 'lucide-react';
import { storeApi, foodStoreApi, favoriteApi, reviewApi } from '../../../api/api';
import type { StoreDto, FoodStoreDto } from '../../../types/swagger';
import { cn } from '../../../lib/utils';
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
    const [favFoodIds, setFavFoodIds] = useState<Set<number>>(new Set());
    const [reviews, setReviews] = useState<any[]>([]);

    // Cart conflict dialog state
    const [differentStoreItem, setDifferentStoreItem] = useState<FoodStoreDto | null>(null);
    const [showConflictDialog, setShowConflictDialog] = useState(false);
    const [isAddingToCart, setIsAddingToCart] = useState<string | null>(null); // foodStoreId being added

    useEffect(() => {
        if (!id) return;
        favoriteApi.checkStore(Number(id)).then(res => setIsFav(!!res.data)).catch(() => { });
        
        // Initial fetch of favorite foods to sync hearts
        if (authStorage.getToken()) {
            favoriteApi.getFoods().then(res => {
                const ids = new Set((res.data as any[] || []).map(f => f.foodId || f.id));
                setFavFoodIds(ids);
            }).catch(() => { });
        }
    }, [id]);

    const toggleFav = async () => {
        if (!id) return;
        try {
            if (isFav) {
                await favoriteApi.removeStore(Number(id));
                setIsFav(false);
                toast.success('Đã bỏ yêu thích cửa hàng');
            } else {
                await favoriteApi.addStore(Number(id));
                setIsFav(true);
                toast.success('Đã thêm yêu thích cửa hàng ♥');
            }
        } catch { toast.error('Lỗi khi thao tác yêu thích'); }
    };

    const toggleFoodFav = async (foodId: number, foodName: string) => {
        if (!authStorage.getToken()) {
            toast.error('Vui lòng đăng nhập để thực hiện');
            navigate('/login');
            return;
        }

        const isCurrentlyFav = favFoodIds.has(foodId);
        try {
            if (isCurrentlyFav) {
                await favoriteApi.removeFood(foodId);
                setFavFoodIds(prev => {
                    const next = new Set(prev);
                    next.delete(foodId);
                    return next;
                });
                toast.success(`Đã bỏ yêu thích ${foodName}`);
            } else {
                await favoriteApi.addFood(foodId);
                setFavFoodIds(prev => {
                    const next = new Set(prev);
                    next.add(foodId);
                    return next;
                });
                toast.success(`Đã thêm yêu thích ${foodName} ♥`);
            }
        } catch {
            toast.error('Lỗi khi thao tác yêu thích món ăn');
        }
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

    const isAdmin = localStorage.getItem('roleName') === 'Admin';

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
        <div className="pb-24 bg-[#FCF9F5] min-h-screen font-sans">
            {/* ADMIN PREVIEW BANNER */}
            {isAdmin && (!store.isApproved || !store.isActive) && (
                <div className="bg-amber-600 text-white px-4 py-2 text-center text-xs font-black uppercase tracking-widest sticky top-0 z-[60] shadow-lg">
                    Chế độ xem trước (Admin): Quán này {!store.isApproved ? 'chưa được duyệt' : 'đang bị khóa'}
                </div>
            )}

            {/* STICKY HEADER - Only for customers */}
            {!isAdmin && (
                <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-[#C76E00]/10 shadow-sm transition-all duration-300">
                    <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => navigate(-1)}
                                className="p-2 -ml-2 hover:bg-orange-50 rounded-full text-gray-900 transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                            <h1 className="text-sm font-black text-gray-900 uppercase italic tracking-tighter truncate max-w-[200px] sm:max-w-md">
                                {store.name}
                            </h1>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={toggleFav}
                                className={cn(
                                    "p-2 rounded-full transition-all border",
                                    isFav
                                        ? "bg-red-50 text-red-500 border-red-100"
                                        : "hover:bg-gray-100 text-gray-600 border-transparent"
                                )}
                            >
                                <Heart className={cn("w-5 h-5", isFav && "fill-current")} />
                            </button>
                            <Link to="/cart" className="p-2 hover:bg-gray-100 rounded-full text-gray-600 transition-colors border border-transparent">
                                <ShoppingCart className="w-5 h-5" />
                            </Link>
                        </div>
                    </div>
                </header>
            )}

            <main className="max-w-6xl mx-auto px-4 pt-6">
                {/* ADMIN BACK BUTTON */}
                {isAdmin && (
                    <button
                        onClick={() => navigate(-1)}
                        className="mb-6 flex items-center gap-2 text-gray-500 hover:text-[#C76E00] font-black uppercase text-[10px] tracking-widest transition-colors group"
                    >
                        <div className="w-8 h-8 rounded-full bg-white border border-gray-100 flex items-center justify-center shadow-sm group-hover:border-[#C76E00]/30 transition-all">
                            <ArrowLeft className="w-4 h-4" />
                        </div>
                        Quay lại danh sách
                    </button>
                )}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* MAIN COLUMN */}
                    <div className="lg:col-span-8 space-y-8">
                        {/* HERO IMAGE */}
                        <div className="relative h-[280px] sm:h-[380px] rounded-[2.5rem] overflow-hidden shadow-2xl shadow-orange-900/10 border-4 border-white group">
                            <img 
                                src={(store as any).imageSrc || 'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=1200'} 
                                alt={(store as any).name} 
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" 
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />
                            <div className="absolute bottom-6 left-8 right-8">
                                <div className="flex items-center gap-3 mb-2">
                                    {store.isApproved ? (
                                        <Badge className="bg-green-500 text-white border-none px-3 py-1 text-[10px] font-black uppercase tracking-widest shadow-lg">Open Now</Badge>
                                    ) : (
                                        <Badge className="bg-orange-500 text-white border-none px-3 py-1 text-[10px] font-black uppercase tracking-widest shadow-lg">Pending Approval</Badge>
                                    )}
                                    {!store.isActive && (
                                        <Badge className="bg-red-500 text-white border-none px-3 py-1 text-[10px] font-black uppercase tracking-widest shadow-lg">Hidden (Inactive)</Badge>
                                    )}
                                    <div className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-white text-[10px] font-black uppercase tracking-widest border border-white/30">
                                        {(store as any).address?.split(',').pop()?.trim() || 'Food Store'}
                                    </div>
                                </div>
                                <h2 className="text-3xl font-black text-white uppercase italic tracking-tight drop-shadow-xl">{(store as any).name}</h2>
                            </div>
                        </div>

                        {/* STORE STATS CARD */}
                        <div className="bg-white/80 backdrop-blur-xl border border-orange-100/50 rounded-3xl p-6 shadow-xl shadow-orange-900/5 grid grid-cols-3 gap-4">
                            <div className="text-center space-y-1 group hover:scale-105 transition-transform">
                                <div className="w-10 h-10 bg-yellow-400/10 rounded-xl flex items-center justify-center mx-auto mb-2">
                                    <Star className="w-5 h-5 text-yellow-600 fill-yellow-500" />
                                </div>
                                <p className="text-lg font-black text-gray-900 leading-none">4.5</p>
                                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Đánh giá</p>
                            </div>
                            <div className="text-center space-y-1 group hover:scale-105 transition-transform border-x border-orange-50">
                                <div className="w-10 h-10 bg-[#C76E00]/10 rounded-xl flex items-center justify-center mx-auto mb-2">
                                    <Clock className="w-5 h-5 text-[#C76E00]" />
                                </div>
                                <p className="text-lg font-black text-gray-900 leading-none">15-25p</p>
                                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Chuẩn bị</p>
                            </div>
                            <div className="text-center space-y-1 group hover:scale-105 transition-transform">
                                <div className="w-10 h-10 bg-blue-400/10 rounded-xl flex items-center justify-center mx-auto mb-2">
                                    <MapPin className="w-5 h-5 text-blue-600" />
                                </div>
                                <p className="text-[10px] font-black text-gray-900 leading-tight uppercase italic truncate px-2">Grab Food</p>
                                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Giao hàng</p>
                            </div>
                        </div>

                        {/* MENU SECTION */}
                        <section className="space-y-6">
                            <div className="flex items-center gap-4 mb-2 border-l-4 border-[#C76E00] pl-4">
                                <div>
                                    <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight italic">Thực đơn</h2>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em]">{foods.length} món ngon đang chờ bạn</p>
                                </div>
                            </div>

                            {foods.length === 0 ? (
                                <div className="py-16 text-center bg-white/50 rounded-3xl border border-dashed border-orange-200">
                                    <div className="text-4xl mb-4">🍽️</div>
                                    <p className="text-sm font-black text-gray-400 uppercase tracking-widest">Cửa hàng chưa có món ăn nào</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {foods.map((item) => (
                                        <div key={item.id} className="bg-white/80 backdrop-blur-xl border border-orange-100/50 rounded-2xl p-3 shadow-sm hover:shadow-xl hover:shadow-orange-900/5 transition-all group flex gap-4">
                                            {/* Food Image */}
                                            <Link to={`/product/${item.id}`} state={{ foodStore: item }} className="shrink-0">
                                                <div className="w-24 h-24 rounded-2xl overflow-hidden bg-gray-100 shadow-inner">
                                                    <img
                                                        src={item.food?.imageSrc || ''}
                                                        alt={item.food?.name}
                                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                        onError={e => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80'; }}
                                                    />
                                                </div>
                                            </Link>

                                            {/* Info */}
                                            <div className="flex-1 min-w-0 flex flex-col pt-1 relative">
                                                {!isAdmin && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            if (item.food?.id) toggleFoodFav(item.food.id, item.food.name || 'Món ăn');
                                                        }}
                                                        className={cn(
                                                            "absolute top-0 right-0 p-1.5 rounded-full transition-all",
                                                            item.food?.id && favFoodIds.has(item.food.id)
                                                                ? "text-red-500 bg-red-50"
                                                                : "text-gray-300 hover:text-gray-400 hover:bg-gray-100"
                                                        )}
                                                    >
                                                        <Heart className={cn("w-3.5 h-3.5", item.food?.id && favFoodIds.has(item.food.id) && "fill-current")} />
                                                    </button>
                                                )}

                                                <div>
                                                    <Link to={`/product/${item.id}`} state={{ foodStore: item }}>
                                                        <h3 className="font-black text-gray-900 text-xs sm:text-sm uppercase tracking-tight line-clamp-1 group-hover:text-[#C76E00] transition-colors">
                                                            {item.food?.name}
                                                        </h3>
                                                    </Link>
                                                    <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-1 font-bold uppercase tracking-wider">{item.food?.foodTypeName}</p>
                                                </div>
                                                
                                                <div className="mt-auto flex items-center justify-between">
                                                    <span className="text-sm sm:text-base font-black text-gray-900 italic">
                                                        {item.price.toLocaleString()}đ
                                                    </span>
                                                    {!isAdmin ? (
                                                        <button
                                                            onClick={() => addToCart(item)}
                                                            disabled={isAddingToCart === item.id || item.isAvailable === false}
                                                            className="flex items-center gap-2 bg-[#C76E00] hover:bg-[#A55B00] disabled:bg-gray-200 text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl transition-all shadow-lg shadow-orange-900/10 active:scale-95"
                                                        >
                                                            {isAddingToCart === item.id ? (
                                                                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                            ) : (
                                                                <Plus className="w-3.5 h-3.5" />
                                                            )}
                                                            Thêm
                                                        </button>
                                                    ) : (
                                                        <span className={cn(
                                                            "text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg",
                                                            item.isAvailable ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-rose-50 text-rose-500 border border-rose-100"
                                                        )}>
                                                            {item.isAvailable ? 'Sẵn sàng' : 'Hết hàng'}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>
                    </div>

                    {/* SIDEBAR COLUMN */}
                    <aside className="lg:col-span-4 space-y-8">
                        {/* ADDRESS CARD */}
                        <div className="bg-[#1A1A1A] rounded-[2.5rem] p-8 shadow-2xl shadow-orange-900/20 text-white relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-[#C76E00]/10 rounded-full blur-3xl" />
                            <div className="relative z-10 space-y-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-[#C76E00] rounded-xl flex items-center justify-center shadow-lg shadow-orange-900/20">
                                        <MapPin className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <p className="text-[9px] text-orange-400 font-bold uppercase tracking-widest mb-0.5">Vị trí quán</p>
                                        <h4 className="text-sm font-black text-white italic line-clamp-2">{(store as any).address}</h4>
                                    </div>
                                </div>
                                <button className="w-full bg-white/5 hover:bg-white/10 border border-white/10 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">
                                    Chỉ đường tới quán
                                </button>
                            </div>
                        </div>

                        {/* REVIEWS CARD */}
                        <div className="bg-white/80 backdrop-blur-xl border border-orange-100/50 rounded-[2.5rem] p-8 shadow-xl shadow-orange-900/5 space-y-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight italic">Đánh giá</h3>
                                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">{reviews.length} nhận xét từ khách hàng</p>
                                </div>
                                <div className="text-right">
                                    <div className="text-2xl font-black text-[#C76E00] leading-none italic">4.5</div>
                                    <div className="flex mt-1">
                                        {[1,2,3,4,5].map(i => <Star key={i} className="w-2.5 h-2.5 fill-yellow-500 text-yellow-500" />)}
                                    </div>
                                </div>
                            </div>
                            
                            <hr className="border-orange-50" />

                            <div className="space-y-6">
                                {reviews.length === 0 ? (
                                    <p className="text-xs text-gray-400 text-center py-4 font-bold uppercase tracking-widest italic">Chưa có đánh giá nào</p>
                                ) : (
                                    reviews.slice(0, 5).map((r: any, idx: number) => (
                                        <div key={r.id || idx} className="space-y-2">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-[#C76E00] font-black text-[10px] shrink-0">
                                                    {(r.userName || r.user?.name || 'U').charAt(0).toUpperCase()}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[10px] font-black text-gray-900 uppercase tracking-tight">
                                                            {r.userName || r.user?.name || 'Khách hàng'}
                                                        </span>
                                                        <span className="text-[9px] text-gray-400 font-bold">
                                                            {new Date(r.createdAt || r.date || Date.now()).toLocaleDateString('vi-VN')}
                                                        </span>
                                                    </div>
                                                    <div className="flex gap-0.5">
                                                        {Array.from({ length: r.rating || r.star || 5 }).map((_, i) => (
                                                            <Star key={i} className="w-2 h-2 fill-yellow-500 text-yellow-500" />
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                            <p className="text-[11px] text-gray-600 font-medium leading-relaxed pl-11">
                                                {r.comment || r.content}
                                            </p>
                                        </div>
                                    ))
                                )}
                            </div>
                            
                            {reviews.length > 5 && (
                                <button className="w-full text-[10px] font-black text-[#C76E00] uppercase tracking-widest hover:underline pt-2">
                                    Xem tất cả đánh giá
                                </button>
                            )}
                        </div>
                    </aside>
                </div>
            </main>

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

