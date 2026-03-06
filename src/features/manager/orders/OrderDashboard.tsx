import { useState, useEffect } from 'react';
import { Clock, User, Check, X, Phone, RefreshCw, MapPin, Eye, Receipt, CreditCard, StickyNote, ChevronRight } from 'lucide-react';
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
                <button
                  onClick={() => openOrderDetail(order)}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-bold rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-sm"
                  title="Xem chi tiết"
                >
                  <Eye className="w-4 h-4" />
                  Chi tiết
                </button>
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

      {/* ORDER DETAIL MODAL */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => setSelectedOrder(null)}>
          <div
            className="bg-white dark:bg-[#1e1007] w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-gradient-to-r from-orange-600 to-orange-700 text-white">
              <div>
                <p className="text-orange-100 text-xs font-bold uppercase tracking-widest">Chi tiết đơn hàng</p>
                <h2 className="text-xl font-bold mt-0.5">#{selectedOrder.id.slice(-8).toUpperCase()}</h2>
                <p className="text-orange-200 text-xs mt-1">{new Date(selectedOrder.purchaseDate).toLocaleString('vi-VN')}</p>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body - Scrollable */}
            <div className="overflow-y-auto flex-1 divide-y divide-gray-100 dark:divide-gray-800 relative">

              {/* Loading overlay */}
              {isLoadingDetail && (
                <div className="absolute inset-0 bg-white/70 dark:bg-black/50 z-10 flex items-center justify-center">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm text-gray-500 font-medium">Đang tải...</span>
                  </div>
                </div>
              )}

              {/* Customer Info */}
              <div className="p-5 space-y-2">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1"><User className="w-3.5 h-3.5" /> Khách hàng</p>
                <p className="font-bold text-gray-900 dark:text-white text-lg">{selectedOrder.recipientName || 'Khách'}</p>
                {selectedOrder.recipientPhone && (
                  <a href={`tel:${selectedOrder.recipientPhone}`} className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-medium hover:underline">
                    <Phone className="w-4 h-4" />{selectedOrder.recipientPhone}
                  </a>
                )}
                {selectedOrder.deliveryAddress && (
                  <div className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400 mt-1">
                    <MapPin className="w-4 h-4 mt-0.5 text-orange-500 shrink-0" />
                    <span>{selectedOrder.deliveryAddress}</span>
                  </div>
                )}
              </div>

              {/* Items */}
              <div className="p-5 space-y-3">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1"><Receipt className="w-3.5 h-3.5" /> Danh sách món ({selectedOrder.totalItems})</p>
                {isLoadingDetail ? (
                  <div className="space-y-2">
                    {[...Array(selectedOrder.totalItems || 2)].map((_, i) => (
                      <div key={i} className="flex items-center justify-between animate-pulse">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-gray-200 dark:bg-gray-700 rounded-lg" />
                          <div className="h-4 w-28 bg-gray-200 dark:bg-gray-700 rounded" />
                        </div>
                        <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {(selectedOrder.items && selectedOrder.items.length > 0) ? (
                      selectedOrder.items.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between text-sm bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3">
                          <div className="flex items-center gap-3">
                            {item.foodImage ? (
                              <img src={item.foodImage} alt={item.foodName || ''} className="w-10 h-10 rounded-lg object-cover bg-gray-200 shrink-0" />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-500/20 flex items-center justify-center shrink-0">
                                <span className="text-orange-600 font-black text-xs">{item.quantity}x</span>
                              </div>
                            )}
                            <div>
                              <p className="font-semibold text-gray-900 dark:text-white leading-tight">{item.foodName}</p>
                              <p className="text-xs text-gray-400">{item.quantity}x ₫{item.price.toLocaleString('vi-VN')}{item.sizeName ? ` · ${item.sizeName}` : ''}</p>
                            </div>
                          </div>
                          <p className="font-bold text-gray-900 dark:text-white shrink-0 ml-2">₫{item.total.toLocaleString('vi-VN')}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-400 italic text-center py-2">Không có dữ liệu món ăn</p>
                    )}
                  </div>
                )}
              </div>

              {/* Price Breakdown */}
              <div className="p-5 space-y-2">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Tổng tiền</p>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                    <span>Tạm tính</span>
                    <span className="font-medium">₫{(selectedOrder.subTotal || 0).toLocaleString('vi-VN')}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                    <span>🛵 Phí giao hàng</span>
                    <span className="font-medium">
                      {(selectedOrder.deliveryFee ?? 0) === 0
                        ? <span className="text-green-600 font-semibold">Miễn phí</span>
                        : `₫${selectedOrder.deliveryFee.toLocaleString('vi-VN')}`
                      }
                    </span>
                  </div>
                  {(selectedOrder.discount ?? 0) > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>🏷️ Giảm giá</span>
                      <span className="font-semibold">-₫{selectedOrder.discount.toLocaleString('vi-VN')}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-2 border-t border-dashed border-gray-200 dark:border-gray-700">
                    <span className="font-bold text-gray-900 dark:text-white">Tổng cộng</span>
                    <span className="text-xl font-black text-orange-600">₫{(selectedOrder.total || 0).toLocaleString('vi-VN')}</span>
                  </div>
                </div>
              </div>

              {/* Payment */}
              <div className="p-5 space-y-2">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1"><CreditCard className="w-3.5 h-3.5" /> Thanh toán</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">{selectedOrder.paymentMethodName || 'N/A'}</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${selectedOrder.paymentStatus === 1
                    ? 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-300'
                    : 'bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-300'
                    }`}>
                    {selectedOrder.paymentStatusName || 'Chưa thanh toán'}
                  </span>
                </div>
              </div>

              {/* Note */}
              {selectedOrder.note && (
                <div className="p-5 space-y-2">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1"><StickyNote className="w-3.5 h-3.5" /> Ghi chú</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 italic bg-orange-50 dark:bg-orange-500/10 p-3 rounded-lg border border-orange-100 dark:border-orange-500/20">{selectedOrder.note}</p>
                </div>
              )}

              {/* Cancel reason */}
              {selectedOrder.cancelReason && (
                <div className="p-5 space-y-2">
                  <p className="text-xs font-bold text-red-400 uppercase tracking-widest">Lý do huỷ</p>
                  <p className="text-sm text-red-600 dark:text-red-400 italic bg-red-50 dark:bg-red-500/10 p-3 rounded-lg">{selectedOrder.cancelReason}</p>
                </div>
              )}
            </div>

            {/* Modal Footer - Action */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex gap-2">
              {selectedOrder.status === OrderStatus.Pending && (
                <>
                  <button
                    onClick={() => { handleStatusUpdate(selectedOrder.id, OrderStatus.Confirmed); setSelectedOrder(null); }}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition-colors"
                  >
                    <Check className="w-4 h-4" /> Xác nhận
                  </button>
                  <button
                    onClick={() => { handleReject(selectedOrder.id); setSelectedOrder(null); }}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-colors"
                  >
                    <X className="w-4 h-4" /> Từ chối
                  </button>
                </>
              )}
              {selectedOrder.status === OrderStatus.Confirmed && (
                <button
                  onClick={() => { handleStatusUpdate(selectedOrder.id, OrderStatus.Preparing); setSelectedOrder(null); }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-yellow-600 hover:bg-yellow-700 text-white font-bold rounded-xl transition-colors"
                >
                  <Check className="w-4 h-4" /> Bắt đầu chuẩn bị
                </button>
              )}
              {selectedOrder.status === OrderStatus.Preparing && (
                <button
                  onClick={() => { handleStatusUpdate(selectedOrder.id, OrderStatus.Ready); setSelectedOrder(null); }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors"
                >
                  <Check className="w-4 h-4" /> Sẵn sàng giao
                </button>
              )}
              {selectedOrder.status === OrderStatus.Ready && (
                <button
                  onClick={() => { handleStatusUpdate(selectedOrder.id, OrderStatus.Delivering); setSelectedOrder(null); }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition-colors"
                >
                  <ChevronRight className="w-4 h-4" /> Bắt đầu giao
                </button>
              )}
              {selectedOrder.status === OrderStatus.Delivering && (
                <button
                  onClick={() => { handleStatusUpdate(selectedOrder.id, OrderStatus.Completed); setSelectedOrder(null); }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-colors"
                >
                  <Check className="w-4 h-4" /> Hoàn thành
                </button>
              )}
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-bold rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderDashboard;
