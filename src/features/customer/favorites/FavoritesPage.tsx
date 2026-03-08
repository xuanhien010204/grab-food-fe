import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Heart, Store, UtensilsCrossed, Star, MapPin } from 'lucide-react';
import { favoriteApi } from '../../../api/api';
import { cn } from '../../../lib/utils';
import { toast } from 'sonner';
import { Card, CardContent } from '../../../components/ui/Card';

export default function FavoritesPage() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'stores' | 'foods'>('stores');
    const [favStores, setFavStores] = useState<any[]>([]);
    const [favFoods, setFavFoods] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchFavorites = async () => {
        try {
            setIsLoading(true);
            const [storesRes, foodsRes] = await Promise.all([
                favoriteApi.getStores().catch(() => ({ data: [] })),
                favoriteApi.getFoods().catch(() => ({ data: [] })),
            ]);
            setFavStores(Array.isArray(storesRes.data) ? storesRes.data : []);
            setFavFoods(Array.isArray(foodsRes.data) ? foodsRes.data : []);
        } catch (err) {
            console.error('Failed to fetch favorites:', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchFavorites();
    }, []);

    const handleUnfavStore = async (id: number) => {
        try {
            await favoriteApi.removeStore(id);
            setFavStores((prev) => prev.filter((s) => s.id !== id && s.storeId !== id));
            toast.success('Đã bỏ yêu thích');
        } catch {
            toast.error('Không thể bỏ yêu thích');
        }
    };

    const handleUnfavFood = async (id: number) => {
        try {
            await favoriteApi.removeFood(id);
            setFavFoods((prev) => prev.filter((f) => f.id !== id && f.foodId !== id));
            toast.success('Đã bỏ yêu thích');
        } catch {
            toast.error('Không thể bỏ yêu thích');
        }
    };

    const activeData = activeTab === 'stores' ? favStores : favFoods;

    return (
        <div className="pb-24 bg-[#FCF9F5] min-h-screen font-sans">
            {/* Header */}
            <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-orange-100/50 px-4 py-4 mb-6">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate(-1)} className="p-2 hover:bg-orange-50 rounded-xl transition-colors">
                            <ArrowLeft className="w-5 h-5 text-[#C76E00]" />
                        </button>
                        <div>
                            <h1 className="text-xl font-black text-gray-900 tracking-tight uppercase italic flex items-center gap-2">
                                <Heart className="w-5 h-5 text-[#C76E00]" />
                                Yêu thích
                            </h1>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em] mt-0.5">
                                Các món ăn & Cửa hàng đã lưu
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 sm:px-6">
                {/* Premium Tabs */}
                <div className="flex bg-orange-50/50 backdrop-blur-sm rounded-2xl p-1.5 gap-2 mb-8 border border-orange-100/30">
                    <button
                        onClick={() => setActiveTab('stores')}
                        className={cn(
                            "flex-1 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2",
                            activeTab === 'stores' 
                                ? "bg-white text-[#C76E00] shadow-sm shadow-orange-200/50 border border-orange-100/50" 
                                : "text-gray-400 hover:text-gray-600"
                        )}
                    >
                        <Store className="w-4 h-4" />
                        Cửa hàng
                    </button>
                    <button
                        onClick={() => setActiveTab('foods')}
                        className={cn(
                            "flex-1 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2",
                            activeTab === 'foods' 
                                ? "bg-white text-[#C76E00] shadow-sm shadow-orange-200/50 border border-orange-100/50" 
                                : "text-gray-400 hover:text-gray-600"
                        )}
                    >
                        <UtensilsCrossed className="w-4 h-4" />
                        Món ăn
                    </button>
                </div>

                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <div className="w-1 h-4 bg-[#C76E00] rounded-full" />
                        <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                            {activeData.length} mục yêu thích
                        </h2>
                    </div>
                </div>

                {isLoading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="bg-white rounded-xl h-24 animate-pulse shadow-sm" />
                        ))}
                    </div>
                ) : activeData.length === 0 ? (
                    <div className="text-center py-16">
                        <Heart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">
                            {activeTab === 'stores' ? 'Chưa có cửa hàng yêu thích' : 'Chưa có món ăn yêu thích'}
                        </p>
                    </div>
                ) : activeTab === 'stores' ? (
                    <div className="space-y-4">
                        {favStores.map((item) => {
                            const store = item.store || item;
                            return (
                                <div key={item.id || store.id} className="relative">
                                    <Link to={`/store/${store.id || item.storeId}`} className="block">
                                        <Card className="border-none shadow-sm hover:shadow-md transition-shadow rounded-2xl overflow-hidden">
                                            <div className="flex">
                                                <div className="w-24 h-24 shrink-0">
                                                    <img src={store.imageSrc || ''} alt={store.name} className="w-full h-full object-cover" />
                                                </div>
                                                <CardContent className="p-3 flex-1">
                                                    <h3 className="font-bold text-gray-900 text-sm truncate">{store.name}</h3>
                                                    <p className="text-xs text-gray-400 mt-1 flex items-center gap-1 truncate">
                                                        <MapPin className="w-3 h-3 shrink-0" />
                                                        {store.address}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                                                        <span className="flex items-center text-yellow-500 font-medium">
                                                            <Star className="w-3 h-3 fill-yellow-500 mr-0.5" />4.5
                                                        </span>
                                                    </div>
                                                </CardContent>
                                            </div>
                                        </Card>
                                    </Link>
                                    <button
                                        onClick={() => handleUnfavStore(store.id || item.storeId)}
                                        className="absolute top-2 right-2 bg-white shadow-sm p-1.5 rounded-full text-red-500 hover:bg-red-50 transition-colors z-10"
                                    >
                                        <Heart className="w-4 h-4 fill-red-500" />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-3">
                        {favFoods.map((item) => {
                            const food = item.food || item;
                            return (
                                <div key={item.id || food.id} className="relative">
                                    <Link to={`/food/${food.id || item.foodId}`} className="block">
                                        <Card className="overflow-hidden border-none shadow-sm hover:shadow-md transition-shadow h-full rounded-2xl">
                                            <div className="h-32">
                                                <img src={food.imageSrc || ''} alt={food.name} className="w-full h-full object-cover" />
                                            </div>
                                            <CardContent className="p-3">
                                                <h3 className="font-semibold text-gray-900 text-sm truncate">{food.name}</h3>
                                                <p className="text-xs text-gray-400 truncate">{food.foodTypeName}</p>
                                                <div className="flex items-center justify-between mt-2">
                                                    <span className="text-sm font-bold text-orange-600">
                                                        {(food.price || 0).toLocaleString()}đ
                                                    </span>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </Link>
                                    <button
                                        onClick={() => handleUnfavFood(food.id || item.foodId)}
                                        className="absolute top-2 right-2 bg-white shadow-sm p-1.5 rounded-full text-red-500 hover:bg-red-50 transition-colors z-10"
                                    >
                                        <Heart className="w-4 h-4 fill-red-500" />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
