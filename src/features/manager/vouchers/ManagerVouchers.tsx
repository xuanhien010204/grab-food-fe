import { useState, useEffect, useCallback } from 'react';
import { Plus, Edit2, Trash2, Ticket, X, Calendar, Loader2 } from 'lucide-react';
import { voucherApi, userApi, storeApi } from '../../../api/api';
import { VoucherType, VoucherTypeName } from '../../../types/swagger';
import type { VoucherDto } from '../../../types/swagger';
import { toast } from 'sonner';

function toVietnamISOString(dateStr: string, endOfDay = false): string {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-').map(Number);
    const hours = endOfDay ? 23 : 0;
    const minutes = endOfDay ? 59 : 0;
    const seconds = endOfDay ? 59 : 0;
    const vnDate = new Date(Date.UTC(year, month - 1, day, hours - 7, minutes, seconds));
    return vnDate.toISOString();
}

function toVietnamDateString(utcDateStr: string): string {
    if (!utcDateStr) return '-';
    return new Date(utcDateStr).toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
}

function toVietnamInputDate(utcDateStr: string): string {
    if (!utcDateStr) return '';
    const date = new Date(utcDateStr);
    const vnFormatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit',
    });
    return vnFormatter.format(date);
}

const defaultForm = {
    code: '', name: '', description: '',
    type: VoucherType.Percent as number,
    value: 0, minOrderAmount: 0, maxDiscount: 0,
    startDate: '', endDate: '',
    usageLimit: 100, usageLimitPerUser: 1,
    isActive: true,
};

export default function ManagerVouchers() {
    const [vouchers, setVouchers] = useState<VoucherDto[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editing, setEditing] = useState<VoucherDto | null>(null);
    const [form, setForm] = useState({ ...defaultForm });
    const [storeId, setStoreId] = useState<number | null>(null);
    const [storeName, setStoreName] = useState('');

    const fetchData = useCallback(async () => {
        try {
            setIsLoading(true);
            const profileRes = await userApi.profile();
            const profile = profileRes.data as any;
            const storesRes = await storeApi.getAll();
            const stores = Array.isArray(storesRes.data) ? storesRes.data : [];
            const myStore = stores.find((s: any) => s.managerId === profile.id) || stores[0];
            if (!myStore) { toast.error('Không tìm thấy cửa hàng'); return; }
            setStoreId(myStore.id);
            setStoreName(myStore.name || 'Cửa hàng');
            const res = await voucherApi.getActive({ storeId: myStore.id });
            setVouchers(Array.isArray(res.data) ? res.data : []);
        } catch { toast.error('Không thể tải voucher'); }
        finally { setIsLoading(false); }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const resetForm = () => { setForm({ ...defaultForm }); setEditing(null); };

    const handleEdit = (v: VoucherDto) => {
        setEditing(v);
        setForm({
            code: v.code || '', name: v.name || '', description: v.description || '',
            type: v.type, value: v.value || 0, minOrderAmount: v.minOrderAmount || 0,
            maxDiscount: v.maxDiscount || 0,
            startDate: v.startDate ? toVietnamInputDate(v.startDate) : '',
            endDate: v.endDate ? toVietnamInputDate(v.endDate) : '',
            usageLimit: v.usageLimit || 100, usageLimitPerUser: v.usageLimitPerUser || 1,
            isActive: v.isActive ?? true,
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async () => {
        if (!storeId) { toast.error('Không xác định được cửa hàng'); return; }
        try {
            if (editing) {
                await voucherApi.update(editing.id, {
                    name: form.name, description: form.description,
                    minOrderAmount: form.minOrderAmount, maxDiscount: form.maxDiscount,
                    endDate: toVietnamISOString(form.endDate, true),
                    usageLimit: form.usageLimit, usageLimitPerUser: form.usageLimitPerUser,
                    isActive: form.isActive,
                });
                toast.success('Đã cập nhật voucher');
            } else {
                await voucherApi.create({
                    code: form.code, name: form.name, description: form.description,
                    type: form.type, value: form.value,
                    minOrderAmount: form.minOrderAmount, maxDiscount: form.maxDiscount,
                    startDate: toVietnamISOString(form.startDate),
                    endDate: toVietnamISOString(form.endDate, true),
                    usageLimit: form.usageLimit, usageLimitPerUser: form.usageLimitPerUser,
                    storeId: storeId,
                });
                toast.success('Đã tạo voucher');
            }
            setIsModalOpen(false);
            resetForm();
            fetchData();
        } catch { toast.error('Thao tác thất bại'); }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Xoá voucher này?')) return;
        try {
            await voucherApi.delete(id);
            toast.success('Đã xoá voucher');
            fetchData();
        } catch { toast.error('Xoá thất bại'); }
    };

    const formatDiscount = (v: VoucherDto) => {
        if (v.type === VoucherType.Percent) return `-${v.value}%`;
        if (v.type === VoucherType.FixedAmount) return `-${v.value?.toLocaleString()}đ`;
        return 'Miễn phí ship';
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Voucher cửa hàng</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{storeName} — Quản lý mã giảm giá</p>
                </div>
                <button
                    onClick={() => { resetForm(); setIsModalOpen(true); }}
                    className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white font-bold rounded-lg hover:bg-orange-700 transition-colors shadow-lg"
                >
                    <Plus className="w-5 h-5" /> Tạo voucher
                </button>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-orange-500" /></div>
            ) : vouchers.length === 0 ? (
                <div className="text-center py-16 bg-white dark:bg-[#2d1b15] rounded-xl shadow-sm">
                    <Ticket className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">Chưa có voucher nào cho cửa hàng.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {vouchers.map(v => (
                        <div key={v.id} className="bg-white dark:bg-[#2d1b15] rounded-xl border border-gray-200 dark:border-gray-800 p-5 shadow-sm hover:shadow-md transition-all relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-2">
                                <span className={`px-2 py-1 text-xs font-bold rounded-bl-lg ${v.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    {v.isActive ? 'ACTIVE' : 'INACTIVE'}
                                </span>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-xl bg-orange-100 dark:bg-orange-500/20 flex items-center justify-center text-orange-600 font-bold text-lg shrink-0">
                                    <Ticket className="w-6 h-6" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-gray-900 dark:text-white truncate">{v.name}</h3>
                                    <p className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded font-mono inline-block mt-1">{v.code}</p>
                                    <p className="text-orange-600 font-bold text-lg mt-2">{formatDiscount(v)}</p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Tối thiểu: {v.minOrderAmount?.toLocaleString()}đ
                                        {v.maxDiscount ? ` • Giảm tối đa: ${v.maxDiscount?.toLocaleString()}đ` : ''}
                                    </p>
                                    <div className="flex items-center gap-1 text-xs text-gray-400 mt-2">
                                        <Calendar className="w-3 h-3" />
                                        {toVietnamDateString(v.startDate)} → {toVietnamDateString(v.endDate)}
                                    </div>
                                    <p className="text-xs text-gray-400 mt-1">
                                        Đã dùng: {v.usedCount}/{v.usageLimit || '∞'} • {v.usageLimitPerUser}/người
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-2 mt-4 pt-3 border-t border-gray-100 dark:border-gray-800">
                                <button onClick={() => handleEdit(v)} className="flex-1 flex items-center justify-center gap-1 text-sm font-bold text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 py-2 rounded-lg transition-colors">
                                    <Edit2 className="w-4 h-4" /> Sửa
                                </button>
                                <button onClick={() => handleDelete(v.id)} className="flex-1 flex items-center justify-center gap-1 text-sm font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 py-2 rounded-lg transition-colors">
                                    <Trash2 className="w-4 h-4" /> Xoá
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => { setIsModalOpen(false); resetForm(); }}>
                    <div className="bg-white dark:bg-[#2d1b15] rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{editing ? 'Sửa voucher' : 'Tạo voucher mới'}</h2>
                            <button onClick={() => { setIsModalOpen(false); resetForm(); }} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            {!editing && (
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Mã voucher</label>
                                    <input value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="VD: SALE50"
                                        className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 font-mono" />
                                </div>
                            )}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Tên voucher</label>
                                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="VD: Giảm 50K"
                                    className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Mô tả</label>
                                <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500" />
                            </div>
                            {!editing && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Loại</label>
                                        <select value={form.type} onChange={e => setForm({ ...form, type: Number(e.target.value) })}
                                            className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500">
                                            <option value={VoucherType.Percent}>{VoucherTypeName[VoucherType.Percent]}</option>
                                            <option value={VoucherType.FixedAmount}>{VoucherTypeName[VoucherType.FixedAmount]}</option>
                                            <option value={VoucherType.FreeShipping}>{VoucherTypeName[VoucherType.FreeShipping]}</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Giá trị</label>
                                        <input type="number" value={form.value} onChange={e => setForm({ ...form, value: Number(e.target.value) })}
                                            className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500" />
                                    </div>
                                </div>
                            )}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Đơn tối thiểu</label>
                                    <input type="number" value={form.minOrderAmount} onChange={e => setForm({ ...form, minOrderAmount: Number(e.target.value) })}
                                        className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Giảm tối đa</label>
                                    <input type="number" value={form.maxDiscount} onChange={e => setForm({ ...form, maxDiscount: Number(e.target.value) })}
                                        className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Ngày bắt đầu</label>
                                    <input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} disabled={!!editing}
                                        className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 disabled:opacity-50" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Ngày kết thúc</label>
                                    <input type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Giới hạn sử dụng</label>
                                    <input type="number" value={form.usageLimit} onChange={e => setForm({ ...form, usageLimit: Number(e.target.value) })}
                                        className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Giới hạn/người</label>
                                    <input type="number" value={form.usageLimitPerUser} onChange={e => setForm({ ...form, usageLimitPerUser: Number(e.target.value) })}
                                        className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500" />
                                </div>
                            </div>
                            {editing && (
                                <div className="flex items-center gap-3">
                                    <input type="checkbox" id="isActive" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })}
                                        className="w-4 h-4 accent-orange-600" />
                                    <label htmlFor="isActive" className="text-sm font-bold text-gray-700 dark:text-gray-300">Kích hoạt</label>
                                </div>
                            )}
                        </div>
                        <div className="flex gap-3 p-6 border-t border-gray-200 dark:border-gray-800">
                            <button onClick={() => { setIsModalOpen(false); resetForm(); }}
                                className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-bold rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                Huỷ
                            </button>
                            <button onClick={handleSubmit}
                                className="flex-1 px-4 py-2.5 bg-orange-600 text-white font-bold rounded-lg hover:bg-orange-700 transition-colors">
                                {editing ? 'Cập nhật' : 'Tạo voucher'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
