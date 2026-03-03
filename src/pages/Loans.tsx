import { useState, useEffect } from "react";
import { Table } from "../components/Table";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { ErrorMessage } from "../components/ErrorMessage";
import { useApi } from "../hooks/useApi";
import { loansApi } from "../services/api";
import { formatCurrency, formatDate, getStatusColor } from "../utils/format";
import { LoanStatus, type Loan } from "../types";
import { Banknote, X, Loader2, CheckCircle2, Clock } from "lucide-react";
import { toast } from "react-hot-toast";
import axios from "axios";
import { API_URL } from "../config/constant";

export function Loans() {
  const [activeTab, setActiveTab] = useState<LoanStatus>(LoanStatus.DISBURSED);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [repayAmount, setRepayAmount] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initial hook setup
  const {
    data: loans,
    loading,
    error,
    refetch,
  } = useApi(() => loansApi.getAll(activeTab));

  // --- THE FIX ---
  // Since useApi doesn't watch 'activeTab', we manually trigger refetch here.
  useEffect(() => {
    refetch();
    // We only want this to run when activeTab changes.
    // If refetch is not memoized in the hook, including it here might cause 
    // a loop, so we only track activeTab.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);
  // ----------------

  const handleOpenModal = (loan: Loan) => {
    setSelectedLoan(loan);
    setRepayAmount("");
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedLoan(null);
    setRepayAmount("");
  };

  const handleRepaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLoan || !repayAmount) return;

    setIsSubmitting(true);
    try {
      await axios.post(`${API_URL}/loan/repay`, {
        loanId: selectedLoan.id,
        amount: Number(repayAmount),
      });

      toast.success("Repayment recorded successfully");
      refetch(); // Refresh data after payment
      handleCloseModal();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to process repayment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns = [
    {
      key: "member",
      header: "Member",
      render: (loan: Loan) => (
        <div className="py-1">
          <div className="font-bold text-gray-900">{loan.memberName}</div>
          <div className="text-[10px] font-medium text-gray-400 uppercase tracking-tight">
            {loan.memberNo}
          </div>
        </div>
      ),
    },
    {
      key: "amount",
      header: "Financials",
      render: (loan: Loan) => (
        <div>
          <div className="font-bold text-gray-900">
            {formatCurrency(loan.approvedAmount || loan.requestedAmount)}
          </div>
          <div className="text-[10px] text-gray-500 font-medium">
            Balance:{" "}
            {formatCurrency(
              (loan.approvedAmount || 0) - (loan.paidAmount || 0)
            )}
          </div>
        </div>
      ),
    },
    {
      key: "dates",
      header: "Schedule",
      render: (loan: Loan) => (
        <div className="text-xs">
          <div className="text-gray-500">
            Disbursed: {formatDate(loan.requestDate)}
          </div>
          {loan.dueDate && (
            <div
              className={`font-bold mt-0.5 ${
                activeTab === LoanStatus.DISBURSED
                  ? "text-amber-600"
                  : "text-gray-400"
              }`}
            >
              Due: {formatDate(loan.dueDate)}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (loan: Loan) => (
        <span
          className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${getStatusColor(
            loan.status
          )} shadow-sm border border-black/5`}
        >
          {loan.status}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      render: (loan: Loan) => (
        <div className="flex justify-end">
          {activeTab === LoanStatus.DISBURSED ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleOpenModal(loan);
              }}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-lg shadow-emerald-100 active:scale-95"
            >
              <Banknote size={14} />
              Repay
            </button>
          ) : (
            <div className="text-emerald-500 p-2 bg-emerald-50 rounded-full">
              <CheckCircle2 size={20} />
            </div>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">
            Loan Portfolio
          </h1>
          <p className="text-sm text-gray-500 font-medium tracking-wide">
            Monitoring active credit and settled repayments
          </p>
        </div>
      </div>

      {/* Tab Toggles */}
      <div className="inline-flex p-1.5 bg-gray-100/80 rounded-2xl border border-gray-200 shadow-inner">
        <button
          onClick={() => setActiveTab(LoanStatus.DISBURSED)}
          className={`flex items-center gap-2 px-8 py-2.5 rounded-xl text-sm font-bold transition-all ${
            activeTab === LoanStatus.DISBURSED
              ? "bg-white text-blue-600 shadow-md ring-1 ring-black/5"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <Clock size={16} />
          Active Loans
        </button>
        <button
          onClick={() => setActiveTab(LoanStatus.REPAID)}
          className={`flex items-center gap-2 px-8 py-2.5 rounded-xl text-sm font-bold transition-all ${
            activeTab === LoanStatus.REPAID
              ? "bg-white text-emerald-600 shadow-md ring-1 ring-black/5"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <CheckCircle2 size={16} />
          Settled
        </button>
      </div>

      {/* Table Section */}
      {loading ? (
        <div className="h-64 flex items-center justify-center bg-white rounded-3xl border border-dashed border-gray-200">
          <LoadingSpinner />
        </div>
      ) : error ? (
        <ErrorMessage message={error} onRetry={refetch} />
      ) : (
        <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
          <Table columns={columns} data={loans || []} />
          {loans?.length === 0 && (
            <div className="p-20 text-center flex flex-col items-center gap-3">
              <div className="p-4 bg-gray-50 rounded-full text-gray-300">
                <Banknote size={40} />
              </div>
              <p className="text-gray-400 font-medium text-center">
                No {activeTab.toLowerCase()} loans found.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Modal - Kept exactly as provided */}
      {isModalOpen && selectedLoan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b flex justify-between items-center bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 text-green-600 rounded-lg">
                  <Banknote size={20} />
                </div>
                <h3 className="font-bold text-gray-900 text-lg">Record Repayment</h3>
              </div>
              <button onClick={handleCloseModal} className="p-2 hover:bg-gray-200 rounded-full">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleRepaySubmit} className="p-6 space-y-5">
              <div className="p-5 bg-blue-50/50 rounded-2xl border border-blue-100">
                <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1">Target Account</p>
                <p className="font-black text-blue-900 text-lg">{selectedLoan.memberName}</p>
                <div className="mt-3 pt-3 border-t border-blue-100 flex justify-between items-center">
                  <span className="text-xs font-bold text-blue-700">Outstanding Balance:</span>
                  <span className="text-lg font-black text-blue-900 font-mono">
                    {formatCurrency((selectedLoan.approvedAmount || 0) - (selectedLoan.paidAmount || 0))}
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Payment Amount (KSH)</label>
                <input
                  autoFocus
                  type="number"
                  required
                  min="1"
                  value={repayAmount}
                  onChange={(e) => setRepayAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full p-5 bg-gray-50 border-2 border-transparent rounded-2xl outline-none focus:border-emerald-500 focus:bg-white font-black text-2xl transition-all font-mono"
                />
              </div>
              <div className="flex gap-4 pt-2">
                <button type="button" onClick={handleCloseModal} className="flex-1 py-4 font-bold text-gray-500 hover:bg-gray-100 rounded-2xl transition-all">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl shadow-xl shadow-emerald-200 flex items-center justify-center gap-2 transition-all active:scale-95">
                  {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : "Record Payment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}