import { useState, useEffect } from 'react';
import { Store, Tag, Check, Loader2, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts';
import { adminApi, storeApi, foodTypeApi } from '../../../api/api';
import type { StoreDto } from '../../../types/swagger';
import { toast } from 'sonner';

const PIE_COLORS = ['#FF7F00', '#3B82F6', '#10B981', '#6366F1', '#F59E0B', '#EF4444'];

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
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard Quản trị</h2>
                    <p className="text-sm text-gray-500 mt-1">Tổng quan hệ thống</p>
                </div>
                <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
                    <RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
                    Làm mới
                </Button>
            </div>

            {/* SUMMARY CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {loading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                        <Card key={i} className="border-none shadow animate-pulse">
                            <CardContent className="p-6 h-24" />
                        </Card>
                    ))
                ) : (
                    <>
                        <Card className="border-none shadow hover:shadow-md transition-shadow">
                            <CardContent className="p-6 flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Tổng cửa hàng</p>
                                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{allStores.length}</h3>
                                    <p className="text-xs text-gray-400 mt-1">{activeStores.length} đang hoạt động</p>
                                </div>
                                <div className="p-3 rounded-full bg-green-100 text-green-600">
                                    <Store className="w-6 h-6" />
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="border-none shadow hover:shadow-md transition-shadow">
                            <CardContent className="p-6 flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Chờ phê duyệt</p>
                                    <h3 className="text-2xl font-bold text-orange-600 mt-1">{pendingStores.length}</h3>
                                    <p className="text-xs text-gray-400 mt-1">Cần xử lý</p>
                                </div>
                                <div className="p-3 rounded-full bg-orange-100 text-orange-600">
                                    <Store className="w-6 h-6" />
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="border-none shadow hover:shadow-md transition-shadow">
                            <CardContent className="p-6 flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Danh mục món ăn</p>
                                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{foodTypes.length}</h3>
                                    <p className="text-xs text-gray-400 mt-1">Loại món trong hệ thống</p>
                                </div>
                                <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                                    <Tag className="w-6 h-6" />
                                </div>
                            </CardContent>
                        </Card>
                    </>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* STORE STATUS PIE CHART */}
                <div className="lg:col-span-2">
                    <Card className="shadow-sm h-full border-none">
                        <CardHeader>
                            <CardTitle>Trạng thái cửa hàng</CardTitle>
                        </CardHeader>
                        <CardContent className="h-[280px]">
                            {loading ? (
                                <div className="flex items-center justify-center h-full">
                                    <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
                                </div>
                            ) : storeStatusData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={storeStatusData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={4} dataKey="value">
                                            {storeStatusData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Legend verticalAlign="bottom" height={36} />
                                        <Tooltip formatter={(value, name) => [`${value} cửa hàng`, name]} />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex items-center justify-center h-full text-gray-400">Chưa có dữ liệu</div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* CATEGORY PIE CHART */}
                <div>
                    <Card className="shadow-sm h-full border-none">
                        <CardHeader>
                            <CardTitle>Danh mục món ăn</CardTitle>
                        </CardHeader>
                        <CardContent className="h-[280px]">
                            {loading ? (
                                <div className="flex items-center justify-center h-full">
                                    <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
                                </div>
                            ) : categoryChartData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={categoryChartData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={3} dataKey="value">
                                            {categoryChartData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Legend verticalAlign="bottom" height={36} />
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex items-center justify-center h-full text-gray-400">Chưa có danh mục</div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* PENDING STORES */}
            <Card className="border-none shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>⏳ Cửa hàng chờ phê duyệt</CardTitle>
                    <Badge variant="warning">{pendingStores.length} chờ duyệt</Badge>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
                        </div>
                    ) : pendingStores.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <Check className="w-12 h-12 mx-auto mb-2 text-green-400" />
                            <p>Không có cửa hàng nào chờ duyệt</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {pendingStores.map((store) => (
                                <div key={store.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                                    <div>
                                        <div className="flex items-center space-x-3">
                                            <h4 className="font-bold text-gray-900 dark:text-white">{store.name || 'Không có tên'}</h4>
                                            <Badge variant="warning">Pending</Badge>
                                        </div>
                                        <p className="text-sm text-gray-500 mt-1">{store.address || 'N/A'} • {store.phone || 'N/A'}</p>
                                    </div>
                                    <div className="flex space-x-2">
                                        <Button
                                            size="sm"
                                            className="bg-green-500 hover:bg-green-600 text-white"
                                            onClick={() => handleApprove(store.id)}
                                            disabled={approvingId === store.id}
                                        >
                                            {approvingId === store.id
                                                ? <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                                                : <Check className="w-4 h-4 mr-1" />
                                            }
                                            Approve
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
