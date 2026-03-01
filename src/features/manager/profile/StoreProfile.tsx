import { useState, useEffect } from 'react';
import { Loader2, MapPin, Phone, Clock } from 'lucide-react';
import { userApi, storeApi } from '../../../api/api';
import type { StoreDto } from '../../../types/swagger';
import { toast } from 'sonner';

const StoreProfile = () => {
  const [store, setStore] = useState<StoreDto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStore = async () => {
      try {
        // Get manager's profile to find their store
        const profileRes = await userApi.profile();
        const profile = profileRes.data as any;
        const storesRes = await storeApi.getAll();
        const stores = Array.isArray(storesRes.data) ? storesRes.data : [];
        // Find the store that belongs to this manager
        const myStore = stores.find((s: any) => s.managerId === profile.id) || stores[0];
        if (myStore) {
          setStore(myStore as StoreDto);
        }
      } catch (err) {
        console.error('Failed to fetch store:', err);
        toast.error('Không thể tải thông tin cửa hàng');
      } finally {
        setLoading(false);
      }
    };
    fetchStore();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
      </div>
    );
  }

  if (!store) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-gray-500 text-lg">Không tìm thấy cửa hàng</p>
          <p className="text-gray-400 text-sm mt-1">Vui lòng liên hệ Admin để được hỗ trợ</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cover Photo Section */}
      <div className="relative mb-20">
        <div
          className="bg-cover bg-center flex flex-col justify-end overflow-hidden rounded-xl min-h-80 shadow-lg"
          style={{
            backgroundImage: `linear-gradient(0deg, rgba(0, 0, 0, 0.6) 0%, rgba(0, 0, 0, 0) 40%), url(${store.imageSrc || 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=1200&h=300&fit=crop'})`,
            backgroundPosition: 'center'
          }}
        >
          <div className="flex p-6 justify-between items-end">
            <div>
              <p className="text-white tracking-light text-[32px] font-bold leading-tight">
                {store.name || 'Cửa hàng'}
              </p>
              <div className="flex items-center gap-2 mt-1">
                {store.isApproved && <span className="text-orange-400">✓</span>}
                <p className="text-white/90 text-base font-medium">
                  {store.isApproved ? 'Đã xác minh' : 'Chờ duyệt'} • {store.isOpen ? 'Đang mở' : 'Đã đóng'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Logo */}
        <div className="absolute -bottom-14 left-8">
          <div
            className="size-32 rounded-full border-4 border-white dark:border-gray-900 bg-white overflow-hidden shadow-xl bg-cover bg-center"
            style={{
              backgroundImage: `url(${store.imageSrc || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&h=300&fit=crop'})`
            }}
          ></div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left Column (8/12) */}
        <div className="md:col-span-8 flex flex-col gap-6">
          {/* Basic Info Card */}
          <div className="rounded-xl bg-white dark:bg-[#2d1b15] p-6 shadow-sm border border-gray-200 dark:border-gray-800">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 dark:bg-orange-500/20 rounded-lg text-orange-600">
                  ℹ️
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Thông tin cơ bản</h3>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1">
                  Tên cửa hàng
                </p>
                <p className="text-gray-900 dark:text-white font-medium">{store.name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1">
                  Số điện thoại
                </p>
                <p className="text-gray-900 dark:text-white font-medium flex items-center gap-1">
                  <Phone className="w-4 h-4 text-gray-400" />
                  {store.phone || 'N/A'}
                </p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-gray-600 dark:text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1">
                  Mô tả
                </p>
                <p className="text-gray-900 dark:text-white font-medium">{store.description || 'Chưa có mô tả'}</p>
              </div>
            </div>
          </div>

          {/* Location Card */}
          <div className="rounded-xl bg-white dark:bg-[#2d1b15] p-6 shadow-sm border border-gray-200 dark:border-gray-800">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 dark:bg-orange-500/20 rounded-lg text-orange-600">
                  <MapPin className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Vị trí</h3>
              </div>
            </div>
            <div className="flex flex-col lg:flex-row gap-6">
              <div className="flex-1">
                <p className="text-gray-900 dark:text-white font-medium text-lg leading-relaxed">
                  {store.address || 'Chưa cập nhật địa chỉ'}
                </p>
                {store.latitude && store.longitude && (
                  <p className="text-gray-600 dark:text-gray-400 text-sm mt-2">
                    Toạ độ: {store.latitude}, {store.longitude}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (4/12) */}
        <div className="md:col-span-4 flex flex-col gap-6">
          {/* Operating Hours Card */}
          <div className="rounded-xl bg-white dark:bg-[#2d1b15] p-6 shadow-sm border border-gray-200 dark:border-gray-800">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 dark:bg-orange-500/20 rounded-lg text-orange-600">
                  <Clock className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Giờ hoạt động</h3>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-800">
                <span className="font-medium text-gray-700 dark:text-gray-300">Mở cửa</span>
                <span className="font-bold text-gray-900 dark:text-white">{store.openTime || 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-800">
                <span className="font-medium text-gray-700 dark:text-gray-300">Đóng cửa</span>
                <span className="font-bold text-gray-900 dark:text-white">{store.closeTime || 'N/A'}</span>
              </div>
            </div>
            <div className={`mt-6 p-4 rounded-xl border flex items-center gap-3 ${store.isOpen
              ? 'bg-green-100 dark:bg-green-900/20 border-green-200 dark:border-green-800'
              : 'bg-red-100 dark:bg-red-900/20 border-red-200 dark:border-red-800'
              }`}>
              <span>{store.isOpen ? '✓' : '✕'}</span>
              <div>
                <p className={`text-sm font-bold leading-none ${store.isOpen ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'}`}>
                  Trạng thái: {store.isOpen ? 'Đang mở' : 'Đã đóng'}
                </p>
              </div>
            </div>
          </div>

          {/* Status Card */}
          <div className={`rounded-xl p-6 text-white shadow-lg ${store.isApproved ? 'bg-orange-600 shadow-orange-600/30' : 'bg-gray-600 shadow-gray-600/30'}`}>
            <h3 className="text-lg font-bold mb-4">Trạng thái cửa hàng</h3>
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between px-4 py-3 bg-white/10 rounded-xl border border-white/20">
                <span className="font-medium">Phê duyệt</span>
                <span className="font-bold">{store.isApproved ? '✓ Đã duyệt' : '⏳ Chờ duyệt'}</span>
              </div>
              <div className="flex items-center justify-between px-4 py-3 bg-white/10 rounded-xl border border-white/20">
                <span className="font-medium">Hoạt động</span>
                <span className="font-bold">{store.isActive ? '✓ Active' : '✕ Inactive'}</span>
              </div>
              <div className="flex items-center justify-between px-4 py-3 bg-white/10 rounded-xl border border-white/20">
                <span className="font-medium">Mã cửa hàng</span>
                <span className="font-bold">#{store.id}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoreProfile;
