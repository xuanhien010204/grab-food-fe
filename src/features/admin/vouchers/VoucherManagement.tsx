import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Ticket, X, Calendar } from 'lucide-react';
import { voucherApi } from '../../../api/api';
import { cn } from '../../../lib/utils';
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
        <div className="space-y-8 animate-in fade-in duration-700">
            <div className="flex justify-between items-center bg-white/50 backdrop-blur-md p-6 rounded-2xl border border-orange-100/50 shadow-sm">
                <div className="border-l-4 border-[#C76E00] pl-4">
                    <h1 className="text-3xl font-black text-charcoal tracking-tighter uppercase italic">Quản lý voucher</h1>
                    <p className="text-[10px] font-black text-charcoal/40 uppercase tracking-[0.2em] mt-1">
                        Chiến dịch khuyến mãi toàn hệ thống
                    </p>
                </div>
                <button
                    onClick={() => { resetForm(); setIsModalOpen(true); }}
                    className="flex items-center gap-2 px-6 py-3 bg-[#C76E00] text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-[#A55B00] transition-all shadow-lg shadow-[#C76E00]/20 active:scale-95"
                >
                    <Plus className="w-5 h-5" />
                    Tạo Voucher Mới
                </button>
            </div>

            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="bg-white rounded-2xl h-48 animate-pulse border border-orange-100/50 shadow-sm" />
                    ))}
                </div>
            ) : vouchers.length === 0 ? (
                <div className="text-center py-20 bg-white/50 backdrop-blur-md rounded-2xl border-2 border-dashed border-orange-100/50">
                    <Ticket className="w-16 h-16 text-charcoal/10 mx-auto mb-4" />
                    <p className="text-xs font-black text-charcoal/30 uppercase tracking-widest">Không tìm thấy voucher nào</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {vouchers.map(v => (
                        <div key={v.id} className="group bg-white rounded-2xl border border-orange-100/50 p-6 shadow-sm hover:shadow-xl hover:shadow-orange-500/5 transition-all relative overflow-hidden">
                            <div className="absolute top-0 right-0">
                                <span className={cn(
                                    "px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-bl-xl shadow-sm",
                                    v.isActive ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                                )}>
                                    {v.isActive ? 'Hoạt động' : 'Tạm dừng'}
                                </span>
                            </div>
                            <div className="flex items-start gap-5">
                                <div className="w-14 h-14 rounded-2xl bg-cream flex items-center justify-center text-[#C76E00] border border-orange-100 shrink-0 group-hover:scale-110 transition-transform">
                                    <Ticket className="w-7 h-7" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-black text-xl text-charcoal tracking-tighter italic group-hover:text-[#C76E00] transition-colors">{v.code}</h3>
                                    <p className="text-[10px] font-bold text-charcoal/40 uppercase tracking-widest mb-2">{v.name}</p>
                                    <p className="text-3xl font-black text-[#C76E00] tracking-tighter italic">
                                        {formatDiscount(v)}
                                    </p>
                                    <div className="flex flex-wrap gap-2 mt-4">
                                        <span className="bg-cream border border-orange-100 text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg text-charcoal/60">{getTypeLabel(v.type)}</span>
                                        <span className="bg-charcoal/5 text-[10px] font-bold px-2 py-1 rounded-lg text-charcoal/60 italic">Min: {v.minOrderAmount?.toLocaleString()}đ</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-[10px] font-bold text-charcoal/40 mt-4 border-t border-orange-50/50 pt-4">
                                        <Calendar className="w-3.5 h-3.5 text-[#C76E00]" />
                                        <span>{toVietnamDateString(v.startDate)}</span>
                                        <span className="text-[#C76E00]/20">—</span>
                                        <span>{toVietnamDateString(v.endDate)}</span>
                                    </div>
                                    <div className="mt-3 flex items-center justify-between">
                                        <div className="w-full bg-orange-50 rounded-full h-1.5 overflow-hidden">
                                            <div
                                                className="bg-[#C76E00] h-full transition-all duration-1000"
                                                style={{ width: `${Math.min((v.usedCount / v.usageLimit) * 100, 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                    <p className="text-[9px] font-black text-charcoal/30 uppercase tracking-[0.2em] mt-2 text-right">
                                        Sử dụng: {v.usedCount} / {v.usageLimit}
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-3 mt-6 pt-6 border-t border-orange-50">
                                <button
                                    onClick={() => handleEdit(v)}
                                    className="flex-1 py-2.5 text-xs font-black uppercase tracking-widest text-charcoal/60 hover:bg-[#C76E00]/10 hover:text-[#C76E00] rounded-xl transition-all flex items-center justify-center gap-2"
                                >
                                    <Edit2 className="w-3.5 h-3.5" /> Sửa
                                </button>
                                <button
                                    onClick={() => handleDelete(v.id)}
                                    className="flex-1 py-2.5 text-xs font-black uppercase tracking-widest text-rose-500 hover:bg-rose-50 rounded-xl transition-all flex items-center justify-center gap-2"
                                >
                                    <Trash2 className="w-3.5 h-3.5" /> Xóa
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-charcoal/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
                    <div className="bg-cream rounded-[2.5rem] shadow-2xl max-w-lg w-full p-8 border border-orange-100 animate-in zoom-in-95 duration-300">
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-2xl font-black text-charcoal tracking-tighter uppercase italic">
                                {editing ? 'Cập nhật Voucher' : 'Tạo Voucher mới'}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="size-10 flex items-center justify-center hover:bg-charcoal/5 rounded-full transition-colors">
                                <X className="w-6 h-6 text-charcoal/40" />
                            </button>
                        </div>

                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-charcoal/40 tracking-widest mb-2 px-1">Mã code</label>
                                    <input
                                        type="text"
                                        value={form.code}
                                        onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })}
                                        disabled={!!editing}
                                        className="w-full px-5 py-4 bg-white border-2 border-orange-100/50 rounded-2xl focus:border-[#C76E00] focus:ring-4 focus:ring-[#C76E00]/10 outline-none transition-all font-bold text-sm disabled:opacity-50"
                                        placeholder="SALE50"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-charcoal/40 tracking-widest mb-2 px-1">Tên hiển thị</label>
                                    <input
                                        type="text"
                                        value={form.name}
                                        onChange={e => setForm({ ...form, name: e.target.value })}
                                        className="w-full px-5 py-4 bg-white border-2 border-orange-100/50 rounded-2xl focus:border-[#C76E00] focus:ring-4 focus:ring-[#C76E00]/10 outline-none transition-all font-bold text-sm"
                                        placeholder="Giảm giá 50%"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase text-charcoal/40 tracking-widest mb-2 px-1">Mô tả chiến dịch</label>
                                <textarea
                                    rows={2}
                                    value={form.description}
                                    onChange={e => setForm({ ...form, description: e.target.value })}
                                    className="w-full px-5 py-4 bg-white border-2 border-orange-100/50 rounded-2xl focus:border-[#C76E00] focus:ring-4 focus:ring-[#C76E00]/10 outline-none transition-all font-bold text-sm resize-none"
                                />
                            </div>
                            {!editing && (
                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-[10px] font-black uppercase text-charcoal/40 tracking-widest mb-2 px-1">Loại khuyến mãi</label>
                                        <select
                                            value={form.type}
                                            onChange={e => setForm({ ...form, type: Number(e.target.value) })}
                                            className="w-full px-5 py-4 bg-white border-2 border-orange-100/50 rounded-2xl focus:border-[#C76E00] focus:ring-4 focus:ring-[#C76E00]/10 outline-none transition-all font-bold text-sm cursor-pointer"
                                        >
                                            <option value={1}>Phần trăm (%)</option>
                                            <option value={2}>Số tiền cố định</option>
                                            <option value={3}>Free Ship</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black uppercase text-charcoal/40 tracking-widest mb-2 px-1">Giá trị giảm</label>
                                        <input
                                            type="number"
                                            value={form.value}
                                            onChange={e => setForm({ ...form, value: Number(e.target.value) })}
                                            className="w-full px-5 py-4 bg-white border-2 border-orange-100/50 rounded-2xl focus:border-[#C76E00] focus:ring-4 focus:ring-[#C76E00]/10 outline-none transition-all font-bold text-sm"
                                        />
                                    </div>
                                </div>
                            )}
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-charcoal/40 tracking-widest mb-2 px-1">Đơn tối thiểu</label>
                                    <input
                                        type="number"
                                        value={form.minOrderAmount}
                                        onChange={e => setForm({ ...form, minOrderAmount: Number(e.target.value) })}
                                        className="w-full px-5 py-4 bg-white border-2 border-orange-100/50 rounded-2xl focus:border-[#C76E00] focus:ring-4 focus:ring-[#C76E00]/10 outline-none transition-all font-bold text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-charcoal/40 tracking-widest mb-2 px-1">Giảm tối đa</label>
                                    <input
                                        type="number"
                                        value={form.maxDiscount}
                                        onChange={e => setForm({ ...form, maxDiscount: Number(e.target.value) })}
                                        className="w-full px-5 py-4 bg-white border-2 border-orange-100/50 rounded-2xl focus:border-[#C76E00] focus:ring-4 focus:ring-[#C76E00]/10 outline-none transition-all font-bold text-sm"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-charcoal/40 tracking-widest mb-2 px-1">Bắt đầu</label>
                                    <input
                                        type="date"
                                        value={form.startDate}
                                        onChange={e => setForm({ ...form, startDate: e.target.value })}
                                        disabled={!!editing}
                                        className="w-full px-5 py-4 bg-white border-2 border-orange-100/50 rounded-2xl focus:border-[#C76E00] focus:ring-4 focus:ring-[#C76E00]/10 outline-none transition-all font-bold text-sm disabled:opacity-50"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-charcoal/40 tracking-widest mb-2 px-1">Hết hạn</label>
                                    <input
                                        type="date"
                                        value={form.endDate}
                                        onChange={e => setForm({ ...form, endDate: e.target.value })}
                                        className="w-full px-5 py-4 bg-white border-2 border-orange-100/50 rounded-2xl focus:border-[#C76E00] focus:ring-4 focus:ring-[#C76E00]/10 outline-none transition-all font-bold text-sm"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-charcoal/40 tracking-widest mb-2 px-1">Tổng lượt</label>
                                    <input
                                        type="number"
                                        value={form.usageLimit}
                                        onChange={e => setForm({ ...form, usageLimit: Number(e.target.value) })}
                                        className="w-full px-5 py-4 bg-white border-2 border-orange-100/50 rounded-2xl focus:border-[#C76E00] focus:ring-4 focus:ring-[#C76E00]/10 outline-none transition-all font-bold text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-charcoal/40 tracking-widest mb-2 px-1">Lượt/Người</label>
                                    <input
                                        type="number"
                                        value={form.usageLimitPerUser}
                                        onChange={e => setForm({ ...form, usageLimitPerUser: Number(e.target.value) })}
                                        className="w-full px-5 py-4 bg-white border-2 border-orange-100/50 rounded-2xl focus:border-[#C76E00] focus:ring-4 focus:ring-[#C76E00]/10 outline-none transition-all font-bold text-sm"
                                    />
                                </div>
                            </div>
                            {editing && (
                                <label className="flex items-center gap-3 cursor-pointer group w-fit">
                                    <div className="relative">
                                        <input
                                            type="checkbox"
                                            checked={form.isActive}
                                            onChange={e => setForm({ ...form, isActive: e.target.checked })}
                                            className="sr-only"
                                        />
                                        <div className={cn(
                                            "w-12 h-6 rounded-full transition-colors duration-300",
                                            form.isActive ? "bg-emerald-500" : "bg-charcoal/20"
                                        )} />
                                        <div className={cn(
                                            "absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform duration-300",
                                            form.isActive && "translate-x-6"
                                        )} />
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-charcoal/60">Kích hoạt voucher</span>
                                </label>
                            )}
                        </div>

                        <div className="flex gap-4 mt-10">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="flex-1 px-6 py-4 border-2 border-orange-100 text-charcoal/60 text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-charcoal/5 transition-all"
                            >
                                Quay lại
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={!form.code || !form.endDate}
                                className="flex-1 px-6 py-4 bg-[#C76E00] text-white text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-[#A55B00] disabled:opacity-50 transition-all shadow-xl shadow-[#C76E00]/20"
                            >
                                {editing ? 'Cập nhật ngay' : 'Tạo Voucher'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}