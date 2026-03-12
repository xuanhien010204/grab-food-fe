import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle2, XCircle, Loader2, Wallet, Home } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { walletApi } from '../../../api/api';
import { toast } from 'sonner';

export default function PaymentResultPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [isVerifying, setIsVerifying] = useState(true);
    const [verified, setVerified] = useState(false);

    const resultCode = searchParams.get('resultCode');
    const amount = searchParams.get('amount');
    const orderId = searchParams.get('orderId');
    const transId = searchParams.get('transId');
    const message = searchParams.get('message');

    const isSuccess = resultCode === '0';

    useEffect(() => {
        // Notify backend to confirm the transaction
        if (orderId && resultCode) {
            walletApi.momoReturn({ orderId, resultCode: Number(resultCode), message: message || '', amount: Number(amount || 0) })
                .catch(() => { /* backend may have already processed via IPN */ })
                .finally(() => {
                    setVerified(true);
                    setIsVerifying(false);
                    if (isSuccess) {
                        toast.success('Nạp tiền thành công!');
                    } else {
                        toast.error('Giao dịch thất bại hoặc bị huỷ');
                    }
                });
        } else {
            setIsVerifying(false);
            setVerified(true);
        }
    }, []);

    if (isVerifying) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-12 h-12 text-orange-500 animate-spin" />
                <p className="text-gray-500 font-medium">Đang xác nhận giao dịch...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
            <div className="bg-white rounded-3xl shadow-xl p-8 max-w-sm w-full flex flex-col items-center gap-6 text-center">

                {/* Icon */}
                {isSuccess ? (
                    <div className="w-24 h-24 rounded-full bg-green-50 flex items-center justify-center">
                        <CheckCircle2 className="w-14 h-14 text-green-500" />
                    </div>
                ) : (
                    <div className="w-24 h-24 rounded-full bg-red-50 flex items-center justify-center">
                        <XCircle className="w-14 h-14 text-red-500" />
                    </div>
                )}

                {/* Title */}
                <div>
                    <h1 className="text-2xl font-black text-gray-900">
                        {isSuccess ? 'Nạp tiền thành công!' : 'Giao dịch thất bại'}
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        {isSuccess
                            ? 'Số dư ví của bạn đã được cập nhật'
                            : (message || 'Giao dịch không thành công hoặc đã bị huỷ')}
                    </p>
                </div>

                {/* Amount */}
                {amount && (
                    <div className={`w-full rounded-2xl p-4 ${isSuccess ? 'bg-green-50' : 'bg-red-50'}`}>
                        <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Số tiền</p>
                        <p className={`text-3xl font-black ${isSuccess ? 'text-green-600' : 'text-red-500'}`}>
                            {Number(amount).toLocaleString('vi-VN')}đ
                        </p>
                    </div>
                )}

                {/* Transaction info */}
                {verified && (orderId || transId) && (
                    <div className="w-full bg-gray-50 rounded-2xl p-4 text-left space-y-2">
                        {orderId && (
                            <div className="flex justify-between text-xs">
                                <span className="text-gray-400 font-medium">Mã đơn</span>
                                <span className="text-gray-700 font-bold truncate ml-4 max-w-[160px]">{orderId.split('_').pop()}</span>
                            </div>
                        )}
                        {transId && (
                            <div className="flex justify-between text-xs">
                                <span className="text-gray-400 font-medium">Mã GD MoMo</span>
                                <span className="text-gray-700 font-bold">{transId}</span>
                            </div>
                        )}
                        <div className="flex justify-between text-xs">
                            <span className="text-gray-400 font-medium">Trạng thái</span>
                            <span className={`font-bold ${isSuccess ? 'text-green-600' : 'text-red-500'}`}>
                                {isSuccess ? 'Thành công' : 'Thất bại'}
                            </span>
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="w-full flex flex-col gap-3">
                    <Button
                        className="w-full rounded-2xl py-4 font-bold shadow-lg shadow-orange-100"
                        onClick={() => navigate('/wallet?refreshed=1')}
                    >
                        <Wallet className="w-4 h-4 mr-2" />
                        Về ví của tôi
                    </Button>
                    <Button
                        variant="outline"
                        className="w-full rounded-2xl py-4 font-bold border-gray-200"
                        onClick={() => {
                            const role = localStorage.getItem('roleName');
                            if (role === 'Admin') navigate('/admin');
                            else if (role === 'Manager') navigate('/manager');
                            else navigate('/');
                        }}
                    >
                        <Home className="w-4 h-4 mr-2" />
                        Về trang chủ
                    </Button>
                </div>
            </div>
        </div>
    );
}
