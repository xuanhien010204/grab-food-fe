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
        <div className="bg-[#FFF7ED] min-h-screen p-8 font-[Inter] space-y-6">

            {/* Header */}
            <div>
                <h2 className="text-3xl font-bold text-[#1F2937]">
                    Quản lý cửa hàng
                </h2>
                <p className="text-[#4B5563]">
                    Xem và quản lý tất cả cửa hàng
                </p>
            </div>

            {/* Tabs */}
            <div className="flex gap-3">

                <button
                    onClick={() => setTab('all')}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition
                        ${tab === 'all'
                            ? 'bg-[#F97316] text-white'
                            : 'bg-white border border-[#FED7AA] text-[#374151] hover:bg-[#FFF7ED]'
                        }`}
                >
                    Tất cả ({stores.length})
                </button>

                <button
                    onClick={() => setTab('pending')}
                    className={`px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-1 transition
                        ${tab === 'pending'
                            ? 'bg-[#F97316] text-white'
                            : 'bg-white border border-[#FED7AA] text-[#374151] hover:bg-[#FFF7ED]'
                        }`}
                >
                    <Clock className="w-4 h-4" />
                    Chờ duyệt ({pendingStores.length})
                </button>

            </div>

            {/* Search */}
            <div className="relative max-w-md">

                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />

                <input
                    type="text"
                    placeholder="Search stores..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-white border border-[#FED7AA] rounded-xl focus:ring-2 focus:ring-[#F97316] outline-none"
                />

            </div>

            {/* Store Grid */}
            {loading ? (
                <div className="flex justify-center py-16">
                    <Loader2 className="w-8 h-8 animate-spin text-[#F97316]" />
                </div>
            ) : (

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                    {filteredStores.map((store) => (

                        <div
                            key={store.id}
                            className="bg-white rounded-2xl shadow-md border border-[#FED7AA] overflow-hidden hover:shadow-lg transition"
                        >

                            {/* Image */}
                            <div className="h-36 bg-[#FFEDD5] relative">

                                {store.imageSrc ? (
                                    <img
                                        src={store.imageSrc}
                                        alt={store.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="flex items-center justify-center h-full text-orange-400">
                                        <Store className="w-12 h-12" />
                                    </div>
                                )}

                                <div className="absolute top-2 right-2">

                                    {store.isApproved ? (
                                        <span className="px-2 py-1 text-[10px] font-medium bg-green-100 text-green-700 rounded-lg flex items-center gap-1">
                                            <CheckCircle className="w-3 h-3" />
                                            Đã duyệt
                                        </span>
                                    ) : (
                                        <span className="px-2 py-1 text-[10px] font-medium bg-yellow-100 text-yellow-700 rounded-lg">
                                            Chờ duyệt
                                        </span>
                                    )}

                                </div>

                            </div>

                            {/* Body */}
                            <div className="p-5 space-y-3">

                                <h3
                                    className="font-semibold text-lg text-[#1F2937] truncate"
                                    title={store.name}
                                >
                                    {store.name}
                                </h3>

                                {store.description && (
                                    <p className="text-xs text-gray-500 line-clamp-2">
                                        {store.description}
                                    </p>
                                )}

                                <div className="flex items-start gap-2 text-sm text-[#4B5563]">
                                    <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
                                    <span className="line-clamp-2">
                                        {store.address || 'Chưa có địa chỉ'}
                                    </span>
                                </div>

                                <div className="flex items-center gap-2 text-xs">

                                    {store.isOpen ? (
                                        <span className="text-green-600 font-medium">
                                            🟢 Đang mở
                                        </span>
                                    ) : (
                                        <span className="text-red-500 font-medium">
                                            🔴 Đã đóng
                                        </span>
                                    )}

                                    {store.phone && (
                                        <span className="text-gray-500">
                                            • {store.phone}
                                        </span>
                                    )}

                                </div>

                                {/* Footer */}
                                <div className="pt-3 border-t border-[#FED7AA] flex justify-between items-center">

                                    <span className="text-xs font-medium px-2 py-1 bg-[#FFEDD5] rounded-lg text-[#9A3412]">
                                        ID: {store.id}
                                    </span>

                                    {!store.isApproved && (
                                        <button
                                            onClick={() => handleApprove(store.id)}
                                            disabled={approvingId === store.id}
                                            className="px-3 py-1.5 bg-[#F97316] text-white text-xs font-medium rounded-lg hover:bg-[#EA580C] disabled:opacity-50 flex items-center gap-1"
                                        >
                                            {approvingId === store.id &&
                                                <Loader2 className="w-3 h-3 animate-spin" />
                                            }
                                            Duyệt
                                        </button>
                                    )}

                                </div>

                            </div>

                        </div>

                    ))}

                    {filteredStores.length === 0 && (
                        <div className="col-span-full text-center py-16 text-gray-500">
                            Không tìm thấy cửa hàng
                        </div>
                    )}

                </div>

            )}

        </div>
    );
}

export default StoreManagement;