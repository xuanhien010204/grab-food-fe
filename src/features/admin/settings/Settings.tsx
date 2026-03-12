import { useState, useEffect } from 'react';
import { User, Shield, Loader2, Save } from 'lucide-react';
import { userApi } from '../../../api/api';
import { toast } from 'sonner';

export default function Settings() {
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState({ name: '', email: '', phone: '' });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await userApi.profile();
                const data = res.data as any;
                setProfile(data);
                setForm({ name: data.name || '', email: data.email || '', phone: data.phone || '' });
            } catch {
                toast.error('Không thể tải thông tin');
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    const handleSave = async () => {
        try {
            setSaving(true);
            await userApi.editProfile(form);
            toast.success('Đã cập nhật thông tin');
        } catch {
            toast.error('Cập nhật thất bại');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh] animate-in fade-in duration-700">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-12 h-12 animate-spin text-[#C76E00]" />
                    <p className="text-[10px] font-black text-charcoal/30 uppercase tracking-[0.2em]">Đang chuẩn bị cài đặt...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="bg-white/50 backdrop-blur-md p-6 rounded-2xl border border-orange-100/50 shadow-sm">
                <div className="border-l-4 border-[#C76E00] pl-4">
                    <h1 className="text-3xl font-black text-charcoal tracking-tighter uppercase italic">Cài đặt tài khoản</h1>
                    <p className="text-[10px] font-black text-charcoal/40 uppercase tracking-[0.2em] mt-1">
                        Quản lý thông tin cá nhân và bảo mật tài khoản Admin
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Profile Section */}
                <div className="bg-white rounded-[2.5rem] border border-orange-100/50 shadow-sm overflow-hidden flex flex-col">
                    <div className="p-8 border-b border-orange-50 bg-cream/10 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-[#C76E00]/10 flex items-center justify-center text-[#C76E00]">
                                <User className="w-5 h-5" />
                            </div>
                            <h3 className="text-xl font-black text-charcoal tracking-tighter uppercase italic">Thông tin cá nhân</h3>
                        </div>
                    </div>

                    <div className="p-8 space-y-6 flex-1">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-charcoal/40 tracking-widest px-1">Họ và tên</label>
                            <input
                                value={form.name}
                                onChange={e => setForm({ ...form, name: e.target.value })}
                                className="w-full px-5 py-4 bg-white border-2 border-orange-100/50 rounded-2xl focus:border-[#C76E00] focus:ring-4 focus:ring-[#C76E00]/10 outline-none transition-all font-bold text-sm"
                                placeholder="Nhập họ tên..."
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-charcoal/40 tracking-widest px-1">Email liên hệ</label>
                            <input
                                value={form.email}
                                onChange={e => setForm({ ...form, email: e.target.value })}
                                className="w-full px-5 py-4 bg-white border-2 border-orange-100/50 rounded-2xl focus:border-[#C76E00] focus:ring-4 focus:ring-[#C76E00]/10 outline-none transition-all font-bold text-sm"
                                placeholder="example@email.com"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-charcoal/40 tracking-widest px-1">Số điện thoại</label>
                            <input
                                value={form.phone}
                                onChange={e => setForm({ ...form, phone: e.target.value })}
                                className="w-full px-5 py-4 bg-white border-2 border-orange-100/50 rounded-2xl focus:border-[#C76E00] focus:ring-4 focus:ring-[#C76E00]/10 outline-none transition-all font-bold text-sm"
                                placeholder="0xxx..."
                            />
                        </div>

                        <div className="pt-6">
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="w-full py-4 bg-[#C76E00] text-white text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-[#A55B00] transition-all shadow-lg shadow-[#C76E00]/20 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                            >
                                {saving ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <Save className="w-5 h-5" />
                                )}
                                Lưu tất cả thay đổi
                            </button>
                        </div>
                    </div>
                </div>

                {/* Account Details */}
                <div className="space-y-8">
                    <div className="bg-white rounded-[2.5rem] border border-orange-100/50 shadow-sm overflow-hidden min-h-[400px]">
                        <div className="p-8 border-b border-orange-50 bg-charcoal/5 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-charcoal/10 flex items-center justify-center text-charcoal">
                                    <Shield className="w-5 h-5" />
                                </div>
                                <h3 className="text-xl font-black text-charcoal tracking-tighter uppercase italic">Chi tiết tài khoản</h3>
                            </div>
                        </div>

                        <div className="p-8 space-y-8">
                            <div className="flex items-center justify-between py-2 border-b border-orange-50 group">
                                <span className="text-[10px] font-black text-charcoal/30 uppercase tracking-[0.2em] group-hover:text-charcoal transition-colors">Vai trò hệ thống</span>
                                <span className="bg-orange-50 text-[#C76E00] px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-orange-100">
                                    {profile?.roleName || 'Hệ thống Admin'}
                                </span>
                            </div>

                            <div className="flex items-center justify-between py-2 border-b border-orange-50 group">
                                <span className="text-[10px] font-black text-charcoal/30 uppercase tracking-[0.2em] group-hover:text-charcoal transition-colors">Mã định danh (ID)</span>
                                <span className="font-mono text-xs font-bold text-charcoal/60 bg-charcoal/5 px-3 py-1.5 rounded-lg">
                                    #{profile?.id || '---'}
                                </span>
                            </div>

                            <div className="flex items-center justify-between py-6 px-6 bg-emerald-50 rounded-3xl border border-emerald-100 group">
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black text-emerald-600/60 uppercase tracking-[0.2em]">Số dư ví hiện tại</span>
                                    <h4 className="text-3xl font-black text-emerald-600 tracking-tighter italic mt-1">
                                        {(profile?.balance || 0).toLocaleString('vi-VN')}đ
                                    </h4>
                                </div>
                                <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                                    <Save className="w-6 h-6" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-orange-50/50 rounded-[2rem] p-8 border-2 border-dashed border-orange-100 flex flex-col items-center text-center justify-center space-y-4">
                        <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-sm">
                            <Shield className="w-6 h-6 text-[#C76E00]" />
                        </div>
                        <p className="text-xs font-bold text-charcoal/40 italic leading-relaxed">
                            Thông tin tài khoản của bạn được bảo mật theo tiêu chuẩn hệ thống. <br/>
                            Vui lòng không chia sẻ mã ID cho người không có thẩm quyền.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}