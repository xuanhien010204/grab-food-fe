import { Search, Star, Clock, Store, ChevronRight } from 'lucide-react';
import { Input } from '../../../components/ui/Input';
import { Badge } from '../../../components/ui/Badge';
import { motion } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import { cn } from '../../../lib/utils';
import { Link } from 'react-router-dom';
import { foodStoreApi, storeApi, voucherApi } from '../../../api/api';
import type { FoodStoreDto, StoreDto } from '../../../types/swagger';


export default function HomePage() {
    const [sortBy, setSortBy] = useState<'nearest' | 'rating' | 'fastest' | 'price'>('nearest');
    const userRole = localStorage.getItem('roleName') || '';
    const [isLoading, setIsLoading] = useState(true);
    const [foodStores, setFoodStores] = useState<FoodStoreDto[]>([]);
    const [stores, setStores] = useState<StoreDto[]>([]);
    const [vouchers, setVouchers] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const resultsRef = useRef<HTMLDivElement>(null);

    const handleSearch = () => {
        if (searchQuery.trim()) {
            // Scroll to results section with an offset if needed, but start is usually okay
            resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    const sortedStores = [...stores].sort((a, b) => {
        if (sortBy === 'rating') return ((b as any).rating || 0) - ((a as any).rating || 0);
        if (sortBy === 'fastest') return 20 - 25; // Dummy logic
        if (sortBy === 'price') return ((a as any).averagePrice || 0) - ((b as any).averagePrice || 0);
        return 0;
    });

    useEffect(() => {
        const fetchInitialData = async () => {
            setIsLoading(true);
            try {
                const [vouchersRes, storesRes] = await Promise.allSettled([
                    voucherApi.getAll(),
                    storeApi.getAll()
                ]);

                if (storesRes.status === 'fulfilled') {
                    const allStores = storesRes.value.data || [];
                    // Filter: Only show approved and active stores for customers
                    setStores(allStores.filter(s => s.isApproved && s.isActive));
                }
                
                let rawVoucherData = vouchersRes.status === 'fulfilled' ? (vouchersRes.value.data as any) : [];
                let voucherList = Array.isArray(rawVoucherData) ? rawVoucherData : (rawVoucherData?.result || rawVoucherData?.vouchers || []);

                if (voucherList.length === 0) {
                    setVouchers([
                        { id: 1, title: 'Giảm giá 30% cho đơn đầu', color: 'bg-orange-50', code: 'GRAB30' },
                        { id: 2, title: 'Freeship đơn từ 100k', color: 'bg-blue-50', code: 'FREESHIP' },
                        { id: 3, title: 'Mua 1 tặng 1 trà sữa', color: 'bg-pink-50', code: 'BOBOLIFE' },
                    ]);
                } else {
                    setVouchers(voucherList.map((v: any) => ({
                        ...v,
                        title: v.name || v.title,
                        color: v.color || (v.type === 1 ? 'bg-orange-50' : v.type === 2 ? 'bg-blue-50' : 'bg-pink-50')
                    })));
                }
                setIsLoading(false);
            } catch (err) {
                console.error("Failed to fetch initial data", err);
                setIsLoading(false);
            }
        };
        fetchInitialData();
    }, []);


    useEffect(() => {
        const fetchByFilter = async () => {
            try {
                const foodsRes = await foodStoreApi.getAll();
                const allFoodStores = foodsRes.data || [];
                // Filter: Only show food from approved and active stores
                setFoodStores(allFoodStores.filter(fs => fs.store?.isApproved && fs.store?.isActive));
            } catch (error) {
                console.error("Failed to fetch food stores", error);
            }
        };
        fetchByFilter();
    }, []);

    return (
        <div className="pb-12 bg-[#FCF9F5] min-h-screen">
            {/* MINI HERO / SEARCH - Distinct Light Orange Tone */}
            <div className="bg-[#FFE9D1] py-10 sm:py-14 border-b border-orange-100/50 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-orange-100/20 rounded-full blur-3xl -ml-24 -mb-24" />
                
                <div className="max-w-4xl mx-auto px-4 text-center space-y-6 relative z-10">
                    <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-gray-900 uppercase italic">
                        Ăn gì cũng sướng, <span className="text-[#C76E00]">Món gì cũng ngon!</span>
                    </h1>
                    
                    <div className="max-w-xl mx-auto bg-white rounded-2xl shadow-2xl p-1.5 flex items-center gap-2 focus-within:ring-4 focus-within:ring-[#C76E00]/10 transition-all border border-orange-100/30">
                        <div className="pl-4">
                            <Search className="w-5 h-5 text-gray-400" />
                        </div>
                        <Input
                            className="border-none shadow-none focus-visible:ring-0 p-0 h-10 text-sm placeholder:text-gray-400 text-gray-900 bg-transparent flex-1 font-medium"
                            placeholder="Tìm kiếm món ăn, nhà hàng..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={handleKeyDown}
                        />
                        <button 
                            onClick={handleSearch}
                            className="bg-[#C76E00] hover:bg-[#A55B00] text-white px-8 py-2.5 rounded-xl font-black transition-all text-[10px] uppercase tracking-widest active:scale-95 shadow-xl shadow-[#C76E00]/20"
                        >
                            Tìm Kiếm
                        </button>
                    </div>
                </div>
            </div>

            <div ref={resultsRef} className="max-w-7xl mx-auto px-4 sm:px-6 mt-8 space-y-12 scroll-mt-6">
                {/* PREMIUM VOUCHERS SECTION */}
                <section className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight italic">Ưu đãi độc quyền</h2>
                        <span className="text-[10px] font-bold text-[#C76E00] uppercase tracking-widest bg-[#C76E00]/10 px-3 py-1 rounded-full">Hot Vouchers</span>
                    </div>
                    
                    <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide">
                        {vouchers.map((promo, idx) => (
                            <motion.div 
                                key={promo.id || idx}
                                whileHover={{ y: -5 }}
                                className="min-w-[280px] sm:min-w-[320px] h-32 relative bg-white rounded-2xl border border-orange-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden flex"
                            >
                                {/* Left Side: Discount Info */}
                                <div className={cn("w-24 sm:w-28 flex flex-col items-center justify-center border-r-2 border-dashed border-orange-100 relative", promo.color || 'bg-orange-50')}>
                                    <div className="absolute -top-3 -right-3 w-6 h-6 bg-[#FCF9F5] rounded-full border border-orange-50" />
                                    <div className="absolute -bottom-3 -right-3 w-6 h-6 bg-[#FCF9F5] rounded-full border border-orange-50" />
                                    
                                    <span className="text-[10px] font-black text-[#C76E00]/60 uppercase tracking-tighter mb-1">Giảm</span>
                                    <span className="text-2xl font-black text-[#C76E00]">
                                        {promo.title?.match(/\d+%/)?.[0] || 'HOT'}
                                    </span>
                                </div>
                                
                                {/* Right Side: Content & Action */}
                                <div className="flex-1 p-4 flex flex-col justify-between">
                                    <div>
                                        <h3 className="text-sm font-black text-gray-900 leading-tight line-clamp-2 uppercase italic">{promo.title}</h3>
                                        <p className="text-[9px] text-gray-400 font-bold mt-1 uppercase tracking-widest">{promo.storeName || 'Toàn hệ thống'}</p>
                                    </div>
                                    
                                    <div className="flex items-center justify-between mt-2">
                                        <div className="bg-gray-50 border border-gray-100 rounded-lg px-3 py-1.5 flex items-center gap-2">
                                            <span className="text-[10px] font-black text-gray-900 tracking-wider select-all">{promo.code || 'FOOD2026'}</span>
                                        </div>
                                        <button 
                                            onClick={() => {
                                                navigator.clipboard.writeText(promo.code || 'FOOD2026');
                                                // Minimal feedback since we don't have a toast ref here
                                            }}
                                            className="text-[10px] font-black text-[#C76E00] hover:text-[#A55B00] uppercase tracking-widest"
                                        >
                                            Sao chép
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </section>
                {/* POPULAR ITEMS */}
                <section>
                    <div className="flex space-x-4 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide">
                        {isLoading ? (
                            [1, 2, 3, 4].map(i => <div key={i} className="min-w-[180px] h-48 bg-gray-50 rounded-xl animate-pulse" />)
                        ) : (
                            (() => {
                                const items = (foodStores || [])
                                    .filter(item => !searchQuery || item.food?.name?.toLowerCase().includes(searchQuery.toLowerCase()))
                                    .slice(0, 10);
                                
                                if (items.length === 0 && searchQuery) {
                                    return (
                                        <div className="w-full py-8 text-center bg-white/50 rounded-2xl border border-dashed border-orange-200">
                                            <div className="text-2xl mb-2">🍽️</div>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Không tìm thấy món ăn nào</p>
                                        </div>
                                    );
                                }

                                return items.map((item) => (
                                    <Link to={`/product/${item.id}`} state={{ foodStore: item }} key={item.id} className="min-w-[200px] block group">
                                        <div className="bg-white rounded-xl shadow-sm hover:shadow transition-all border border-gray-100 overflow-hidden">
                                            <div className="relative h-28 overflow-hidden">
                                                <img 
                                                    src={item.food?.imageSrc || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&q=80'} 
                                                    alt={item.food?.name} 
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                                                />
                                            </div>
                                            <div className="p-3">
                                                <h3 className="font-bold text-xs text-gray-900 group-hover:text-[#C76E00] transition-colors line-clamp-1">{item.food?.name}</h3>
                                                <p className="text-[9px] text-gray-400 mt-0.5 line-clamp-1">{item.store?.name}</p>
                                                <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-50">
                                                    <div className="flex items-center text-yellow-500 text-[9px] font-bold">
                                                        <Star className="w-2.5 h-2.5 fill-yellow-500 mr-1" /> 4.8
                                                    </div>
                                                    <span className="text-xs font-black text-[#C76E00]">
                                                        {item.price?.toLocaleString()}đ
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                ));
                            })()
                        )}
                    </div>
                </section>

                {/* RESTAURANTS */}
                <section className="pb-8">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 border-l-4 border-gray-900 pl-3">
                        <div>
                            <h2 className="text-lg font-black text-gray-900 uppercase tracking-tight">Khám phá cửa hàng</h2>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Tìm kiếm địa điểm ăn uống</p>
                        </div>
                        
                        <div className="flex gap-1 bg-gray-100 p-0.5 rounded-lg self-start">
                            {[
                                { id: 'nearest', label: 'Gần tôi' },
                                { id: 'rating', label: 'Đánh giá' },
                                { id: 'fastest', label: 'Nhanh' },
                                { id: 'price', label: 'Giá' }
                            ].map((btn) => (
                                <button
                                    key={btn.id}
                                    onClick={() => setSortBy(btn.id as any)}
                                    className={cn(
                                        "px-2.5 py-1 rounded-md text-[9px] font-black transition-all uppercase tracking-tighter",
                                        sortBy === btn.id 
                                            ? "bg-[#C76E00] text-white shadow-md shadow-[#C76E00]/20" 
                                            : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                                    )}
                                >
                                    {btn.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                        {isLoading ? (
                            [1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-48 bg-gray-50 rounded-xl animate-pulse" />)
                        ) : (
                            (() => {
                                const storesToShow = sortedStores.filter(s => {
                                    const matchesSearch = !searchQuery || s.name?.toLowerCase().includes(searchQuery.toLowerCase());
                                    return matchesSearch;
                                });

                                if (storesToShow.length === 0) {
                                    return (
                                        <div className="col-span-full py-12 text-center bg-white/50 rounded-3xl border border-dashed border-orange-200">
                                            <div className="text-3xl mb-3">🏪</div>
                                            <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight italic">Không thấy cửa hàng phù hợp</h3>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Thử tìm kiếm với từ khóa khác xem sao!</p>
                                        </div>
                                    );
                                }

                                return storesToShow.map((store) => (
                                    <Link to={`/store/${store.id}`} key={store.id} className="group">
                                        <div className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow transition-all border border-gray-100 h-full flex flex-col">
                                            <div className="relative h-32 overflow-hidden">
                                                <img 
                                                    src={store.imageSrc || 'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=600&q=80'} 
                                                    alt={store.name} 
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                                                />
                                                <div className="absolute top-2 left-2">
                                                    <Badge className="bg-green-500/90 text-[7px] px-1.5 py-0.5 rounded font-bold border-none">OPEN</Badge>
                                                </div>
                                            </div>
                                            
                                            <div className="p-3 flex flex-col flex-1">
                                                <h3 className="text-xs font-black text-gray-900 group-hover:text-[#C76E00] transition-colors line-clamp-1 uppercase tracking-tight">{store.name}</h3>
                                                <p className="text-[9px] text-gray-400 line-clamp-1 mt-0.5">{store.address}</p>
                                                
                                                <div className="mt-auto pt-2 border-t border-gray-50 flex items-center justify-between text-[9px] font-bold">
                                                    <div className="flex items-center text-yellow-600">
                                                        <Star className="w-2.5 h-2.5 fill-yellow-500 text-yellow-500 mr-1" /> 4.7
                                                    </div>
                                                    <div className="text-gray-400 flex items-center">
                                                        <Clock className="w-2.5 h-2.5 mr-1 text-[#C76E00]/60" /> 25p
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                ));
                            })()
                        )}
                    </div>
                </section>

                {/* BUSINESS CTA - Synchronized with brand palette */}
                {(!userRole || userRole === 'User') && (
                    <section className="pb-8">
                        <Link to="/register-store" className="block group">
                            <div className="relative overflow-hidden rounded-[2.5rem] bg-[#1A1A1A] p-8 sm:p-10 shadow-2xl shadow-orange-900/10 transition-all hover:shadow-orange-900/20 hover:-translate-y-1">
                                <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-[#C76E00]/10 blur-3xl group-hover:bg-[#C76E00]/20 transition-colors" />
                                <div className="absolute -bottom-12 -left-12 w-32 h-32 rounded-full bg-white/5 blur-2xl" />
                                
                                <div className="relative flex flex-col sm:flex-row items-center justify-between gap-6">
                                    <div className="flex-1 text-center sm:text-left space-y-3">
                                        <div className="flex items-center justify-center sm:justify-start gap-3 mb-1">
                                            <div className="w-10 h-10 bg-[#C76E00] rounded-xl flex items-center justify-center shadow-lg shadow-orange-900/20 rotate-3 group-hover:rotate-0 transition-transform">
                                                <Store className="w-5 h-5 text-white" />
                                            </div>
                                            <Badge className="bg-[#C76E00]/20 text-[#C76E00] border-none text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg">Đối tác</Badge>
                                        </div>
                                        <h3 className="text-xl font-black text-white uppercase tracking-tight italic leading-tight">Bạn là chủ quán?</h3>
                                        <p className="text-gray-400 text-[10px] max-w-xs font-bold uppercase tracking-[0.2em]">Đăng ký bán hàng cùng FoodDelivery ngay</p>
                                    </div>
                                    <button className="bg-[#C76E00] text-white px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all hover:bg-[#A55B00] active:scale-95 shadow-xl shadow-orange-900/20 flex items-center gap-3">
                                        Bắt đầu ngay
                                        <ChevronRight className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        </Link>
                    </section>
                )}
            </div>
        </div>
    );
}
