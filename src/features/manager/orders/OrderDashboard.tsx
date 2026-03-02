import { useState, useEffect } from 'react';
import { Clock, User, Check, X, Phone, RefreshCw, MapPin } from 'lucide-react';
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
        <div className="rounded-xl bg-white dark:bg-[#2d1b15] p-6 shadow-sm border border-gray-200 dark:border-gray-800 border-l-4 border-l-orange-600">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm font-bold uppercase tracking-wider mb-2">
                Trạng thái cửa hàng
              </p>
              <div className="flex items-center gap-3">
                <div className={`px-4 py-2 rounded-lg font-bold text-white ${isOpen ? 'bg-green-600' : 'bg-red-600'}`}>
                  {isOpen ? '🟢 MỞ CỬA' : '🔴 ĐÓNG CỬA'}
                </div>
                <button
                  onClick={() => setIsOpen(!isOpen)}
                  className={`relative w-12 h-7 rounded-full transition-all ${isOpen ? 'bg-green-600' : 'bg-gray-400'}`}
                >
                  <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${isOpen ? 'right-1' : 'left-1'}`}></div>
                </button>
              </div>
            </div>
            <button onClick={fetchOrders} className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors" title="Làm mới">
              <RefreshCw className={`w-5 h-5 text-gray-600 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        <div className="rounded-xl bg-gradient-to-br from-orange-600 to-orange-700 text-white p-6 shadow-lg">
          <p className="text-orange-100 text-sm font-bold uppercase tracking-wider mb-2">Doanh thu hôm nay</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-4xl font-bold">₫{todayRevenue.toLocaleString('vi-VN')}</h3>
            <span className="text-orange-200 text-sm">ước tính</span>
          </div>
        </div>
      </div>

      {/* Order Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {TAB_STATUS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.status)}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl font-bold transition-all whitespace-nowrap border-2 ${activeTab === tab.status
              ? 'border-transparent text-white bg-gradient-to-r from-orange-600 to-orange-700'
              : 'border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 bg-white dark:bg-[#2d1b15] hover:border-gray-300'
              }`}
          >
            <span>{tab.label}</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${activeTab === tab.status ? 'bg-white/30 text-white' : 'bg-orange-100 text-orange-600'}`}>
              {counts[tab.status] || 0}
            </span>
          </button>
        ))}
      </div>

      {/* Orders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {!storeId ? (
          <div className="col-span-full py-12 text-center">
            <p className="text-gray-500 font-bold text-lg">Không tìm thấy cửa hàng của bạn</p>
          </div>
        ) : filteredOrders.length > 0 ? (
          filteredOrders.map((order) => (
            <div key={order.id} className="rounded-xl bg-white dark:bg-[#2d1b15] border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm hover:shadow-lg transition-shadow">
              {/* Card Header */}
              <div className="p-4 bg-orange-50 dark:bg-orange-500/10 border-b-2 border-orange-600">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-bold text-lg text-gray-900 dark:text-white">#{order.id.slice(-6)}</p>
                    <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400 text-sm mt-1">
                      <Clock className="w-4 h-4" />
                      {getTimeString(order.purchaseDate)}
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-orange-600 dark:text-orange-500">
                    ₫{(order.total || 0).toLocaleString('vi-VN')}
                  </p>
                </div>
              </div>

              {/* Card Content */}
              <div className="p-4 space-y-4">
                {/* Customer Info */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-gray-900 dark:text-white">
                    <User className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="font-bold">{order.recipientName || 'Khách'}</p>
                      {order.recipientPhone && (
                        <a href={`tel:${order.recipientPhone}`} className="text-sm text-blue-600 dark:text-blue-400 flex items-center gap-1 hover:underline">
                          <Phone className="w-3 h-3" />
                          {order.recipientPhone}
                        </a>
                      )}
                    </div>
                  </div>
                  {order.deliveryAddress && (
                    <div className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
                      <span>{order.deliveryAddress}</span>
                    </div>
                  )}
                </div>

                {/* Items */}
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 space-y-2 max-h-40 overflow-y-auto">
                  <p className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase">Món ({order.totalItems})</p>
                  {order.items?.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-sm">
                      <span className="text-gray-700 dark:text-gray-300">
                        {item.quantity}x {item.foodName}
                      </span>
                      <span className="text-gray-600 dark:text-gray-400">
                        ₫{item.total.toLocaleString('vi-VN')}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Notes */}
                {order.note && (
                  <div className="bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/30 rounded-lg p-2">
                    <p className="text-xs font-bold text-orange-800 dark:text-orange-200 mb-1">Ghi chú:</p>
                    <p className="text-xs text-orange-700 dark:text-orange-300 italic">{order.note}</p>
                  </div>
                )}

                {/* Payment info */}
                <div className="text-xs text-gray-500 flex justify-between">
                  <span>Thanh toán: {order.paymentMethodName}</span>
                  <span className={order.paymentStatus === 1 ? 'text-green-600' : 'text-yellow-600'}>
                    {order.paymentStatusName}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 flex gap-2">
                {activeTab === OrderStatus.Pending && (
                  <>
                    <button
                      onClick={() => handleStatusUpdate(order.id, OrderStatus.Confirmed)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-colors"
                    >
                      <Check className="w-4 h-4" /> Xác nhận
                    </button>
                    <button
                      onClick={() => handleReject(order.id)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4" /> Từ chối
                    </button>
                  </>
                )}
                {activeTab === OrderStatus.Confirmed && (
                  <button
                    onClick={() => handleStatusUpdate(order.id, OrderStatus.Preparing)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white font-bold rounded-lg transition-colors"
                  >
                    <Check className="w-4 h-4" /> Bắt đầu chuẩn bị
                  </button>
                )}
                {activeTab === OrderStatus.Preparing && (
                  <button
                    onClick={() => handleStatusUpdate(order.id, OrderStatus.Ready)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors"
                  >
                    <Check className="w-4 h-4" /> Sẵn sàng giao
                  </button>
                )}
                {activeTab === OrderStatus.Ready && (
                  <button
                    onClick={() => handleStatusUpdate(order.id, OrderStatus.Delivering)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-colors"
                  >
                    <Check className="w-4 h-4" /> Bắt đầu giao
                  </button>
                )}
                {activeTab === OrderStatus.Delivering && (
                  <button
                    onClick={() => handleStatusUpdate(order.id, OrderStatus.Completed)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-colors"
                  >
                    <Check className="w-4 h-4" /> Hoàn thành
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-12 text-center">
            <Clock className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 font-bold text-lg">Không có đơn hàng ở trạng thái này</p>
            {isLoading && <p className="text-sm text-gray-400 mt-2">Đang cập nhật...</p>}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderDashboard;
