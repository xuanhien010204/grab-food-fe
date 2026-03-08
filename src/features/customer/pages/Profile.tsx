import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { userApi, walletApi } from '../../../api/api';
import { authStorage } from '../../../utils/auth';
import type { UserProfileDto } from '../../../types/swagger';
import { 
    User, Mail, Phone, MapPin, ChevronRight, 
    ArrowLeft, LogOut, Loader2, X, Edit2, Lock, 
    Bell, Heart, Shield, Wallet, ClipboardList, Store
} from 'lucide-react';
import { toast } from 'sonner';
import { cartStore } from '../../../utils/cartStore';

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
    const [showChangePassword, setShowChangePassword] = useState(false);
    const [pwForm, setPwForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
    const [isChangingPw, setIsChangingPw] = useState(false);
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
            cartStore.clear();
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

    const handleChangePassword = async () => {
        if (!pwForm.oldPassword || !pwForm.newPassword || !pwForm.confirmPassword) {
            toast.error('Vui lòng điền đầy đủ thông tin');
            return;
        }
        if (pwForm.newPassword !== pwForm.confirmPassword) {
            toast.error('Mật khẩu mới và xác nhận không khớp');
            return;
        }
        if (pwForm.newPassword.length < 6) {
            toast.error('Mật khẩu mới phải có ít nhất 6 ký tự');
            return;
        }
        try {
            setIsChangingPw(true);
            await userApi.changePassword({ oldPassword: pwForm.oldPassword, newPassword: pwForm.newPassword });
            toast.success('Đổi mật khẩu thành công!');
            setShowChangePassword(false);
            setPwForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Đổi mật khẩu thất bại. Vui lòng kiểm tra mật khẩu cũ.');
        } finally {
            setIsChangingPw(false);
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
        <div className="bg-[#FCF9F5] min-h-screen pb-32 font-sans">
            {/* Header */}
            <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-orange-100/50 px-4 py-4 mb-8">
                <div className="max-w-6xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate(-1)} className="p-2 hover:bg-orange-50 rounded-xl transition-colors">
                            <ArrowLeft className="w-5 h-5 text-[#C76E00]" />
                        </button>
                        <div>
                            <h1 className="text-xl font-black text-gray-900 tracking-tight uppercase italic flex items-center gap-2">
                                <User className="w-5 h-5 text-[#C76E00]" />
                                Tài khoản
                            </h1>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em] mt-0.5">
                                Thông tin cá nhân & Bảo mật
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 sm:px-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* LEFT COLUMN: IDENTITY & BASIC INFO */}
                    <div className="lg:col-span-5 space-y-6">
                        {/* HERO PROFILE CARD */}
                        <div className="relative group">
                            <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 shadow-xl shadow-orange-900/5 border border-orange-100/50 flex items-center gap-6 transition-all hover:shadow-2xl hover:shadow-orange-900/10 hover:-translate-y-1">
                                <div className="w-16 h-16 bg-gradient-to-br from-[#C76E00] to-[#E67E00] rounded-2xl flex items-center justify-center text-2xl font-black text-white shadow-lg shadow-orange-200 rotate-2 transition-transform group-hover:rotate-0 shrink-0">
                                    {profile?.name?.charAt(0)?.toUpperCase() || 'U'}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h2 className="text-lg font-black text-gray-900 tracking-tight uppercase truncate">{profile?.name || 'N/A'}</h2>
                                    <span className="inline-block px-3 py-1 bg-orange-50 text-[#C76E00] text-[8px] font-black uppercase tracking-widest rounded-full mt-1 border border-orange-100">
                                        {profile?.roleName === 'User' ? 'Khách hàng' : profile?.roleName || 'Thành viên'}
                                    </span>
                                </div>
                                <button
                                    onClick={handleEdit}
                                    className="bg-gray-50 text-gray-400 p-2.5 rounded-xl hover:bg-[#C76E00] hover:text-white transition-all active:scale-95 border border-gray-100 shrink-0"
                                >
                                    <Edit2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* BASIC INFO */}
                        <div className="space-y-4">
                            <div className="flex items-center space-x-2 text-gray-900 font-black ml-2 uppercase text-[9px] tracking-[0.2em] italic opacity-40">
                                <User className="w-3 h-3" />
                                <span>Thông tin cơ bản</span>
                            </div>
                            <div className="grid grid-cols-1 gap-3">
                                <div className="bg-white/70 backdrop-blur-md rounded-2xl p-4 shadow-sm border border-orange-100/30 flex items-center gap-4 transition-all hover:shadow-md hover:bg-white hover:border-orange-100/60 group">
                                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center border border-blue-100 shrink-0 group-hover:scale-110 transition-transform">
                                        <Mail className="w-5 h-5 text-blue-500" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[8px] text-gray-400 font-black uppercase tracking-widest mb-0.5">Địa chỉ Email</p>
                                        <p className="text-sm font-bold text-gray-800 truncate">{profile?.email || 'N/A'}</p>
                                    </div>
                                </div>

                                <div className="bg-white/70 backdrop-blur-md rounded-2xl p-4 shadow-sm border border-orange-100/30 flex items-center gap-4 transition-all hover:shadow-md hover:bg-white hover:border-orange-100/60 group">
                                    <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center border border-emerald-100 shrink-0 group-hover:scale-110 transition-transform">
                                        <Phone className="w-5 h-5 text-emerald-500" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[8px] text-gray-400 font-black uppercase tracking-widest mb-0.5">Số điện thoại</p>
                                        <p className="text-sm font-bold text-gray-800 truncate">{(profile as any)?.phone || 'Chưa cập nhật'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* LOGOUT AT BOTTOM OF LEFT COL */}
                        <button
                            onClick={handleSignOut}
                            disabled={signingOut}
                            className="w-full mt-4 flex items-center justify-center gap-3 bg-red-50 hover:bg-red-100 text-red-600 font-black py-4 rounded-2xl transition-all disabled:opacity-50 text-[10px] uppercase tracking-[0.2em] active:scale-95"
                        >
                            {signingOut ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
                            {signingOut ? 'Đang thoát...' : 'Đăng xuất tài khoản'}
                        </button>
                    </div>

                    {/* RIGHT COLUMN: NAVIGATION & SERVICES */}
                    <div className="lg:col-span-7 space-y-6">
                        <div className="flex items-center space-x-2 text-gray-900 font-black ml-2 uppercase text-[9px] tracking-[0.2em] italic opacity-40">
                            <Shield className="w-3 h-3" />
                            <span>Tiện ích & Bảo mật</span>
                        </div>
                        
                        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl shadow-orange-900/5 border border-orange-100/50 overflow-hidden divide-y divide-orange-50/50">
                            {[
                                { icon: Wallet, label: 'Ví FoodDelivery', sub: balance != null ? balance.toLocaleString('vi-VN') + ' ₫' : '0 ₫', to: '/wallet', color: 'text-emerald-500', bg: 'bg-emerald-50' },
                                { icon: ClipboardList, label: 'Lịch sử đơn hàng', sub: 'Hành trình ngon miệng', to: '/orders', color: 'text-blue-500', bg: 'bg-blue-50' },
                                { icon: MapPin, label: 'Địa chỉ giao hàng', sub: 'Địa điểm nhận món', to: '/addresses', color: 'text-[#C76E00]', bg: 'bg-[#C76E00]/5' },
                                { icon: Heart, label: 'Món ăn yêu thích', sub: 'Ghi nhớ hương vị', to: '/favorites', color: 'text-rose-500', bg: 'bg-rose-50' },
                                { icon: Bell, label: 'Thông báo mới', sub: 'Đừng bỏ lỡ tin vui', to: '/notifications', color: 'text-indigo-500', bg: 'bg-indigo-50' },
                                ...((!profile?.roleName || profile?.roleName === 'User') ? [
                                    { icon: Store, label: 'Đăng ký bán hàng', sub: 'Bắt đầu kinh doanh ngay', to: '/register-store', color: 'text-amber-500', bg: 'bg-amber-50' },
                                ] : []),
                            ].map(({ icon: Icon, label, sub, to, color, bg }) => (
                                <Link
                                    key={to}
                                    to={to}
                                    className="flex items-center gap-4 p-5 hover:bg-orange-50/30 transition-all group"
                                >
                                    <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center shrink-0 border border-white group-hover:rotate-6 transition-transform shadow-sm group-hover:shadow-orange-100`}>
                                        <Icon className={`w-5 h-5 ${color}`} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-black text-gray-900 uppercase tracking-tight truncate group-hover:text-[#C76E00] transition-colors">{label}</p>
                                        <p className="text-[9px] text-gray-400 font-bold mt-0.5 uppercase tracking-widest truncate">{sub}</p>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-[#C76E00] group-hover:translate-x-1 transition-all" />
                                </Link>
                            ))}
                            
                            {/* Change Password integrated in the menu list */}
                            <button
                                onClick={() => setShowChangePassword(true)}
                                className="w-full flex items-center gap-4 p-5 hover:bg-orange-50/30 transition-all group text-left"
                            >
                                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center shrink-0 border border-white group-hover:rotate-6 transition-transform shadow-sm group-hover:shadow-indigo-100">
                                    <Lock className="w-5 h-5 text-indigo-500" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-black text-gray-900 uppercase tracking-tight truncate group-hover:text-indigo-600 transition-colors">Đổi mật khẩu</p>
                                    <p className="text-[9px] text-gray-400 font-bold mt-0.5 uppercase tracking-widest truncate">Bảo vệ tài khoản</p>
                                </div>
                                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
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

            {/* Change Password Modal */}
            {showChangePassword && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-bold text-gray-900">Đổi mật khẩu</h2>
                            <button onClick={() => { setShowChangePassword(false); setPwForm({ oldPassword: '', newPassword: '', confirmPassword: '' }); }} className="p-1 hover:bg-gray-100 rounded-lg">
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>
                        <div className="space-y-3">
                            <div>
                                <label className="text-xs font-medium text-gray-500 mb-1 block">Mật khẩu hiện tại</label>
                                <input
                                    type="password"
                                    value={pwForm.oldPassword}
                                    onChange={e => setPwForm({ ...pwForm, oldPassword: e.target.value })}
                                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                    placeholder="Nhập mật khẩu hiện tại..."
                                />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-gray-500 mb-1 block">Mật khẩu mới</label>
                                <input
                                    type="password"
                                    value={pwForm.newPassword}
                                    onChange={e => setPwForm({ ...pwForm, newPassword: e.target.value })}
                                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                    placeholder="Tối thiểu 6 ký tự..."
                                />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-gray-500 mb-1 block">Xác nhận mật khẩu mới</label>
                                <input
                                    type="password"
                                    value={pwForm.confirmPassword}
                                    onChange={e => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
                                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                    placeholder="Nhập lại mật khẩu mới..."
                                />
                            </div>
                        </div>
                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={() => { setShowChangePassword(false); setPwForm({ oldPassword: '', newPassword: '', confirmPassword: '' }); }}
                                className="flex-1 py-2.5 border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
                            >
                                Huỷ
                            </button>
                            <button
                                onClick={handleChangePassword}
                                disabled={isChangingPw}
                                className="flex-1 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isChangingPw && <Loader2 className="w-4 h-4 animate-spin" />}
                                {isChangingPw ? 'Đang lưu...' : 'Xác nhận'}
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
