import { ArrowLeft, Heart, Minus, Plus, Star, MapPin, Clock, ShoppingCart, MessageSquare } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { foodStoreApi, favoriteApi, reviewApi } from '../../../api/api';
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
    const [product, setProduct] = useState<FoodStoreDto | null>(
        // Use passed state from StoreDetailPage if available (avoids extra API call)
        (location.state as any)?.foodStore || null
    );
    const [isLoading, setIsLoading] = useState(!(location.state as any)?.foodStore);
    const [isAdding, setIsAdding] = useState(false);
    const [isFav, setIsFav] = useState(false);
    const [reviews, setReviews] = useState<any[]>([]);
    const [avgRating, setAvgRating] = useState(0);

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

        // Fetch reviews
        if (product?.food?.id) {
            reviewApi.getByFood(product.food.id).then(res => {
                const d = res.data as any;
                const items = Array.isArray(d) ? d : (d?.reviews || d?.Reviews || []);
                setReviews(items);
                if (items.length > 0) {
                    const sum = items.reduce((acc: number, r: any) => acc + (r.rating || r.star || 0), 0);
                    setAvgRating(sum / items.length);
                } else if (product.food.averageRating) {
                    setAvgRating(product.food.averageRating);
                }
            }).catch(() => { });
        }
    }, [id, product?.food?.id]);

    useEffect(() => {
        const foodId = product?.food?.id;
        if (foodId) {
            favoriteApi.checkFood(foodId)
                .then(res => {
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
                        <button
                            onClick={toggleFavFood}
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
                        <div className="space-y-4 px-2">
                             <div className="flex items-center gap-3">
                                {product.food?.foodTypeName && (
                                    <Badge className="bg-[#C76E00]/10 text-[#C76E00] border-none text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full">
                                        {product.food.foodTypeName}
                                    </Badge>
                                )}
                                <div className="flex items-center text-yellow-500 font-black text-xs">
                                    <Star className="w-4 h-4 fill-yellow-500 mr-1" /> {avgRating > 0 ? avgRating.toFixed(1) : (product?.food?.averageRating || 5.0)}
                                </div>
                            </div>
                            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 uppercase italic tracking-tight leading-tight">
                                {product.food?.name}
                            </h2>
                            <p className="text-gray-500 text-sm leading-relaxed max-w-2xl">
                                Món ăn này được chế biến từ những nguyên liệu tươi ngon nhất, đảm bảo hương vị đậm đà và trải nghiệm ẩm thực tuyệt vời của bạn.
                            </p>
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

                    {/* RIGHT COLUMN: ORDER CARD & STORE BRIEF */}
                    <div className="lg:col-span-5 space-y-6">
                        {/* FLOATING ORDER CARD */}
                        <div className="bg-white rounded-[2.5rem] p-8 shadow-2xl shadow-orange-900/5 border border-orange-100/50 space-y-8 sticky top-24">
                            <div className="flex items-end justify-between border-b border-orange-50 pb-6">
                                <div>
                                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] mb-1">Giá mỗi phần</p>
                                    <h3 className="text-3xl font-black text-[#C76E00] italic leading-none">{product.price.toLocaleString()}đ</h3>
                                </div>
                                {product.size && (
                                    <div className="text-right">
                                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] mb-1">Kích cỡ</p>
                                        <Badge variant="outline" className="border-orange-200 text-[#C76E00] font-black uppercase italic rounded-lg tracking-tighter">
                                            {(product.size as any)?.name || 'Thường'}
                                        </Badge>
                                    </div>
                                )}
                            </div>

                            {/* QUANTITY & NOTE */}
                            <div className="space-y-6">
                                <div className="space-y-3">
                                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Số lượng</h4>
                                    <div className="flex items-center gap-6 bg-gray-50 p-2 rounded-2xl w-fit">
                                        <button
                                            onClick={() => setQuantity(q => Math.max(1, q - 1))}
                                            className="w-10 h-10 rounded-xl bg-white shadow-sm border border-gray-100 flex items-center justify-center hover:bg-orange-50 hover:text-[#C76E00] transition-all active:scale-90"
                                        >
                                            <Minus className="w-4 h-4" />
                                        </button>
                                        <span className="text-xl font-black w-8 text-center tabular-nums">{quantity}</span>
                                        <button
                                            onClick={() => setQuantity(q => q + 1)}
                                            className="w-10 h-10 rounded-xl bg-[#C76E00] text-white flex items-center justify-center transition-all shadow-lg shadow-orange-900/20 hover:scale-105 active:scale-90"
                                        >
                                            <Plus className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Ghi chú (Tùy chọn)</h4>
                                    <textarea
                                        className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-[#C76E00]/20 text-sm outline-none placeholder:text-gray-300 font-medium h-24 transition-all"
                                        value={note}
                                        onChange={e => setNote(e.target.value)}
                                        placeholder="Ví dụ: Ít cay, không hành..."
                                    />
                                </div>
                            </div>

                            {/* ACTION BUTTON */}
                            <div className="pt-4 space-y-4">
                                <div className="flex items-center justify-between px-2">
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Tổng cộng</span>
                                    <span className="text-xl font-black text-gray-900 italic tracking-tighter">{total.toLocaleString()}đ</span>
                                </div>
                                <Button
                                    onClick={handleAddToCart}
                                    isLoading={isAdding}
                                    disabled={isAdding || product.isAvailable === false}
                                    className="w-full py-7 rounded-[1.5rem] bg-[#C76E00] hover:bg-[#A55B00] text-white font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-orange-900/20 active:scale-95 transition-all"
                                >
                                    THÊM VÀO GIỎ HÀNG
                                </Button>
                            </div>
                        </div>

                        {/* STORE BRIEF */}
                        {product.store && (
                            <Link to={`/store/${product.store.id}`} className="block group">
                                <div className="bg-[#1A1A1A] rounded-[2rem] p-6 shadow-xl shadow-orange-900/10 transition-all hover:-translate-y-1">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 bg-[#C76E00] rounded-2xl flex items-center justify-center shadow-lg shadow-orange-900/20 shrink-0 group-hover:rotate-6 transition-transform">
                                            <ShoppingCart className="w-6 h-6 text-white" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[9px] text-[#C76E00] font-black uppercase tracking-widest mb-0.5">Cung cấp bởi</p>
                                            <h3 className="text-sm font-black text-white uppercase italic truncate">{product.store.name}</h3>
                                            <div className="flex items-center gap-3 text-[9px] text-gray-400 font-bold uppercase mt-1">
                                                <span className="flex items-center truncate"><MapPin className="w-3 h-3 mr-1 text-[#C76E00]" /> {product.store.address}</span>
                                                <span className="flex items-center shrink-0"><Clock className="w-3 h-3 mr-1 text-[#C76E00]" /> 15-20p</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
