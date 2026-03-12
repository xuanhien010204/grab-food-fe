import { useState, useEffect } from 'react';
import { Search, ArrowUpRight, ArrowDownLeft, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { walletApi } from '../../../api/api';
import { cn } from '../../../lib/utils';
import { TransactionType } from '../../../types/swagger';
import type { WalletTransactionDto } from '../../../types/swagger';

const TransactionTypeName: Record<number, string> = {
    1: 'Nạp tiền',
    2: 'Thanh toán',
    3: 'Hoàn tiền',
    4: 'Rút tiền',
    5: 'Thưởng',
};

const Transactions = () => {
    const [transactions, setTransactions] = useState<WalletTransactionDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(1);
    const pageSize = 20;

    useEffect(() => {
        const fetchTransactions = async () => {
            try {
                setLoading(true);
                const res = await walletApi.getTransactions({ pageNumber: page, pageSize });
                const data = res.data as any;
                const list = Array.isArray(data) ? data : Array.isArray(data?.transactions) ? data.transactions : [];
                setTransactions(list);
            } catch {
                console.error('Failed to fetch transactions');
            } finally {
                setLoading(false);
            }
        };
        fetchTransactions();
    }, [page]);

    const isCredit = (type: number) =>
        [TransactionType.Deposit, TransactionType.Refund, TransactionType.Bonus].includes(type);

    const filteredTransactions = transactions.filter(
        (t) =>
            String(t.id).includes(searchTerm) ||
            (TransactionTypeName[t.transactionType] || '')
                .toLowerCase()
                .includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header & Search */}
            <div className="bg-white/50 backdrop-blur-md p-6 rounded-2xl border border-orange-100/50 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="border-l-4 border-[#C76E00] pl-4">
                    <h1 className="text-3xl font-black text-charcoal tracking-tighter uppercase italic">Lịch sử giao dịch</h1>
                    <p className="text-[10px] font-black text-charcoal/40 uppercase tracking-[0.2em] mt-1">
                        Theo dõi toàn bộ biến động số dư hệ thống
                    </p>
                </div>

                <div className="relative w-full md:w-96 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal/20 group-focus-within:text-[#C76E00] transition-colors" />
                    <input
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Tìm theo ID hoặc loại..."
                        className="w-full pl-12 pr-6 py-3.5 bg-white border-2 border-orange-100/50 rounded-2xl focus:border-[#C76E00] focus:ring-4 focus:ring-[#C76E00]/10 outline-none transition-all font-bold text-sm"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="bg-white border border-orange-100/50 rounded-[2.5rem] shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-cream/50 border-b border-orange-50">
                                <th className="px-8 py-6 text-left text-[10px] font-black text-charcoal/40 uppercase tracking-widest">ID Giao dịch</th>
                                <th className="px-8 py-6 text-left text-[10px] font-black text-charcoal/40 uppercase tracking-widest">Loại</th>
                                <th className="px-8 py-6 text-left text-[10px] font-black text-charcoal/40 uppercase tracking-widest">Số tiền</th>
                                <th className="px-8 py-6 text-left text-[10px] font-black text-charcoal/40 uppercase tracking-widest">Biến động số dư</th>
                                <th className="px-8 py-6 text-left text-[10px] font-black text-charcoal/40 uppercase tracking-widest">Thời gian</th>
                                <th className="px-8 py-6 text-left text-[10px] font-black text-charcoal/40 uppercase tracking-widest">Mô tả</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-orange-50">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="py-20 text-center">
                                        <Loader2 className="w-10 h-10 animate-spin text-[#C76E00] mx-auto" />
                                        <p className="text-[10px] font-black text-charcoal/30 uppercase tracking-[0.2em] mt-4">Đang tải dữ liệu...</p>
                                    </td>
                                </tr>
                            ) : filteredTransactions.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-20 text-center">
                                        <div className="text-[10px] font-black text-charcoal/20 uppercase tracking-widest">Không có giao dịch nào được tìm thấy</div>
                                    </td>
                                </tr>
                            ) : (
                                filteredTransactions.map((t) => (
                                    <tr key={t.id} className="group hover:bg-orange-50/30 transition-all">
                                        <td className="px-8 py-6">
                                            <span className="font-mono text-xs font-bold text-charcoal/60 bg-charcoal/5 px-3 py-1.5 rounded-lg group-hover:bg-[#C76E00]/10 group-hover:text-[#C76E00] transition-colors">
                                                #{typeof t.id === 'string' ? t.id.slice(-8).toUpperCase() : t.id}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className={cn(
                                                "inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm",
                                                isCredit(t.transactionType) 
                                                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                                    : 'bg-rose-50 text-rose-600 border border-rose-100'
                                            )}>
                                                {isCredit(t.transactionType) ? (
                                                    <ArrowUpRight className="w-3 h-3" />
                                                ) : (
                                                    <ArrowDownLeft className="w-3 h-3" />
                                                )}
                                                {TransactionTypeName[t.transactionType] || 'Khác'}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className={cn(
                                                "text-lg font-black tracking-tighter italic",
                                                isCredit(t.transactionType) ? 'text-emerald-500' : 'text-rose-500'
                                            )}>
                                                {isCredit(t.transactionType) ? '+' : '-'}{(t.amount || 0).toLocaleString()}đ
                                            </span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col gap-1">
                                                <div className="text-[10px] font-bold text-charcoal/30 uppercase tracking-widest">
                                                    Trước: <span className="text-charcoal/60">{(t.balanceBefore || 0).toLocaleString()}đ</span>
                                                </div>
                                                <div className="text-[10px] font-black text-charcoal/60 uppercase tracking-widest flex items-center gap-2">
                                                    Sau: <span className="text-[#C76E00]">{(t.balanceAfter || 0).toLocaleString()}đ</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="text-xs font-bold text-charcoal/60 italic">
                                                {t.createdAt ? new Date(t.createdAt).toLocaleString('vi-VN') : '-'}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="text-xs font-bold text-charcoal/40 italic max-w-xs truncate group-hover:text-charcoal group-hover:whitespace-normal transition-all">
                                                {t.description || 'Không có mô tả'}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="p-8 border-t border-orange-50 bg-cream/20 flex items-center justify-between">
                    <p className="text-[10px] font-black text-charcoal/40 uppercase tracking-widest">
                        Trang <span className="text-[#C76E00] text-sm">{page}</span> hiển thị tối đa {pageSize} dòng
                    </p>
                    <div className="flex gap-4">
                        <button
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="p-3 bg-white border-2 border-orange-100 rounded-2xl text-charcoal/40 hover:text-[#C76E00] hover:border-[#C76E00] disabled:opacity-30 disabled:hover:border-orange-100 disabled:hover:text-charcoal/40 transition-all active:scale-95"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => setPage((p) => p + 1)}
                            disabled={filteredTransactions.length < pageSize}
                            className="p-3 bg-white border-2 border-orange-100 rounded-2xl text-charcoal/40 hover:text-[#C76E00] hover:border-[#C76E00] disabled:opacity-30 disabled:hover:border-orange-100 disabled:hover:text-charcoal/40 transition-all active:scale-95"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Transactions;