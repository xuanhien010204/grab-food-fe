import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, MapPin, Star, Clock, ArrowLeft, Store, Heart } from 'lucide-react';
import { storeApi, favoriteApi } from '../../../api/api';
import type { StoreDto } from '../../../types/swagger';
import { Badge } from '../../../components/ui/Badge';
import { toast } from 'sonner';

export default function StoresPage() {
    const [stores, setStores] = useState<StoreDto[]>([]);
    const [filteredStores, setFilteredStores] = useState<StoreDto[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [favSet, setFavSet] = useState<Set<number>>(new Set());

    useEffect(() => {
        favoriteApi.getStores().then(res => {
            const ids = (Array.isArray(res.data) ? res.data : []).map((f: any) => f.storeId || f.store?.id || f.id);
            setFavSet(new Set(ids));
        }).catch(() => { });
    }, []);

    const toggleFav = async (e: React.MouseEvent, storeId: number) => {
        e.preventDefault();
        e.stopPropagation();
        try {
            if (favSet.has(storeId)) {
                await favoriteApi.removeStore(storeId);
                setFavSet(prev => { const n = new Set(prev); n.delete(storeId); return n; });
                toast.success('Đã bỏ yêu thích');
            } else {
                await favoriteApi.addStore(storeId);
                setFavSet(prev => new Set(prev).add(storeId));
                toast.success('Đã thêm yêu thích ♥');
            }
        } catch { toast.error('Lỗi khi thao tác yêu thích'); }
    };

    useEffect(() => {
        const fetchStores = async () => {
            try {
                setIsLoading(true);
                const res = await storeApi.getAll();
                const data = Array.isArray(res.data) ? res.data : [];
                setStores(data);
                setFilteredStores(data);
            } catch (err) {
                console.error('Failed to fetch stores:', err);
                setError('Không thể tải danh sách cửa hàng.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchStores();
    }, []);

    useEffect(() => {
        if (!searchQuery.trim()) {
            setFilteredStores(stores);
            return;
        }
        const q = searchQuery.toLowerCase();
        setFilteredStores(
            stores.filter(
                (s) =>
                    s.name?.toLowerCase().includes(q) ||
                    s.address?.toLowerCase().includes(q)
            )
        );
    }, [searchQuery, stores]);

    return (
        <div className="pb-24 bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="bg-gradient-to-br from-orange-500 via-orange-600 to-red-500 rounded-b-[2rem] shadow-xl p-6 pt-10 text-white">
                <div className="flex items-center gap-3 mb-4">
                    <Link to="/" className="bg-white/20 backdrop-blur-md p-2 rounded-full hover:bg-white/30 transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <h1 className="text-xl font-bold">Tất cả cửa hàng</h1>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-2 flex items-center space-x-2">
                    <Search className="w-5 h-5 text-gray-400 ml-2" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="flex-1 border-none outline-none text-gray-800 placeholder:text-gray-400 text-sm bg-transparent"
                        placeholder="Tìm kiếm cửa hàng..."
                    />
                </div>
            </div>

            <div className="px-4 mt-6">
                {/* Results count */}
                <p className="text-sm text-gray-500 mb-4">
                    {filteredStores.length} cửa hàng được tìm thấy
                </p>

                {isLoading ? (
                    <div className="space-y-4">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="bg-white rounded-xl h-28 animate-pulse shadow-sm" />
                        ))}
                    </div>
                ) : error ? (
                    <div className="text-center py-16">
                        <Store className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">{error}</p>
                    </div>
                ) : filteredStores.length === 0 ? (
                    <div className="text-center py-16">
                        <Store className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">Không tìm thấy cửa hàng nào.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredStores.map((store) => (
                            <div key={store.id} className="relative">
                                <Link to={`/store/${store.id}`} className="block group">
                                    <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow flex overflow-hidden">
                                        <div className="w-28 h-28 shrink-0">
                                            <img
                                                src={store.imageSrc || ''}
                                                alt={store.name}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <div className="flex-1 p-3 flex flex-col justify-between">
                                            <div>
                                                <div className="flex justify-between items-start">
                                                    <h3 className="font-bold text-gray-900 line-clamp-1">
                                                        {store.name}
                                                    </h3>
                                                    <Badge variant="success" className="text-[10px] px-1.5 py-0 h-5 shrink-0 ml-2">
                                                        OPEN
                                                    </Badge>
                                                </div>
                                                <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                                                    {store.address}
                                                </p>
                                            </div>
                                            <div className="flex items-center justify-between text-xs text-gray-500 mt-2">
                                                <div className="flex items-center space-x-3">
                                                    <span className="flex items-center text-yellow-500 font-medium">
                                                        <Star className="w-3 h-3 fill-yellow-500 mr-1" />
                                                        4.5
                                                    </span>
                                                    <span className="flex items-center">
                                                        <MapPin className="w-3 h-3 mr-1" />
                                                        {store.address ? store.address.split(',')[0] : ''}
                                                    </span>
                                                </div>
                                                <span className="flex items-center">
                                                    <Clock className="w-3 h-3 mr-1" />
                                                    15-25p
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                                <button
                                    onClick={(e) => toggleFav(e, store.id!)}
                                    className="absolute top-2 right-2 bg-white shadow-sm p-1.5 rounded-full hover:bg-red-50 transition-colors z-10"
                                >
                                    <Heart className={`w-4 h-4 ${favSet.has(store.id!) ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
