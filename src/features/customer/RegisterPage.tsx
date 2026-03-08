import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardContent, CardFooter } from '../../components/ui/Card';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { toast } from 'sonner';
import { userApi } from '../../api/api';

import { useEffect } from 'react';

export default function RegisterPage() {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (localStorage.getItem('token')) {
            navigate('/', { replace: true });
        }
    }, [navigate]);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.password !== formData.confirmPassword) {
            toast.error('Mật khẩu nhập lại không khớp');
            return;
        }

        setIsLoading(true);

        try {
            await userApi.register({
                email: formData.email,
                name: formData.name,
                phone: formData.phone,
                password: formData.password
            });
            toast.success('Đăng ký thành công! Vui lòng đăng nhập.');
            navigate('/login');
        } catch (error: any) {
            console.error(error);
            const msg = error.response?.data?.message || error.message || 'Đăng ký thất bại';
            toast.error(msg);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#FCF9F5] flex items-center justify-center p-4 font-sans">
            <div className="w-full max-w-md space-y-6">
                <div className="text-center">
                    <div className="mx-auto h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center mb-2">
                        <span className="text-2xl">👤</span>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Tạo tài khoản mới</h2>
                </div>

                <Card className="border-none shadow-2xl shadow-orange-900/5 bg-white/80 backdrop-blur-xl rounded-[2.5rem] overflow-hidden">
                    <CardContent className="pt-6">
                        <form onSubmit={handleRegister} className="space-y-4">
                            <div className="space-y-2">
                                <Input
                                    name="name"
                                    placeholder="Họ và tên"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Input
                                    type="email"
                                    name="email"
                                    placeholder="Email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Input
                                    type="tel"
                                    name="phone"
                                    placeholder="Số điện thoại"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Input
                                    type="password"
                                    name="password"
                                    placeholder="Mật khẩu"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Input
                                    type="password"
                                    name="confirmPassword"
                                    placeholder="Nhập lại mật khẩu"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <Button type="submit" className="w-full mt-4 py-6 rounded-2xl bg-[#C76E00] hover:bg-[#A55B00] text-white font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-orange-900/20 active:scale-95 transition-all" isLoading={isLoading}>
                                ĐĂNG KÝ
                            </Button>
                        </form>
                    </CardContent>
                    <CardFooter className="justify-center text-sm text-gray-600 pb-6">
                        Đã có tài khoản?{' '}
                        <Link to="/login" className="ml-1 text-orange-500 font-medium hover:underline">
                            Đăng nhập
                        </Link>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}
