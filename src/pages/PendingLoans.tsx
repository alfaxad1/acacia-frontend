import React, { useState } from "react";
import toast from "react-hot-toast";
import { Check, X, Plus, DollarSign } from "lucide-react";
import { loansApi } from "../services/api";
import { useApi } from "../hooks/useApi";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { ErrorMessage } from "../components/ErrorMessage";
import { Loan, LoanStatus, VoteDecision } from "../types";
import { Modal } from "../components/Modal";
import { Table } from "../components/Table";
import { formatCurrency, formatDate } from "../utils/format";

const PendingLoans: React.FC = () => {
  const {
    data: loans,
    loading,
    error,
    refetch,
  } = useApi(() => loansApi.getAll(LoanStatus.PENDING));

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [amount, setAmount] = useState<number>(0);

  const currentMemberId = Number(localStorage.getItem("memberId"));

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) return toast.error("Please enter a valid amount");

    setSubmitting(true);
    try {
      await loansApi.request({ memberId: currentMemberId, amount });
      toast.success("Loan request submitted successfully");
      setIsModalOpen(false);
      setAmount(0);
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Request failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleVote = async (loanId: number, decision: VoteDecision) => {
    const votePromise = loansApi.vote(loanId, currentMemberId, decision);
    await toast.promise(votePromise, {
      loading: "Processing...",
      success: `Loan ${decision.toLowerCase()}ed!`,
      error: (err) => {
        return (
          err?.response?.data?.message ||
          err?.message ||
          "An unexpected error occurred"
        );
      },
    });

    refetch();
  };

  const columns = [
    {
      key: "member",
      header: "Member",
      render: (loan: Loan) => (
        <div className="flex items-center">
          <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs mr-3">
            {loan.memberName.charAt(0)}
          </div>
          <span className="font-medium text-gray-900">{loan.memberName}</span>
        </div>
      ),
    },
    {
      key: "amount",
      header: "Requested Amount",
      render: (loan: Loan) => (
        <span className="font-semibold text-gray-900">
          {formatCurrency(loan.requestedAmount)}
        </span>
      ),
    },
    {
      key: "eligible-amount",
      header: "Eligible Amount",
      render: (loan: Loan) => (
        <span className="font-semibold text-gray-900">
          {formatCurrency(loan.eligibleAmount)}
        </span>
      ),
    },
    {
      key: "date",
      header: "Date Requested",
      render: (loan: Loan) => (
        <div className="flex items-center text-gray-500">
          {formatDate(loan.requestDate)}
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (loan: Loan) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 capitalize">
          {loan.status.toLowerCase()}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Decisions",
      render: (loan: Loan) => (
        <div className="flex gap-2">
          <button
            onClick={() => handleVote(loan.id, VoteDecision.APPROVE)}
            className="p-1.5 bg-white border border-green-200 text-green-600 rounded-lg hover:bg-green-50 transition-colors shadow-sm"
            title="Approve"
          >
            <Check size={18} />
          </button>
          <button
            onClick={() => handleVote(loan.id, VoteDecision.REJECT)}
            className="p-1.5 bg-white border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors shadow-sm"
            title="Reject"
          >
            <X size={18} />
          </button>
        </div>
      ),
    },
  ];

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} onRetry={refetch} />;

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
            Pending Loan Requests
          </h1>
          <p className="text-gray-500 mt-1">
            Review and manage incoming credit applications from members.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg active:scale-95"
        >
          <Plus size={20} />
          New Request
        </button>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <Table columns={columns} data={loans || []} />
      </div>

      {/* Compact Request Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Request Loan"
      >
        <form onSubmit={handleRequestSubmit} className="p-1">
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              How much do you need?
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <DollarSign size={18} />
              </div>
              <input
                type="number"
                required
                autoFocus
                min="1"
                step="0.01"
                placeholder="0.00"
                value={amount || ""}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="block w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-lg font-medium"
              />
            </div>
            <p className="mt-2 text-xs text-gray-400">
              The request will be sent to the members for immediate review.
            </p>
          </div>

          <div className="flex gap-3 mt-8">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="flex-1 px-4 py-2.5 text-gray-600 font-medium hover:bg-gray-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-[2] px-4 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 disabled:opacity-50 shadow-sm"
            >
              {submitting ? "Sending..." : "Submit Request"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default PendingLoans;
