import { useState, useEffect } from 'react';
import { Store, Tag, Check, Loader2, RefreshCw } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts';
import { adminApi, storeApi, foodTypeApi } from '../../../api/api';
import type { StoreDto } from '../../../types/swagger';
import { toast } from 'sonner';

const PIE_COLORS = ['#C76E00', '#F59E0B', '#10B981', '#6366F1', '#EF4444', '#3B82F6'];

export default function AdminDashboard() {
    const [pendingStores, setPendingStores] = useState<StoreDto[]>([]);
    const [allStores, setAllStores] = useState<StoreDto[]>([]);
    const [foodTypes, setFoodTypes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [approvingId, setApprovingId] = useState<number | null>(null);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [pendingRes, storesRes, typesRes] = await Promise.all([
                adminApi.getPendingStores(),
                storeApi.getAll(),
                foodTypeApi.getAll(),
            ]);
            setPendingStores(Array.isArray(pendingRes.data) ? pendingRes.data : []);
            setAllStores(Array.isArray(storesRes.data) ? storesRes.data : []);
            setFoodTypes(Array.isArray(typesRes.data) ? typesRes.data : []);
        } catch {
            toast.error('Không thể tải dữ liệu dashboard');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const handleApprove = async (storeId: number) => {
        try {
            setApprovingId(storeId);
            await adminApi.approveStore(storeId);
            toast.success('Đã phê duyệt cửa hàng thành công');
            setPendingStores(prev => prev.filter(s => s.id !== storeId));
            setAllStores(prev => prev.map(s => s.id === storeId ? { ...s, isApproved: true } : s));
        } catch {
            toast.error('Không thể phê duyệt cửa hàng');
        } finally {
            setApprovingId(null);
        }
    };

    const approvedStores = allStores.filter(s => s.isApproved);
    const activeStores = allStores.filter(s => s.isActive && s.isApproved);

    const categoryChartData = foodTypes.slice(0, 6).map((ft, i) => ({
        name: ft.name || ft.typeName || `Loại ${i + 1}`,
        value: 1,
        color: PIE_COLORS[i % PIE_COLORS.length],
    }));

    const storeStatusData = [
        { name: 'Đã duyệt', value: approvedStores.length, color: '#10B981' },
        { name: 'Chờ duyệt', value: pendingStores.length, color: '#F59E0B' },
        { name: 'Chưa active', value: allStores.filter(s => !s.isActive).length, color: '#6B7280' },
    ].filter(d => d.value > 0);

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex items-center justify-between bg-white/50 backdrop-blur-md p-6 rounded-2xl border border-orange-100/50 shadow-sm">
                <div className="border-l-4 border-[#C76E00] pl-4">
                    <h1 className="text-3xl font-black text-charcoal tracking-tighter uppercase italic">Tổng quan hệ thống</h1>
                    <p className="text-[10px] font-black text-charcoal/40 uppercase tracking-[0.2em] mt-1">
                        Dữ liệu thời gian thực và quản lý phê duyệt
                    </p>
                </div>

                <button
                    onClick={fetchData}
                    disabled={loading}
                    className="flex items-center gap-2 px-5 py-2.5 bg-white border border-orange-100 text-[#C76E00] text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-orange-50 transition-all active:scale-95 disabled:opacity-50"
                >
                    <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
                    Làm mới dữ liệu
                </button>
            </div>

            {/* SUMMARY CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { label: 'Tổng cửa hàng', value: allStores.length, sub: `${activeStores.length} hoạt động`, icon: Store, color: 'text-emerald-500', bg: 'bg-emerald-50' },
                    { label: 'Chờ phê duyệt', value: pendingStores.length, sub: 'Cần xử lý ngay', icon: RefreshCw, color: 'text-[#C76E00]', bg: 'bg-orange-50' },
                    { label: 'Danh mục món', value: foodTypes.length, sub: 'Phân loại món ăn', icon: Tag, color: 'text-[#C76E00]', bg: 'bg-orange-50' }
                ].map((stat, i) => (
                    <div key={i} className="bg-white rounded-[2rem] p-8 border border-orange-100/50 shadow-sm hover:shadow-xl hover:shadow-orange-500/5 transition-all group">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-[10px] font-black text-charcoal/30 uppercase tracking-[0.2em] mb-1">{stat.label}</p>
                                <h3 className="text-4xl font-black text-charcoal tracking-tighter italic group-hover:text-[#C76E00] transition-colors">
                                    {loading ? '...' : stat.value}
                                </h3>
                                <p className="text-[10px] font-bold text-charcoal/40 uppercase mt-2 italic">{stat.sub}</p>
                            </div>
                            <div className={cn("p-4 rounded-2xl transition-transform group-hover:scale-110", stat.bg, stat.color)}>
                                <stat.icon className="w-8 h-8" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* CHARTS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-[2.5rem] p-8 border border-orange-100/50 shadow-sm">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-2 h-8 bg-[#C76E00] rounded-full" />
                        <h2 className="text-xl font-black text-charcoal tracking-tighter uppercase italic">Trạng thái cửa hàng</h2>
                    </div>
                    <div className="h-[300px]">
                        {loading ? (
                            <div className="flex items-center justify-center h-full">
                                <Loader2 className="w-10 h-10 animate-spin text-[#C76E00]" />
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={storeStatusData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={100}
                                        paddingAngle={8}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {storeStatusData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip 
                                        contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                        itemStyle={{ fontWeight: 900, fontSize: '12px', textTransform: 'uppercase' }}
                                    />
                                    <Legend 
                                        verticalAlign="bottom" 
                                        height={36}
                                        formatter={(val) => <span className="text-[10px] font-black uppercase text-charcoal/60 tracking-widest">{val}</span>}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                <div className="bg-white rounded-[2.5rem] p-8 border border-orange-100/50 shadow-sm">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-2 h-8 bg-charcoal rounded-full" />
                        <h2 className="text-xl font-black text-charcoal tracking-tighter uppercase italic">Phân loại món ăn</h2>
                    </div>
                    <div className="h-[300px]">
                        {loading ? (
                            <div className="flex items-center justify-center h-full">
                                <Loader2 className="w-10 h-10 animate-spin text-charcoal" />
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={categoryChartData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={80}
                                        outerRadius={110}
                                        paddingAngle={5}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {categoryChartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip 
                                        contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                        itemStyle={{ fontWeight: 900, fontSize: '12px', textTransform: 'uppercase' }}
                                    />
                                    <Legend 
                                        verticalAlign="bottom" 
                                        height={36}
                                        formatter={(val) => <span className="text-[10px] font-black uppercase text-charcoal/60 tracking-widest">{val}</span>}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>
            </div>

            {/* PENDING STORES */}
            <div className="bg-white rounded-[2.5rem] p-8 border border-orange-100/50 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-8 bg-rose-500 rounded-full" />
                        <h2 className="text-xl font-black text-charcoal tracking-tighter uppercase italic">Cửa hàng chờ phê duyệt</h2>
                    </div>
                    <span className="bg-rose-500 text-white text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest">
                        {pendingStores.length} Yêu cầu
                    </span>
                </div>

                {loading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-[#C76E00]" />
                    </div>
                ) : pendingStores.length === 0 ? (
                    <div className="text-center py-20 bg-orange-50/30 rounded-3xl border-2 border-dashed border-orange-100/50">
                        <Check className="w-16 h-16 text-emerald-500/20 mx-auto mb-4" />
                        <p className="text-xs font-black text-charcoal/30 uppercase tracking-widest">Tuyệt vời! Không có yêu cầu nào đang chờ</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {pendingStores.map((store) => (
                            <div
                                key={store.id}
                                className="group flex items-center justify-between p-6 bg-white rounded-[2rem] border border-orange-100/50 hover:shadow-xl hover:shadow-orange-500/5 transition-all"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-2xl bg-cream flex items-center justify-center text-[#C76E00] border border-orange-100 shrink-0 group-hover:scale-110 transition-transform">
                                        <Store className="w-7 h-7" />
                                    </div>
                                    <div>
                                        <h4 className="font-black text-lg text-charcoal tracking-tighter italic prose-h4:m-0">
                                            {store.name || 'Cửa hàng không tên'}
                                        </h4>
                                        <p className="text-[10px] font-bold text-charcoal/40 uppercase tracking-widest mt-1">
                                            {store.phone || 'Chưa cập nhật SĐT'}
                                        </p>
                                    </div>
                                </div>

                                <button
                                    onClick={() => handleApprove(store.id)}
                                    disabled={approvingId === store.id}
                                    className="px-6 py-3 bg-[#C76E00] text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-[#A55B00] transition-all shadow-lg shadow-[#C76E00]/20 active:scale-95 disabled:opacity-50"
                                >
                                    {approvingId === store.id ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        'Phê duyệt'
                                    )}
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}