import { useState, useEffect } from 'react';
import { User, Shield, Loader2 } from 'lucide-react';
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
            <div className="flex items-center justify-center min-h-[60vh] bg-[#FFF7ED]">
                <Loader2 className="w-10 h-10 animate-spin text-[#F97316]" />
            </div>
        );
    }

    return (
        <div className="bg-[#FFF7ED] min-h-screen p-8 font-[Inter]">
            <div className="space-y-8 max-w-3xl">

                <div>
                    <h2 className="text-3xl font-bold text-[#1F2937]">
                        Settings
                    </h2>
                    <p className="text-sm text-[#4B5563] mt-1">
                        Quản lý thông tin tài khoản admin
                    </p>
                </div>

                {/* Profile Section */}
                <div className="bg-white rounded-2xl border border-[#FED7AA] shadow-md">
                    <div className="p-6 border-b border-[#FED7AA] flex items-center gap-3">
                        <User className="w-5 h-5 text-[#F97316]" />
                        <h3 className="text-lg font-semibold text-[#1F2937]">
                            Thông tin cá nhân
                        </h3>
                    </div>

                    <div className="p-6 space-y-5">

                        <div>
                            <label className="block text-sm font-medium text-[#374151] mb-1">
                                Họ tên
                            </label>

                            <input
                                value={form.name}
                                onChange={e => setForm({ ...form, name: e.target.value })}
                                className="w-full px-4 py-2.5 border border-[#FED7AA] rounded-xl bg-[#FFF7ED] focus:ring-2 focus:ring-[#F97316] focus:outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-[#374151] mb-1">
                                Email
                            </label>

                            <input
                                value={form.email}
                                onChange={e => setForm({ ...form, email: e.target.value })}
                                className="w-full px-4 py-2.5 border border-[#FED7AA] rounded-xl bg-[#FFF7ED] focus:ring-2 focus:ring-[#F97316] focus:outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-[#374151] mb-1">
                                Số điện thoại
                            </label>

                            <input
                                value={form.phone}
                                onChange={e => setForm({ ...form, phone: e.target.value })}
                                className="w-full px-4 py-2.5 border border-[#FED7AA] rounded-xl bg-[#FFF7ED] focus:ring-2 focus:ring-[#F97316] focus:outline-none"
                            />
                        </div>

                        <div className="flex justify-end pt-2">
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="px-6 py-2.5 bg-[#F97316] text-white font-medium rounded-xl hover:bg-[#EA580C] disabled:opacity-50 transition flex items-center gap-2 shadow"
                            >
                                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                                Lưu thay đổi
                            </button>
                        </div>
                    </div>
                </div>

                {/* Account Info */}
                <div className="bg-white rounded-2xl border border-[#FED7AA] shadow-md">

                    <div className="p-6 border-b border-[#FED7AA] flex items-center gap-3">
                        <Shield className="w-5 h-5 text-[#F97316]" />
                        <h3 className="text-lg font-semibold text-[#1F2937]">
                            Thông tin tài khoản
                        </h3>
                    </div>

                    <div className="p-6 space-y-3">

                        <div className="flex items-center justify-between py-3 border-b border-[#FED7AA]">
                            <span className="text-sm text-[#4B5563]">
                                Vai trò
                            </span>

                            <span className="px-3 py-1 bg-[#FFEDD5] text-[#C2410C] rounded-full text-sm font-medium">
                                {profile?.roleName || 'Admin'}
                            </span>
                        </div>

                        <div className="flex items-center justify-between py-3 border-b border-[#FED7AA]">
                            <span className="text-sm text-[#4B5563]">
                                ID tài khoản
                            </span>

                            <span className="text-sm font-mono text-[#1F2937]">
                                {profile?.id || '-'}
                            </span>
                        </div>

                        <div className="flex items-center justify-between py-3">
                            <span className="text-sm text-[#4B5563]">
                                Số dư ví
                            </span>

                            <span className="text-sm font-semibold text-green-600">
                                {(profile?.balance || 0).toLocaleString('vi-VN')}đ
                            </span>
                        </div>

                    </div>
                </div>

            </div>
        </div>
    );
}