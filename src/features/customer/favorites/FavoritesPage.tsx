import { useState, useEffect } from 'react';
import { ArrowLeft, Heart, Store, UtensilsCrossed, Star, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { favoriteApi } from '../../../api/api';
import { Card, CardContent } from '../../../components/ui/Card';
import { cn } from '../../../lib/utils';

export default function FavoritesPage() {
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
        <div className="pb-24 bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="bg-gradient-to-br from-pink-500 via-red-500 to-orange-500 rounded-b-[2rem] shadow-xl p-6 pt-10 text-white">
                <div className="flex items-center gap-3 mb-4">
                    <Link to="/" className="bg-white/20 backdrop-blur-md p-2 rounded-full hover:bg-white/30 transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <h1 className="text-xl font-bold">Yêu thích</h1>
                </div>

                {/* Tabs */}
                <div className="flex bg-white/20 backdrop-blur-md rounded-xl p-1 gap-1">
                    <button
                        onClick={() => setActiveTab('stores')}
                        className={cn(
                            "flex-1 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2",
                            activeTab === 'stores' ? "bg-white text-red-600 shadow-md" : "text-white/80 hover:text-white"
                        )}
                    >
                        <Store className="w-4 h-4" />
                        Cửa hàng
                    </button>
                    <button
                        onClick={() => setActiveTab('foods')}
                        className={cn(
                            "flex-1 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2",
                            activeTab === 'foods' ? "bg-white text-red-600 shadow-md" : "text-white/80 hover:text-white"
                        )}
                    >
                        <UtensilsCrossed className="w-4 h-4" />
                        Món ăn
                    </button>
                </div>
            </div>

            <div className="px-4 mt-6">
                <p className="text-sm text-gray-500 mb-4">{activeData.length} mục yêu thích</p>

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
