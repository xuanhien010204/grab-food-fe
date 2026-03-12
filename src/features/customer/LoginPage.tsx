import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/Card';
import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { userApi } from '../../api/api';
import { authStorage, type RoleName } from '../../utils/auth';
import { getHomeByRole } from '../../utils/roleRedirect';
import { cartStore } from '../../utils/cartStore';


export default function LoginPage() {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    useEffect(() => {
        const token = authStorage.getToken();
        if (!token) return;

        (async () => {
            try {
                const profile = await userApi.profile();
                // 1. Try to get role from Token first (most reliable)
                const tokenUser = authStorage.getUserFromToken();
                let roleName = tokenUser?.role || tokenUser?.Role || tokenUser?.['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || profile.data.roleName;

                const role = (roleName || 'User') as RoleName;
                authStorage.setRole(role);
                navigate(getHomeByRole(role), { replace: true });
            } catch {
                authStorage.clear();
            }
        })();
    }, [navigate]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            console.log('LOGIN ATTEMPT:', { email, passwordLength: password.length });
            const loginRes = await userApi.login({ email, password });

            const profile = await userApi.profile();

            // 1. Try to get role from Token first (most reliable)
            const tokenUser = authStorage.getUserFromToken();
            let roleName = tokenUser?.role || tokenUser?.Role || tokenUser?.['http://schemas.microsoft.com/ws/2008/06/identity/claims/role']
                || loginRes.data?.result?.roleName
                || loginRes.data?.roleName
                || profile.data.roleName;

            const role = (roleName || 'User') as RoleName;
            authStorage.setRole(role);

            // B02: Merge local cart with server cart after login
            // Cart Leak Fix: if a different user's cart is in localStorage, clear it first
            const newUserId = String(profile.data?.id || '');
            const storedCartUserId = cartStore.getCartUser();
            if (storedCartUserId && storedCartUserId !== newUserId) {
                cartStore.clear();
            }
            if (newUserId) cartStore.setCartUser(newUserId);
            await cartStore.syncFromApi();

            toast.success('Đăng nhập thành công');
            navigate(getHomeByRole(role), { replace: true });
        } catch (error: any) {
            console.error('LOGIN ERROR:', error);
            // Global API interceptor handles the error toast
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#FCF9F5] flex items-center justify-center p-4 font-sans">
            <div className="w-full max-w-md space-y-8">
                <div className="text-center">
                    <div className="mx-auto h-16 w-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                        <span className="text-3xl">🍕</span>
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900">FoodDelivery</h2>
                    <p className="mt-2 text-gray-600">Đặt món ngon, giao tận nơi</p>
                </div>

                <Card className="border-none shadow-2xl shadow-orange-900/5 bg-white/80 backdrop-blur-xl rounded-[2.5rem] overflow-hidden">
                    <CardHeader>
                        <CardTitle className="text-xl text-center">Đăng nhập</CardTitle>
                        <CardDescription className="text-center">Nhập email và mật khẩu của bạn</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleLogin} className="space-y-4">
                            <div className="space-y-2">
                                <Input
                                    type="email"
                                    placeholder="Email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="bg-white"
                                />
                            </div>
                            <div className="space-y-2">
                                <Input
                                    type="password"
                                    placeholder="Mật khẩu"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="bg-white"
                                />
                            </div>
                            <div className="flex justify-end">
                                <Link to="#" className="text-sm text-orange-500 hover:underline">
                                    Quên mật khẩu?
                                </Link>
                            </div>
                            <Button type="submit" className="w-full py-6 rounded-2xl bg-[#C76E00] hover:bg-[#A55B00] text-white font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-orange-900/20 active:scale-95 transition-all" isLoading={isLoading}>
                                ĐĂNG NHẬP
                            </Button>
                        </form>
                    </CardContent>
                    <CardFooter className="justify-center text-sm text-gray-600">
                        Chưa có tài khoản?{' '}
                        <Link to="/register" className="ml-1 text-orange-500 font-medium hover:underline">
                            Đăng ký ngay
                        </Link>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}
