import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, MapPin, Phone, ImageIcon, FileText, Clock, ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { userApi } from '../../../api/api';
import type { RegisterManagerRequest } from '../../../types/swagger';

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
        <div className="p-4 max-w-lg mx-auto pb-24">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                >
                    <ArrowLeft className="w-5 h-5 text-gray-700" />
                </button>
                <div>
                    <h1 className="text-xl font-bold text-gray-900">Đăng ký trở thành đối tác</h1>
                    <p className="text-xs text-gray-500">Mở quán và bắt đầu kinh doanh</p>
                </div>
            </div>

            {/* Banner */}
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-6 text-white mb-6 shadow-lg">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center">
                        <Store className="w-7 h-7" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold">Trở thành đối tác</h2>
                        <p className="text-orange-100 text-sm">Đăng ký quán ăn của bạn trên nền tảng</p>
                    </div>
                </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Store Name */}
                <div className="bg-white rounded-xl p-4 shadow-sm">
                    <label className="flex items-center gap-2 text-xs font-bold text-gray-500 mb-2">
                        <Store className="w-4 h-4 text-orange-500" />
                        Tên quán *
                    </label>
                    <input
                        type="text"
                        name="storeName"
                        value={form.storeName}
                        onChange={handleChange}
                        placeholder="Nhập tên quán ăn..."
                        required
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none"
                    />
                </div>

                {/* Description */}
                <div className="bg-white rounded-xl p-4 shadow-sm">
                    <label className="flex items-center gap-2 text-xs font-bold text-gray-500 mb-2">
                        <FileText className="w-4 h-4 text-blue-500" />
                        Mô tả
                    </label>
                    <textarea
                        name="description"
                        value={form.description}
                        onChange={handleChange}
                        placeholder="Mô tả về quán ăn của bạn..."
                        rows={3}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none resize-none"
                    />
                </div>

                {/* Address */}
                <div className="bg-white rounded-xl p-4 shadow-sm">
                    <label className="flex items-center gap-2 text-xs font-bold text-gray-500 mb-2">
                        <MapPin className="w-4 h-4 text-red-500" />
                        Địa chỉ *
                    </label>
                    <input
                        type="text"
                        name="address"
                        value={form.address}
                        onChange={handleChange}
                        placeholder="Địa chỉ quán ăn..."
                        required
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none"
                    />
                </div>

                {/* Phone */}
                <div className="bg-white rounded-xl p-4 shadow-sm">
                    <label className="flex items-center gap-2 text-xs font-bold text-gray-500 mb-2">
                        <Phone className="w-4 h-4 text-green-500" />
                        Số điện thoại
                    </label>
                    <input
                        type="tel"
                        name="phone"
                        value={form.phone}
                        onChange={handleChange}
                        placeholder="Số điện thoại liên hệ..."
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none"
                    />
                </div>

                {/* Operating Hours */}
                <div className="bg-white rounded-xl p-4 shadow-sm">
                    <label className="flex items-center gap-2 text-xs font-bold text-gray-500 mb-2">
                        <Clock className="w-4 h-4 text-purple-500" />
                        Giờ hoạt động
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <span className="text-xs text-gray-400">Mở cửa</span>
                            <input
                                type="time"
                                name="openTime"
                                value={form.openTime}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none"
                            />
                        </div>
                        <div>
                            <span className="text-xs text-gray-400">Đóng cửa</span>
                            <input
                                type="time"
                                name="closeTime"
                                value={form.closeTime}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none"
                            />
                        </div>
                    </div>
                </div>

                {/* Image URL */}
                <div className="bg-white rounded-xl p-4 shadow-sm">
                    <label className="flex items-center gap-2 text-xs font-bold text-gray-500 mb-2">
                        <ImageIcon className="w-4 h-4 text-indigo-500" />
                        Ảnh quán (URL)
                    </label>
                    <input
                        type="url"
                        name="imageSrc"
                        value={form.imageSrc}
                        onChange={handleChange}
                        placeholder="https://example.com/image.jpg"
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none"
                    />
                    {form.imageSrc && (
                        <div className="mt-3 rounded-xl overflow-hidden border border-gray-100">
                            <img
                                src={form.imageSrc}
                                alt="Preview"
                                className="w-full h-32 object-cover"
                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                            />
                        </div>
                    )}
                </div>

                {/* Submit */}
                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold py-3.5 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-orange-200"
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Đang gửi...
                        </>
                    ) : (
                        <>
                            <Store className="w-5 h-5" />
                            Gửi đơn đăng ký
                        </>
                    )}
                </button>

                <p className="text-xs text-center text-gray-400 mt-2">
                    Đơn đăng ký sẽ được Admin xem xét và phê duyệt trong vòng 24-48 giờ.
                </p>
            </form>
        </div>
    );
}
