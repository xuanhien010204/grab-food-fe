import { useState, useEffect, useCallback } from 'react';
import { TrendingUp, ShoppingBag, DollarSign, RefreshCw, Loader2, PackageCheck, Info, ArrowUpRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, AreaChart, Area } from 'recharts';
import { userApi, storeApi, orderApi } from '../../../api/api';
import { OrderStatus, OrderStatusName } from '../../../types/swagger';
import type { OrderDto } from '../../../types/swagger';
import { toast } from 'sonner';

const STATUS_COLORS: Record<number, string> = {
    0: '#F59E0B', // Pending - Amber
    1: '#3B82F6', // Confirmed - Blue
    2: '#8B5CF6', // Preparing - Violet
    3: '#06B6D4', // Ready - Cyan
    4: '#10B981', // Delivering - Emerald
    5: '#E65100', // Completed - Dark Orange
    6: '#EF4444', // Cancelled - Red
};

function getLast7Days(): string[] {
    const days: string[] = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        days.push(d.toISOString().split('T')[0]);
    }
    return days;
}

const RevenueAnalytics = () => {
    const [orders, setOrders] = useState<OrderDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [storeName, setStoreName] = useState('');

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const profileRes = await userApi.profile();
            const profile = profileRes.data as any;
            const storesRes = await storeApi.getAll();
            const allStores = Array.isArray(storesRes.data) ? storesRes.data : [];
            const myStore = allStores.find((s: any) => s.managerId === profile.id) || allStores[0];
            if (!myStore) { toast.error('Không tìm thấy cửa hàng'); return; }
            setStoreName(myStore.name || 'Cửa hàng');
            const ordersRes = await orderApi.getStoreOrders(myStore.id);
            setOrders(Array.isArray(ordersRes.data) ? ordersRes.data : []);
        } catch { toast.error('Không thể tải dữ liệu phân tích'); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const completedOrders = orders.filter(o => o.status === OrderStatus.Completed);
    const totalRevenue = completedOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    const totalOrders = orders.length;
    const avgOrderValue = completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0;
    const todayStr = new Date().toISOString().split('T')[0];
    const todayOrders = orders.filter(o => (o.purchaseDate || '').startsWith(todayStr));
    const todayRevenue = todayOrders.filter(o => o.status === OrderStatus.Completed).reduce((sum, o) => sum + (o.total || 0), 0);

    const last7Days = getLast7Days();
    const dailyRevenue = last7Days.map(day => {
        const dayRevenue = orders
            .filter(o => o.status === OrderStatus.Completed && (o.purchaseDate || '').startsWith(day))
            .reduce((sum, o) => sum + (o.total || 0), 0);
        const dayOrders = orders.filter(o => (o.purchaseDate || '').startsWith(day)).length;
        const label = new Date(day).toLocaleDateString('vi-VN', { weekday: 'short' });
        return { day: label, revenue: dayRevenue, orders: dayOrders };
    });

    const statusCounts = Object.entries(
        orders.reduce((acc, o) => { acc[o.status] = (acc[o.status] || 0) + 1; return acc; }, {} as Record<number, number>)
    ).map(([status, count]) => ({
        name: OrderStatusName[Number(status)] || `Status ${status}`,
        value: count,
        color: STATUS_COLORS[Number(status)] || '#6B7280',
    }));

    const foodMap: Record<string, { name: string; qty: number }> = {};
    orders.filter(o => o.status === OrderStatus.Completed && o.items).forEach(o => {
        (o.items || []).forEach(item => {
            const key = item.foodId?.toString() || item.foodName || '';
            if (!foodMap[key]) foodMap[key] = { name: item.foodName || 'Unknown', qty: 0 };
            foodMap[key].qty += item.quantity || 0;
        });
    });
    const topFoods = Object.values(foodMap).sort((a, b) => b.qty - a.qty).slice(0, 5);
    const maxQty = topFoods[0]?.qty || 1;

    const stats = [
        { label: 'Hôm nay', value: `${todayRevenue.toLocaleString('vi-VN')}đ`, sub: `${todayOrders.length} đơn phát sinh`, icon: DollarSign, color: 'text-dark-orange', bg: 'bg-dark-orange/10', border: 'border-dark-orange/20' },
        { label: 'Tổng doanh thu', value: `${totalRevenue.toLocaleString('vi-VN')}đ`, sub: `${completedOrders.length} đơn hoàn thành`, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-500/10', border: 'border-emerald-100 dark:border-emerald-500/20' },
        { label: 'Giá trị TB', value: `${avgOrderValue.toLocaleString('vi-VN', { maximumFractionDigits: 0 })}đ`, sub: `${totalOrders} đơn trong hệ thống`, icon: ShoppingBag, color: 'text-charcoal dark:text-cream', bg: 'bg-cream/40 dark:bg-charcoal', border: 'border-dark-orange/10' },
    ];

    return (
        <div className="space-y-10 animate-in fade-in duration-700">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                   <h1 className="text-4xl font-black tracking-tight text-charcoal dark:text-cream uppercase italic italic">Phân tích hệ thống</h1>
                   <p className="text-[10px] font-black text-charcoal/30 dark:text-cream/30 mt-1 uppercase tracking-[0.2em] italic">{storeName} — BIỂU ĐỒ & DỮ LIỆU KINH DOANH</p>
                </div>
                <button 
                  onClick={fetchData} 
                  disabled={loading} 
                  className="flex items-center gap-2 px-8 py-4 bg-cream/40 dark:bg-charcoal border border-dark-orange/10 dark:border-gray-800 rounded-2xl font-black text-xs hover:bg-dark-orange/5 dark:hover:bg-dark-orange/10 transition-all shadow-sm active:scale-95 uppercase tracking-widest disabled:opacity-50"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-dark-orange' : ''}`} /> Đồng bộ dữ liệu
                </button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-32"><Loader2 className="w-16 h-16 animate-spin text-dark-orange" /></div>
            ) : (
                <div className="space-y-10">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {stats.map((stat, i) => (
                            <div key={i} className={`bg-cream/40 dark:bg-charcoal border-2 ${stat.border} rounded-[2.5rem] p-10 shadow-sm flex items-center justify-between transition-all hover:shadow-2xl hover:shadow-dark-orange/5 relative overflow-hidden group`}>
                                <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-all">
                                   <ArrowUpRight className="w-6 h-6 text-dark-orange" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-charcoal/30 dark:text-cream/30 uppercase tracking-[0.2em] mb-2">{stat.label}</p>
                                    <p className={`text-3xl font-black ${stat.color} tracking-tighter`}>{stat.value}</p>
                                    <p className="text-[10px] font-black text-charcoal/40 dark:text-cream/40 mt-1 uppercase tracking-widest italic">{stat.sub}</p>
                                </div>
                                <div className={`w-20 h-20 rounded-[1.5rem] ${stat.bg} ${stat.color} flex items-center justify-center shadow-inner border border-white/10 dark:border-charcoal transition-transform group-hover:scale-110 duration-500`}>
                                    <stat.icon className="w-10 h-10 stroke-[2px]" />
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                        {/* Area Chart Card */}
                        <div className="lg:col-span-2 bg-cream/40 dark:bg-charcoal border border-dark-orange/10 dark:border-gray-800 rounded-[3rem] p-10 shadow-sm transition-all hover:shadow-xl hover:shadow-dark-orange/5 relative group">
                            <div className="absolute top-0 left-0 w-full h-2 bg-dark-orange/10 group-hover:bg-dark-orange transition-all duration-700"></div>
                            <div className="flex justify-between items-start mb-10">
                                <div>
                                    <h3 className="text-2xl font-black text-charcoal dark:text-cream tracking-tighter uppercase italic">Biểu đồ doanh thu</h3>
                                    <p className="text-[10px] font-black text-charcoal/30 uppercase tracking-widest mt-1">Dữ liệu hoàn thành trong 7 ngày</p>
                                </div>
                                <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 px-4 py-2 rounded-2xl shadow-sm">
                                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                                    <span className="text-xs font-black text-emerald-700 dark:text-emerald-400">₫{totalRevenue.toLocaleString('vi-VN')}</span>
                                </div>
                            </div>
                            <div className="h-[320px] pr-4">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={dailyRevenue}>
                                        <defs>
                                            <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#E65100" stopOpacity={0.8}/>
                                                <stop offset="95%" stopColor="#E65100" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="5 5" vertical={false} stroke="#E65100" strokeOpacity={0.1} />
                                        <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#6B7280' }} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: '#6B7280' }}
                                            tickFormatter={v => v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v)} />
                                        <Tooltip 
                                            contentStyle={{ backgroundColor: '#1B1C1E', border: 'none', borderRadius: '20px', padding: '15px' }}
                                            itemStyle={{ color: '#FFFBF0', fontWeight: 900, fontSize: '12px' }}
                                            labelStyle={{ color: '#E65100', fontWeight: 900, fontSize: '10px', marginBottom: '5px', textTransform: 'uppercase' }}
                                            formatter={(value: number) => [`₫${value.toLocaleString('vi-VN')}`, 'Doanh thu']} 
                                        />
                                        <Area type="monotone" dataKey="revenue" stroke="#E65100" strokeWidth={5} fillOpacity={1} fill="url(#colorRev)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Pie Chart Card */}
                        <div className="bg-cream/40 dark:bg-charcoal border border-dark-orange/10 dark:border-gray-800 rounded-[3rem] p-10 shadow-sm transition-all hover:shadow-xl hover:shadow-dark-orange/5 relative group">
                            <h3 className="text-2xl font-black text-charcoal dark:text-cream tracking-tighter uppercase italic mb-8">Trạng thái</h3>
                            {statusCounts.length > 0 ? (
                                <div className="h-[300px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie 
                                              data={statusCounts} 
                                              cx="50%" 
                                              cy="40%" 
                                              innerRadius={55} 
                                              outerRadius={85} 
                                              paddingAngle={8} 
                                              dataKey="value"
                                            >
                                                {statusCounts.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />)}
                                            </Pie>
                                            <Legend 
                                              verticalAlign="bottom" 
                                              height={80} 
                                              iconSize={8} 
                                              layout="vertical"
                                              wrapperStyle={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', paddingLeft: '10px' }} 
                                            />
                                            <Tooltip 
                                              contentStyle={{ borderRadius: '15px', border: 'none', fontWeight: 900 }}
                                              formatter={(value, name) => [`${value} đơn`, name]} 
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-[300px] opacity-20">
                                   <RefreshCw className="w-16 h-16 animate-pulse" />
                                   <p className="mt-4 font-black uppercase tracking-widest italic">Chưa có dữ liệu</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Top Foods List */}
                    <div className="bg-cream/40 dark:bg-charcoal border border-dark-orange/10 dark:border-gray-800 rounded-[3rem] p-12 transition-all hover:shadow-xl hover:shadow-dark-orange/5 group overflow-hidden relative">
                        <div className="absolute right-0 bottom-0 p-10 opacity-5">
                           <PackageCheck className="w-48 h-48" />
                        </div>
                        <h3 className="text-2xl font-black text-charcoal dark:text-cream tracking-tighter uppercase italic mb-10 border-b-4 border-dark-orange/20 w-fit pb-2">Top món ưa chuộng</h3>
                        {topFoods.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8 relative z-10">
                                {topFoods.map((item, i) => (
                                    <div key={i} className="flex items-center gap-6 group/item">
                                        <span className="w-12 h-12 rounded-2xl bg-dark-orange/10 text-dark-orange text-lg font-black flex items-center justify-center shrink-0 border border-dark-orange/20 group-hover/item:bg-dark-orange group-hover/item:text-white transition-all shadow-sm">{i + 1}</span>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-end mb-2">
                                                <span className="font-black text-charcoal dark:text-cream uppercase text-sm italic">{item.name}</span>
                                                <span className="text-[10px] font-black text-dark-orange uppercase tracking-widest">{item.qty} phần đã bán</span>
                                            </div>
                                            <div className="w-full bg-dark-orange/10 rounded-full h-3 overflow-hidden shadow-inner">
                                                <div 
                                                  className="bg-dark-orange h-full rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(230,81,0,0.3)]" 
                                                  style={{ width: `${(item.qty / maxQty) * 100}%` }} 
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center py-10 opacity-20">
                                <Info className="w-16 h-16 mb-4" />
                                <p className="font-black uppercase tracking-widest italic">Bắt đầu bán món để xem thống kê</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default RevenueAnalytics;
