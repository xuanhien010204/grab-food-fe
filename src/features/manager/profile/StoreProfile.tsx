import { useState, useEffect } from 'react';
import { Loader2, MapPin, Phone, Clock, Globe } from 'lucide-react';
import { userApi, storeApi } from '../../../api/api';
import type { StoreDto } from '../../../types/swagger';
import { toast } from 'sonner';

const StoreProfile = () => {
  const [store, setStore] = useState<StoreDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [isToggling, setIsToggling] = useState(false);

  useEffect(() => {
    const fetchStore = async () => {
      try {
        const profileRes = await userApi.profile();
        const profile = profileRes.data as any;
        const storesRes = await storeApi.getAll();
        const stores = Array.isArray(storesRes.data) ? storesRes.data : [];
        const myStore = stores.find((s: any) => s.managerId === profile.id);
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
        <Loader2 className="w-10 h-10 text-[#C76E00] animate-spin" />
      </div>
    );
  }

  if (!store) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-charcoal/50 dark:text-cream/50 text-lg font-black uppercase tracking-widest italic">Không tìm thấy cửa hàng</p>
          <p className="text-charcoal/30 dark:text-cream/30 text-sm mt-1 uppercase tracking-tighter font-black">Vui lòng liên hệ Admin để được hỗ trợ</p>
        </div>
      </div>
    );
  }

  const handleToggleOpen = async () => {
    if (!store) return;
    try {
      setIsToggling(true);
      await storeApi.toggleOpen(store.id);
      setStore({ ...store, isOpen: !store.isOpen });
      toast.success(store.isOpen ? 'Đã đóng cửa hàng' : 'Đã mở cửa hàng');
    } catch (err: any) {
      console.error('Failed to toggle store open/close:', err);
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* Cover Photo Section */}
      <div className="relative mb-20 group">
        <div
          className="bg-cover bg-center flex flex-col justify-end overflow-hidden rounded-[2.5rem] min-h-80 shadow-2xl relative"
          style={{
            backgroundImage: `linear-gradient(0deg, rgba(0, 0, 0, 0.7) 0%, rgba(0, 0, 0, 0) 50%), url(${store.imageSrc || 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=1200&h=300&fit=crop'})`,
            backgroundPosition: 'center'
          }}
        >
          <div className="flex p-10 justify-between items-end relative z-10">
            <div className="space-y-2">
              <p className="text-white tracking-light text-[40px] font-black leading-tight italic tracking-tighter">
                {store.name || 'Cửa hàng'}
              </p>
              <div className="flex items-center gap-3">
                {store.isApproved && <div className="bg-emerald-500 text-white p-0.5 rounded-full"><CheckCircle className="w-3.5 h-3.5" /></div>}
                <p className="text-white/90 text-[10px] font-black uppercase tracking-[0.15em]">
                  {store.isApproved ? 'Xác minh bởi GrabFood' : 'Đang chờ phê duyệt'} • {store.isOpen ? 'Hoạt động' : 'Tạm nghỉ'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Logo */}
        <div className="absolute -bottom-14 left-10">
          <div
            className="size-36 rounded-[2.5rem] border-8 border-cream dark:border-charcoal bg-white overflow-hidden shadow-2xl bg-cover bg-center relative group/logo"
            style={{
              backgroundImage: `url(${store.imageSrc || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&h=300&fit=crop'})`
            }}
          >
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Left Column (8/12) */}
        <div className="md:col-span-8 space-y-8">
          {/* Basic Info Card */}
          <div className="rounded-[2.5rem] bg-white dark:bg-charcoal p-10 shadow-sm border border-gray-100 dark:border-gray-800 transition-all hover:shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-2 h-full bg-[#C76E00]/20"></div>
            <div className="flex items-center gap-5 mb-10">
              <div className="w-16 h-16 bg-[#C76E00]/10 rounded-[1.5rem] flex items-center justify-center text-[#C76E00] border border-[#C76E00]/20 transition-transform group-hover:scale-110">
                <span className="text-2xl">📋</span>
              </div>
              <div>
                <h3 className="text-2xl font-black text-charcoal dark:text-cream tracking-tighter uppercase italic">Giới thiệu cửa hàng</h3>
                <p className="text-[10px] font-black text-charcoal/30 uppercase tracking-[0.2em] mt-0.5">Tiếp cận khách hàng qua thông tin cơ bản</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
              <div className="sm:col-span-2">
                <label className="text-[#C76E00] text-[10px] font-black uppercase tracking-[0.2em] mb-3 block ml-1">Mô tả ngắn</label>
                <p className="text-charcoal/70 dark:text-cream/70 text-base leading-relaxed font-bold italic">
                  {store.description || 'Vui lòng cập nhật mô tả cửa hàng để thu hút khách hàng hơn.'}
                </p>
              </div>
              
              <div>
                <label className="text-[#C76E00] text-[10px] font-black uppercase tracking-[0.2em] mb-3 block ml-1">Đường dây nóng</label>
                <div className="px-6 py-4 bg-cream/30 dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-2xl font-black text-charcoal dark:text-cream flex items-center gap-3">
                  <Phone className="w-5 h-5 text-[#C76E00]/40" />
                  {store.phone || 'Chưa cung cấp'}
                </div>
              </div>
            </div>
          </div>

          {/* Location Card */}
          <div className="rounded-[2.5rem] bg-white dark:bg-charcoal p-10 shadow-sm border border-gray-100 dark:border-gray-800 transition-all hover:shadow-xl group relative">
             <div className="flex items-center gap-5 mb-10">
              <div className="w-16 h-16 bg-blue-500/10 rounded-[1.5rem] flex items-center justify-center text-blue-500 border border-blue-500/20 transition-transform group-hover:scale-110">
                <MapPin className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-charcoal dark:text-cream tracking-tighter uppercase italic">Vị trí hiển thị</h3>
                <p className="text-[10px] font-black text-charcoal/30 uppercase tracking-[0.2em] mt-0.5">Địa chỉ chính xác giúp giao hàng nhanh hơn</p>
              </div>
            </div>
            
            <div className="space-y-6">
              <p className="text-charcoal dark:text-cream font-bold text-xl leading-relaxed italic pr-10">
                {store.address || 'Chưa cập nhật địa chỉ'}
              </p>
            </div>
          </div>
        </div>

        {/* Right Column (4/12) */}
        <div className="md:col-span-4 space-y-8">
          {/* Operating Hours Card */}
          <div className="rounded-[2.5rem] bg-white dark:bg-charcoal p-10 shadow-sm border border-gray-100 dark:border-gray-800 transition-all hover:shadow-xl group">
             <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-500 border border-amber-500/10 transition-transform group-hover:scale-110">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black text-charcoal dark:text-cream tracking-tighter uppercase italic">Thời gian</h3>
            </div>
            
            <div className="space-y-6">
              <div className="flex items-center justify-between py-4 border-b border-gray-100 dark:border-gray-800">
                <span className="font-black text-gray-400 uppercase text-[9px] tracking-widest">Giờ mở cửa</span>
                <span className="font-black text-charcoal dark:text-cream text-lg">{store.openTime || '--:--'}</span>
              </div>
              <div className="flex items-center justify-between py-4 border-b border-gray-100 dark:border-gray-800">
                <span className="font-black text-gray-400 uppercase text-[9px] tracking-widest">Giờ đóng cửa</span>
                <span className="font-black text-charcoal dark:text-cream text-lg">{store.closeTime || '--:--'}</span>
              </div>
            </div>
            
            <button
              onClick={handleToggleOpen}
              disabled={isToggling}
              className={`mt-10 p-5 rounded-[2rem] border-2 flex w-full items-center justify-between transition-all group ${store.isOpen
                ? 'bg-emerald-50 border-emerald-100 dark:bg-emerald-500/5 dark:border-emerald-500/20'
                : 'bg-rose-50 border-rose-100 dark:bg-rose-500/5 dark:border-rose-500/20'
                } disabled:opacity-50 active:scale-[0.98] shadow-sm`}
            >
              <div className="flex items-center gap-4">
                <div className={`flex items-center justify-center w-12 h-12 rounded-[1.25rem] shadow-sm transition-transform group-hover:scale-110 ${store.isOpen ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                  {isToggling ? <Loader2 className="w-5 h-5 animate-spin" /> : (store.isOpen ? '⚡' : '💤')}
                </div>
                <div className="text-left font-sans">
                  <p className={`text-base font-black uppercase tracking-tighter ${store.isOpen ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}>
                    {store.isOpen ? 'Đang mở' : 'Tạm đóng'}
                  </p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Click để thay đổi</p>
                </div>
              </div>
              <div className={`w-14 h-8 rounded-full p-1.5 transition-all shadow-inner border ${store.isOpen ? 'bg-emerald-500 border-emerald-400' : 'bg-gray-200 dark:bg-gray-800 border-gray-100 dark:border-gray-700'}`}>
                <div className={`w-5 h-5 rounded-full bg-white shadow-2xl transition-transform duration-500 ${store.isOpen ? 'translate-x-6' : 'translate-x-0'}`} />
              </div>
            </button>
          </div>

          {/* System Card */}
          <div className={`rounded-[2.5rem] p-10 text-white shadow-3xl transition-all duration-700 relative overflow-hidden group ${store.isApproved ? 'bg-[#C76E00] shadow-[#C76E00]/20' : 'bg-charcoal shadow-charcoal/30'}`}>
            <div className="absolute -right-20 -top-20 w-64 h-64 bg-white/10 rounded-full blur-[100px] group-hover:bg-white/20 transition-all duration-1000"></div>
            <div className="flex items-center justify-between mb-10 border-b border-white/10 pb-6">
               <h3 className="text-xs font-black uppercase tracking-[0.3em] opacity-80">Trạng thái hệ thống</h3>
               <Globe className="w-5 h-5 opacity-40 animate-pulse" />
            </div>
            <div className="space-y-5 relative z-10">
              <div className="flex items-center justify-between px-6 py-5 bg-white/10 rounded-3xl border border-white/10 backdrop-blur-xl hover:bg-white/15 transition-all group/badge">
                <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Phê duyệt</span>
                <span className="font-black text-sm tracking-tighter italic">{store.isApproved ? 'ĐÃ XÁC MINH' : 'ĐANG CHỜ DUYỆT'}</span>
              </div>
              <div className="flex items-center justify-between px-6 py-5 bg-white/10 rounded-3xl border border-white/10 backdrop-blur-xl hover:bg-white/15 transition-all group/badge">
                <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Định danh</span>
                <span className="font-black font-mono text-xs opacity-90 tracking-tighter">#{store.id}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoreProfile;

const CheckCircle = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);
