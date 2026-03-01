import { useState, useEffect } from 'react';
import { Store, MapPin, Search, CheckCircle, Clock, Loader2 } from 'lucide-react';
import { storeApi, adminApi } from '../../../api/api';
import type { StoreDto } from '../../../types/swagger';
import { toast } from 'sonner';

const StoreManagement = () => {
    const [stores, setStores] = useState<StoreDto[]>([]);
    const [pendingStores, setPendingStores] = useState<StoreDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [tab, setTab] = useState<'all' | 'pending'>('all');
    const [approvingId, setApprovingId] = useState<number | null>(null);

    useEffect(() => {
        fetchStores();
    }, []);

    const fetchStores = async () => {
        try {
            setLoading(true);
            const [allRes, pendingRes] = await Promise.all([
                storeApi.getAll(),
                adminApi.getPendingStores().catch(() => ({ data: [] })),
            ]);
            setStores(Array.isArray(allRes.data) ? allRes.data : []);
            setPendingStores(Array.isArray(pendingRes.data) ? pendingRes.data : []);
        } catch (error) {
            console.error("Failed to fetch stores", error);
            toast.error("Không thể tải danh sách cửa hàng");
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (storeId: number) => {
        setApprovingId(storeId);
        try {
            await adminApi.approveStore(storeId);
            toast.success('Đã duyệt cửa hàng');
            fetchStores();
        } catch {
            toast.error('Duyệt thất bại');
        } finally {
            setApprovingId(null);
        }
    };

    const currentList = tab === 'pending' ? pendingStores : stores;
    const filteredStores = currentList.filter(store =>
        store.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        store.address?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-1">
                <h2 className="text-3xl font-black text-gray-900 dark:text-white">Quản lý cửa hàng</h2>
                <p className="text-gray-600 dark:text-gray-400">Xem và quản lý tất cả cửa hàng.</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-2">
                <button
                    onClick={() => setTab('all')}
                    className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors ${tab === 'all' ? 'bg-orange-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'}`}
                >
                    Tất cả ({stores.length})
                </button>
                <button
                    onClick={() => setTab('pending')}
                    className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors flex items-center gap-1 ${tab === 'pending' ? 'bg-orange-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'}`}
                >
                    <Clock className="w-4 h-4" />
                    Chờ duyệt ({pendingStores.length})
                </button>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                    type="text"
                    placeholder="Search stores..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-white dark:bg-[#2d1b15] border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-orange-500"
                />
            </div>

            {/* Store Grid */}
            {loading ? (
                <div className="text-center py-10">Loading stores...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredStores.map((store) => (
                        <div key={store.id} className="bg-white dark:bg-[#2d1b15] rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden hover:shadow-md transition-shadow">
                            <div className="h-32 bg-gray-200 dark:bg-gray-800 relative">
                                {store.imageSrc ? (
                                    <img src={store.imageSrc} alt={store.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                                        <Store className="w-12 h-12" />
                                    </div>
                                )}
                                <div className="absolute top-2 right-2">
                                    {store.isApproved ? (
                                        <span className="px-2 py-1 text-[10px] font-bold bg-green-100 text-green-700 rounded-lg flex items-center gap-1">
                                            <CheckCircle className="w-3 h-3" /> Đã duyệt
                                        </span>
                                    ) : (
                                        <span className="px-2 py-1 text-[10px] font-bold bg-yellow-100 text-yellow-700 rounded-lg">
                                            Chờ duyệt
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="p-5 space-y-3">
                                <h3 className="font-bold text-lg text-gray-900 dark:text-white truncate" title={store.name}>{store.name}</h3>
                                {store.description && (
                                    <p className="text-xs text-gray-500 line-clamp-2">{store.description}</p>
                                )}

                                <div className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                                    <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
                                    <span className="line-clamp-2">{store.address || 'Chưa có địa chỉ'}</span>
                                </div>

                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                    {store.isOpen ? (
                                        <span className="text-green-600 font-bold">🟢 Đang mở</span>
                                    ) : (
                                        <span className="text-red-500 font-bold">🔴 Đã đóng</span>
                                    )}
                                    {store.phone && <span>• {store.phone}</span>}
                                </div>

                                <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center">
                                    <span className="text-xs font-bold px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-lg text-gray-600 dark:text-gray-300">
                                        ID: {store.id}
                                    </span>
                                    {!store.isApproved && (
                                        <button
                                            onClick={() => handleApprove(store.id)}
                                            disabled={approvingId === store.id}
                                            className="px-3 py-1.5 bg-orange-600 text-white text-xs font-bold rounded-lg hover:bg-orange-700 disabled:opacity-50 flex items-center gap-1"
                                        >
                                            {approvingId === store.id && <Loader2 className="w-3 h-3 animate-spin" />}
                                            Duyệt
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                    {!loading && filteredStores.length === 0 && (
                        <div className="col-span-full text-center py-12 text-gray-500">
                            Không tìm thấy cửa hàng.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default StoreManagement;
