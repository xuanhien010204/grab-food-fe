import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, MapPin, Phone, ImageIcon, FileText, Clock, ArrowLeft, Loader2, Sparkles, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { userApi } from '../../../api/api';
import type { RegisterManagerRequest } from '../../../types/swagger';
import { Card } from '../../../components/ui/Card';

export default function ManagerRegistrationPage() {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [form, setForm] = useState<RegisterManagerRequest>({
        storeName: '',
        description: '',
        address: '',
        phone: '',
        openTime: '08:00',
        closeTime: '22:00',
        imageSrc: '',
        latitude: '',
        longitude: '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!form.storeName.trim()) {
            toast.error('Vui lòng nhập tên quán');
            return;
        }
        if (!form.address.trim()) {
            toast.error('Vui lòng nhập địa chỉ');
            return;
        }

        setIsLoading(true);
        try {
            await userApi.registerManager(form);
            toast.success('Đăng ký quán thành công! Vui lòng chờ Admin duyệt.');
            navigate('/profile', { replace: true });
        } catch (error: any) {
            const msg = error.response?.data?.message || error.response?.data?.Message || error.message || 'Đăng ký thất bại';
            toast.error(msg);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-[#FCF9F5] min-h-screen pb-32 font-sans">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 bg-white rounded-xl shadow-sm border border-gray-100 text-gray-400 hover:text-[#C76E00] transition-all active:scale-95"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="text-right">
                        <h1 className="text-xl font-black text-gray-900 tracking-tight uppercase italic">Đăng ký đối tác</h1>
                        <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Mở rộng kinh doanh cùng chúng tôi</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* LEFT COLUMN: INFO & BENEFITS */}
                    <div className="lg:col-span-4 space-y-6">
                        <Card className="bg-[#1A1A1A] p-8 rounded-[2.5rem] border-none shadow-2xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-[#C76E00]/20 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-[#C76E00]/30 transition-colors" />
                            
                            <div className="relative z-10 space-y-6">
                                <div className="w-16 h-16 bg-gradient-to-br from-[#C76E00] to-[#E67E00] rounded-2xl flex items-center justify-center shadow-xl shadow-orange-950/20 rotate-3 group-hover:rotate-0 transition-transform">
                                    <Store className="w-8 h-8 text-white" />
                                </div>
                                
                                <div>
                                    <h2 className="text-2xl font-black text-white leading-tight uppercase italic tracking-tight">
                                        Trở thành <br />
                                        <span className="text-[#C76E00]">Đối tác nhà hàng</span>
                                    </h2>
                                    <p className="text-gray-400 text-xs mt-3 font-medium leading-relaxed">
                                        Tham gia cộng đồng hàng nghìn nhà hàng thành công trên nền tảng của chúng tôi.
                                    </p>
                                </div>

                                <div className="space-y-4 pt-4 border-t border-white/5">
                                    {[
                                        { icon: Sparkles, text: "Tiếp cận triệu khách hàng" },
                                        { icon: ShieldCheck, text: "Hệ thống quản lý chuyên nghiệp" },
                                        { icon: Clock, text: "Giao hàng nhanh chóng" }
                                    ].map((benefit, i) => (
                                        <div key={i} className="flex items-center gap-3">
                                            <div className="w-6 h-6 rounded-lg bg-[#C76E00]/10 flex items-center justify-center">
                                                <benefit.icon className="w-3.5 h-3.5 text-[#C76E00]" />
                                            </div>
                                            <span className="text-[11px] font-bold text-gray-300 uppercase tracking-widest">{benefit.text}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </Card>

                        <div className="bg-orange-50/50 rounded-3xl p-6 border border-[#C76E00]/10">
                            <p className="text-[10px] text-[#C76E00] font-black uppercase tracking-[0.2em] mb-3 opacity-60 italic">Quy trình duyệt</p>
                            <p className="text-xs text-gray-600 font-medium leading-relaxed italic">
                                "Đơn đăng ký của bạn sẽ được đội ngũ vận hành xem xét kỹ lưỡng và phản hồi trong vòng 24-48 giờ làm việc."
                            </p>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: REGISTRATION FORM */}
                    <div className="lg:col-span-8">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <Card className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] p-8 shadow-xl shadow-orange-900/5 border border-orange-100/50">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Store Name */}
                                    <div className="md:col-span-2 space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Tên nhà hàng *</label>
                                        <div className="relative group">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#C76E00] group-focus-within:scale-110 transition-transform">
                                                <Store className="w-5 h-5" />
                                            </div>
                                            <input
                                                type="text"
                                                name="storeName"
                                                value={form.storeName}
                                                onChange={handleChange}
                                                placeholder="VD: Cơm Tấm Sài Gòn"
                                                required
                                                className="w-full pl-12 pr-4 py-4 bg-gray-50/50 border border-orange-100/50 rounded-2xl text-sm font-bold text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#C76E00]/20 focus:bg-white transition-all shadow-inner"
                                            />
                                        </div>
                                    </div>

                                    {/* Description */}
                                    <div className="md:col-span-2 space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Mô tả quán</label>
                                        <div className="relative group">
                                            <div className="absolute left-4 top-5 text-[#C76E00] group-focus-within:scale-110 transition-transform">
                                                <FileText className="w-5 h-5" />
                                            </div>
                                            <textarea
                                                name="description"
                                                value={form.description}
                                                onChange={handleChange}
                                                placeholder="Mô tả về phong cách ẩm thực của bạn..."
                                                rows={3}
                                                className="w-full pl-12 pr-4 py-4 bg-gray-50/50 border border-orange-100/50 rounded-2xl text-sm font-bold text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#C76E00]/20 focus:bg-white transition-all shadow-inner resize-none"
                                            />
                                        </div>
                                    </div>

                                    {/* Address */}
                                    <div className="md:col-span-2 space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Địa chỉ chính xác *</label>
                                        <div className="relative group">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#C76E00] group-focus-within:scale-110 transition-transform">
                                                <MapPin className="w-5 h-5" />
                                            </div>
                                            <input
                                                type="text"
                                                name="address"
                                                value={form.address}
                                                onChange={handleChange}
                                                placeholder="Số nhà, tên đường, phường, quận..."
                                                required
                                                className="w-full pl-12 pr-4 py-4 bg-gray-50/50 border border-orange-100/50 rounded-2xl text-sm font-bold text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#C76E00]/20 focus:bg-white transition-all shadow-inner"
                                            />
                                        </div>
                                    </div>

                                    {/* Phone */}
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Số điện thoại quán</label>
                                        <div className="relative group">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#C76E00] group-focus-within:scale-110 transition-transform">
                                                <Phone className="w-5 h-5" />
                                            </div>
                                            <input
                                                type="tel"
                                                name="phone"
                                                value={form.phone}
                                                onChange={handleChange}
                                                placeholder="VD: 090xxxxxxx"
                                                className="w-full pl-12 pr-4 py-4 bg-gray-50/50 border border-orange-100/50 rounded-2xl text-sm font-bold text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#C76E00]/20 focus:bg-white transition-all shadow-inner"
                                            />
                                        </div>
                                    </div>

                                    {/* Operating Hours */}
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 block">Giờ hoạt động</label>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="relative">
                                                <input
                                                    type="time"
                                                    name="openTime"
                                                    value={form.openTime}
                                                    onChange={handleChange}
                                                    className="w-full px-4 py-3.5 bg-gray-50/50 border border-orange-100/50 rounded-2xl text-xs font-black text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#C76E00]/20 focus:bg-white transition-all"
                                                />
                                                <span className="absolute -top-2 left-3 px-2 bg-white text-[8px] font-black text-[#C76E00] uppercase tracking-widest">Mở</span>
                                            </div>
                                            <div className="relative">
                                                <input
                                                    type="time"
                                                    name="closeTime"
                                                    value={form.closeTime}
                                                    onChange={handleChange}
                                                    className="w-full px-4 py-3.5 bg-gray-50/50 border border-orange-100/50 rounded-2xl text-xs font-black text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#C76E00]/20 focus:bg-white transition-all"
                                                />
                                                <span className="absolute -top-2 left-3 px-2 bg-white text-[8px] font-black text-[#C76E00] uppercase tracking-widest">Đóng</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Image URL */}
                                    <div className="md:col-span-2 space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Hình ảnh bìa (URL)</label>
                                        <div className="relative group">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#C76E00] group-focus-within:scale-110 transition-transform">
                                                <ImageIcon className="w-5 h-5" />
                                            </div>
                                            <input
                                                type="url"
                                                name="imageSrc"
                                                value={form.imageSrc}
                                                onChange={handleChange}
                                                placeholder="Dán link ảnh tại đây..."
                                                className="w-full pl-12 pr-4 py-4 bg-gray-50/50 border border-orange-100/50 rounded-2xl text-sm font-bold text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#C76E00]/20 focus:bg-white transition-all shadow-inner"
                                            />
                                        </div>
                                        {form.imageSrc && (
                                            <div className="mt-4 rounded-3xl overflow-hidden border-2 border-orange-100 border-dashed p-2">
                                                <img
                                                    src={form.imageSrc}
                                                    alt="Preview"
                                                    className="w-full h-40 object-cover rounded-2xl shadow-lg"
                                                    onError={(e) => { (e.target as HTMLImageElement).parentElement!.style.display = 'none'; }}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="mt-10">
                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full flex items-center justify-center gap-3 bg-[#C76E00] hover:bg-[#A55B00] text-white font-black py-5 rounded-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-orange-900/10 uppercase tracking-[0.2em] text-xs active:scale-95"
                                    >
                                        {isLoading ? (
                                            <>
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                Đang xử lý hồ sơ...
                                            </>
                                        ) : (
                                            <>
                                                <Sparkles className="w-5 h-5" />
                                                Gửi đơn đăng ký ngay
                                            </>
                                        )}
                                    </button>
                                </div>
                            </Card>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
