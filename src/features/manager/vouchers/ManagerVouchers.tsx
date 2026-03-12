import { useState, useEffect, useCallback } from 'react';
import { Plus, Edit2, Trash2, Ticket, X, Calendar, Loader2 } from 'lucide-react';
import { voucherApi, userApi, storeApi } from '../../../api/api';
import { VoucherType, VoucherTypeName } from '../../../types/swagger';
import type { VoucherDto } from '../../../types/swagger';
import { toast } from 'sonner';

/** High-resilience date to ISO converter */
function toVietnamISOString(dateStr: string, endOfDay = false): string {
    if (!dateStr) return '';
    try {
        let date: Date;
        // Standard YYYY-MM-DD
        if (dateStr.includes('-')) {
            const [y, m, d] = dateStr.split('-').map(Number);
            date = new Date(Date.UTC(y, m - 1, d));
        } 
        // DD/MM/YYYY or similar
        else if (dateStr.includes('/')) {
            const parts = dateStr.split('/');
            if (parts[0].length === 4) { // YYYY/MM/DD
                date = new Date(Date.UTC(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2])));
            } else { // DD/MM/YYYY
                date = new Date(Date.UTC(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0])));
            }
        } else {
            date = new Date(dateStr);
        }

        if (isNaN(date.getTime())) throw new Error('Invalid date');

        // Adjust for Vietnam Time (GMT+7)
        const hours = endOfDay ? 23 : 0;
        const mins = endOfDay ? 59 : 59;
        const secs = endOfDay ? 59 : 59;
        
        // We set the UTC time so that when converted to ISO it represents midnight/end-of-day in VN
        const vnDate = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), hours - 7, mins, secs));
        return vnDate.toISOString();
    } catch (e) {
        console.error('Date parse error for:', dateStr, e);
        return new Date().toISOString(); // Last resort fallback
    }
}

/** Convert ISO to VN display string */
function toVietnamDateString(utcDateStr: string): string {
    if (!utcDateStr) return '-';
    try {
        return new Date(utcDateStr).toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
    } catch { return utcDateStr; }
}

/** Convert ISO to YYYY-MM-DD for input[type=date] */
function toVietnamInputDate(utcDateStr: string): string {
    if (!utcDateStr) return '';
    try {
        const date = new Date(utcDateStr);
        const vnFormatter = new Intl.DateTimeFormat('en-CA', {
            timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit',
        });
        return vnFormatter.format(date);
    } catch { return ''; }
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
            
            // Robust identification of manager's store
            const myStore = stores.find((s: any) => Number(s.managerId) === Number(profile.id));
            
            console.log('[DEBUG] Profile ID:', profile.id);
            console.log('[DEBUG] My Store:', myStore);
            
            if (!myStore) { 
                toast.error('Không tìm thấy cửa hàng gắn liền với tài khoản của bạn'); 
                setIsLoading(false);
                return; 
            }
            
            setStoreId(myStore.id);
            setStoreName(myStore.name || 'Cửa hàng');
            
            const res = await voucherApi.getAll({ storeId: myStore.id });
            const data = res.data as any;
            const voucherList = Array.isArray(data) ? data : (data?.result || data?.vouchers || []);
            setVouchers(voucherList);
        } catch (err: any) { 
            console.error('[CRITICAL] Fetch vouchers error:', err);
            const status = err.response?.status;
            const msg = err.response?.data?.message || err.message || 'Lỗi không xác định';
            toast.error(`Không thể tải voucher (${status || 'Network'}: ${msg})`); 
        } finally { 
            setIsLoading(false); 
        }
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
        if (!storeId) { toast.error('Không xác định được cửa hàng. Vui lòng tải lại trang.'); return; }
        
        // Basic Validation
        if (!form.code || form.code.length < 2) { toast.error('Mã voucher quá ngắn'); return; }
        if (!form.name) { toast.error('Vui lòng nhập tên chiến dịch'); return; }
        if (form.type === VoucherType.Percent && (form.value <= 0 || form.value > 100)) {
            toast.error('Phần trăm giảm giá phải từ 1-100');
            return;
        }
        if (form.value < 0) { toast.error('Giá trị giảm không được âm'); return; }
        if (!form.startDate || !form.endDate) { toast.error('Vui lòng chọn thời hạn voucher'); return; }

        const payload = {
            code: form.code.trim().toUpperCase(),
            name: form.name.trim(),
            description: form.description || '',
            type: form.type,
            value: form.value,
            minOrderAmount: form.minOrderAmount,
            maxDiscount: form.maxDiscount,
            startDate: toVietnamISOString(form.startDate),
            endDate: toVietnamISOString(form.endDate, true),
            usageLimit: form.usageLimit,
            usageLimitPerUser: form.usageLimitPerUser,
            storeId: storeId,
        };

        console.log('[DEBUG] Submitting Voucher Payload:', payload);

        try {
            if (editing) {
                await voucherApi.update(editing.id, {
                    name: payload.name, description: payload.description,
                    minOrderAmount: payload.minOrderAmount, maxDiscount: payload.maxDiscount,
                    startDate: payload.startDate,
                    endDate: payload.endDate,
                    usageLimit: payload.usageLimit, usageLimitPerUser: payload.usageLimitPerUser,
                    isActive: form.isActive,
                } as any);
                toast.success('Đã cập nhật voucher');
            } else {
                await voucherApi.create(payload);
                toast.success('Tạo voucher thành công!');
            }
            setIsModalOpen(false);
            resetForm();
            fetchData();
        } catch (error: any) { 
            console.error('[CRITICAL] Voucher submission failed:', error);
            
            let errMsg = 'Thao tác thất bại';
            const data = error.response?.data;
            
            if (data) {
                if (typeof data === 'string') errMsg = data;
                else if (data.message) errMsg = data.message;
                else if (data.Message) errMsg = data.Message; // Handle capitalized key
                else if (data.errors) {
                    const firstErr = Object.values(data.errors)[0];
                    errMsg = Array.isArray(firstErr) ? firstErr[0] : String(firstErr);
                }
                else if (data.title) errMsg = data.title;
                else errMsg = JSON.stringify(data);
            } else if (error.message) {
                errMsg = `Lỗi mạng: ${error.message}`;
            }
            
            toast.error(errMsg, { duration: 6000 }); 
        }
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
        <div className="space-y-8 animate-in fade-in duration-700">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-4xl font-black tracking-tight text-charcoal dark:text-cream uppercase italic tracking-tighter">Voucher cửa hàng</h1>
                    <p className="text-[10px] font-black text-charcoal/30 dark:text-cream/30 mt-1 uppercase tracking-[0.2em] italic">{storeName} ― QUẢN LÝ KHUYẾN MÃI</p>
                </div>
                <button
                    onClick={() => { resetForm(); setIsModalOpen(true); }}
                    className="flex items-center gap-2 px-8 py-4 bg-[#C76E00] text-white font-black rounded-2xl hover:bg-[#C76E00]/90 transition-all shadow-xl shadow-[#C76E00]/30 active:scale-95 uppercase text-xs tracking-widest"
                >
                    <Plus className="w-5 h-5 stroke-[3px]" /> Tạo voucher mới
                </button>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-24"><Loader2 className="w-12 h-12 animate-spin text-[#C76E00]" /></div>
            ) : vouchers.length === 0 ? (
                <div className="text-center py-20 bg-cream/40 dark:bg-charcoal rounded-[3rem] border border-[#C76E00]/10">
                    <Ticket className="w-20 h-20 text-[#C76E00]/20 mx-auto mb-4 stroke-[1px]" />
                    <p className="text-charcoal/40 dark:text-cream/40 font-black uppercase tracking-[0.2em] italic">Chưa có mã giảm giá nào.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    {vouchers.map(v => {
                        const getStatus = (v: VoucherDto) => {
                            if (!v.isActive) return { label: 'PAUSED', color: 'bg-rose-50 text-rose-600 border-rose-100' };
                            const now = new Date();
                            const start = new Date(v.startDate);
                            const end = new Date(v.endDate);
                            if (now < start) return { label: 'UPCOMING', color: 'bg-blue-50 text-blue-600 border-blue-100' };
                            if (now > end) return { label: 'EXPIRED', color: 'bg-gray-100 text-gray-500 border-gray-200' };
                            return { label: 'ACTIVE', color: 'bg-emerald-50 text-emerald-600 border-emerald-100' };
                        };
                        const status = getStatus(v);

                        return (
                            <div key={v.id} className="bg-white dark:bg-gray-900 rounded-3xl border border-dark-orange/10 dark:border-gray-800 overflow-hidden shadow-[0_4px_25px_rgba(0,0,0,0.03)] hover:shadow-[0_15px_40px_rgba(199,110,0,0.12)] transition-all duration-500 group relative flex flex-col">
                                {/* Status Badge */}
                                <div className="absolute top-4 right-4 z-20">
                                    <span className={`px-2.5 py-1 text-[8px] font-black rounded-lg tracking-widest border ${status.color}`}>
                                        {status.label}
                                    </span>
                                </div>
                            
                            {/* Card Content Area */}
                            <div className="p-5 flex-1 flex flex-col">
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-dark-orange/10 flex items-center justify-center text-dark-orange shrink-0 border border-dark-orange/20 group-hover:bg-dark-orange group-hover:text-white transition-all duration-500">
                                        <Ticket className="w-6 h-6 stroke-[2px]" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-black text-charcoal dark:text-cream text-base tracking-tight truncate uppercase leading-tight">{v.name}</h3>
                                        <div className="flex items-center gap-2 mt-1.5 focus-within:ring-2">
                                            <span className="text-[9px] bg-gray-50 dark:bg-gray-800 text-charcoal/40 px-2 py-0.5 rounded font-black tracking-widest uppercase border border-gray-100 dark:border-gray-700">
                                                {v.code}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-4 flex items-baseline gap-2">
                                    <p className="text-dark-orange font-black text-2xl tracking-tighter">
                                        {formatDiscount(v)}
                                    </p>
                                    <span className="text-[10px] font-bold text-charcoal/40 uppercase tracking-tighter">OFF</span>
                                </div>
                                
                                <div className="mt-4 space-y-2 py-3 border-y border-gray-50 dark:border-gray-800">
                                    <div className="flex items-center justify-between text-[11px] font-bold">
                                        <span className="text-charcoal/40 uppercase tracking-tighter">Min Order</span>
                                        <span className="text-charcoal dark:text-cream">₫{v.minOrderAmount?.toLocaleString()}</span>
                                    </div>
                                    {v.maxDiscount > 0 && (
                                        <div className="flex items-center justify-between text-[11px] font-bold">
                                            <span className="text-charcoal/40 uppercase tracking-tighter">Max Cap</span>
                                            <span className="text-charcoal dark:text-cream">₫{v.maxDiscount?.toLocaleString()}</span>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2 text-[9px] font-black text-charcoal/30 pt-1 uppercase tracking-widest">
                                        <Calendar className="w-3 h-3" />
                                        {toVietnamDateString(v.startDate)} ― {toVietnamDateString(v.endDate)}
                                    </div>
                                </div>
                                
                                <div className="mt-4 bg-gray-50/50 dark:bg-gray-800/40 p-3 rounded-xl border border-gray-100 dark:border-gray-700">
                                    <div className="flex justify-between text-[9px] font-black uppercase tracking-tighter text-charcoal/40 mb-2">
                                        <span>Redemption Progress</span>
                                        <span>{v.usedCount} / {v.usageLimit || '∞'}</span>
                                    </div>
                                    <div className="w-full bg-dark-orange/10 rounded-full h-1 overflow-hidden">
                                            <div 
                                            className="bg-dark-orange h-full rounded-full transition-all duration-1000" 
                                            style={{ width: v.usageLimit ? `${(v.usedCount! / v.usageLimit) * 100}%` : '0%' }}
                                            />
                                    </div>
                                </div>
                            </div>
                            
                            {/* Action Row */}
                            <div className="p-3 bg-gray-50/30 dark:bg-white/5 border-t border-gray-50 dark:border-gray-800 flex gap-2">
                                <button onClick={() => handleEdit(v)} className="flex-1 flex items-center justify-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-charcoal/60 dark:text-cream/60 hover:text-dark-orange bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 py-2.5 rounded-xl transition-all shadow-sm active:scale-95">
                                    <Edit2 className="w-3.5 h-3.5" /> Edit
                                </button>
                                <button onClick={() => handleDelete(v.id)} className="w-10 h-10 flex items-center justify-center text-rose-500 hover:bg-rose-500 hover:text-white dark:hover:bg-rose-500 border border-rose-100 dark:border-rose-900/20 rounded-xl transition-all active:scale-95 shadow-sm">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    );
                })}
                </div>
            )}

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-cream dark:bg-charcoal rounded-[2.5rem] shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-[#C76E00]/20 overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-8">
                             <button onClick={() => { setIsModalOpen(false); resetForm(); }} className="p-2 hover:bg-[#C76E00]/10 rounded-full transition-colors">
                                <X className="w-6 h-6 text-charcoal/40" />
                             </button>
                        </div>
                        
                        <div className="p-10">
                            <h2 className="text-2xl font-black text-charcoal dark:text-cream tracking-tighter uppercase italic border-b-4 border-[#C76E00] pb-2 w-fit mb-8">
                                {editing ? 'Cập nhật voucher' : 'Tạo voucher cửa hàng'}
                            </h2>
                            
                            <div className="space-y-6">
                                {!editing && (
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-[#C76E00] uppercase tracking-[0.2em] ml-2">Mã voucher (không dấu, viết hoa)</label>
                                        <input value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="VD: GRABMANAGER50"
                                            className="w-full px-6 py-4 border border-[#C76E00]/10 rounded-2xl bg-white/50 dark:bg-gray-900 dark:text-white focus:ring-4 focus:ring-[#C76E00]/10 focus:border-[#C76E00] font-black placeholder:text-charcoal/20 transition-all uppercase" />
                                    </div>
                                )}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-[#C76E00] uppercase tracking-[0.2em] ml-2">Tên chiến dịch</label>
                                    <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="VD: Khuyến mãi cuối tuần"
                                        className="w-full px-6 py-4 border border-[#C76E00]/10 rounded-2xl bg-white/50 dark:bg-gray-900 dark:text-white focus:ring-4 focus:ring-[#C76E00]/10 focus:border-[#C76E00] font-bold transition-all" />
                                </div>
                                
                                {!editing && (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-[#C76E00] uppercase tracking-[0.2em] ml-2">Loại giảm</label>
                                            <select value={form.type} onChange={e => setForm({ ...form, type: Number(e.target.value) })}
                                                className="w-full px-6 py-4 border border-[#C76E00]/10 rounded-2xl bg-white/50 dark:bg-gray-900 dark:text-white focus:ring-4 focus:ring-[#C76E00]/10 font-bold appearance-none cursor-pointer">
                                                <option value={VoucherType.Percent}>{VoucherTypeName[VoucherType.Percent]}</option>
                                                <option value={VoucherType.FixedAmount}>{VoucherTypeName[VoucherType.FixedAmount]}</option>
                                                <option value={VoucherType.FreeShipping}>{VoucherTypeName[VoucherType.FreeShipping]}</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-[#C76E00] uppercase tracking-[0.2em] ml-2">Giá trị</label>
                                            <input type="number" value={form.value} 
                                                min={0}
                                                max={form.type === VoucherType.Percent ? 100 : undefined}
                                                onChange={e => setForm({ ...form, value: Number(e.target.value) })}
                                                className="w-full px-6 py-4 border border-[#C76E00]/10 rounded-2xl bg-white/50 dark:bg-gray-900 dark:text-white focus:ring-4 focus:ring-[#C76E00]/10 font-black" />
                                        </div>
                                    </div>
                                )}
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-[#C76E00] uppercase tracking-[0.2em] ml-2">Đơn tối thiểu</label>
                                        <input type="number" value={form.minOrderAmount} onChange={e => setForm({ ...form, minOrderAmount: Number(e.target.value) })}
                                            className="w-full px-6 py-4 border border-[#C76E00]/10 rounded-2xl bg-white/50 dark:bg-gray-900 dark:text-white focus:ring-4 focus:ring-[#C76E00]/10 font-black" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-[#C76E00] uppercase tracking-[0.2em] ml-2">Giảm tối đa</label>
                                        <input type="number" value={form.maxDiscount} onChange={e => setForm({ ...form, maxDiscount: Number(e.target.value) })}
                                            className="w-full px-6 py-4 border border-[#C76E00]/10 rounded-2xl bg-white/50 dark:bg-gray-900 dark:text-white focus:ring-4 focus:ring-[#C76E00]/10 font-black" />
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-[#C76E00] uppercase tracking-[0.2em] ml-2">Ngày bắt đầu</label>
                                        <input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })}
                                            className="w-full px-6 py-4 border border-[#C76E00]/10 rounded-2xl bg-white/50 dark:bg-gray-900 dark:text-white focus:ring-4 focus:ring-[#C76E00]/10 font-black" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-[#C76E00] uppercase tracking-[0.2em] ml-2">Ngày kết thúc</label>
                                        <input type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })}
                                            className="w-full px-6 py-4 border border-[#C76E00]/10 rounded-2xl bg-white/50 dark:bg-gray-900 dark:text-white focus:ring-4 focus:ring-[#C76E00]/10 font-black" />
                                    </div>
                                </div>
                                
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-[#C76E00] uppercase tracking-[0.2em] ml-2">Số lượng phát hành</label>
                                    <input type="number" value={form.usageLimit} onChange={e => setForm({ ...form, usageLimit: Number(e.target.value) })}
                                        className="w-full px-6 py-4 border border-[#C76E00]/10 rounded-2xl bg-white/50 dark:bg-gray-900 dark:text-white focus:ring-4 focus:ring-[#C76E00]/10 font-black" />
                                </div>

                                {editing && (
                                    <div className="flex items-center gap-4 bg-emerald-50/50 p-5 rounded-3xl border border-emerald-100">
                                       <button
                                          onClick={() => setForm({...form, isActive: !form.isActive})}
                                          className={`w-14 h-7 rounded-full transition-all relative shadow-inner ${form.isActive ? 'bg-emerald-500' : 'bg-gray-300'}`}
                                       >
                                          <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all shadow-md ${form.isActive ? 'right-1' : 'left-1'}`} />
                                       </button>
                                       <label className="text-[10px] font-black text-emerald-700 uppercase tracking-widest cursor-pointer">Trạng thái: {form.isActive ? 'ĐANG KÍCH HOẠT' : 'ĐANG TẠM DỪNG'}</label>
                                    </div>
                                )}
                            </div>
                            
                            <div className="flex gap-4 mt-10 pb-4">
                                <button onClick={handleSubmit}
                                    className="flex-1 px-8 py-5 bg-[#C76E00] text-white font-black rounded-3xl hover:bg-[#C76E00]/90 transition-all shadow-xl shadow-[#C76E00]/30 uppercase text-sm tracking-widest active:scale-95"
                                >
                                    {editing ? 'Xác nhận cập nhật' : 'Phát hành Voucher'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
