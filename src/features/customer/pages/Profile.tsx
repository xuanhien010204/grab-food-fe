import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { userApi, walletApi } from '../../../api/api';
import { authStorage } from '../../../utils/auth';
import type { UserProfileDto } from '../../../types/swagger';
import { LogOut, User, Mail, Shield, Wallet, Loader2, Edit2, X, Phone, MapPin, Heart, Bell, ClipboardList, ChevronRight, Store, Clock } from 'lucide-react';
import { toast } from 'sonner';

export function CustomerProfile() {
    const [profile, setProfile] = useState<UserProfileDto | null>(null);
    const [balance, setBalance] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [signingOut, setSigningOut] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({ name: '', email: '', phone: '' });
    const [isSaving, setIsSaving] = useState(false);
    const [showRoleChangePopup, setShowRoleChangePopup] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            setLoading(true);
            setError(null);
            const [profileRes] = await Promise.all([
                userApi.profile(),
                walletApi.getBalance().then(r => {
                    const d = r.data as any;
                    setBalance(typeof d === 'number' ? d : (d?.balance ?? 0));
                }).catch(() => setBalance(0))
            ]);
            const data: any = profileRes.data;
            console.log('DEBUG - Profile API response (after unwrap):', JSON.stringify(data));

            if (data && (data.id || data.email || data.name)) {
                setProfile(data as UserProfileDto);
                // M05: Detect role change - if server role differs from stored role, prompt re-login
                const storedRole = authStorage.getRole();
                const serverRole = data.roleName;
                if (storedRole && serverRole && storedRole !== serverRole) {
                    setShowRoleChangePopup(true);
                }
            } else {
                setError('Dữ liệu trả về không đúng định dạng.');
            }
        } catch (err: any) {
            console.error('Failed to fetch profile:', err);
            setError(err.response?.data?.message || 'Không thể tải thông tin cá nhân. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    const handleSignOut = async () => {
        try {
            setSigningOut(true);
            await userApi.signOut();
        } catch (err) {
            console.warn('Sign-out API call failed, clearing local session anyway:', err);
        } finally {
            authStorage.clear();
            localStorage.removeItem('bypass_user');
            setSigningOut(false);
            navigate('/login', { replace: true });
        }
    };

    const handleEdit = () => {
        setEditForm({
            name: profile?.name || '',
            email: profile?.email || '',
            phone: (profile as any)?.phone || '',
        });
        setIsEditing(true);
    };

    const handleSaveProfile = async () => {
        try {
            setIsSaving(true);
            await userApi.editProfile(editForm);
            toast.success('Cập nhật thông tin thành công');
            setIsEditing(false);
            await fetchProfile();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Không thể cập nhật thông tin');
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
                    <p className="text-gray-500 text-sm">Đang tải thông tin...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] p-6">
                <div className="bg-white rounded-2xl shadow-sm p-8 text-center max-w-sm w-full">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <User className="w-8 h-8 text-red-500" />
                    </div>
                    <h2 className="text-lg font-bold text-gray-800 mb-2">Lỗi</h2>
                    <p className="text-gray-500 text-sm mb-6">{error}</p>
                    <div className="space-y-3">
                        <button
                            onClick={fetchProfile}
                            className="w-full bg-orange-500 hover:bg-orange-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                        >
                            Thử lại
                        </button>
                        <button
                            onClick={handleSignOut}
                            disabled={signingOut}
                            className="w-full flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 font-semibold py-2.5 rounded-xl transition-colors disabled:opacity-50"
                        >
                            {signingOut ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
                            {signingOut ? 'Đang đăng xuất...' : 'Đăng xuất'}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 max-w-lg mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-xl font-bold text-gray-900">Thông tin cá nhân</h1>
                <button
                    onClick={handleEdit}
                    className="flex items-center gap-1 text-orange-500 hover:text-orange-600 text-sm font-semibold transition-colors"
                >
                    <Edit2 className="w-4 h-4" />
                    Chỉnh sửa
                </button>
            </div>

            {/* Avatar & Name Card */}
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-6 text-white mb-6 shadow-lg">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-full flex items-center justify-center text-2xl font-bold">
                        {profile?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <div>
                        <h2 className="text-lg font-bold">{profile?.name || 'N/A'}</h2>
                        <p className="text-orange-100 text-sm">{profile?.roleName || 'Customer'}</p>
                        {/* M04: Pending approval badge */}
                        {profile?.roleName === 'Customer' && (profile as any)?.pendingManagerRegistration && (
                            <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 bg-yellow-400/20 text-yellow-100 text-[10px] font-bold rounded-full">
                                <Clock className="w-3 h-3" />
                                Đang chờ duyệt đối tác
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Info Cards */}
            <div className="space-y-3 mb-8">
                <div className="bg-white rounded-xl p-4 shadow-sm flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                        <Mail className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                        <p className="text-xs text-gray-400 font-medium">Email</p>
                        <p className="text-sm font-semibold text-gray-800">{profile?.email || 'N/A'}</p>
                    </div>
                </div>

                <div className="bg-white rounded-xl p-4 shadow-sm flex items-center gap-4">
                    <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
                        <Shield className="w-5 h-5 text-purple-500" />
                    </div>
                    <div>
                        <p className="text-xs text-gray-400 font-medium">Vai trò</p>
                        <p className="text-sm font-semibold text-gray-800">{profile?.roleName || 'Customer'}</p>
                    </div>
                </div>

                <div className="bg-white rounded-xl p-4 shadow-sm flex items-center gap-4">
                    <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
                        <Phone className="w-5 h-5 text-green-500" />
                    </div>
                    <div>
                        <p className="text-xs text-gray-400 font-medium">Số điện thoại</p>
                        <p className="text-sm font-semibold text-gray-800">{(profile as any)?.phone || 'Chưa cập nhật'}</p>
                    </div>
                </div>
            </div>

            {/* Quick Menu */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-6">
                {[
                    { icon: Wallet, label: 'Ví của tôi', sub: balance != null ? balance.toLocaleString('vi-VN') + ' ₫' : '0 ₫', to: '/wallet', color: 'text-green-500', bg: 'bg-green-50' },
                    { icon: ClipboardList, label: 'Lịch sử đơn hàng', sub: 'Xem lịch sử đặt ăn', to: '/orders', color: 'text-blue-500', bg: 'bg-blue-50' },
                    { icon: MapPin, label: 'Địa chỉ giao hàng', sub: 'Quản lý địa chỉ', to: '/addresses', color: 'text-orange-500', bg: 'bg-orange-50' },
                    { icon: Heart, label: 'Yêu thích', sub: 'Quán và món yêu thích', to: '/favorites', color: 'text-red-500', bg: 'bg-red-50' },
                    { icon: Bell, label: 'Thông báo', sub: 'Xem tất cả thông báo', to: '/notifications', color: 'text-purple-500', bg: 'bg-purple-50' },
                    // M01: Register Store link - only show for Customer role
                    ...((!profile?.roleName || profile?.roleName === 'Customer') ? [
                        { icon: Store, label: 'Đăng ký trở thành đối tác', sub: 'Mở quán trên nền tảng', to: '/register-store', color: 'text-amber-500', bg: 'bg-amber-50' },
                    ] : []),
                ].map(({ icon: Icon, label, sub, to, color, bg }, idx, arr) => (
                    <Link
                        key={to}
                        to={to}
                        className={`flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors${idx < arr.length - 1 ? ' border-b border-gray-100' : ''}`}
                    >
                        <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center shrink-0`}>
                            <Icon className={`w-5 h-5 ${color}`} />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-semibold text-gray-900">{label}</p>
                            <p className="text-xs text-gray-400">{sub}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-300" />
                    </Link>
                ))}
            </div>

            {/* Sign Out Button */}
            <button
                onClick={handleSignOut}
                disabled={signingOut}
                className="w-full flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 font-semibold py-3.5 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {signingOut ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                    <LogOut className="w-5 h-5" />
                )}
                {signingOut ? 'Đang đăng xuất...' : 'Đăng xuất'}
            </button>
            {/* Edit Profile Modal */}
            {isEditing && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-bold text-gray-900">Chỉnh sửa thông tin</h2>
                            <button onClick={() => setIsEditing(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>
                        <div className="space-y-3">
                            <div>
                                <label className="text-xs font-medium text-gray-500 mb-1 block">Tên</label>
                                <input
                                    type="text"
                                    value={editForm.name}
                                    onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none"
                                    placeholder="Nhập tên..."
                                />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-gray-500 mb-1 block">Email</label>
                                <input
                                    type="email"
                                    value={editForm.email}
                                    onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none"
                                    placeholder="Nhập email..."
                                />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-gray-500 mb-1 block">Số điện thoại</label>
                                <input
                                    type="tel"
                                    value={editForm.phone}
                                    onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none"
                                    placeholder="Nhập SĐT..."
                                />
                            </div>
                        </div>
                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={() => setIsEditing(false)}
                                className="flex-1 py-2.5 border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
                            >
                                Huỷ
                            </button>
                            <button
                                onClick={handleSaveProfile}
                                disabled={isSaving}
                                className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                                {isSaving ? 'Đang lưu...' : 'Lưu'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* M05: Role Change Popup */}
            {showRoleChangePopup && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm text-center space-y-4">
                        <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto">
                            <Shield className="w-8 h-8 text-orange-500" />
                        </div>
                        <h2 className="text-lg font-bold text-gray-900">Vai trò đã thay đổi!</h2>
                        <p className="text-sm text-gray-500">
                            Tài khoản của bạn đã được nâng cấp vai trò. Vui lòng đăng nhập lại để sử dụng quyền mới.
                        </p>
                        <button
                            onClick={() => {
                                authStorage.clear();
                                localStorage.removeItem('bypass_user');
                                navigate('/login', { replace: true });
                            }}
                            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl transition-colors"
                        >
                            Đăng nhập lại
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
