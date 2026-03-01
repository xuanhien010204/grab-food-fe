import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, ArrowLeft, Star, Heart, UtensilsCrossed } from 'lucide-react';
import { foodApi, foodStoreApi, foodTypeApi, favoriteApi } from '../../../api/api';
import type { FoodDto, FoodStoreDto } from '../../../types/swagger';
import { Card, CardContent } from '../../../components/ui/Card';
import { cn } from '../../../lib/utils';
import { toast } from 'sonner';

export default function FoodsPage() {
    const [foods, setFoods] = useState<FoodDto[]>([]);
    const [foodStores, setFoodStores] = useState<FoodStoreDto[]>([]);
    const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
    const [activeCategory, setActiveCategory] = useState<number | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [favFoodSet, setFavFoodSet] = useState<Set<number>>(new Set());

    useEffect(() => {
        favoriteApi.getFoods().then(res => {
            const ids = (Array.isArray(res.data) ? res.data : []).map((f: any) => f.foodId || f.food?.id || f.id);
            setFavFoodSet(new Set(ids));
        }).catch(() => { });
    }, []);

    const toggleFavFood = async (e: React.MouseEvent, foodId: number) => {
        e.preventDefault();
        e.stopPropagation();
        try {
            if (favFoodSet.has(foodId)) {
                await favoriteApi.removeFood(foodId);
                setFavFoodSet(prev => { const n = new Set(prev); n.delete(foodId); return n; });
                toast.success('Đã bỏ yêu thích');
            } else {
                await favoriteApi.addFood(foodId);
                setFavFoodSet(prev => new Set(prev).add(foodId));
                toast.success('Đã thêm yêu thích ♥');
            }
        } catch { toast.error('Lỗi khi thao tác yêu thích'); }
    };

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await foodTypeApi.getAll();
                setCategories(Array.isArray(res.data) ? res.data : []);
            } catch (err) {
                console.error('Failed to fetch categories:', err);
            }
        };
        fetchCategories();
    }, []);

    useEffect(() => {
        const fetchFoods = async () => {
            try {
                setIsLoading(true);
                setError(null);

                // Fetch both foods and food-stores for price / store info
                const [foodsRes, foodStoresRes] = await Promise.all([
                    foodApi.getAll(),
                    foodStoreApi.getAll({
                        FoodName: searchQuery.trim() || undefined,
                        FoodTypeId: activeCategory || undefined,
                    }),
                ]);

                setFoods(Array.isArray(foodsRes.data) ? foodsRes.data : []);
                setFoodStores(Array.isArray(foodStoresRes.data) ? foodStoresRes.data : []);
            } catch (err) {
                console.error('Failed to fetch foods:', err);
                setError('Không thể tải danh sách món ăn.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchFoods();
    }, [activeCategory, searchQuery]);

    // Build a display list: prefer food-stores (has price + store info), fallback to foods
    const displayItems = foodStores.length > 0
        ? foodStores
        : foods.map((f) => ({
            id: String(f.id),
            storeId: 0,
            foodId: f.id,
            food: f,
            price: f.price || 0,
        } as FoodStoreDto));

    return (
        <div className="pb-24 bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="bg-gradient-to-br from-orange-500 via-orange-600 to-red-500 rounded-b-[2rem] shadow-xl p-6 pt-10 text-white">
                <div className="flex items-center gap-3 mb-4">
                    <Link to="/" className="bg-white/20 backdrop-blur-md p-2 rounded-full hover:bg-white/30 transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <h1 className="text-xl font-bold">Tất cả món ăn</h1>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-2 flex items-center space-x-2">
                    <Search className="w-5 h-5 text-gray-400 ml-2" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="flex-1 border-none outline-none text-gray-800 placeholder:text-gray-400 text-sm bg-transparent"
                        placeholder="Tìm kiếm món ăn..."
                    />
                </div>
            </div>

            <div className="px-4 mt-6">
                {/* Category Pills */}
                <div className="flex space-x-3 overflow-x-auto pb-3 -mx-4 px-4 scrollbar-hide mb-4">
                    <button
                        onClick={() => setActiveCategory(null)}
                        className={cn(
                            "whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors border",
                            activeCategory === null
                                ? "bg-orange-500 text-white border-orange-500 shadow-md"
                                : "bg-white text-gray-700 border-gray-200"
                        )}
                    >
                        Tất cả
                    </button>
                    {categories.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => setActiveCategory(cat.id)}
                            className={cn(
                                "whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors border",
                                activeCategory === cat.id
                                    ? "bg-orange-500 text-white border-orange-500 shadow-md"
                                    : "bg-white text-gray-700 border-gray-200"
                            )}
                        >
                            {cat.name}
                        </button>
                    ))}
                </div>

                <p className="text-sm text-gray-500 mb-4">
                    {displayItems.length} món ăn được tìm thấy
                </p>

                {isLoading ? (
                    <div className="grid grid-cols-2 gap-3">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="bg-white rounded-xl h-52 animate-pulse shadow-sm" />
                        ))}
                    </div>
                ) : error ? (
                    <div className="text-center py-16">
                        <UtensilsCrossed className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">{error}</p>
                    </div>
                ) : displayItems.length === 0 ? (
                    <div className="text-center py-16">
                        <UtensilsCrossed className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">Không tìm thấy món ăn nào.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-3">
                        {displayItems.map((item) => (
                            <Link to={`/product/${item.id}`} key={item.id} className="block group">
                                <Card className="overflow-hidden border-none shadow-sm hover:shadow-md transition-shadow h-full">
                                    <div className="relative h-32">
                                        <img
                                            src={item.food?.imageSrc || ''}
                                            alt={item.food?.name}
                                            className="w-full h-full object-cover"
                                        />
                                        <button
                                            onClick={(e) => toggleFavFood(e, item.foodId || item.food?.id || 0)}
                                            className="absolute top-2 right-2 bg-white/80 p-1.5 rounded-full transition-colors z-10"
                                        >
                                            <Heart className={`w-4 h-4 ${favFoodSet.has(item.foodId || item.food?.id || 0) ? 'fill-red-500 text-red-500' : 'text-gray-500 hover:text-red-500'}`} />
                                        </button>
                                    </div>
                                    <CardContent className="p-3">
                                        <h3 className="font-semibold text-gray-900 text-sm truncate">
                                            {item.food?.name}
                                        </h3>
                                        <p className="text-xs text-gray-400 truncate">
                                            {item.food?.foodTypeName || item.store?.name}
                                        </p>
                                        <div className="flex items-center justify-between mt-2">
                                            <span className="text-sm font-bold text-orange-600">
                                                {item.price.toLocaleString()}đ
                                            </span>
                                            <span className="flex items-center text-xs text-yellow-500">
                                                <Star className="w-3 h-3 fill-yellow-500 mr-0.5" />
                                                4.8
                                            </span>
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
