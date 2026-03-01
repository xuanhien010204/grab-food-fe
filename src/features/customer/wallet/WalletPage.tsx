import { LogOut, ArrowUp, ArrowDown, Plus as PlusIcon, History, Landmark, Wallet2 } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { Input } from '../../../components/ui/Input';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { cn } from '../../../lib/utils';
import { userApi, walletApi } from '../../../api/api';
import type { UserProfileDto, WalletTransactionDto } from '../../../types/swagger';
import { TransactionType } from '../../../types/swagger';
import { Badge } from '../../../components/ui/Badge';

const TransactionTypeName: Record<number, string> = {
    [TransactionType.Deposit]: 'Nạp tiền',
    [TransactionType.Payment]: 'Thanh toán',
    [TransactionType.Refund]: 'Hoàn tiền',
    [TransactionType.Withdrawal]: 'Rút tiền',
    [TransactionType.Bonus]: 'Thưởng',
};

const isCredit = (type: number) => [TransactionType.Deposit, TransactionType.Refund, TransactionType.Bonus].includes(type);

export default function WalletPage() {
    const navigate = useNavigate();
    const [amount, setAmount] = useState('');
    const [selectedMethod, setSelectedMethod] = useState('momo');
    const [user, setUser] = useState<UserProfileDto | null>(null);
    const [transactions, setTransactions] = useState<WalletTransactionDto[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }

        const fetchData = async () => {
            try {
                const [profileRes, balanceRes, transRes] = await Promise.all([
                    userApi.profile(),
                    walletApi.getBalance().catch(() => ({ data: 0 })),
                    walletApi.getTransactions().catch(() => ({ data: [] }))
                ]);

                const profileData = profileRes.data as any;
                // walletApi.getBalance() returns WalletResponse { userId, userName, balance, lastUpdated }
                const walletData = balanceRes.data as any;
                const balance = typeof walletData === 'number' ? walletData : (walletData?.balance ?? profileData?.balance ?? 0);
                setUser({ ...profileData, balance });

                const rawTrans = transRes.data as any;
                const transData = Array.isArray(rawTrans) ? rawTrans : Array.isArray(rawTrans?.transactions) ? rawTrans.transactions : [];
                setTransactions(transData);
            } catch (error) {
                console.error("Failed to fetch wallet data", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [navigate]);

    const handleTopUp = async () => {
        if (!amount || isNaN(Number(amount))) return;
        try {
            const res = await walletApi.deposit({ amount: Number(amount) });
            const paymentData = res.data;
            if (paymentData?.payUrl) {
                toast.success('Đang chuyển đến trang thanh toán...');
                window.location.href = paymentData.payUrl;
                return;
            }
            toast.success(`Yêu cầu nạp ${parseInt(amount).toLocaleString()}đ đã được gửi`);
            setAmount('');
            // Refresh balance
            const [profileRes, balanceRes] = await Promise.all([
                userApi.profile(),
                walletApi.getBalance().catch(() => ({ data: 0 }))
            ]);
            const profileData = profileRes.data as any;
            const balance = typeof balanceRes.data === 'number' ? balanceRes.data : ((balanceRes.data as any)?.balance || profileData?.balance || 0);
            setUser({ ...profileData, balance });
        } catch (error) {
            toast.error("Nạp tiền thất bại");
        }
    };

    const handleLogout = async () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    if (isLoading) {
        return (
            <div className="p-6 bg-gray-50 min-h-screen space-y-6">
                <div className="h-40 bg-gray-200 animate-pulse rounded-[2rem]" />
                <div className="h-64 bg-gray-200 animate-pulse rounded-[2rem]" />
            </div>
        );
    }

    return (
        <div className="p-4 bg-gray-50 min-h-screen pb-24">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-black text-gray-900">Tài chính</h1>
                    <p className="text-xs text-gray-500 font-medium">Quản lý nguồn vốn của bạn</p>
                </div>
                <Button variant="ghost" size="icon" className="bg-white shadow-sm rounded-xl text-red-500" onClick={handleLogout}>
                    <LogOut className="w-5 h-5" />
                </Button>
            </div>

            {/* Premium Card Layout */}
            <div className="mb-8 relative overflow-hidden rounded-[2rem] bg-slate-900 border border-slate-800 text-white p-8 shadow-2xl shadow-slate-200">
                <div className="relative z-10">
                    <div className="flex justify-between items-center mb-10">
                        <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                                <Wallet2 className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-xs font-bold tracking-widest uppercase text-slate-400">Grab Wallet</span>
                        </div>
                        <Badge variant="secondary" className="bg-white/10 text-white border-none backdrop-blur-md">Active</Badge>
                    </div>

                    <div>
                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Available Balance</p>
                        <h2 className="text-4xl font-black tracking-tight tracking-tighter">
                            {user?.balance?.toLocaleString() || 0}<span className="text-xl ml-1 font-bold text-orange-500 underline underline-offset-8">đ</span>
                        </h2>
                    </div>

                    <div className="mt-8 flex justify-between items-end">
                        <div>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] mb-1">Card Holder</p>
                            <p className="font-bold text-sm tracking-wide">{user?.name?.toUpperCase() || 'VALUED CUSTOMER'}</p>
                        </div>
                        <div className="flex -space-x-2">
                            <div className="w-8 h-8 rounded-full bg-orange-500/80 backdrop-blur-sm shadow-lg" />
                            <div className="w-8 h-8 rounded-full bg-yellow-500/80 backdrop-blur-sm shadow-lg border border-white/10" />
                        </div>
                    </div>
                </div>

                {/* Visual Glassmorphism elements */}
                <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-orange-600/20 blur-[80px]" />
                <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 rounded-full bg-blue-600/10 blur-[60px]" />
            </div>

            <div className="space-y-8">
                <section>
                    <div className="flex items-center space-x-2 mb-4">
                        <div className="w-8 h-8 bg-white shadow-sm border border-gray-100 rounded-lg flex items-center justify-center">
                            <PlusIcon className="w-4 h-4 text-orange-600" />
                        </div>
                        <h3 className="font-bold text-gray-900">Nạp tiền</h3>
                    </div>

                    <Card className="p-6 border-none shadow-sm rounded-[2rem] bg-white">
                        <div className="grid grid-cols-3 gap-3 mb-6">
                            {['50000', '100000', '200000', '500000', '1000000', '2000000'].map((val) => (
                                <button
                                    key={val}
                                    onClick={() => setAmount(val)}
                                    className={cn(
                                        "py-3 rounded-2xl border text-sm font-bold transition-all transform active:scale-95",
                                        amount === val
                                            ? "bg-orange-600 border-orange-600 text-white shadow-lg shadow-orange-100"
                                            : "bg-gray-50 border-gray-50 text-gray-500 hover:border-orange-200 hover:bg-white"
                                    )}
                                >
                                    {parseInt(val) >= 1000000 ? `${parseInt(val) / 1000000}M` : `${parseInt(val) / 1000}K`}
                                </button>
                            ))}
                        </div>

                        <div className="relative mb-6">
                            <Input
                                type="number"
                                placeholder="0"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="bg-gray-50 border-none rounded-2xl py-7 pl-6 pr-12 text-xl font-black focus-visible:ring-orange-500"
                            />
                            <span className="absolute right-6 top-1/2 -translate-y-1/2 font-bold text-gray-400">đ</span>
                        </div>

                        <div className="grid grid-cols-3 gap-4 mb-6">
                            {[
                                { id: 'momo', icon: 'M', color: 'bg-pink-100 text-pink-600', label: 'MoMo' },
                                { id: 'zalo', icon: 'Z', color: 'bg-blue-100 text-blue-600', label: 'Zalo' },
                                { id: 'atm', icon: <Landmark className="w-4 h-4" />, color: 'bg-indigo-100 text-indigo-600', label: 'Bank' },
                            ].map((method) => (
                                <button
                                    key={method.id}
                                    onClick={() => setSelectedMethod(method.id)}
                                    className={cn(
                                        "flex flex-col items-center p-3 rounded-2xl border transition-all",
                                        selectedMethod === method.id ? "border-orange-300 bg-orange-50/50" : "border-gray-50 bg-gray-50/50"
                                    )}
                                >
                                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center font-black mb-2 shadow-sm", method.color)}>
                                        {method.icon}
                                    </div>
                                    <span className="text-[10px] font-bold text-gray-500">{method.label}</span>
                                </button>
                            ))}
                        </div>

                        <Button className="w-full py-7 text-lg font-bold rounded-2xl shadow-xl shadow-orange-200" onClick={handleTopUp} disabled={!amount}>
                            TIẾP TỤC THANH TOÁN
                        </Button>
                    </Card>
                </section>

                <section>
                    <div className="flex items-center space-x-2 mb-4">
                        <div className="w-8 h-8 bg-white shadow-sm border border-gray-100 rounded-lg flex items-center justify-center">
                            <History className="w-4 h-4 text-orange-600" />
                        </div>
                        <h3 className="font-bold text-gray-900">Giao dịch gần đây</h3>
                    </div>

                    <div className="space-y-3">
                        {transactions.length === 0 ? (
                            <Card className="p-8 border-none shadow-sm flex flex-col items-center justify-center rounded-[2rem] bg-white">
                                <History className="w-12 h-12 text-gray-100 mb-2" />
                                <p className="text-gray-400 text-sm font-medium">Chưa có giao dịch nào</p>
                            </Card>
                        ) : (
                            transactions.slice(0, 10).map((trx) => {
                                const credit = isCredit(trx.transactionType);
                                return (
                                    <Card key={trx.id} className="p-4 border-none shadow-sm flex items-center justify-between rounded-2xl group hover:shadow-md transition-shadow">
                                        <div className="flex items-center space-x-4">
                                            <div className={cn(
                                                "w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm transition-transform group-hover:scale-110",
                                                credit ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                                            )}>
                                                {credit ? <ArrowUp className="w-5 h-5" /> : <ArrowDown className="w-5 h-5" />}
                                            </div>
                                            <div>
                                                <p className="font-bold text-sm text-gray-900 leading-tight">
                                                    {TransactionTypeName[trx.transactionType] || trx.transactionTypeName || 'Giao dịch'}
                                                </p>
                                                <p className="text-[10px] font-medium text-gray-400 mt-1 uppercase tracking-wider">
                                                    {trx.createdAt ? new Date(trx.createdAt).toLocaleDateString('vi-VN') : '-'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className={cn("font-black text-sm", credit ? "text-emerald-600" : "text-gray-900")}>
                                                {credit ? '+' : '-'}{(trx.amount || 0).toLocaleString()}đ
                                            </span>
                                            <p className="text-[8px] text-gray-300 font-bold uppercase tracking-widest mt-0.5">
                                                {trx.statusName || 'Hoàn thành'}
                                            </p>
                                        </div>
                                    </Card>
                                );
                            })
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
}
