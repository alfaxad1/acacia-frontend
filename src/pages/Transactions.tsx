import React, { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Search } from "lucide-react";
import { transactionsApi } from "../services/api";
import { formatCurrency, formatDate } from "../utils/format";
import { LoadingSpinner } from "../components/LoadingSpinner";
import Pagination from "../components/Pagination";

interface TransactionSummary {
  uniqueId: string;
  originalId: number;
  amount: number;
  status: string;
  createdAt: string;
  category: string;
  reference: string;
  description: string;
  loanId?: number;
  memberId?: number;
  memberName?: string;
}

export default function Transactions() {
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(15);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [transactions, setTransactions] = useState<TransactionSummary[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(0);
    }, 500);
    return () => clearTimeout(handler);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await transactionsApi.getAll(page, size, debouncedSearch);
      setTransactions(data.content ?? []);
      setTotalPages(Math.max(data.totalPages ?? 1, 1));
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Could not load transactions");
    } finally {
      setLoading(false);
    }
  }, [page, size, debouncedSearch]);

  useEffect(() => {
    load();
  }, [load]);

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case "COMPLETED":
        return "bg-emerald-100 text-emerald-700";
      case "PENDING":
        return "bg-amber-100 text-amber-700";
      case "FAILED":
        return "bg-rose-100 text-rose-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="space-y-4 md:space-y-6 max-w-7xl mx-auto px-2 sm:px-4 md:px-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">All Transactions</h1>
          <p className="text-xs md:text-sm text-gray-500">
            A detailed view of all transactions across the system.
          </p>
        </div>
        <div className="relative w-full sm:w-64">
          <input
            type="text"
            placeholder="Search by name or reference..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm"
          />
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8">
            <LoadingSpinner />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 text-xs uppercase font-medium">
                <tr>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Reference</th>
                  <th className="px-6 py-4">Member</th>
                  <th className="px-6 py-4">Description</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {transactions.map((tx) => (
                  <tr key={tx.uniqueId} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 text-gray-500">
                      {formatDate(tx.createdAt)}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs">
                      {tx.reference || "-"}
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {tx.memberName || "System"}
                    </td>
                    <td className="px-6 py-4 text-gray-600 truncate max-w-[200px]" title={tx.description}>
                      {tx.description || "-"}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {tx.category?.replace("_", " ")}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(tx.status)}`}>
                        {tx.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-900 text-right">
                      {formatCurrency(tx.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {transactions.length === 0 && (
              <div className="text-center p-8 text-gray-500">
                No transactions found.
              </div>
            )}
          </div>
        )}

        <div className="border-t border-gray-100">
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>
      </div>
    </div>
  );
}
