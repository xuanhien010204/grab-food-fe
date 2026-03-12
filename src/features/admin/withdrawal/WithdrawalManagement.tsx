import { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, Clock, CreditCard, RefreshCw, Filter, Banknote, Eye, Building2, User, StickyNote, CalendarCheck } from 'lucide-react';
import { toast } from 'sonner';
import type { WithdrawalRequest } from '../../manager/withdrawal/WithdrawalPage';

const STORAGE_KEY = 'withdrawal_requests';

function loadRequests(): WithdrawalRequest[] {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
}
function saveRequests(reqs: WithdrawalRequest[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reqs));
}

const STATUS_CONFIG = {
    pending: { label: 'Chờ duyệt', icon: Clock, color: 'text-yellow-700 bg-yellow-100 dark:bg-yellow-500/20 dark:text-yellow-300' },
    approved: { label: 'Đã duyệt', icon: CheckCircle2, color: 'text-green-700 bg-green-100 dark:bg-green-500/20 dark:text-green-300' },
    rejected: { label: 'Từ chối', icon: XCircle, color: 'text-red-700 bg-red-100 dark:bg-red-500/20 dark:text-red-300' },
};

type FilterTab = 'all' | 'pending' | 'approved' | 'rejected';

function DetailModal({ req, onClose, onApprove, onReject }: {
    req: WithdrawalRequest;
    onClose: () => void;
    onApprove: () => void;
    onReject: () => void;
}) {
    const cfg = STATUS_CONFIG[req.status];
    const Icon = cfg.icon;
    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div
                className="bg-white dark:bg-[#1e1007] rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-orange-600 to-orange-700 px-6 py-5 text-white flex items-start justify-between">
                    <div>
                        <p className="text-orange-100 text-xs font-bold uppercase tracking-widest mb-1">Chi tiết yêu cầu rút tiền</p>
                        <h2 className="text-xl font-black">{req.id}</h2>
                        <p className="text-orange-200 text-xs mt-1">{new Date(req.createdAt).toLocaleString('vi-VN')}</p>
                    </div>
                    <span className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold ${cfg.color} mt-1`}>
                        <Icon className="w-3.5 h-3.5" />{cfg.label}
                    </span>
                </div>

                {/* Body */}
                <div className="overflow-y-auto flex-1 divide-y divide-gray-100 dark:divide-gray-800">

                    {/* Manager & Store Info */}
                    <div className="px-6 py-5 space-y-3">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                            <User className="w-3.5 h-3.5" /> Thông tin Manager
                        </p>
                        <div className="grid grid-cols-2 gap-y-2 text-sm">
                            <span className="text-gray-500">Họ tên</span>
                            <span className="font-semibold text-gray-900 dark:text-white text-right">{req.managerName}</span>
                            <span className="text-gray-500 flex items-center gap-1"><Building2 className="w-3 h-3" /> Cửa hàng</span>
                            <span className="font-semibold text-gray-900 dark:text-white text-right">{req.storeName}</span>
                        </div>
                    </div>

                    {/* Bank Info */}
                    <div className="px-6 py-5 space-y-3">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                            <CreditCard className="w-3.5 h-3.5" /> Thông tin nhận tiền
                        </p>
                        <div className="bg-gray-50 dark:bg-gray-900 rounded-xl divide-y divide-gray-100 dark:divide-gray-800 border border-gray-200 dark:border-gray-700">
                            {[
                                { label: 'Ngân hàng', value: req.bankName },
                                { label: 'Số tài khoản', value: req.accountNumber },
                                { label: 'Chủ tài khoản', value: req.accountHolder },
                            ].map(({ label, value }) => (
                                <div key={label} className="flex items-center justify-between px-4 py-3">
                                    <span className="text-sm text-gray-500">{label}</span>
                                    <span className="text-sm font-bold text-gray-900 dark:text-white">{value}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Amount Breakdown */}
                    <div className="px-6 py-5 space-y-3">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                            <Banknote className="w-3.5 h-3.5" /> Chi tiết số tiền
                        </p>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between text-gray-600 dark:text-gray-400">
                                <span>Số tiền yêu cầu</span>
                                <span className="font-semibold text-gray-900 dark:text-white">{req.requestedAmount.toLocaleString('vi-VN')}đ</span>
                            </div>
                            <div className="flex justify-between text-red-500">
                                <span>Phí nền tảng (5%)</span>
                                <span className="font-semibold">-{req.platformFee.toLocaleString('vi-VN')}đ</span>
                            </div>
                            <div className="flex justify-between font-bold text-green-600 text-base border-t border-dashed border-gray-200 dark:border-gray-700 pt-2">
                                <span>Manager thực nhận</span>
                                <span>{req.netAmount.toLocaleString('vi-VN')}đ</span>
                            </div>
                        </div>
                    </div>

                    {/* Note from Manager */}
                    {req.note && (
                        <div className="px-6 py-5 space-y-2">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                                <StickyNote className="w-3.5 h-3.5" /> Ghi chú từ Manager
                            </p>
                            <p className="text-sm text-gray-700 dark:text-gray-300 italic bg-orange-50 dark:bg-orange-500/10 p-3 rounded-xl border border-orange-100 dark:border-orange-500/20">{req.note}</p>
                        </div>
                    )}

                    {/* Processing Timeline */}
                    <div className="px-6 py-5 space-y-3">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                            <CalendarCheck className="w-3.5 h-3.5" /> Lịch sử xử lý
                        </p>
                        <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-orange-500 shrink-0" />
                                <span className="text-gray-500">Gửi yêu cầu:</span>
                                <span className="font-semibold text-gray-900 dark:text-white">{new Date(req.createdAt).toLocaleString('vi-VN')}</span>
                            </div>
                            {req.processedAt && (
                                <div className="flex items-center gap-3">
                                    <div className={`w-2 h-2 rounded-full shrink-0 ${req.status === 'approved' ? 'bg-green-500' : 'bg-red-500'}`} />
                                    <span className="text-gray-500">{req.status === 'approved' ? 'Phê duyệt:' : 'Từ chối:'}</span>
                                    <span className="font-semibold text-gray-900 dark:text-white">{new Date(req.processedAt).toLocaleString('vi-VN')}</span>
                                </div>
                            )}
                        </div>
                        {req.adminNote && (
                            <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
                                <p className="text-xs text-gray-500 mb-0.5 font-bold uppercase">Ghi chú Admin</p>
                                <p className="text-sm text-gray-700 dark:text-gray-300 italic">{req.adminNote}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex gap-3">
                    {req.status === 'pending' && (
                        <>
                            <button
                                onClick={onApprove}
                                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition-colors"
                            >
                                <CheckCircle2 className="w-4 h-4" /> Duyệt
                            </button>
                            <button
                                onClick={onReject}
                                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition-colors"
                            >
                                <XCircle className="w-4 h-4" /> Từ chối
                            </button>
                        </>
                    )}
                    <button onClick={onClose} className={`${req.status === 'pending' ? '' : 'flex-1'} px-6 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-bold rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors`}>
                        Đóng
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function WithdrawalManagement() {
    const [requests, setRequests] = useState<WithdrawalRequest[]>([]);
    const [filter, setFilter] = useState<FilterTab>('pending');
    const [actionModal, setActionModal] = useState<{ req: WithdrawalRequest; type: 'approve' | 'reject' } | null>(null);
    const [detailModal, setDetailModal] = useState<WithdrawalRequest | null>(null);
    const [adminNote, setAdminNote] = useState('');

    const reload = () => {
        const all = loadRequests().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setRequests(all);
    };

    useEffect(() => { reload(); }, []);

    const filtered = filter === 'all' ? requests : requests.filter(r => r.status === filter);
    const pendingCount = requests.filter(r => r.status === 'pending').length;

    const totalStats = {
        pending: requests.filter(r => r.status === 'pending').reduce((s, r) => s + r.requestedAmount, 0),
        approved: requests.filter(r => r.status === 'approved').reduce((s, r) => s + r.netAmount, 0),
        fees: requests.filter(r => r.status === 'approved').reduce((s, r) => s + r.platformFee, 0),
    };

    const handleConfirm = () => {
        if (!actionModal) return;
        const all = loadRequests();
        const idx = all.findIndex(r => r.id === actionModal.req.id);
        if (idx === -1) return;
        all[idx] = {
            ...all[idx],
            status: actionModal.type === 'approve' ? 'approved' : 'rejected',
            processedAt: new Date().toISOString(),
            adminNote: adminNote.trim() || undefined,
        };
        saveRequests(all);
        reload();
        toast.success(actionModal.type === 'approve' ? '✅ Đã phê duyệt yêu cầu rút tiền' : '❌ Đã từ chối yêu cầu');
        setActionModal(null);
        setDetailModal(null);
        setAdminNote('');
    };

    const TABS: { id: FilterTab; label: string }[] = [
        { id: 'pending', label: `Chờ duyệt (${pendingCount})` },
        { id: 'approved', label: 'Đã duyệt' },
        { id: 'rejected', label: 'Từ chối' },
        { id: 'all', label: 'Tất cả' },
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap gap-4 items-start justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Banknote className="w-6 h-6 text-orange-600" />
                        Quản lý rút tiền Manager
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">Phê duyệt hoặc từ chối yêu cầu rút doanh thu. Phí nền tảng 5%.</p>
                </div>
                <button onClick={reload} className="flex items-center gap-2 px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-[#1a120b] text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <RefreshCw className="w-4 h-4" /> Làm mới
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-2xl p-5">
                    <p className="text-xs font-bold text-yellow-600 uppercase tracking-widest mb-1">Chờ duyệt</p>
                    <p className="text-2xl font-black text-yellow-700 dark:text-yellow-400">{totalStats.pending.toLocaleString('vi-VN')}đ</p>
                    <p className="text-xs text-yellow-500 mt-1">{pendingCount} yêu cầu đang chờ</p>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl p-5">
                    <p className="text-xs font-bold text-green-600 uppercase tracking-widest mb-1">Đã chi trả (ròng)</p>
                    <p className="text-2xl font-black text-green-700 dark:text-green-400">{totalStats.approved.toLocaleString('vi-VN')}đ</p>
                    <p className="text-xs text-green-500 mt-1">Sau khi trừ phí sàn</p>
                </div>
                <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-2xl p-5">
                    <p className="text-xs font-bold text-orange-600 uppercase tracking-widest mb-1">Phí sàn thu được (5%)</p>
                    <p className="text-2xl font-black text-orange-700 dark:text-orange-400">{totalStats.fees.toLocaleString('vi-VN')}đ</p>
                    <p className="text-xs text-orange-400 mt-1">Từ đơn đã phê duyệt</p>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 flex-wrap">
                <Filter className="w-4 h-4 text-gray-400 self-center" />
                {TABS.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setFilter(tab.id)}
                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${filter === tab.id
                            ? 'bg-orange-600 text-white shadow-lg'
                            : 'bg-white dark:bg-[#1a120b] border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-300'
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-[#1a120b] border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm">
                {filtered.length === 0 ? (
                    <div className="py-16 text-center">
                        <Clock className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                        <p className="text-gray-500 font-semibold">Không có yêu cầu nào</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
                                    {['ID / Ngày', 'Manager / Cửa hàng', 'Yêu cầu', 'Phí 5%', 'Thực nhận', 'Ngân hàng', 'Trạng thái', 'Hành động'].map(h => (
                                        <th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(req => {
                                    const cfg = STATUS_CONFIG[req.status];
                                    const Icon = cfg.icon;
                                    return (
                                        <tr key={req.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                            <td className="px-4 py-4">
                                                <p className="font-bold text-xs text-gray-900 dark:text-white">{req.id}</p>
                                                <p className="text-xs text-gray-400">{new Date(req.createdAt).toLocaleString('vi-VN')}</p>
                                            </td>
                                            <td className="px-4 py-4">
                                                <p className="font-semibold text-sm text-gray-900 dark:text-white">{req.managerName}</p>
                                                <p className="text-xs text-gray-400">{req.storeName}</p>
                                            </td>
                                            <td className="px-4 py-4 font-bold text-gray-900 dark:text-white whitespace-nowrap">
                                                {req.requestedAmount.toLocaleString('vi-VN')}đ
                                            </td>
                                            <td className="px-4 py-4 text-red-500 font-semibold whitespace-nowrap">
                                                -{req.platformFee.toLocaleString('vi-VN')}đ
                                            </td>
                                            <td className="px-4 py-4 text-green-600 font-bold whitespace-nowrap">
                                                {req.netAmount.toLocaleString('vi-VN')}đ
                                            </td>
                                            <td className="px-4 py-4">
                                                <p className="text-sm font-semibold text-gray-900 dark:text-white">{req.bankName}</p>
                                                <p className="text-xs text-gray-400 font-mono">{req.accountNumber}</p>
                                                <p className="text-xs text-gray-400">{req.accountHolder}</p>
                                            </td>
                                            <td className="px-4 py-4">
                                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${cfg.color}`}>
                                                    <Icon className="w-3 h-3" />{cfg.label}
                                                </span>
                                                {req.adminNote && <p className="text-xs text-gray-400 mt-1 italic max-w-[120px] truncate">{req.adminNote}</p>}
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="flex flex-col gap-1.5">
                                                    {/* View Detail button - always visible */}
                                                    <button
                                                        onClick={() => setDetailModal(req)}
                                                        className="flex items-center justify-center gap-1 px-3 py-1.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-xs font-bold rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                                    >
                                                        <Eye className="w-3 h-3" /> Chi tiết
                                                    </button>
                                                    {req.status === 'pending' && (
                                                        <div className="flex gap-1">
                                                            <button
                                                                onClick={() => { setActionModal({ req, type: 'approve' }); setAdminNote(''); }}
                                                                className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-lg transition-colors"
                                                            >
                                                                <CheckCircle2 className="w-3 h-3" /> Duyệt
                                                            </button>
                                                            <button
                                                                onClick={() => { setActionModal({ req, type: 'reject' }); setAdminNote(''); }}
                                                                className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-lg transition-colors"
                                                            >
                                                                <XCircle className="w-3 h-3" /> Từ chối
                                                            </button>
                                                        </div>
                                                    )}
                                                    {req.status !== 'pending' && (
                                                        <p className="text-xs text-gray-400 text-center">
                                                            {req.processedAt ? new Date(req.processedAt).toLocaleDateString('vi-VN') : '-'}
                                                        </p>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Detail Modal */}
            {detailModal && (
                <DetailModal
                    req={detailModal}
                    onClose={() => setDetailModal(null)}
                    onApprove={() => { setActionModal({ req: detailModal, type: 'approve' }); setAdminNote(''); setDetailModal(null); }}
                    onReject={() => { setActionModal({ req: detailModal, type: 'reject' }); setAdminNote(''); setDetailModal(null); }}
                />
            )}

            {/* Action Confirmation Modal */}
            {actionModal && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setActionModal(null)}>
                    <div className="bg-white dark:bg-[#1e1007] rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-5" onClick={e => e.stopPropagation()}>
                        <div className="text-center">
                            {actionModal.type === 'approve'
                                ? <CheckCircle2 className="w-14 h-14 text-green-500 mx-auto mb-3" />
                                : <XCircle className="w-14 h-14 text-red-500 mx-auto mb-3" />
                            }
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                {actionModal.type === 'approve' ? 'Phê duyệt yêu cầu?' : 'Từ chối yêu cầu?'}
                            </h3>
                            <p className="text-sm text-gray-500 mt-1">{actionModal.req.id} — {actionModal.req.managerName}</p>
                        </div>

                        <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 space-y-2 text-sm">
                            <div className="flex justify-between text-gray-600 dark:text-gray-400">
                                <span>Yêu cầu</span>
                                <span className="font-semibold">{actionModal.req.requestedAmount.toLocaleString('vi-VN')}đ</span>
                            </div>
                            <div className="flex justify-between text-red-500">
                                <span>Phí sàn (5%)</span>
                                <span className="font-semibold">-{actionModal.req.platformFee.toLocaleString('vi-VN')}đ</span>
                            </div>
                            <div className="flex justify-between text-green-600 font-bold border-t border-gray-200 dark:border-gray-700 pt-2">
                                <span>Manager nhận</span>
                                <span>{actionModal.req.netAmount.toLocaleString('vi-VN')}đ</span>
                            </div>
                            <div className="text-gray-500 pt-1 flex items-center gap-1">
                                <CreditCard className="w-3 h-3" />
                                {actionModal.req.bankName} · <span className="font-mono">{actionModal.req.accountNumber}</span> · {actionModal.req.accountHolder}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Ghi chú Admin (tuỳ chọn)</label>
                            <input
                                type="text"
                                value={adminNote}
                                onChange={e => setAdminNote(e.target.value)}
                                placeholder="Ghi chú cho manager..."
                                className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                            />
                        </div>

                        <div className="flex gap-3">
                            <button onClick={() => setActionModal(null)} className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-bold rounded-xl hover:bg-gray-50 transition-colors">
                                Huỷ
                            </button>
                            <button
                                onClick={handleConfirm}
                                className={`flex-1 px-4 py-2.5 font-bold rounded-xl text-white transition-colors ${actionModal.type === 'approve'
                                    ? 'bg-green-600 hover:bg-green-700'
                                    : 'bg-red-500 hover:bg-red-600'
                                    }`}
                            >
                                {actionModal.type === 'approve' ? '✅ Xác nhận duyệt' : '❌ Xác nhận từ chối'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
