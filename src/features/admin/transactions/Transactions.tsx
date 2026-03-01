import { useState, useEffect } from 'react';
import { Search, ArrowUpRight, ArrowDownLeft, Loader2 } from 'lucide-react';
import { walletApi } from '../../../api/api';
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

  const isCredit = (type: number) => [TransactionType.Deposit, TransactionType.Refund, TransactionType.Bonus].includes(type);

  const filteredTransactions = transactions.filter(t =>
    String(t.id).includes(searchTerm) ||
    (TransactionTypeName[t.transactionType] || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Breadcrumb */}
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Lịch sử giao dịch</h2>
        <p className="text-sm text-gray-500">Xem tất cả giao dịch ví trên hệ thống</p>
      </div>

      {/* Search */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white dark:bg-[#1d140c] p-4 rounded-xl border border-[#eadbcd] dark:border-[#3d2d1e]">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 dark:text-gray-400 w-5 h-5" />
          <input
            className="w-full pl-11 pr-4 py-2.5 rounded-lg border border-[#eadbcd] dark:border-[#3d2d1e] dark:bg-[#23190f] text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-orange-600/50 focus:border-orange-600 placeholder:text-gray-500/60"
            placeholder="Tìm theo ID hoặc loại..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Transaction History Table */}
      <div className="bg-white dark:bg-[#1d140c] rounded-xl border border-[#eadbcd] dark:border-[#3d2d1e] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-100 dark:bg-[#23190f] border-b border-[#eadbcd] dark:border-[#3d2d1e]">
              <tr>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-500">ID</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-500">Loại</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-500">Số tiền</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-500">Trước GD</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-500">Sau GD</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-500">Thời gian</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-500">Mô tả</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eadbcd] dark:divide-[#3d2d1e]">
              {loading ? (
                <tr><td colSpan={7} className="px-6 py-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-orange-500" /></td></tr>
              ) : filteredTransactions.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-500">Không có giao dịch nào</td></tr>
              ) : (
                filteredTransactions.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-[#23190f] transition-colors">
                    <td className="px-6 py-4 text-sm font-medium font-mono text-gray-900 dark:text-white">
                      #{typeof t.id === 'string' ? t.id.slice(-8) : t.id}
                    </td>
                    <td className="px-6 py-4">
                      <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full w-fit font-bold text-xs ${isCredit(t.transactionType)
                        ? 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400'
                        : 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400'
                        }`}>
                        {isCredit(t.transactionType) ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownLeft className="w-4 h-4" />}
                        {TransactionTypeName[t.transactionType] || 'Khác'}
                      </div>
                    </td>
                    <td className={`px-6 py-4 text-sm font-bold ${isCredit(t.transactionType) ? 'text-green-600' : 'text-red-600'}`}>
                      {isCredit(t.transactionType) ? '+' : '-'}{(t.amount || 0).toLocaleString()}đ
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{(t.balanceBefore || 0).toLocaleString()}đ</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{(t.balanceAfter || 0).toLocaleString()}đ</td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {t.createdAt ? new Date(t.createdAt).toLocaleString('vi-VN') : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 max-w-[200px] truncate">
                      {t.description || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[#eadbcd] dark:border-[#3d2d1e]">
          <p className="text-sm text-gray-500">Trang {page}</p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-2 rounded-lg border border-[#eadbcd] dark:border-[#3d2d1e] hover:bg-gray-100 dark:hover:bg-[#23190f] disabled:opacity-50"
            >
              Trước
            </button>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={filteredTransactions.length < pageSize}
              className="px-3 py-2 rounded-lg border border-[#eadbcd] dark:border-[#3d2d1e] hover:bg-gray-100 dark:hover:bg-[#23190f] disabled:opacity-50"
            >
              Sau
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Transactions;
