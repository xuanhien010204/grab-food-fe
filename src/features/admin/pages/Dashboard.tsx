import { useState, useEffect, useCallback } from 'react';
import {
  Store,
  ShoppingCart,
  Clock,
  TrendingUp,
  Loader2,
  Eye,
  CheckCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { adminApi, storeApi } from '../../../api/api';
import type { StoreDto } from '../../../types/swagger';

const Dashboard = () => {
  const [allStores, setAllStores] = useState<StoreDto[]>([]);
  const [pendingStores, setPendingStores] = useState<StoreDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [approvingId, setApprovingId] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [storesRes, pendingRes] = await Promise.all([
        storeApi.getAll(),
        adminApi.getPendingStores(),
      ]);
      setAllStores(Array.isArray(storesRes.data) ? storesRes.data : []);
      setPendingStores(Array.isArray(pendingRes.data) ? pendingRes.data : []);
    } catch (err) {
      console.error('Failed to fetch dashboard data', err);
      toast.error('Không thể tải dữ liệu dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleApprove = async (store: StoreDto) => {
    try {
      setApprovingId(store.id);
      await adminApi.approveStore(store.id);
      toast.success(`Đã duyệt cửa hàng "${store.name ?? store.id}" thành công!`);
      await fetchData();
    } catch (err) {
      console.error('Approve failed', err);
      toast.error(`Không thể duyệt cửa hàng "${store.name ?? store.id}"`);
    } finally {
      setApprovingId(null);
    }
  };

  const totalStores = allStores.length;
  const activeStores = allStores.filter((s) => s.isActive).length;
  const openStores = allStores.filter((s) => s.isOpen).length;
  const pendingCount = pendingStores.length;

  const stats = [
    {
      label: 'Tổng cửa hàng',
      value: totalStores.toLocaleString(),
      icon: Store,
      bgColor: 'bg-orange-100',
      iconColor: 'text-orange-600',
    },
    {
      label: 'Đang hoạt động',
      value: activeStores.toLocaleString(),
      icon: CheckCircle,
      bgColor: 'bg-orange-100',
      iconColor: 'text-orange-600',
    },
    {
      label: 'Đang mở cửa',
      value: openStores.toLocaleString(),
      icon: ShoppingCart,
      bgColor: 'bg-orange-100',
      iconColor: 'text-orange-600',
    },
    {
      label: 'Chờ duyệt',
      value: pendingCount.toLocaleString(),
      icon: Clock,
      bgColor: 'bg-orange-100',
      iconColor: 'text-orange-600',
    },
  ];

  const categories = [
    { name: 'Pizza', percentage: 40, color: 'bg-orange-500' },
    { name: 'Burgers', percentage: 25, color: 'bg-orange-300' },
    { name: 'Sushi', percentage: 15, color: 'bg-yellow-500' },
    { name: 'Khác', percentage: 20, color: 'bg-stone-400' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
        <span className="ml-3 text-gray-500 dark:text-gray-400">Đang tải dữ liệu...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <div
              key={index}
              className="bg-white dark:bg-[#2d2114] p-6 rounded-xl border border-[#eadbcd] dark:border-[#3d2f21] flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className={`${stat.bgColor} p-3 rounded-lg`}>
                <IconComponent className={`${stat.iconColor} w-6 h-6`} />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium dark:text-gray-400">{stat.label}</p>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</h3>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Revenue Trend */}
        <div className="xl:col-span-2 bg-white dark:bg-[#2d2114] p-6 rounded-xl border border-[#eadbcd] dark:border-[#3d2f21] shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Xu hướng doanh thu</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Hiệu suất trong 7 ngày qua</p>
            </div>
            <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-3 py-1 rounded-full text-sm font-medium">
              <TrendingUp className="w-4 h-4" />
              +12%
            </div>
          </div>

          {/* Simple Chart Placeholder */}
          <div className="h-[250px] w-full relative bg-gradient-to-b from-orange-50 dark:from-orange-900/10 to-transparent rounded-lg flex items-center justify-center">
            <div className="text-center text-gray-400 dark:text-gray-500">
              <p className="text-sm">Biểu đồ doanh thu (chưa có API)</p>
            </div>
          </div>

          <div className="flex justify-between mt-4 text-xs font-bold text-gray-400 uppercase tracking-tighter">
            <span>T2</span>
            <span>T3</span>
            <span>T4</span>
            <span>T5</span>
            <span>T6</span>
            <span>T7</span>
            <span>CN</span>
          </div>
        </div>

        {/* Category Distribution */}
        <div className="bg-white dark:bg-[#2d2114] p-6 rounded-xl border border-[#eadbcd] dark:border-[#3d2f21] shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Phân bố danh mục</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">Tỉ lệ đơn hàng theo loại</p>

          <div className="flex flex-col gap-6">
            {/* Pie Chart Placeholder */}
            <div className="relative size-48 mx-auto flex items-center justify-center">
              <div className="size-40 rounded-full border-8 border-gray-200 dark:border-gray-700 flex items-center justify-center">
                <div className="text-center">
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">{totalStores}</span>
                  <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold block">Cửa hàng</span>
                </div>
              </div>
            </div>

            {/* Legend */}
            <div className="grid grid-cols-2 gap-4">
              {categories.map((cat, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className={`size-2 rounded-full ${cat.color}`}></span>
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                    {cat.name} ({cat.percentage}%)
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Pending Approvals */}
      <div className="bg-white dark:bg-[#2d2114] rounded-xl border border-[#eadbcd] dark:border-[#3d2f21] shadow-sm overflow-hidden">
        <div className="p-6 border-b border-[#f4ede6] dark:border-[#3d2f21] flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            Cửa hàng chờ duyệt
            {pendingCount > 0 && (
              <span className="ml-2 text-sm font-medium text-orange-600">({pendingCount})</span>
            )}
          </h3>
          <button
            onClick={fetchData}
            className="text-sm font-semibold text-orange-600 dark:text-orange-500 hover:underline"
          >
            Làm mới
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 dark:bg-[#1f160d] text-[11px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                <th className="px-6 py-4">Thông tin cửa hàng</th>
                <th className="px-6 py-4">Địa chỉ</th>
                <th className="px-6 py-4">SĐT</th>
                <th className="px-6 py-4">Trạng thái</th>
                <th className="px-6 py-4 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f4ede6] dark:divide-[#3d2f21]">
              {pendingStores.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-400 dark:text-gray-500">
                    Không có cửa hàng nào chờ duyệt
                  </td>
                </tr>
              ) : (
                pendingStores.map((store) => (
                  <tr
                    key={store.id}
                    className="hover:bg-gray-50 dark:hover:bg-[#3a2f24] transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {store.imageSrc ? (
                          <img
                            src={store.imageSrc}
                            alt={store.name ?? ''}
                            className="size-10 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="size-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-orange-600 font-bold">
                            {(store.name ?? 'S').charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">
                            {store.name ?? `Cửa hàng #${store.id}`}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {store.description
                              ? store.description.length > 50
                                ? store.description.slice(0, 50) + '...'
                                : store.description
                              : `ID: ${store.id}`}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300 max-w-[200px] truncate">
                      {store.address ?? '—'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {store.phone ?? '—'}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 rounded text-[10px] font-bold uppercase bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400">
                        Chờ duyệt
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleApprove(store)}
                          disabled={approvingId === store.id}
                          className="px-4 py-1.5 bg-orange-600 text-white text-xs font-bold rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                        >
                          {approvingId === store.id ? (
                            <>
                              <Loader2 className="w-3 h-3 animate-spin" />
                              Đang duyệt...
                            </>
                          ) : (
                            'Duyệt'
                          )}
                        </button>
                        <button
                          onClick={() =>
                            toast.info(`Xem chi tiết cửa hàng: ${store.name ?? store.id}`)
                          }
                          className="px-4 py-1.5 border border-[#eadbcd] dark:border-[#3d2f21] text-gray-600 dark:text-gray-300 text-xs font-bold rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" />
                          Chi tiết
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
