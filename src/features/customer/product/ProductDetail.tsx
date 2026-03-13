import { ArrowLeft, Minus, Plus, Star, MapPin, Clock, ShoppingCart, MessageSquare, Store } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { foodStoreApi, reviewApi } from '../../../api/api';
import type { FoodStoreDto } from '../../../types/swagger';
import { authStorage } from '../../../utils/auth';
import { cartStore } from '../../../utils/cartStore';
import { cn } from '../../../lib/utils';
import { Badge } from '../../../components/ui/Badge';

export default function ProductDetail() {
    const navigate = useNavigate();
    const location = useLocation();
    const { id } = useParams();
    const [quantity, setQuantity] = useState(1);
    const [note, setNote] = useState('');
    
    console.log("[ProductDetail] Render starting. State ID:", id);
    const normalizeProductData = (data: any): FoodStoreDto | null => {
        if (!data) return null;
        
        // Handle food object
        const foodRaw = data.food || data.Food;
        const food = foodRaw ? {
            id: foodRaw.id ?? foodRaw.Id,
            name: foodRaw.name ?? foodRaw.Name,
            imageSrc: foodRaw.imageSrc ?? foodRaw.ImageSrc,
            price: foodRaw.price ?? foodRaw.Price,
            averageRating: foodRaw.averageRating ?? foodRaw.AverageRating,
            foodTypeName: foodRaw.foodTypeName ?? foodRaw.FoodTypeName
        } : undefined;

        // Handle store object
        const storeRaw = data.store || data.Store;
        const store = storeRaw ? {
            id: storeRaw.id ?? storeRaw.Id,
            name: storeRaw.name ?? storeRaw.Name,
            address: storeRaw.address ?? storeRaw.Address,
            imageSrc: storeRaw.imageSrc ?? storeRaw.ImageSrc
        } : undefined;

        // Handle root properties
        return {
            ...data,
            id: data.id ?? data.Id,
            price: data.price ?? data.Price,
            isAvailable: data.isAvailable ?? data.IsAvailable,
            food,
            store
        } as FoodStoreDto;
    };

    const [product, setProduct] = useState<FoodStoreDto | null>(() => {
        const state = location.state as any;
        if (state?.foodStore) return normalizeProductData(state.foodStore);
        
        // Handle favorite state from FavoritesPage
        const fav = state?.favorite;
        if (fav) {
            console.log("[ProductDetail] Favorite state found:", fav);
            const mapped = normalizeProductData({
                id: fav.foodStoreId || fav.FoodStoreId || id, // Try to find Guid
                price: fav.foodPrice || fav.FoodPrice,
                isAvailable: true,
                food: {
                    id: fav.foodId || fav.FoodId,
                    name: fav.foodName || fav.FoodName,
                    imageSrc: fav.foodImage || fav.FoodImage,
                    averageRating: fav.foodRating || fav.FoodRating || 5
                },
                store: {
                    id: fav.storeId || fav.StoreId,
                    name: fav.storeName || fav.StoreName || 'Cửa hàng',
                    address: fav.storeAddress || fav.StoreAddress,
                    imageSrc: fav.storeImage || fav.StoreImage
                }
            });
            console.log("[ProductDetail] Mapped from favorite:", mapped);
            return mapped;
        }
        return null;
    });
    const [isLoading, setIsLoading] = useState(!product);
    const [isAdding, setIsAdding] = useState(false);
    const [reviews, setReviews] = useState<any[]>([]);
    const [avgRating, setAvgRating] = useState(0);

    useEffect(() => {
        // Fallback fetch if data is incomplete or missing
        const isNumericId = id && !isNaN(Number(id));
        const state = location.state as any;
        const favStoreId = state?.favorite?.storeId || state?.favorite?.StoreId;
        
        if (!product || isNumericId || !product.store?.id) {
            setIsLoading(true);
            console.log("[ProductDetail] Fetching data. ID:", id, "FavStore:", favStoreId);
            
            // Priority: Try to use storeId from favorites to get a smaller/more reliable dataset
            const fetchPromise = favStoreId 
                ? foodStoreApi.getByStore(favStoreId) 
                : foodStoreApi.getAll({} as any, { silent: true } as any);

            fetchPromise
                .then(res => {
                    const data = Array.isArray(res.data) ? res.data : [];
                    console.log("[ProductDetail] API data length:", data.length);
                    const found = data.find(f => 
                        String(f.id).toLowerCase() === String(id).toLowerCase() || 
                        (f.food?.id !== undefined && String(f.food.id) === String(id))
                    );
                    
                    if (found) {
                        setProduct(normalizeProductData(found));
                    } else {
                        console.warn("[ProductDetail] Product not found in fallback for ID:", id);
                    }
                })
                .catch((err) => {
                    console.error("[ProductDetail] Fetch failed:", err);
                    toast.error("Không thể tải thông tin món ăn từ máy chủ.");
                })
                .finally(() => setIsLoading(false));
        }

        // Fetch reviews
        if (product?.food?.id) {
            reviewApi.getByFood(product.food.id).then(res => {
                const d = res.data as any;
                const items = Array.isArray(d) ? d : (d?.reviews || d?.Reviews || []);
                setReviews(items);
                if (items.length > 0) {
                    const sum = items.reduce((acc: number, r: any) => acc + (r.rating || r.star || 0), 0);
                    setAvgRating(sum / items.length);
                } else if (product?.food?.averageRating) {
                    setAvgRating(product.food.averageRating);
                }
            }).catch(() => { });
        }
    }, [id, product?.food?.id]);


    const handleAddToCart = () => {
        if (!product) return;
        // CRITICAL: Ensure we have a real GUID for foodStoreId, not a numeric foodId
        const foodStoreId = product.id;
        if (!foodStoreId || foodStoreId.length < 10) {
            toast.error('Không thể xác định mã cửa hàng. Vui lòng thử lại.');
            return;
        }

        if (!authStorage.getToken()) {
            toast.error('Vui lòng đăng nhập để đặt hàng');
            navigate('/login');
            return;
        }

        setIsAdding(true);
        const result = cartStore.addItem(foodStoreId, product, quantity);

        if (result === 'conflict') {
            if (window.confirm('Bạn đã có đơn từ quán khác. Tạo mới đơn hàng?')) {
                cartStore.forceAddItem(foodStoreId, product, quantity);
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
        <div className="bg-[#FCF9F5] min-h-screen pb-12 font-sans">
            {/* STICKY HEADER */}
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
                            {product.food?.name}
                        </h1>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <Link to="/cart" className="p-2 hover:bg-gray-100 rounded-full text-gray-600 transition-colors border border-transparent">
                            <ShoppingCart className="w-5 h-5" />
                        </Link>
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-4 pt-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
                    {/* LEFT COLUMN: PRODUCT IMAGE & INFO */}
                    <div className="lg:col-span-7 space-y-8">
                        {/* PRODUCT IMAGE */}
                        <div className="relative group">
                            <div className="aspect-square sm:aspect-video rounded-[2.5rem] overflow-hidden bg-white shadow-2xl shadow-orange-900/10 border-4 border-white">
                                <img
                                    src={product.food?.imageSrc || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=1000'}
                                    alt={product.food?.name}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"
                                    onError={e => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80'; }}
                                />
                            </div>
                            {product.isAvailable === false && (
                                <div className="absolute top-6 right-6">
                                    <Badge className="bg-red-500 text-white px-4 py-2 rounded-xl font-black uppercase tracking-widest shadow-xl border-none">Hết hàng</Badge>
                                </div>
                            )}
                        </div>

                        {/* PRODUCT INFO */}
                        <div className="space-y-6 px-2">
                             <div className="flex items-center gap-3">
                                {product.food?.foodTypeName && (
                                    <Badge className="bg-[#C76E00]/10 text-[#C76E00] border-none text-[10px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full">
                                        {product.food.foodTypeName}
                                    </Badge>
                                )}
                                <div className="flex items-center bg-yellow-400/10 px-3 py-1 rounded-full text-yellow-600 font-bold text-xs">
                                    <Star className="w-3.5 h-3.5 fill-yellow-500 mr-1.5" /> 
                                    {avgRating > 0 ? avgRating.toFixed(1) : (product?.food?.averageRating || 5.0)}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <h2 className="text-4xl sm:text-5xl font-black text-gray-900 uppercase italic tracking-tighter leading-[0.9] mb-4">
                                    {product.food?.name}
                                </h2>
                                <p className="text-gray-500 text-base leading-relaxed max-w-2xl font-medium">
                                    Món ăn được chế biến tỉ mỉ từ những nguyên liệu tươi ngon nhất, mang đến hương vị đặc trưng và trải nghiệm ẩm thực trọn vẹn cho bạn.
                                </p>
                            </div>
                        </div>

                        {/* REVIEWS SECTION */}
                        <div className="space-y-6 pt-8 border-t border-orange-100/50">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-black text-gray-900 uppercase italic tracking-tight">Đánh giá từ khách hàng</h3>
                                <div className="flex items-center gap-2">
                                    <div className="px-3 py-1 bg-yellow-400/10 rounded-full flex items-center gap-1.5">
                                        <Star className="w-3.5 h-3.5 text-yellow-600 fill-yellow-500" />
                                        <span className="text-xs font-black text-yellow-700">{avgRating > 0 ? avgRating.toFixed(1) : (product.food?.averageRating || 5.0)}</span>
                                    </div>
                                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{reviews.length} đánh giá</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                {reviews.length === 0 ? (
                                    <div className="bg-white/50 rounded-[2rem] p-10 text-center border-2 border-dashed border-orange-100">
                                        <MessageSquare className="w-10 h-10 text-orange-200 mx-auto mb-3" />
                                        <p className="text-xs font-black text-gray-400 uppercase tracking-widest italic">Chưa có đánh giá nào cho món ăn này</p>
                                    </div>
                                ) : (
                                    reviews.map((r, idx) => (
                                        <div key={idx} className="bg-white/80 backdrop-blur-xl border border-orange-100/50 rounded-3xl p-5 shadow-sm space-y-3 transition-all hover:shadow-md border-l-4 border-l-[#C76E00]">
                                            <div className="flex justify-between items-start">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-2xl bg-orange-50 flex items-center justify-center text-[#C76E00] font-black text-xs border border-orange-100">
                                                        {(r.userName || 'U').charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-gray-900 text-xs uppercase tracking-tight">{r.userName || 'Khách hàng'}</p>
                                                        <p className="text-[10px] text-gray-400 font-medium">{new Date(r.createdAt).toLocaleDateString('vi-VN')}</p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-0.5">
                                                    {Array.from({ length: 5 }).map((_, i) => (
                                                        <Star key={i} className={cn("w-3 h-3", i < (r.rating || r.star) ? "fill-yellow-400 text-yellow-400" : "text-gray-100")} />
                                                    ))}
                                                </div>
                                            </div>
                                            <p className="text-sm text-gray-600 font-medium italic pl-13">
                                                "{r.comment || r.content}"
                                            </p>
                                            {r.storeReply && (
                                                <div className="ml-13 p-4 bg-orange-50/50 rounded-2xl border border-orange-100/50 space-y-1">
                                                    <p className="text-[10px] font-black text-[#C76E00] uppercase tracking-widest italic">Phản hồi từ quán:</p>
                                                    <p className="text-xs text-gray-600 font-medium italic">{r.storeReply}</p>
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: STORE & ORDER */}
                    <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24 h-fit">
                        {/* STORE BRIEF - NOW PROMINENT */}
                        {product.store && product.store.id ? (
                            <Link to={`/store/${product.store.id}`} className="block group">
                                <div className="bg-charcoal rounded-[1.5rem] p-4 shadow-xl shadow-orange-900/5 transition-all hover:shadow-orange-900/15 hover:-translate-y-0.5 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-[#C76E00]/5 rounded-full -mr-12 -mt-12 blur-2xl group-hover:bg-[#C76E00]/10 transition-colors" />
                                    <div className="flex items-center gap-4 relative z-10">
                                        <div className="w-12 h-12 bg-[#C76E00] rounded-xl flex items-center justify-center shadow-lg shadow-orange-900/30 shrink-0 group-hover:scale-105 transition-transform duration-500">
                                            <Store className="w-6 h-6 text-white" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <div className="w-1 h-1 rounded-full bg-[#C76E00] animate-pulse" />
                                                <p className="text-[9px] text-[#C76E00] font-black uppercase tracking-[0.2em]">Cung cấp bởi</p>
                                            </div>
                                            <h3 className="text-base font-black text-white uppercase italic truncate tracking-tight">{product.store.name}</h3>
                                            <div className="flex items-center gap-3 text-[9px] text-gray-400 font-bold uppercase mt-1">
                                                <span className="flex items-center truncate max-w-[120px]"><MapPin className="w-2.5 h-2.5 mr-1 text-[#C76E00]" /> {product.store.address}</span>
                                                <span className="flex items-center shrink-0"><Clock className="w-2.5 h-2.5 mr-1 text-[#C76E00]" /> 15-20p</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ) : (
                            <div className="bg-charcoal/50 rounded-[1.5rem] p-4 border border-white/5">
                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest text-center italic">Đang cập nhật thông tin cửa hàng...</p>
                            </div>
                        )}

                        {/* ORDER CARD */}
                        <div className="bg-white rounded-[2rem] p-6 shadow-2xl shadow-orange-900/5 border border-orange-100/30 space-y-6">
                            <div className="flex items-end justify-between border-b border-orange-50 pb-5">
                                <div>
                                    <p className="text-[9px] text-gray-400 font-black uppercase tracking-[0.2em] mb-0.5">Giá mỗi phần</p>
                                    <h3 className="text-3xl font-black text-[#C76E00] italic leading-none tabular-nums tracking-tighter">
                                        {product.price.toLocaleString()}đ
                                    </h3>
                                </div>
                                {product.size && (
                                    <div className="text-right">
                                        <p className="text-[9px] text-gray-400 font-black uppercase tracking-[0.2em] mb-0.5">Kích cỡ</p>
                                        <div className="bg-orange-50 px-3 py-1.5 rounded-lg border border-orange-100">
                                            <span className="text-[10px] font-black text-[#C76E00] uppercase italic tracking-tighter">
                                                {(product.size as any)?.name || 'Thường'}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* QUANTITY & NOTE */}
                            <div className="space-y-5">
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Số lượng</h4>
                                        <span className="text-[8px] font-black text-[#C76E00] uppercase tracking-widest bg-orange-50 px-2 py-0.5 rounded">Tối ưu 1-3 phần</span>
                                    </div>
                                    <div className="flex items-center gap-4 bg-gray-50/80 p-2 rounded-[1.2rem] w-full border border-gray-100/50">
                                        <button
                                            onClick={() => setQuantity(q => Math.max(1, q - 1))}
                                            className="w-10 h-10 rounded-lg bg-white shadow-sm border border-orange-100/50 flex items-center justify-center hover:bg-orange-50 hover:text-[#C76E00] transition-all active:scale-90"
                                        >
                                            <Minus className="w-4 h-4" />
                                        </button>
                                        <span className="flex-1 text-xl font-black text-center tabular-nums text-charcoal">{quantity}</span>
                                        <button
                                            onClick={() => setQuantity(q => q + 1)}
                                            className="w-10 h-10 rounded-lg bg-[#C76E00] text-white flex items-center justify-center transition-all shadow-md shadow-orange-900/20 hover:scale-105 active:scale-95"
                                        >
                                            <Plus className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-2.5">
                                    <h4 className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Ghi chú cho nhà bếp</h4>
                                    <textarea
                                        className="w-full p-4 bg-gray-50/50 border border-gray-100 rounded-[1.2rem] focus:border-[#C76E00]/30 focus:bg-white text-xs outline-none placeholder:text-gray-300 font-medium h-24 transition-all resize-none shadow-inner"
                                        value={note}
                                        onChange={e => setNote(e.target.value)}
                                        placeholder="Ví dụ: Ít cay, không lấy hành..."
                                    />
                                </div>
                            </div>

                            {/* ACTION BUTTON */}
                            <div className="pt-2 space-y-4">
                                <div className="flex items-center justify-between px-3 py-2.5 bg-charcoal/5 rounded-xl">
                                    <span className="text-[10px] font-black text-charcoal uppercase tracking-[0.2em]">Tổng giá trị</span>
                                    <span className="text-xl font-black text-charcoal italic tracking-tighter tabular-nums">{total.toLocaleString()}đ</span>
                                </div>
                                <Button
                                    onClick={handleAddToCart}
                                    isLoading={isAdding}
                                    disabled={isAdding || product.isAvailable === false}
                                    className="w-full py-6 rounded-[1.2rem] bg-[#C76E00] hover:bg-charcoal text-white font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-orange-900/20 active:scale-[0.98] transition-all group overflow-hidden relative"
                                >
                                    <span className="relative z-10 flex items-center justify-center gap-2">
                                        <ShoppingCart className="w-4 h-4 group-hover:animate-bounce" />
                                        XÁC NHẬN ĐẶT MÓN
                                    </span>
                                    <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
