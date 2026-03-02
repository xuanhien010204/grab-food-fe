import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Ticket, X, Calendar } from 'lucide-react';
import { voucherApi } from '../../../api/api';
import { VoucherType, VoucherTypeName } from '../../../types/swagger';
import type { VoucherDto } from '../../../types/swagger';
import { toast } from 'sonner';

/**
 * B01: Convert a date string (YYYY-MM-DD) to ISO string in Vietnam timezone (UTC+7).
 * This ensures vouchers don't expire 7 hours early when backend stores UTC.
 * For endDate, we set it to end-of-day (23:59:59) in VN time.
 */
function toVietnamISOString(dateStr: string, endOfDay = false): string {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-').map(Number);
    // Create date as VN time by subtracting 7 hours offset
    const hours = endOfDay ? 23 : 0;
    const minutes = endOfDay ? 59 : 0;
    const seconds = endOfDay ? 59 : 0;
    // VN is UTC+7, so we subtract 7 hours to get UTC equivalent
    const vnDate = new Date(Date.UTC(year, month - 1, day, hours - 7, minutes, seconds));
    return vnDate.toISOString();
}

/** Convert UTC date string to VN date display */
function toVietnamDateString(utcDateStr: string): string {
    if (!utcDateStr) return '-';
    const date = new Date(utcDateStr);
    return date.toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
}

/** Convert UTC date to YYYY-MM-DD for input[type=date] in VN timezone */
function toVietnamInputDate(utcDateStr: string): string {
    if (!utcDateStr) return '';
    const date = new Date(utcDateStr);
    // Format in VN timezone
    const vnFormatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Ho_Chi_Minh',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    });
    return vnFormatter.format(date); // Returns YYYY-MM-DD format
}

const defaultForm = {
    code: '',
    name: '',
    description: '',
    type: VoucherType.Percent as number,
    value: 0,
    minOrderAmount: 0,
    maxDiscount: 0,
    startDate: '',
    endDate: '',
    usageLimit: 100,
    usageLimitPerUser: 1,
    storeId: null as number | null,
    isActive: true,
};

export default function VoucherManagement() {
    const [vouchers, setVouchers] = useState<VoucherDto[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editing, setEditing] = useState<VoucherDto | null>(null);
    const [form, setForm] = useState({ ...defaultForm });

    const fetchVouchers = async () => {
        try {
            const res = await voucherApi.getActive();
            setVouchers(Array.isArray(res.data) ? res.data : []);
        } catch {
            console.error('Failed to fetch vouchers');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchVouchers(); }, []);

    const resetForm = () => {
        setForm({ ...defaultForm });
        setEditing(null);
    };

    const handleEdit = (v: VoucherDto) => {
        setEditing(v);
        setForm({
            code: v.code || '',
            name: v.name || '',
            description: v.description || '',
            type: v.type,
            value: v.value || 0,
            minOrderAmount: v.minOrderAmount || 0,
            maxDiscount: v.maxDiscount || 0,
            startDate: v.startDate ? toVietnamInputDate(v.startDate) : '',
            endDate: v.endDate ? toVietnamInputDate(v.endDate) : '',
            usageLimit: v.usageLimit || 100,
            usageLimitPerUser: v.usageLimitPerUser || 1,
            storeId: v.storeId || null,
            isActive: v.isActive ?? true,
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async () => {
        try {
            if (editing) {
                await voucherApi.update(editing.id, {
                    name: form.name,
                    description: form.description,
                    minOrderAmount: form.minOrderAmount,
                    maxDiscount: form.maxDiscount,
                    endDate: toVietnamISOString(form.endDate, true),
                    usageLimit: form.usageLimit,
                    usageLimitPerUser: form.usageLimitPerUser,
                    isActive: form.isActive,
                });
                toast.success('Đã cập nhật voucher');
            } else {
                await voucherApi.create({
                    code: form.code,
                    name: form.name,
                    description: form.description,
                    type: form.type,
                    value: form.value,
                    minOrderAmount: form.minOrderAmount,
                    maxDiscount: form.maxDiscount,
                    startDate: toVietnamISOString(form.startDate),
                    endDate: toVietnamISOString(form.endDate, true),
                    usageLimit: form.usageLimit,
                    usageLimitPerUser: form.usageLimitPerUser,
                    storeId: form.storeId,
                });
                toast.success('Đã tạo voucher');
            }
            setIsModalOpen(false);
            resetForm();
            fetchVouchers();
        } catch {
            toast.error('Thao tác thất bại');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Xoá voucher này?')) return;
        try {
            await voucherApi.delete(id);
            toast.success('Đã xoá voucher');
            fetchVouchers();
        } catch {
            toast.error('Xoá thất bại');
        }
    };

    const getTypeLabel = (type: number) => VoucherTypeName[type] || 'Unknown';
    const formatDiscount = (v: VoucherDto) => {
        if (v.type === VoucherType.Percent) return `-${v.value}%`;
        if (v.type === VoucherType.FixedAmount) return `-${v.value?.toLocaleString()}đ`;
        return 'Free Ship';
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Voucher Management</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">Manage discount codes</p>
                </div>
                <button
                    onClick={() => { resetForm(); setIsModalOpen(true); }}
                    className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white font-bold rounded-lg hover:bg-orange-700 transition-colors shadow-lg"
                >
                    <Plus className="w-5 h-5" />
                    New Voucher
                </button>
            </div>

            {isLoading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="bg-white dark:bg-[#2d1b15] rounded-xl h-20 animate-pulse shadow-sm" />
                    ))}
                </div>
            ) : vouchers.length === 0 ? (
                <div className="text-center py-16 bg-white dark:bg-[#2d1b15] rounded-xl shadow-sm">
                    <Ticket className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No vouchers found.</p>
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
                                <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 shrink-0">
                                    <Ticket className="w-6 h-6" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-lg text-gray-900 dark:text-white tracking-wide">{v.code}</h3>
                                    <p className="text-sm text-gray-500">{v.name}</p>
                                    <p className="text-orange-600 font-bold text-xl mt-1">
                                        {formatDiscount(v)}
                                    </p>
                                    <div className="flex flex-wrap gap-2 mt-2 text-xs text-gray-500">
                                        <span className="bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">{getTypeLabel(v.type)}</span>
                                        <span>Min: {v.minOrderAmount?.toLocaleString()}đ</span>
                                        {v.maxDiscount > 0 && <span>Max: {v.maxDiscount?.toLocaleString()}đ</span>}
                                    </div>
                                    <div className="flex items-center gap-1 text-xs text-gray-400 mt-2">
                                        <Calendar className="w-3 h-3" />
                                        {toVietnamDateString(v.startDate)} - {toVietnamDateString(v.endDate)}
                                    </div>
                                    <p className="text-xs text-gray-400 mt-1">
                                        Đã dùng: {v.usedCount}/{v.usageLimit} | /user: {v.usageLimitPerUser}
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                                <button
                                    onClick={() => handleEdit(v)}
                                    className="flex-1 py-1.5 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors flex items-center justify-center gap-1"
                                >
                                    <Edit2 className="w-4 h-4" /> Edit
                                </button>
                                <button
                                    onClick={() => handleDelete(v.id)}
                                    className="flex-1 py-1.5 text-sm font-bold text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center justify-center gap-1"
                                >
                                    <Trash2 className="w-4 h-4" /> Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-[#2d1b15] rounded-2xl shadow-2xl max-w-md w-full p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                {editing ? 'Edit Voucher' : 'New Voucher'}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Mã code</label>
                                    <input
                                        type="text"
                                        value={form.code}
                                        onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })}
                                        disabled={!!editing}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-gray-50 dark:bg-gray-900 dark:text-white disabled:opacity-50"
                                        placeholder="SALE50"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Tên</label>
                                    <input
                                        type="text"
                                        value={form.name}
                                        onChange={e => setForm({ ...form, name: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-gray-50 dark:bg-gray-900 dark:text-white"
                                        placeholder="Giảm giá 50%"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Mô tả</label>
                                <input
                                    type="text"
                                    value={form.description}
                                    onChange={e => setForm({ ...form, description: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-gray-50 dark:bg-gray-900 dark:text-white"
                                />
                            </div>
                            {!editing && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Loại</label>
                                        <select
                                            value={form.type}
                                            onChange={e => setForm({ ...form, type: Number(e.target.value) })}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-gray-50 dark:bg-gray-900 dark:text-white"
                                        >
                                            <option value={1}>Phần trăm (%)</option>
                                            <option value={2}>Số tiền cố định</option>
                                            <option value={3}>Free Ship</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Giá trị</label>
                                        <input
                                            type="number"
                                            value={form.value}
                                            onChange={e => setForm({ ...form, value: Number(e.target.value) })}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-gray-50 dark:bg-gray-900 dark:text-white"
                                        />
                                    </div>
                                </div>
                            )}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Đơn tối thiểu</label>
                                    <input
                                        type="number"
                                        value={form.minOrderAmount}
                                        onChange={e => setForm({ ...form, minOrderAmount: Number(e.target.value) })}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-gray-50 dark:bg-gray-900 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Giảm tối đa</label>
                                    <input
                                        type="number"
                                        value={form.maxDiscount}
                                        onChange={e => setForm({ ...form, maxDiscount: Number(e.target.value) })}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-gray-50 dark:bg-gray-900 dark:text-white"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">{editing ? 'Bắt đầu' : 'Ngày bắt đầu'}</label>
                                    <input
                                        type="date"
                                        value={form.startDate}
                                        onChange={e => setForm({ ...form, startDate: e.target.value })}
                                        disabled={!!editing}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-gray-50 dark:bg-gray-900 dark:text-white disabled:opacity-50"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Ngày hết hạn</label>
                                    <input
                                        type="date"
                                        value={form.endDate}
                                        onChange={e => setForm({ ...form, endDate: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-gray-50 dark:bg-gray-900 dark:text-white"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Giới hạn sử dụng</label>
                                    <input
                                        type="number"
                                        value={form.usageLimit}
                                        onChange={e => setForm({ ...form, usageLimit: Number(e.target.value) })}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-gray-50 dark:bg-gray-900 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Lượt/người</label>
                                    <input
                                        type="number"
                                        value={form.usageLimitPerUser}
                                        onChange={e => setForm({ ...form, usageLimitPerUser: Number(e.target.value) })}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-gray-50 dark:bg-gray-900 dark:text-white"
                                    />
                                </div>
                            </div>
                            {editing && (
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="isActive"
                                        checked={form.isActive}
                                        onChange={e => setForm({ ...form, isActive: e.target.checked })}
                                        className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
                                    />
                                    <label htmlFor="isActive" className="text-sm font-bold text-gray-700 dark:text-gray-300">Kích hoạt</label>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-3 mt-8">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 font-bold rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Huỷ
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={!form.code || !form.endDate}
                                className="flex-1 px-4 py-2 bg-orange-600 text-white font-bold rounded-lg hover:bg-orange-700 disabled:opacity-50 transition-colors"
                            >
                                {editing ? 'Cập nhật' : 'Tạo'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
