import { LogOut, ArrowUp, ArrowDown, Plus as PlusIcon, History, Wallet2, RefreshCw, ArrowLeft } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { Input } from '../../../components/ui/Input';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { cn } from '../../../lib/utils';
import { userApi, walletApi } from '../../../api/api';
import { authStorage } from '../../../utils/auth';
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

const TransactionStatusLabel: Record<number, { label: string; color: string }> = {
    0: { label: 'Đang xử lý', color: 'text-yellow-500' },
    1: { label: 'Thành công', color: 'text-green-500' },
    2: { label: 'Thất bại', color: 'text-red-500' },
    3: { label: 'Đã huỷ', color: 'text-gray-400' },
};

const isCredit = (type: number) => [TransactionType.Deposit, TransactionType.Refund, TransactionType.Bonus].includes(type);

export default function WalletPage() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [amount, setAmount] = useState('100000');
    const [user, setUser] = useState<UserProfileDto | null>(null);
    const [transactions, setTransactions] = useState<WalletTransactionDto[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

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
                setIsRefreshing(false);
            }
        };
        fetchData();

        // B03: Polling after returning from MoMo payment instead of fixed 2s wait
        if (searchParams.get('refreshed') === '1') {
            setSearchParams({}, { replace: true });
            setIsRefreshing(true);

            // Poll balance every 2s for up to 30s to detect IPN update
            let pollCount = 0;
            const maxPolls = 15;
            const initialBalance = user?.balance;

            const pollInterval = setInterval(async () => {
                pollCount++;
                try {
                    const [balanceRes, transRes] = await Promise.all([
                        walletApi.getBalance().catch(() => ({ data: 0 })),
                        walletApi.getTransactions().catch(() => ({ data: [] }))
                    ]);
                    const walletData = balanceRes.data as any;
                    const newBalance = typeof walletData === 'number' ? walletData : (walletData?.balance ?? 0);

                    const rawTrans = transRes.data as any;
                    const transData = Array.isArray(rawTrans) ? rawTrans : Array.isArray(rawTrans?.transactions) ? rawTrans.transactions : [];
                    setTransactions(transData);

                    // Balance changed or max polls reached → stop polling
                    if (newBalance !== initialBalance || pollCount >= maxPolls) {
                        clearInterval(pollInterval);
                        setUser(prev => prev ? { ...prev, balance: newBalance } : prev);
                        setIsRefreshing(false);
                        if (newBalance !== initialBalance) {
                            toast.success('Số dư đã được cập nhật!');
                        }
                    }
                } catch {
                    // Continue polling on error
                }

                if (pollCount >= maxPolls) {
                    clearInterval(pollInterval);
                    setIsRefreshing(false);
                }
            }, 2000);

            return () => clearInterval(pollInterval);
        }
    }, [navigate]);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            const [profileRes, balanceRes, transRes] = await Promise.all([
                userApi.profile(),
                walletApi.getBalance().catch(() => ({ data: 0 })),
                walletApi.getTransactions().catch(() => ({ data: [] }))
            ]);
            const profileData = profileRes.data as any;
            const walletData = balanceRes.data as any;
            const balance = typeof walletData === 'number' ? walletData : (walletData?.balance ?? profileData?.balance ?? 0);
            setUser({ ...profileData, balance });
            const rawTrans = transRes.data as any;
            const transData = Array.isArray(rawTrans) ? rawTrans : Array.isArray(rawTrans?.transactions) ? rawTrans.transactions : [];
            setTransactions(transData);
            toast.success('Đã cập nhật');
        } catch {
            toast.error('Không thể tải lại');
        } finally {
            setIsRefreshing(false);
        }
    };

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
        try { await userApi.signOut(); } catch { }
        authStorage.clear();
        localStorage.removeItem('bypass_user');
        navigate('/login', { replace: true });
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
        <div className="bg-[#FCF9F5] min-h-screen pb-20">
            {/* Header */}
            <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-orange-100/50 px-4 py-4 mb-8">
                <div className="max-w-6xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate(-1)} className="p-2 hover:bg-orange-50 rounded-xl transition-colors">
                            <ArrowLeft className="w-5 h-5 text-[#C76E00]" />
                        </button>
                        <div>
                            <h1 className="text-xl font-black text-gray-900 tracking-tight uppercase italic flex items-center gap-2">
                                <Wallet2 className="w-5 h-5 text-[#C76E00]" />
                                Tài chính
                            </h1>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em] mt-0.5">
                                Quản lý ví & Giao dịch
                            </p>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" className="bg-white shadow-sm border border-orange-100/30 rounded-xl text-red-500 hover:bg-red-50" onClick={handleLogout}>
                        <LogOut className="w-5 h-5" />
                    </Button>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* LEFT COLUMN: Balance & Top-up */}
                    <div className="lg:col-span-5 space-y-8">
                        {/* Premium Balance Card */}
                        <div className="relative overflow-hidden rounded-[2.5rem] bg-slate-900 border border-slate-800 text-white p-8 shadow-2xl shadow-slate-300 group">
                            <div className="relative z-10">
                                <div className="flex justify-between items-center mb-10">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-10 h-10 bg-[#C76E00] rounded-xl flex items-center justify-center shadow-lg shadow-orange-900/40">
                                            <Wallet2 className="w-6 h-6 text-white" />
                                        </div>
                                        <span className="text-[11px] font-black tracking-[0.2em] uppercase text-slate-400 italic">Grab Wallet</span>
                                    </div>
                                    <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 backdrop-blur-md text-[10px] font-black uppercase tracking-widest px-3 py-1">Active</Badge>
                                </div>

                                <div>
                                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] mb-2 opacity-80">Available Balance</p>
                                    <h2 className="text-5xl font-black tracking-tighter flex items-baseline gap-2">
                                        {user?.balance?.toLocaleString() || 0}
                                        <span className="text-2xl font-black text-[#C76E00] underline underline-offset-8">đ</span>
                                    </h2>
                                </div>

                                <div className="mt-10 flex justify-between items-end">
                                    <div className="space-y-1">
                                        <p className="text-[9px] text-slate-500 font-black uppercase tracking-[0.3em] opacity-60">Card Holder</p>
                                        <p className="font-black text-sm tracking-widest uppercase italic text-slate-200">{user?.name || 'VALUED CUSTOMER'}</p>
                                    </div>
                                    <div className="flex -space-x-3 group-hover:space-x-1 transition-all">
                                        <div className="w-10 h-10 rounded-full bg-[#C76E00]/80 backdrop-blur-sm shadow-xl border border-white/5" />
                                        <div className="w-10 h-10 rounded-full bg-yellow-500/60 backdrop-blur-sm shadow-xl border border-white/5" />
                                    </div>
                                </div>
                            </div>
                            {/* Visual Effects */}
                            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-[#C76E00]/10 blur-[100px] group-hover:bg-[#C76E00]/20 transition-colors" />
                            <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 rounded-full bg-blue-600/5 blur-[80px]" />
                        </div>

                        {/* Top-up Section */}
                        <Card className="p-8 bg-white/80 backdrop-blur-xl border border-orange-100/50 shadow-xl shadow-orange-900/5 rounded-[2.5rem] space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-orange-50 rounded-2xl flex items-center justify-center border border-orange-100/50">
                                    <PlusIcon className="w-5 h-5 text-[#C76E00]" />
                                </div>
                                <h3 className="font-black text-gray-900 uppercase tracking-widest italic text-sm">Nạp tiền vào ví</h3>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                {['50000', '100000', '200000', '500000', '1000000', '2000000'].map((val) => (
                                    <button
                                        key={val}
                                        onClick={() => setAmount(val)}
                                        className={cn(
                                            "py-4 rounded-2xl border-2 text-xs font-black transition-all transform active:scale-95 tracking-widest",
                                            amount === val
                                                ? "bg-[#C76E00] border-[#C76E00] text-white shadow-xl shadow-orange-200"
                                                : "bg-orange-50/30 border-orange-100/50 text-gray-400 hover:border-orange-200 hover:bg-white hover:text-[#C76E00]"
                                        )}
                                    >
                                        {parseInt(val) >= 1000000 ? `${parseInt(val) / 1000000}M` : `${parseInt(val) / 1000}K`}
                                    </button>
                                ))}
                            </div>

                            <div className="relative">
                                <div className="absolute left-6 top-1/2 -translate-y-1/2">
                                    <span className="text-gray-400 font-black text-xl italic tracking-tighter">₫</span>
                                </div>
                                <Input
                                    type="number"
                                    placeholder="Nhập số tiền..."
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    className="bg-orange-50/30 border-none rounded-2xl py-8 pl-12 pr-6 text-2xl font-black focus-visible:ring-2 focus-visible:ring-[#C76E00]/20 tracking-tighter placeholder:text-gray-300"
                                />
                            </div>

                            <div className="flex justify-center">
                                {[
                                    { id: 'momo', icon: 'M', color: 'bg-pink-100 text-pink-600', label: 'MoMo' },
                                ].map((method) => (
                                    <button
                                        key={method.id}
                                        className={cn(
                                            "flex flex-col items-center p-6 px-12 rounded-3xl border-2 transition-all group border-[#C76E00] bg-orange-50/50"
                                        )}
                                    >
                                        <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center font-black mb-3 shadow-md transition-transform group-hover:rotate-6", method.color)}>
                                            {method.icon}
                                        </div>
                                        <span className="text-xs font-black text-[#C76E00] uppercase tracking-widest">{method.label}</span>
                                    </button>
                                ))}
                            </div>

                            <Button className="w-full py-8 text-sm font-black uppercase tracking-[0.2em] rounded-2xl bg-[#C76E00] hover:bg-[#A55B00] shadow-xl shadow-orange-200 active:scale-95 transition-all text-white border-b-4 border-[#8B4D00]" onClick={handleTopUp} disabled={!amount}>
                                Tiếp tục thanh toán
                            </Button>
                        </Card>
                    </div>

                    {/* RIGHT COLUMN: Transactions */}
                    <div className="lg:col-span-7 space-y-6">
                        <div className="flex items-center justify-between px-2">
                            <div className="flex items-center gap-2">
                                <div className="w-1 h-4 bg-[#C76E00] rounded-full" />
                                <h2 className="text-sm font-black text-gray-900 uppercase tracking-widest italic">Lịch sử giao dịch</h2>
                            </div>
                            <button
                                onClick={handleRefresh}
                                disabled={isRefreshing}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] text-[#C76E00] font-black uppercase tracking-widest hover:bg-orange-50 transition-colors disabled:opacity-50"
                            >
                                <RefreshCw className={cn("w-3.5 h-3.5", isRefreshing && "animate-spin")} />
                                {isRefreshing ? 'Đang cập nhật' : 'Làm mới'}
                            </button>
                        </div>

                        <div className="space-y-4">
                            {transactions.length === 0 ? (
                                <Card className="p-16 bg-white/80 backdrop-blur-xl border border-orange-100/50 shadow-xl shadow-orange-900/5 flex flex-col items-center justify-center rounded-[2.5rem]">
                                    <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mb-6">
                                        <History className="w-10 h-10 text-orange-200" />
                                    </div>
                                    <p className="text-gray-400 text-xs font-black uppercase tracking-widest">Chưa có giao dịch nào được ghi lại</p>
                                </Card>
                            ) : (
                                transactions.slice(0, 15).map((trx) => {
                                    const credit = isCredit(trx.transactionType);
                                    const statusInfo = TransactionStatusLabel[trx.status] ?? { label: trx.statusName || 'Hoàn thành', color: 'text-gray-400' };
                                    return (
                                        <Card key={trx.id} className="p-5 bg-white/80 backdrop-blur-xl border border-orange-100/50 shadow-xl shadow-orange-900/5 flex items-center justify-between rounded-3xl group transition-all hover:bg-white hover:-translate-y-1">
                                            <div className="flex items-center space-x-5">
                                                <div className={cn(
                                                    "w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner transition-all group-hover:rotate-6",
                                                    credit ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-red-50 text-red-600 border border-red-100"
                                                )}>
                                                    {credit ? <ArrowUp className="w-6 h-6" /> : <ArrowDown className="w-6 h-6" />}
                                                </div>
                                                <div>
                                                    <p className="font-black text-sm text-gray-900 leading-tight uppercase tracking-tight">
                                                        {TransactionTypeName[trx.transactionType] || trx.transactionTypeName || 'Giao dịch'}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-1.5">
                                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                                            {trx.createdAt ? new Date(trx.createdAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}
                                                        </p>
                                                        <span className="w-1 h-1 bg-gray-200 rounded-full" />
                                                        <p className={cn("text-[9px] font-black uppercase tracking-widest italic", statusInfo.color)}>
                                                            {statusInfo.label}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className={cn("font-black text-lg tracking-tighter", credit ? "text-emerald-600" : "text-gray-900")}>
                                                    {credit ? '+' : '-'}{(trx.amount || 0).toLocaleString()} <span className="text-[10px] ml-0.5">₫</span>
                                                </p>
                                                <p className="text-[9px] font-bold text-gray-300 uppercase tracking-widest mt-0.5 italic">ID: #{trx.id.toString().slice(-6)}</p>
                                            </div>
                                        </Card>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
