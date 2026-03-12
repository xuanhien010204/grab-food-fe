import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Store, MapPin, Search, CheckCircle, Clock, Loader2, Eye } from 'lucide-react';
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
        <div className="bg-cream min-h-screen p-8 font-sans space-y-8 animate-in fade-in duration-700">

            {/* Header */}
            <div className="border-l-4 border-[#C76E00] pl-4">
                <h2 className="text-3xl font-black text-charcoal tracking-tighter uppercase italic">
                    Quản lý cửa hàng
                </h2>
                <p className="text-[10px] font-black text-charcoal/40 uppercase tracking-[0.2em] mt-1">
                    Kiểm duyệt và giám sát hệ thống đối tác
                </p>
            </div>

            {/* Tabs */}
            <div className="flex gap-4">

                <button
                    onClick={() => setTab('all')}
                    className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all
                        ${tab === 'all'
                            ? 'bg-[#C76E00] text-white shadow-lg shadow-[#C76E00]/20'
                            : 'bg-white border border-[#C76E00]/20 text-charcoal/60 hover:bg-[#C76E00]/5'
                        }`}
                >
                    Tất cả ({stores.length})
                </button>

                <button
                    onClick={() => setTab('pending')}
                    className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all
                        ${tab === 'pending'
                            ? 'bg-[#C76E00] text-white shadow-lg shadow-[#C76E00]/20'
                            : 'bg-white border border-[#C76E00]/20 text-charcoal/60 hover:bg-[#C76E00]/5'
                        }`}
                >
                    <Clock className="w-4 h-4" />
                    Chờ duyệt ({pendingStores.length})
                </button>

            </div>

            {/* Search */}
            <div className="relative max-w-md group">

                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-charcoal/30 group-focus-within:text-[#C76E00] transition-colors" />

                <input
                    type="text"
                    placeholder="Tìm tên cửa hàng, địa chỉ..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-white border-2 border-orange-100/50 rounded-2xl focus:border-[#C76E00] focus:ring-4 focus:ring-[#C76E00]/10 outline-none transition-all font-bold text-sm"
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
                            <div className="h-44 bg-[#FFEDD5] relative group-hover:scale-105 transition-transform duration-700">

                                {store.imageSrc ? (
                                    <div className="w-full h-full relative">
                                        <img
                                            src={store.imageSrc}
                                            alt={store.name}
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center h-full text-[#C76E00]/20">
                                        <Store className="w-16 h-16" />
                                    </div>
                                )}

                                <div className="absolute top-4 right-4">

                                    {store.isApproved ? (
                                        <span className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest bg-emerald-500 text-white rounded-xl flex items-center gap-1.5 shadow-lg shadow-emerald-500/20">
                                            <CheckCircle className="w-3 h-3" />
                                            Đã duyệt
                                        </span>
                                    ) : (
                                        <span className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest bg-amber-500 text-white rounded-xl shadow-lg shadow-amber-500/20">
                                            Chờ duyệt
                                        </span>
                                    )}

                                </div>

                            </div>

                            {/* Body */}
                            <div className="p-5 space-y-3">

                                <h3
                                    className="font-black text-xl text-charcoal tracking-tighter italic truncate group-hover:text-[#C76E00] transition-colors"
                                    title={store.name}
                                >
                                    {store.name}
                                </h3>

                                {store.description && (
                                    <p className="text-[11px] font-bold text-charcoal/40 line-clamp-2 leading-relaxed h-8">
                                        {store.description}
                                    </p>
                                )}

                                <div className="flex items-start gap-2 text-xs font-bold text-charcoal/60">
                                    <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-[#C76E00]" />
                                    <span className="line-clamp-2 italic">
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
                                <div className="pt-4 border-t border-orange-100/50 flex justify-between items-center">

                                    <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 bg-cream border border-orange-100 rounded-xl text-charcoal/40">
                                        ID: {store.id}
                                    </span>

                                    <div className="flex gap-2">
                                        <Link
                                            to={`/admin/stores/${store.id}`}
                                            className="p-2 text-[#C76E00] hover:bg-[#C76E00]/10 rounded-xl transition-all active:scale-95"
                                            title="Xem chi tiết"
                                        >
                                            <Eye className="w-5 h-5" />
                                        </Link>

                                        {!store.isApproved && (
                                            <button
                                                onClick={() => handleApprove(store.id)}
                                                disabled={approvingId === store.id}
                                                className="px-5 py-2.5 bg-[#C76E00] text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-[#A55B00] disabled:opacity-50 flex items-center gap-2 transition-all shadow-lg shadow-[#C76E00]/20 active:scale-95"
                                            >
                                                {approvingId === store.id ? (
                                                    <Loader2 className="w-3 h-3 animate-spin" />
                                                ) : (
                                                    <CheckCircle className="w-3 h-3" />
                                                )}
                                                Duyệt ngay
                                            </button>
                                        )}
                                    </div>
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