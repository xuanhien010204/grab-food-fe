import { useState, useEffect } from 'react';
import { Clock, User, Check, X, Phone, RefreshCw, MapPin, Eye, Receipt, CreditCard, StickyNote, ChevronRight, TrendingUp } from 'lucide-react';
import { orderApi, userApi, storeApi } from '../../../api/api';
import type { OrderDto } from '../../../types/swagger';
import { OrderStatus, OrderStatusName } from '../../../types/swagger';
import { toast } from 'sonner';

const TAB_STATUS: { id: string; status: number; label: string }[] = [
  { id: 'Pending', status: OrderStatus.Pending, label: 'Chờ xử lý' },
  { id: 'Confirmed', status: OrderStatus.Confirmed, label: 'Đã xác nhận' },
  { id: 'Preparing', status: OrderStatus.Preparing, label: 'Đang chuẩn bị' },
  { id: 'Ready', status: OrderStatus.Ready, label: 'Sẵn sàng' },
  { id: 'Delivering', status: OrderStatus.Delivering, label: 'Đang giao' },
  { id: 'Completed', status: OrderStatus.Completed, label: 'Hoàn thành' },
  { id: 'Cancelled', status: OrderStatus.Cancelled, label: 'Đã huỷ' },
];

const OrderDashboard = () => {
  const [activeTab, setActiveTab] = useState(OrderStatus.Pending);
  const [orders, setOrders] = useState<OrderDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(true);
  const [storeId, setStoreId] = useState<number | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<OrderDto | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  const openOrderDetail = async (order: OrderDto) => {
    setSelectedOrder(order); // show modal immediately with basic info
    setIsLoadingDetail(true);
    try {
      const res = await orderApi.getById(order.id);
      setSelectedOrder(res.data);
    } catch {
      // keep the basic order if detail fetch fails
      toast.error("Không thể tải chi tiết món ăn");
    } finally {
      setIsLoadingDetail(false);
    }
  };

  // Get manager's store ID from profile + stores
  useEffect(() => {
    const getStoreId = async () => {
      try {
        const profileRes = await userApi.profile();
        const user = profileRes.data;
        if (user?.id) {
          const storesRes = await storeApi.getAll();
          const stores = Array.isArray(storesRes.data) ? storesRes.data : [];
          const myStore = stores.find((s: any) => s.managerId === user.id);
          if (myStore) {
            setStoreId(myStore.id);
          }
        }
      } catch (error) {
        console.error('Failed to get store ID', error);
      }
    };
    getStoreId();
  }, []);

  const fetchOrders = async () => {
    if (!storeId) return;
    try {
      const res = await orderApi.getStoreOrders(storeId);
      setOrders(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Failed to fetch orders", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch when storeId is available, poll every 15s
  useEffect(() => {
    if (!storeId) return;
    fetchOrders();
    const interval = setInterval(fetchOrders, 15000);
    return () => clearInterval(interval);
  }, [storeId]);

  const handleStatusUpdate = async (orderId: string, newStatus: number, reason?: string) => {
    try {
      await orderApi.updateStatus(orderId, { status: newStatus, reason });
      toast.success(`Đơn hàng đã cập nhật: ${OrderStatusName[newStatus]}`);
      fetchOrders();
    } catch (error) {
      toast.error("Cập nhật trạng thái thất bại");
    }
  };

  const handleReject = async (orderId: string) => {
    const reason = prompt('Lý do từ chối đơn hàng:');
    if (!reason) return;
    handleStatusUpdate(orderId, OrderStatus.Cancelled, reason);
  };

  const filteredOrders = orders.filter(o => o.status === activeTab);

  // Calculate counts for tabs
  const counts = orders.reduce((acc, order) => {
    acc[order.status] = (acc[order.status] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  const getTimeString = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  };

  const todayRevenue = orders
    .filter(o => o.status === OrderStatus.Completed || o.status === OrderStatus.Delivering)
    .reduce((sum, o) => sum + (o.total || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header with Store Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-2xl bg-cream/40 dark:bg-charcoal p-6 shadow-sm border border-dark-orange/10 dark:border-gray-800 border-l-4 border-l-dark-orange transition-all hover:shadow-md">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-charcoal/60 dark:text-cream/60 text-[10px] font-black uppercase tracking-[0.2em] mb-3">
                Trạng thái cửa hàng
              </p>
              <div className="flex items-center gap-3">
                <div className={`px-4 py-2 rounded-xl font-black text-white shadow-sm transition-all ${isOpen ? 'bg-emerald-600' : 'bg-rose-600 shadow-lg shadow-rose-600/20'}`}>
                  {isOpen ? '🟢 MỞ CỬA' : '🔴 ĐÓNG CỬA'}
                </div>
                <button
                  onClick={() => setIsOpen(!isOpen)}
                  className={`relative w-12 h-7 rounded-full transition-all duration-300 ${isOpen ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-700'}`}
                >
                  <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${isOpen ? 'right-1' : 'left-1'}`}></div>
                </button>
              </div>
            </div>
            <button onClick={fetchOrders} className="p-2 bg-gray-100 dark:bg-gray-800 hover:bg-dark-orange/10 rounded-full transition-all hover:rotate-180" title="Làm mới">
              <RefreshCw className={`w-5 h-5 text-gray-600 dark:text-gray-400 ${isLoading ? 'animate-spin text-dark-orange' : ''}`} />
            </button>
          </div>
        </div>

        <div className="rounded-2xl bg-gradient-to-br from-dark-orange to-[#BF4300] text-white p-6 shadow-xl shadow-dark-orange/20 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <TrendingUp className="w-24 h-24" />
          </div>
          <p className="text-orange-50 text-sm font-black uppercase tracking-widest mb-2">Doanh thu hôm nay</p>
          <div className="flex items-baseline gap-2 relative z-10">
            <h3 className="text-4xl font-black tabular-nums">₫{todayRevenue.toLocaleString('vi-VN')}</h3>
            <span className="text-orange-100/80 text-xs font-bold bg-white/10 px-2 py-0.5 rounded-full">ước tính</span>
          </div>
        </div>
      </div>

      {/* Order Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {TAB_STATUS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.status)}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black transition-all whitespace-nowrap border-2 duration-300 ${activeTab === tab.status
              ? 'border-dark-orange text-white bg-dark-orange shadow-lg shadow-dark-orange/20 scale-105'
              : 'border-dark-orange/10 dark:border-gray-800 text-charcoal/60 dark:text-cream/60 bg-cream/40 dark:bg-charcoal hover:border-dark-orange/30 hover:text-dark-orange'
              }`}
          >
            <span>{tab.label}</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${activeTab === tab.status ? 'bg-white/30 text-white' : 'bg-dark-orange/10 text-dark-orange'}`}>
              {counts[tab.status] || 0}
            </span>
          </button>
        ))}
      </div>

      {/* Orders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-500">
        {!storeId ? (
          <div className="col-span-full py-20 text-center bg-cream/40 dark:bg-charcoal rounded-3xl border border-dashed border-dark-orange/20 dark:border-gray-700">
            <p className="text-charcoal/40 font-black text-lg italic uppercase tracking-widest">Không tìm thấy cửa hàng của bạn</p>
          </div>
        ) : filteredOrders.length > 0 ? (
          filteredOrders.map((order) => (
            <div key={order.id} className="rounded-3xl bg-white dark:bg-gray-900 border border-dark-orange/10 dark:border-gray-800 overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_15px_40px_rgba(199,110,0,0.12)] transition-all duration-300 flex flex-col group/card relative">
              {/* Card Header with vibrant accent */}
              <div className="p-4 bg-gradient-to-br from-dark-orange/[0.04] to-transparent dark:from-dark-orange/10 border-b border-gray-100 dark:border-gray-800 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 bg-dark-orange/5 rounded-full -mr-8 -mt-8 blur-xl"></div>
                <div className="flex items-start justify-between relative z-10">
                  <div className="space-y-0.5">
                    <p className="font-black text-lg text-charcoal dark:text-cream tracking-tight">#{order.id.slice(-6).toUpperCase()}</p>
                    <div className="flex items-center gap-2 text-dark-orange/80 font-black text-[9px] uppercase tracking-[0.2em]">
                      <Clock className="w-3 h-3" />
                      {getTimeString(order.purchaseDate)}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-black text-dark-orange">
                      ₫{(order.total || 0).toLocaleString('vi-VN')}
                    </p>
                    <span className="px-1.5 py-0.5 bg-dark-orange/5 text-dark-orange rounded-md text-[8px] font-black uppercase tracking-widest border border-dark-orange/10">
                      {order.totalItems} món
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Content with high contrast */}
              <div className="p-4 space-y-4 flex-1 bg-white dark:bg-gray-900">
                {/* Customer Identity Section */}
                <div className="flex items-center gap-3 bg-gray-50/50 dark:bg-charcoal/40 p-3 rounded-2xl border border-gray-100 dark:border-gray-800 transition-colors group-hover/card:border-dark-orange/10">
                  <div className="w-10 h-10 rounded-full bg-dark-orange/10 flex items-center justify-center border-2 border-white dark:border-gray-800 shadow-sm shrink-0">
                    <User className="w-5 h-5 text-dark-orange" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-black text-charcoal dark:text-cream truncate uppercase text-xs mb-0.5">{order.recipientName || 'Khách hàng'}</p>
                    {order.recipientPhone && (
                      <a href={`tel:${order.recipientPhone}`} className="text-[10px] font-extrabold text-blue-500 hover:text-blue-600 transition-colors uppercase tracking-[0.1em]">
                        {order.recipientPhone}
                      </a>
                    )}
                  </div>
                </div>

                {/* Delivery Context */}
                {order.deliveryAddress && (
                  <div className="flex items-start gap-2 px-1">
                    <MapPin className="w-3.5 h-3.5 text-dark-orange shrink-0 mt-0.5 opacity-60" />
                    <span className="text-[10px] font-bold text-charcoal/60 dark:text-cream/60 leading-relaxed line-clamp-1">
                      {order.deliveryAddress}
                    </span>
                  </div>
                )}

                {/* Interactive Items Summary */}
                <button 
                  onClick={() => openOrderDetail(order)}
                  className="w-full text-left bg-gray-50/50 dark:bg-gray-800/40 hover:bg-white dark:hover:bg-gray-800 rounded-xl border border-dashed border-gray-200 dark:border-gray-700 p-3 space-y-2 transition-all group/btn hover:border-dark-orange/20"
                >
                  <div className="flex justify-between items-center mb-1">
                    <p className="text-[8px] font-black text-charcoal/40 dark:text-cream/40 uppercase tracking-[0.2em]">Xem đơn hàng</p>
                    <span className="text-[9px] font-black text-dark-orange uppercase group-hover/btn:translate-x-1 transition-transform flex items-center gap-1.5 underline decoration-dark-orange/10 decoration-2 underline-offset-2">
                       Chi tiết →
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {order.items?.slice(0, 2).map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between gap-2">
                        <p className="text-[10px] font-bold text-charcoal/70 dark:text-cream/70 truncate flex-1">
                          {item.foodName}
                        </p>
                        <span className="text-dark-orange text-[9px] font-black min-w-[1.5rem] text-right">
                          x{item.quantity}
                        </span>
                      </div>
                    ))}
                    {order.items && order.items.length > 2 && (
                      <p className="text-[9px] font-black text-charcoal/30 italic pt-1 border-t border-gray-100 dark:border-gray-700">
                        + {order.items.length - 2} món khác...
                      </p>
                    )}
                  </div>
                </button>

                {/* Footer Details */}
                <div className="flex justify-between items-center px-1 border-t border-gray-50 dark:border-gray-800 pt-3">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[8px] font-black text-charcoal/30 dark:text-cream/30 uppercase tracking-[0.2em]">Thanh toán</span>
                    <span className="text-[10px] font-black text-charcoal/70 dark:text-cream/70 uppercase tracking-tight">{order.paymentMethodName}</span>
                  </div>
                  <div className="text-right flex flex-col gap-0.5">
                    <span className="text-[8px] font-black text-charcoal/30 dark:text-cream/30 uppercase tracking-[0.2em]">Trạng thái</span>
                    <span className={`text-[10px] font-black uppercase tracking-widest ${order.paymentStatus === 1 ? 'text-emerald-500' : 'text-amber-500'}`}>
                      {order.paymentStatusName}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-3 bg-gray-50/50 dark:bg-white/5 border-t border-gray-100 dark:border-gray-800 flex gap-2">
                {activeTab === OrderStatus.Pending && (
                  <>
                    <button
                      onClick={() => handleStatusUpdate(order.id, OrderStatus.Confirmed)}
                      className="flex-[2] flex items-center justify-center gap-2 px-3 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl transition-all shadow-md active:scale-95 text-[10px] uppercase tracking-[0.1em]"
                    >
                      <Check className="w-3.5 h-3.5" /> Xác nhận
                    </button>
                    <button
                      onClick={() => handleReject(order.id)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-3 bg-white hover:bg-rose-50 dark:bg-transparent dark:hover:bg-rose-900/10 text-rose-600 border border-rose-100 dark:border-rose-900/30 font-black rounded-xl transition-all active:scale-95 text-[10px] uppercase tracking-[0.1em]"
                    >
                      <X className="w-3.5 h-3.5" /> Từ chối
                    </button>
                  </>
                )}
                {activeTab === OrderStatus.Confirmed && (
                  <button
                    onClick={() => handleStatusUpdate(order.id, OrderStatus.Preparing)}
                    className="w-full flex items-center justify-center gap-2 px-3 py-3.5 bg-amber-500 hover:bg-amber-600 text-white font-black rounded-xl transition-all shadow-md uppercase text-[10px] tracking-[0.15em]"
                  >
                    Bắt đầu chế biến <Clock className="w-3.5 h-3.5" />
                  </button>
                )}
                {activeTab === OrderStatus.Preparing && (
                  <button
                    onClick={() => handleStatusUpdate(order.id, OrderStatus.Ready)}
                    className="w-full flex items-center justify-center gap-2 px-3 py-3.5 bg-blue-500 hover:bg-blue-600 text-white font-black rounded-xl transition-all shadow-md uppercase text-[10px] tracking-[0.15em]"
                  >
                    Đã nấu xong <Check className="w-3.5 h-3.5" />
                  </button>
                )}
                {activeTab === OrderStatus.Ready && (
                  <button
                    onClick={() => handleStatusUpdate(order.id, OrderStatus.Delivering)}
                    className="w-full flex items-center justify-center gap-2 px-3 py-3.5 bg-indigo-500 hover:bg-indigo-600 text-white font-black rounded-xl transition-all shadow-md uppercase text-[10px] tracking-[0.15em]"
                  >
                    Giao shipper <TrendingUp className="w-3.5 h-3.5" />
                  </button>
                )}
                {activeTab === OrderStatus.Delivering && (
                  <button
                    onClick={() => handleStatusUpdate(order.id, OrderStatus.Completed)}
                    className="w-full flex items-center justify-center gap-2 px-3 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl transition-all shadow-md uppercase text-[10px] tracking-[0.15em]"
                  >
                    Hoàn tất đơn <Check className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-12 text-center">
            <Clock className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 font-bold text-lg">Không có đơn hàng ở trạng thái này</p>
            {isLoading && <p className="text-sm text-gray-400 mt-2">Đang tải...</p>}
          </div>
        )}
      </div>

      {/* DETAIL MODAL */}
      {selectedOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setSelectedOrder(null)}>
          <div className="bg-white dark:bg-charcoal w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden border border-dark-orange/10 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="p-6 bg-cream/30 dark:bg-gray-800/50 border-b border-dark-orange/10 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-black text-charcoal dark:text-cream">Chi tiết đơn hàng</h2>
                <p className="text-dark-orange font-bold text-sm">#{selectedOrder.id.toUpperCase()}</p>
                <p className="text-charcoal/40 dark:text-cream/40 text-[10px] font-black uppercase tracking-widest mt-1">
                  {new Date(selectedOrder.purchaseDate).toLocaleString('vi-VN')}
                </p>
              </div>
              <button 
                onClick={() => setSelectedOrder(null)}
                className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
                title="Đóng"
              >
                <X className="w-6 h-6 text-charcoal/60 dark:text-cream/60" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-8 custom-scrollbar relative">
              {isLoadingDetail && (
                <div className="absolute inset-0 z-10 bg-white/60 dark:bg-charcoal/60 backdrop-blur-[2px] flex items-center justify-center">
                  <div className="flex flex-col items-center gap-3">
                    <RefreshCw className="w-10 h-10 text-dark-orange animate-spin" />
                    <p className="text-sm font-black text-dark-orange uppercase tracking-widest">Đang tải chi tiết...</p>
                  </div>
                </div>
              )}
              
              {/* Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <p className="text-[10px] font-black text-charcoal/40 dark:text-cream/40 uppercase tracking-[0.2em] mb-3">Khách hàng</p>
                    <div className="flex items-center gap-4 bg-gray-50 dark:bg-gray-800/30 p-4 rounded-2xl border border-gray-100 dark:border-gray-700">
                      <div className="w-12 h-12 rounded-full bg-dark-orange/10 flex items-center justify-center shrink-0">
                        <User className="w-6 h-6 text-dark-orange" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-black text-charcoal dark:text-cream text-lg leading-tight truncate">{selectedOrder.recipientName || 'Khách hàng'}</p>
                        {selectedOrder.recipientPhone && (
                          <a href={`tel:${selectedOrder.recipientPhone}`} className="text-blue-500 font-bold text-sm mt-1 hover:underline flex items-center gap-2">
                             <Phone className="w-3 h-3" /> {selectedOrder.recipientPhone}
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-charcoal/40 dark:text-cream/40 uppercase tracking-[0.2em] mb-3">Địa chỉ nhận hàng</p>
                    <div className="flex items-start gap-3 bg-gray-50 dark:bg-gray-800/30 p-4 rounded-2xl border border-gray-100 dark:border-gray-700">
                      <MapPin className="w-5 h-5 text-dark-orange shrink-0 mt-0.5" />
                      <p className="text-sm font-bold text-charcoal/80 dark:text-cream/80 leading-relaxed">{selectedOrder.deliveryAddress}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <p className="text-[10px] font-black text-charcoal/40 dark:text-cream/40 uppercase tracking-[0.2em] mb-3">Thanh toán & Ghi chú</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-[#FFF8F0] dark:bg-dark-orange/5 p-4 rounded-2xl border border-dark-orange/10">
                      <p className="text-[10px] font-black text-dark-orange/60 uppercase tracking-widest mb-1 flex items-center gap-1.5"><CreditCard className="w-3 h-3" /> Hình thức</p>
                      <p className="text-sm font-black text-charcoal dark:text-cream uppercase tracking-tight truncate">
                        {selectedOrder.paymentMethodName || 'Tiền mặt'}
                      </p>
                    </div>
                    <div className="bg-[#FFF8F0] dark:bg-dark-orange/5 p-4 rounded-2xl border border-dark-orange/10">
                      <p className="text-[10px] font-black text-dark-orange/60 uppercase tracking-widest mb-1">Trạng thái</p>
                      <p className={`text-sm font-black uppercase tracking-tight truncate ${selectedOrder.paymentStatus === 1 ? 'text-emerald-500' : 'text-amber-500'}`}>
                        {selectedOrder.paymentStatusName}
                      </p>
                    </div>
                  </div>
                  {selectedOrder.note && (
                    <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 p-4 rounded-2xl">
                      <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1 flex items-center gap-1.5"><StickyNote className="w-3 h-3" /> Ghi chú</p>
                      <p className="text-sm font-bold text-amber-800 dark:text-amber-400 italic">"{selectedOrder.note}"</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Items Table */}
              <div>
                <p className="text-[10px] font-black text-charcoal/40 dark:text-cream/40 uppercase tracking-[0.2em] mb-4">Danh sách món ({selectedOrder.totalItems})</p>
                <div className="border border-gray-100 dark:border-gray-800 rounded-3xl overflow-hidden shadow-sm">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50 dark:bg-gray-800/50 text-[10px] font-black text-charcoal/40 dark:text-cream/40 uppercase tracking-widest border-b border-gray-100 dark:border-gray-800">
                      <tr>
                        <th className="px-6 py-4">Món ăn</th>
                        <th className="px-6 py-4 text-center">SL</th>
                        <th className="px-6 py-4 text-right">Đơn giá</th>
                        <th className="px-6 py-4 text-right">Thành tiền</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                      {selectedOrder.items?.map((item: any, idx: number) => (
                        <tr key={idx} className="group hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 overflow-hidden shrink-0 border border-gray-100 dark:border-gray-700">
                                {item.foodImage ? (
                                  <img src={item.foodImage} alt={item.foodName} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-gray-400">🥘</div>
                                )}
                              </div>
                              <p className="font-black text-charcoal dark:text-cream text-sm truncate max-w-[150px]">{item.foodName}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-lg font-black text-sm">{item.quantity}</span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <p className="text-sm font-bold text-charcoal/60 dark:text-cream/60">₫{item.price.toLocaleString('vi-VN')}</p>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <p className="text-sm font-black text-dark-orange">₫{item.total.toLocaleString('vi-VN')}</p>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-cream/20 dark:bg-gray-800/30 border-t border-gray-100 dark:border-gray-800">
                      <tr>
                        <td colSpan={3} className="px-6 py-3 text-right text-[10px] font-black text-charcoal/40 dark:text-cream/40 uppercase tracking-widest">Tạm tính</td>
                        <td className="px-6 py-3 text-right font-black text-sm text-charcoal dark:text-cream">₫{(selectedOrder.subTotal || 0).toLocaleString('vi-VN')}</td>
                      </tr>
                      {(selectedOrder.deliveryFee || 0) > 0 && (
                        <tr>
                          <td colSpan={3} className="px-6 py-2 text-right text-[10px] font-black text-emerald-600/80 uppercase tracking-widest">Phí giao hàng</td>
                          <td className="px-6 py-2 text-right font-bold text-sm text-emerald-600">+₫{selectedOrder.deliveryFee!.toLocaleString('vi-VN')}</td>
                        </tr>
                      )}
                      {(selectedOrder.discount || 0) > 0 && (
                        <tr>
                          <td colSpan={3} className="px-6 py-2 text-right text-[10px] font-black text-rose-500/80 uppercase tracking-widest">Giảm giá</td>
                          <td className="px-6 py-2 text-right font-bold text-sm text-rose-500">-₫{selectedOrder.discount!.toLocaleString('vi-VN')}</td>
                        </tr>
                      )}
                      <tr className="bg-dark-orange/5">
                        <td colSpan={3} className="px-6 py-6 text-right text-sm font-black text-dark-orange uppercase tracking-widest">Tổng cộng</td>
                        <td className="px-6 py-6 text-right font-black text-3xl text-dark-orange">
                          ₫{(selectedOrder.total || 0).toLocaleString('vi-VN')}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-dark-orange/10 bg-gray-50 dark:bg-gray-800/50 flex justify-end gap-3">
              <button 
                onClick={() => setSelectedOrder(null)}
                className="px-8 py-3 rounded-2xl font-black text-charcoal/60 dark:text-cream/60 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-all uppercase text-xs tracking-widest active:scale-95"
              >
                Đóng
              </button>
              {selectedOrder.status === OrderStatus.Pending && (
                <>
                  <button 
                    onClick={() => { handleStatusUpdate(selectedOrder.id, OrderStatus.Confirmed); setSelectedOrder(null); }}
                    className="px-10 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl transition-all shadow-lg shadow-emerald-600/20 uppercase text-xs tracking-widest active:scale-95 flex items-center gap-2"
                  >
                    <Check className="w-4 h-4" /> Xác nhận
                  </button>
                  <button 
                    onClick={() => { handleReject(selectedOrder.id); setSelectedOrder(null); }}
                    className="px-10 py-3 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-2xl transition-all shadow-lg shadow-rose-600/20 uppercase text-xs tracking-widest active:scale-95 flex items-center gap-2"
                  >
                    <X className="w-4 h-4" /> Từ chối
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderDashboard;
