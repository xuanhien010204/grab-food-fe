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
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Lịch sử giao dịch
        </h1>
        <p className="text-sm text-gray-500">
          Xem toàn bộ giao dịch ví trên hệ thống
        </p>
      </div>

      {/* Search */}
      <div className="bg-white border border-[#FED7AA] rounded-2xl p-5 shadow-sm">

        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />

          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm ID hoặc loại giao dịch..."
            className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-[#FED7AA] bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>

      </div>

      {/* Table */}
      <div className="bg-white border border-[#FED7AA] rounded-2xl shadow-sm overflow-hidden">

        <div className="overflow-x-auto">

          <table className="w-full text-sm">

            <thead className="bg-[#FFF7ED] border-b border-[#FED7AA]">
              <tr className="text-xs uppercase text-gray-500 tracking-wider">
                <th className="px-6 py-4 text-left">ID</th>
                <th className="px-6 py-4 text-left">Loại</th>
                <th className="px-6 py-4 text-left">Số tiền</th>
                <th className="px-6 py-4 text-left">Trước GD</th>
                <th className="px-6 py-4 text-left">Sau GD</th>
                <th className="px-6 py-4 text-left">Thời gian</th>
                <th className="px-6 py-4 text-left">Mô tả</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#FED7AA]">

              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12">
                    <div className="flex justify-center">
                      <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
                    </div>
                  </td>
                </tr>
              ) : filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-500">
                    Không có giao dịch nào
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((t) => (
                  <tr
                    key={t.id}
                    className="hover:bg-[#FFF7ED] transition"
                  >

                    <td className="px-6 py-4 font-mono text-gray-900">
                      #{typeof t.id === 'string' ? t.id.slice(-8) : t.id}
                    </td>

                    <td className="px-6 py-4">

                      <span
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold
                        ${
                          isCredit(t.transactionType)
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {isCredit(t.transactionType) ? (
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        ) : (
                          <ArrowDownLeft className="w-3.5 h-3.5" />
                        )}

                        {TransactionTypeName[t.transactionType] || 'Khác'}
                      </span>

                    </td>

                    <td
                      className={`px-6 py-4 font-semibold ${
                        isCredit(t.transactionType)
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}
                    >
                      {isCredit(t.transactionType) ? '+' : '-'}
                      {(t.amount || 0).toLocaleString()}đ
                    </td>

                    <td className="px-6 py-4 text-gray-500">
                      {(t.balanceBefore || 0).toLocaleString()}đ
                    </td>

                    <td className="px-6 py-4 text-gray-500">
                      {(t.balanceAfter || 0).toLocaleString()}đ
                    </td>

                    <td className="px-6 py-4 text-gray-500">
                      {t.createdAt
                        ? new Date(t.createdAt).toLocaleString('vi-VN')
                        : '-'}
                    </td>

                    <td className="px-6 py-4 text-gray-500 max-w-[220px] truncate">
                      {t.description || '-'}
                    </td>

                  </tr>
                ))
              )}

            </tbody>

          </table>

        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[#FED7AA]">

          <span className="text-sm text-gray-500">
            Trang {page}
          </span>

          <div className="flex gap-2">

            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 text-sm rounded-lg border border-[#FED7AA] hover:bg-[#FFF7ED] disabled:opacity-40"
            >
              Trước
            </button>

            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={filteredTransactions.length < pageSize}
              className="px-4 py-2 text-sm rounded-lg border border-[#FED7AA] hover:bg-[#FFF7ED] disabled:opacity-40"
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