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
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-10 h-10 animate-spin text-orange-500" />
            </div>
        );
    }

    return (
        <div className="space-y-8 max-w-3xl">
            <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Cài đặt</h2>
                <p className="text-sm text-gray-500 mt-1">Quản lý thông tin tài khoản admin</p>
            </div>

            {/* Profile Section */}
            <div className="bg-white dark:bg-[#1d140c] rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex items-center gap-3">
                    <User className="w-5 h-5 text-orange-600" />
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Thông tin cá nhân</h3>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-400 mb-1">Họ tên</label>
                        <input
                            value={form.name}
                            onChange={e => setForm({ ...form, name: e.target.value })}
                            className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-400 mb-1">Email</label>
                        <input
                            value={form.email}
                            onChange={e => setForm({ ...form, email: e.target.value })}
                            className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-600 dark:text-gray-400 mb-1">Số điện thoại</label>
                        <input
                            value={form.phone}
                            onChange={e => setForm({ ...form, phone: e.target.value })}
                            className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:outline-none"
                        />
                    </div>
                    <div className="flex justify-end pt-2">
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="px-6 py-2.5 bg-orange-600 text-white font-bold rounded-lg hover:bg-orange-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                        >
                            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                            Lưu thay đổi
                        </button>
                    </div>
                </div>
            </div>

            {/* Account Info */}
            <div className="bg-white dark:bg-[#1d140c] rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex items-center gap-3">
                    <Shield className="w-5 h-5 text-orange-600" />
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Thông tin tài khoản</h3>
                </div>
                <div className="p-6 space-y-3">
                    <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-800">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Vai trò</span>
                        <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-bold">
                            {profile?.roleName || 'Admin'}
                        </span>
                    </div>
                    <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-800">
                        <span className="text-sm text-gray-600 dark:text-gray-400">ID tài khoản</span>
                        <span className="text-sm font-mono text-gray-900 dark:text-white">{profile?.id || '-'}</span>
                    </div>
                    <div className="flex items-center justify-between py-3">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Số dư ví</span>
                        <span className="text-sm font-bold text-green-600">{(profile?.balance || 0).toLocaleString('vi-VN')}đ</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
