import { useState, useEffect, useCallback } from 'react';
import { Wallet, ArrowDownCircle, Clock, CheckCircle2, XCircle, RefreshCw, Loader2, Banknote, AlertCircle } from 'lucide-react';
import { userApi, storeApi, orderApi } from '../../../api/api';
import { OrderStatus } from '../../../types/swagger';
import type { OrderDto } from '../../../types/swagger';
import { toast } from 'sonner';

const PLATFORM_FEE_RATE = 0.05; // 5%
const STORAGE_KEY = 'withdrawal_requests';

export interface WithdrawalRequest {
    id: string;
    managerId: number;
    managerName: string;
    storeId: number;
    storeName: string;
    requestedAmount: number;
    platformFee: number;
    netAmount: number;
    bankName: string;
    accountNumber: string;
    accountHolder: string;
    note?: string;
    status: 'pending' | 'approved' | 'rejected';
    createdAt: string;
    processedAt?: string;
    adminNote?: string;
}

function loadRequests(): WithdrawalRequest[] {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
}
function saveRequests(reqs: WithdrawalRequest[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reqs));
}

const STATUS_CONFIG = {
    pending: { label: 'Chờ duyệt', icon: Clock, color: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-500/10 dark:text-yellow-400', border: 'border-yellow-200 dark:border-yellow-500/30' },
    approved: { label: 'Đã duyệt', icon: CheckCircle2, color: 'text-green-600 bg-green-50 dark:bg-green-500/10 dark:text-green-400', border: 'border-green-200 dark:border-green-500/30' },
    rejected: { label: 'Từ chối', icon: XCircle, color: 'text-red-600 bg-red-50 dark:bg-red-500/10 dark:text-red-400', border: 'border-red-200 dark:border-red-500/30' },
};

export default function WithdrawalPage() {
    const [orders, setOrders] = useState<OrderDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [myInfo, setMyInfo] = useState<{ id: number; name: string; storeId: number; storeName: string } | null>(null);
    const [requests, setRequests] = useState<WithdrawalRequest[]>([]);

    const [form, setForm] = useState({
        requestedAmount: '',
        bankName: '',
        accountNumber: '',
        accountHolder: '',
        note: '',
    });

    const refresh = useCallback(async () => {
        try {
            setLoading(true);
            const profileRes = await userApi.profile();
            const profile = profileRes.data as any;
            const storesRes = await storeApi.getAll();
            const allStores = Array.isArray(storesRes.data) ? storesRes.data : [];
            const myStore = allStores.find((s: any) => s.managerId === profile.id);
            if (!myStore) { toast.error('Không tìm thấy cửa hàng'); return; }
            setMyInfo({ id: profile.id, name: profile.name, storeId: myStore.id, storeName: myStore.name || '' });
            const ordersRes = await orderApi.getStoreOrders(myStore.id);
            setOrders(Array.isArray(ordersRes.data) ? ordersRes.data : []);
            // Load my withdrawal requests
            const all = loadRequests();
            setRequests(all.filter(r => r.managerId === profile.id).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
        } catch { toast.error('Không thể tải dữ liệu'); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { refresh(); }, [refresh]);

    const totalRevenue = orders
        .filter(o => o.status === OrderStatus.Completed)
        .reduce((sum, o) => sum + (o.total || 0), 0);
    const platformFeeTotal = Math.round(totalRevenue * PLATFORM_FEE_RATE);
    const withdrawableRevenue = totalRevenue - platformFeeTotal;

    const totalWithdrawn = requests
        .filter(r => r.status === 'approved')
        .reduce((sum, r) => sum + r.netAmount, 0);
    const pendingWithdrawal = requests
        .filter(r => r.status === 'pending')
        .reduce((sum, r) => sum + r.netAmount, 0);
    const availableBalance = withdrawableRevenue - totalWithdrawn - pendingWithdrawal;

    const requestedAmount = parseFloat(form.requestedAmount) || 0;
    const feeForRequest = Math.round(requestedAmount * PLATFORM_FEE_RATE);
    const netForRequest = requestedAmount - feeForRequest;

    const handleSubmit = () => {
        if (!myInfo) return;
        if (requestedAmount <= 0) { toast.error('Vui lòng nhập số tiền hợp lệ'); return; }
        if (requestedAmount > availableBalance) { toast.error(`Số tiền vượt quá số dư khả dụng (${availableBalance.toLocaleString('vi-VN')}đ)`); return; }
        if (!form.bankName.trim()) { toast.error('Vui lòng nhập tên ngân hàng'); return; }
        if (!form.accountNumber.trim()) { toast.error('Vui lòng nhập số tài khoản'); return; }
        if (!form.accountHolder.trim()) { toast.error('Vui lòng nhập tên chủ tài khoản'); return; }

        setSubmitting(true);
        try {
            const req: WithdrawalRequest = {
                id: `WD-${Date.now()}`,
                managerId: myInfo.id,
                managerName: myInfo.name,
                storeId: myInfo.storeId,
                storeName: myInfo.storeName,
                requestedAmount,
                platformFee: feeForRequest,
                netAmount: netForRequest,
                bankName: form.bankName.trim(),
                accountNumber: form.accountNumber.trim(),
                accountHolder: form.accountHolder.trim(),
                note: form.note.trim() || undefined,
                status: 'pending',
                createdAt: new Date().toISOString(),
            };
            const all = loadRequests();
            all.push(req);
            saveRequests(all);
            setRequests([req, ...requests]);
            setForm({ requestedAmount: '', bankName: '', accountNumber: '', accountHolder: '', note: '' });
            toast.success('Yêu cầu rút tiền đã được gửi! Chờ Admin phê duyệt. 🎉');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Rút tiền</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">Yêu cầu rút doanh thu về tài khoản ngân hàng — phí nền tảng 5%</p>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-24"><Loader2 className="w-10 h-10 animate-spin text-orange-500" /></div>
            ) : (
                <>
                    {/* Revenue Overview */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-white dark:bg-[#1a120b] border border-gray-200 dark:border-gray-800 rounded-2xl p-5">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Tổng doanh thu</p>
                            <p className="text-2xl font-black text-gray-900 dark:text-white">{totalRevenue.toLocaleString('vi-VN')}đ</p>
                            <p className="text-xs text-gray-400 mt-1">Đơn hoàn thành</p>
                        </div>
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-5">
                            <p className="text-xs font-bold text-red-400 uppercase tracking-widest mb-1">Phí nền tảng (5%)</p>
                            <p className="text-2xl font-black text-red-600">-{platformFeeTotal.toLocaleString('vi-VN')}đ</p>
                            <p className="text-xs text-red-400 mt-1">Sàn thu 5% doanh thu</p>
                        </div>
                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-5">
                            <p className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-1">Đã rút / Đang chờ</p>
                            <p className="text-2xl font-black text-blue-600">{(totalWithdrawn + pendingWithdrawal).toLocaleString('vi-VN')}đ</p>
                            <p className="text-xs text-blue-400 mt-1">Đã duyệt + Chờ duyệt</p>
                        </div>
                        <div className="bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl p-5 text-white">
                            <p className="text-xs font-bold text-orange-100 uppercase tracking-widest mb-1">Số dư khả dụng</p>
                            <p className="text-2xl font-black">{Math.max(0, availableBalance).toLocaleString('vi-VN')}đ</p>
                            <p className="text-xs text-orange-100 mt-1">Sau phí & đã rút</p>
                        </div>
                    </div>

                    {/* Platform Fee Notice */}
                    <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
                        <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                        <p className="text-sm text-amber-800 dark:text-amber-200">
                            <strong>Chính sách phí sàn:</strong> Nền tảng thu <strong>5%</strong> trên tổng doanh thu từ đơn hoàn thành.
                            Số tiền bạn thực nhận = số tiền yêu cầu − 5% phí.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Withdrawal Form */}
                        <div className="bg-white dark:bg-[#1a120b] border border-gray-200 dark:border-gray-800 rounded-2xl p-6 space-y-5">
                            <div className="flex items-center gap-2">
                                <ArrowDownCircle className="w-5 h-5 text-orange-600" />
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Tạo yêu cầu rút tiền</h2>
                            </div>

                            {/* Amount */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Số tiền muốn rút (đ)</label>
                                <input
                                    type="number"
                                    min="0"
                                    placeholder="Nhập số tiền..."
                                    value={form.requestedAmount}
                                    onChange={e => setForm({ ...form, requestedAmount: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 text-lg font-semibold"
                                />
                                {requestedAmount > 0 && (
                                    <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-xl space-y-1.5 text-sm">
                                        <div className="flex justify-between text-gray-600 dark:text-gray-400">
                                            <span>Số tiền yêu cầu</span>
                                            <span className="font-medium">{requestedAmount.toLocaleString('vi-VN')}đ</span>
                                        </div>
                                        <div className="flex justify-between text-red-500">
                                            <span>Phí nền tảng (5%)</span>
                                            <span className="font-semibold">-{feeForRequest.toLocaleString('vi-VN')}đ</span>
                                        </div>
                                        <div className="flex justify-between font-bold text-green-600 border-t border-gray-200 dark:border-gray-700 pt-1.5">
                                            <span>Thực nhận</span>
                                            <span>{netForRequest.toLocaleString('vi-VN')}đ</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Bank Info */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Tên ngân hàng</label>
                                <input
                                    type="text"
                                    placeholder="VD: Vietcombank, MB, Techcombank..."
                                    value={form.bankName}
                                    onChange={e => setForm({ ...form, bankName: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Số tài khoản</label>
                                <input
                                    type="text"
                                    placeholder="Nhập số tài khoản..."
                                    value={form.accountNumber}
                                    onChange={e => setForm({ ...form, accountNumber: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Tên chủ tài khoản</label>
                                <input
                                    type="text"
                                    placeholder="Nhập tên chủ tài khoản..."
                                    value={form.accountHolder}
                                    onChange={e => setForm({ ...form, accountHolder: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Ghi chú (tuỳ chọn)</label>
                                <textarea
                                    placeholder="Ghi chú thêm..."
                                    value={form.note}
                                    onChange={e => setForm({ ...form, note: e.target.value })}
                                    rows={2}
                                    className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                                />
                            </div>

                            <button
                                onClick={handleSubmit}
                                disabled={submitting || requestedAmount <= 0}
                                className="w-full py-3 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-orange-100"
                            >
                                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Banknote className="w-4 h-4" />}
                                Gửi yêu cầu rút tiền
                            </button>
                        </div>

                        {/* Request History */}
                        <div className="bg-white dark:bg-[#1a120b] border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
                            <div className="flex items-center justify-between mb-5">
                                <div className="flex items-center gap-2">
                                    <Wallet className="w-5 h-5 text-orange-600" />
                                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">Lịch sử yêu cầu</h2>
                                </div>
                                <button onClick={refresh} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                                    <RefreshCw className="w-4 h-4 text-gray-500" />
                                </button>
                            </div>

                            {requests.length === 0 ? (
                                <div className="text-center py-12 text-gray-400">
                                    <Wallet className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                    <p className="font-medium">Chưa có yêu cầu nào</p>
                                </div>
                            ) : (
                                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                                    {requests.map(req => {
                                        const cfg = STATUS_CONFIG[req.status];
                                        const Icon = cfg.icon;
                                        return (
                                            <div key={req.id} className={`border rounded-xl p-4 space-y-2 ${cfg.border}`}>
                                                <div className="flex items-start justify-between">
                                                    <div>
                                                        <p className="font-bold text-gray-900 dark:text-white text-sm">{req.id}</p>
                                                        <p className="text-xs text-gray-400">{new Date(req.createdAt).toLocaleString('vi-VN')}</p>
                                                    </div>
                                                    <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${cfg.color}`}>
                                                        <Icon className="w-3 h-3" />
                                                        {cfg.label}
                                                    </span>
                                                </div>
                                                <div className="grid grid-cols-2 gap-1 text-sm">
                                                    <div className="text-gray-500">Yêu cầu</div>
                                                    <div className="font-semibold text-gray-900 dark:text-white text-right">{req.requestedAmount.toLocaleString('vi-VN')}đ</div>
                                                    <div className="text-red-500">Phí (5%)</div>
                                                    <div className="font-semibold text-red-500 text-right">-{req.platformFee.toLocaleString('vi-VN')}đ</div>
                                                    <div className="text-green-600 font-bold">Thực nhận</div>
                                                    <div className="font-bold text-green-600 text-right">{req.netAmount.toLocaleString('vi-VN')}đ</div>
                                                </div>
                                                <p className="text-xs text-gray-400">{req.bankName} · {req.accountNumber} · {req.accountHolder}</p>
                                                {req.adminNote && (
                                                    <p className="text-xs italic text-gray-500 bg-gray-50 dark:bg-gray-800 p-2 rounded-lg">Admin: {req.adminNote}</p>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
