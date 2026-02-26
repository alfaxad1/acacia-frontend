import { useState } from "react";
import { Table } from "../components/Table";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { ErrorMessage } from "../components/ErrorMessage";
import { useApi } from "../hooks/useApi";
import { loansApi } from "../services/api";
import { formatCurrency, formatDate, getStatusColor } from "../utils/format";
import { LoanStatus, type Loan } from "../types";
import { Banknote, X, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";
import axios from "axios";
import { API_URL } from "../config/constant";

export function Loans() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [repayAmount, setRepayAmount] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    data: loans,
    loading,
    error,
    refetch,
  } = useApi(() => loansApi.getAll(LoanStatus.DISBURSED));

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
      refetch(); // Refresh the table data
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
        <div>
          <div className="font-medium">{loan.memberName}</div>
          <div className="text-xs text-gray-500">{loan.memberNo}</div>
        </div>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      render: (loan: Loan) => (
        <div>
          <div className="font-bold text-gray-900">
            {formatCurrency(loan.approvedAmount || loan.requestedAmount)}
          </div>
          <div className="text-xs text-gray-500">
            Paid: {formatCurrency(loan.paidAmount || 0)}
          </div>
        </div>
      ),
    },
    {
      key: "dates",
      header: "Dates",
      render: (loan: Loan) => (
        <div className="text-sm">
          <div>Requested: {formatDate(loan.requestDate)}</div>
          {loan.dueDate && (
            <div className="text-xs text-red-500 font-medium">
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
          className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${getStatusColor(
            loan.status
          )}`}
        >
          {loan.status}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (loan: Loan) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleOpenModal(loan);
          }}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95"
        >
          <Banknote size={14} />
          Repay
        </button>
      ),
    },
  ];

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} onRetry={refetch} />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-gray-900">Active Loans</h1>
          <p className="text-sm text-gray-500">
            Manage disbursements and record member repayments
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <Table columns={columns} data={loans || []} />
      </div>

      {/* Repayment Modal */}
      {isModalOpen && selectedLoan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
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
              <div className="p-4 bg-blue-50 rounded-2xl">
                <p className="text-[10px] font-bold text-blue-500 uppercase">Member</p>
                <p className="font-bold text-blue-900">{selectedLoan.memberName}</p>
                <div className="mt-2 pt-2 border-t border-blue-100 flex justify-between">
                  <span className="text-xs text-blue-700">Remaining Balance:</span>
                  <span className="text-xs font-black text-blue-900">
                    {formatCurrency((selectedLoan.approvedAmount || 0) - (selectedLoan.paidAmount || 0))}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase">Repayment Amount (KSH)</label>
                <input
                  autoFocus
                  type="number"
                  required
                  min="1"
                  value={repayAmount}
                  onChange={(e) => setRepayAmount(e.target.value)}
                  placeholder="Enter amount paid"
                  className="w-full p-4 border-2 border-gray-100 rounded-2xl outline-none focus:border-green-500 font-bold text-lg transition-all"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 py-3 font-bold text-gray-500 hover:bg-gray-100 rounded-2xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-2xl shadow-lg shadow-green-100 flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : "Record Payment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}