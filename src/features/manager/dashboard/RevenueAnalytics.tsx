import { useState, useEffect, useCallback } from 'react';
import { TrendingUp, ShoppingBag, DollarSign, RefreshCw, Loader2, PackageCheck } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { userApi, storeApi, orderApi } from '../../../api/api';
import { OrderStatus, OrderStatusName } from '../../../types/swagger';
import type { OrderDto } from '../../../types/swagger';
import { toast } from 'sonner';

const STATUS_COLORS: Record<number, string> = {
    0: '#F59E0B',
    1: '#3B82F6',
    2: '#8B5CF6',
    3: '#06B6D4',
    4: '#10B981',
    5: '#22C55E',
    6: '#EF4444',
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
        { label: 'Doanh thu hôm nay', value: `${todayRevenue.toLocaleString('vi-VN')}đ`, sub: `${todayOrders.length} đơn hôm nay`, icon: DollarSign, color: 'text-orange-600', bg: 'bg-orange-100' },
        { label: 'Tổng doanh thu', value: `${totalRevenue.toLocaleString('vi-VN')}đ`, sub: `${completedOrders.length} đơn hoàn thành`, icon: PackageCheck, color: 'text-green-600', bg: 'bg-green-100' },
        { label: 'Tổng đơn hàng', value: totalOrders.toString(), sub: `TB: ${avgOrderValue.toLocaleString('vi-VN', { maximumFractionDigits: 0 })}đ/đơn`, icon: ShoppingBag, color: 'text-blue-600', bg: 'bg-blue-100' },
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap justify-between items-end gap-3">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Phân tích doanh thu</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{storeName} — dữ liệu thực từ hệ thống</p>
                </div>
                <button onClick={fetchData} disabled={loading} className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-[#1a120b] font-semibold text-sm hover:bg-gray-50 disabled:opacity-50">
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Làm mới
                </button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-24"><Loader2 className="w-10 h-10 animate-spin text-orange-500" /></div>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {stats.map((stat, i) => (
                            <div key={i} className="bg-white dark:bg-[#1a120b] border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                                    <p className={`text-2xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
                                    <p className="text-xs text-gray-400 mt-1">{stat.sub}</p>
                                </div>
                                <div className={`p-3 rounded-full ${stat.bg} ${stat.color}`}><stat.icon className="w-6 h-6" /></div>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 bg-white dark:bg-[#1a120b] border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="font-bold text-gray-900 dark:text-white">Doanh thu 7 ngày gần đây</h3>
                                    <p className="text-sm text-gray-500">Chỉ tính đơn đã hoàn thành</p>
                                </div>
                                <div className="flex items-center gap-1 text-green-600 font-bold">
                                    <TrendingUp className="w-4 h-4" />
                                    <span className="text-sm">{totalRevenue.toLocaleString('vi-VN')}đ tổng</span>
                                </div>
                            </div>
                            <div className="h-[240px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={dailyRevenue} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11 }}
                                            tickFormatter={v => v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v)} />
                                        <Tooltip formatter={(value: number) => [`${value.toLocaleString('vi-VN')}đ`, 'Doanh thu']} labelFormatter={label => `Ngày: ${label}`} />
                                        <Bar dataKey="revenue" fill="#FF7F00" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-[#1a120b] border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm">
                            <h3 className="font-bold text-gray-900 dark:text-white mb-4">Phân bổ trạng thái đơn</h3>
                            {statusCounts.length > 0 ? (
                                <div className="h-[240px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie data={statusCounts} cx="50%" cy="45%" innerRadius={45} outerRadius={75} paddingAngle={3} dataKey="value">
                                                {statusCounts.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                                            </Pie>
                                            <Legend verticalAlign="bottom" height={36} iconSize={10} wrapperStyle={{ fontSize: '11px' }} />
                                            <Tooltip formatter={(value, name) => [`${value} đơn`, name]} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            ) : (
                                <div className="flex items-center justify-center h-[240px] text-gray-400">Chưa có đơn hàng</div>
                            )}
                        </div>
                    </div>

                    <div className="bg-white dark:bg-[#1a120b] border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm">
                        <h3 className="font-bold text-gray-900 dark:text-white mb-4">Top món bán chạy (đơn hoàn thành)</h3>
                        {topFoods.length > 0 ? (
                            <div className="space-y-4">
                                {topFoods.map((item, i) => (
                                    <div key={i} className="flex items-center gap-4">
                                        <span className="w-6 h-6 rounded-full bg-orange-100 text-orange-600 text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                                        <div className="flex-1">
                                            <div className="flex justify-between text-sm mb-1">
                                                <span className="font-medium text-gray-900 dark:text-white">{item.name}</span>
                                                <span className="text-gray-500">{item.qty} phần</span>
                                            </div>
                                            <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2">
                                                <div className="bg-orange-500 h-2 rounded-full" style={{ width: `${(item.qty / maxQty) * 100}%` }} />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-400 text-sm py-4 text-center">Chưa có dữ liệu (cần đơn hoàn thành có chi tiết món)</p>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default RevenueAnalytics;
