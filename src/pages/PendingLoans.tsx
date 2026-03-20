import React, { useState } from "react";
import toast from "react-hot-toast";
import { Check, X, Plus, DollarSign, AlertCircle, ChevronRight } from "lucide-react";
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
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);

  const [confirmVote, setConfirmVote] = useState<{
    id: number;
    decision: VoteDecision;
  } | null>(null);

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

  const processVote = async () => {
    if (!confirmVote) return;

    const { id, decision } = confirmVote;
    setConfirmVote(null); // Close dialog immediately

    const votePromise = loansApi.vote(id, currentMemberId, decision);

    await toast.promise(votePromise, {
      loading: "Processing vote...",
      success: `Loan ${decision.toLowerCase()}ed!`,
      error: (err) =>
        err?.response?.data?.message ||
        err?.message ||
        "An unexpected error occurred",
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
            {loan.memberName?.charAt(0) || "?"}
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
        <div className="text-gray-500">{formatDate(loan.requestDate)}</div>
      ),
    },
    {
      key: "actions",
      header: "Decisions",
      render: (loan: Loan) => {
        const hasVoted = loan.memberId === currentMemberId;
        const isOwnLoan = loan.memberId === currentMemberId;

        if (hasVoted || isOwnLoan) {
          return (
            <span className="text-xs font-medium text-gray-400 italic">
              {isOwnLoan ? "Your Request" : "Vote Recorded"}
            </span>
          );
        }

        return (
          <div className="flex gap-2">
            <button
              onClick={() =>
                setConfirmVote({ id: loan.id, decision: VoteDecision.APPROVE })
              }
              className="p-1.5 bg-white border border-green-200 text-green-600 rounded-lg hover:bg-green-50 transition-colors shadow-sm"
              title="Approve"
            >
              <Check size={18} />
            </button>
            <button
              onClick={() =>
                setConfirmVote({ id: loan.id, decision: VoteDecision.REJECT })
              }
              className="p-1.5 bg-white border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors shadow-sm"
              title="Reject"
            >
              <X size={18} />
            </button>
          </div>
        );
      },
    },
  ];

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} onRetry={refetch} />;

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-4 md:px-6 py-4 md:py-6">
      {/* Header Section - Mobile Optimized */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 md:mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight">
            Pending Loan Requests
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Review and manage incoming credit applications.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-3 sm:py-2.5 bg-indigo-600 text-white text-sm sm:text-base font-semibold rounded-xl hover:bg-indigo-700 transition-all shadow-md active:scale-95 w-full sm:w-auto"
        >
          <Plus size={18} className="sm:w-5 sm:h-5" />
          New Request
        </button>
      </div>

      {/* Summary Card - Mobile Only */}
      <div className="block sm:hidden mb-4">
        <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100">
          <p className="text-xs text-indigo-600 font-semibold mb-1">Pending Requests</p>
          <p className="text-2xl font-bold text-indigo-900">{loans?.length || 0}</p>
          <p className="text-xs text-indigo-500 mt-1">Awaiting member votes</p>
        </div>
      </div>

      {/* Mobile View: Card Layout */}
      <div className="block sm:hidden space-y-3">
        {loans?.map((loan) => {
          const isOwnLoan = loan.memberId === currentMemberId;
          const hasVoted = loan.memberId === currentMemberId;

          return (
            <div
              key={loan.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
              onClick={() => setSelectedLoan(loan)}
            >
              <div className="p-4">
                {/* Header with Member Info */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                      {loan.memberName?.charAt(0) || "?"}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{loan.memberName}</h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Requested {formatDate(loan.requestDate)}
                      </p>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-gray-400" />
                </div>

                {/* Amount Details */}
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div className="bg-gray-50 p-2.5 rounded-lg">
                    <p className="text-[10px] text-gray-500 mb-1">Requested</p>
                    <p className="text-sm font-bold text-gray-900">
                      {formatCurrency(loan.requestedAmount)}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-2.5 rounded-lg">
                    <p className="text-[10px] text-gray-500 mb-1">Eligible</p>
                    <p className="text-sm font-bold text-indigo-600">
                      {formatCurrency(loan.eligibleAmount)}
                    </p>
                  </div>
                </div>

                {/* Vote Status/Actions */}
                <div className="mt-3 pt-3 border-t border-gray-100">
                  {hasVoted || isOwnLoan ? (
                    <div className="text-center py-2">
                      <span className="text-xs font-medium text-gray-400">
                        {isOwnLoan ? "⏳ Your loan request is pending" : "✅ You've already voted"}
                      </span>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmVote({ id: loan.id, decision: VoteDecision.APPROVE });
                        }}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm font-medium hover:bg-green-100 transition-colors"
                      >
                        <Check size={16} />
                        Approve
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmVote({ id: loan.id, decision: VoteDecision.REJECT });
                        }}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors"
                      >
                        <X size={16} />
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {loans?.length === 0 && (
          <div className="bg-white p-8 rounded-xl text-center border border-gray-200">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <AlertCircle size={24} className="text-gray-400" />
            </div>
            <p className="text-gray-400">No pending loan requests</p>
          </div>
        )}
      </div>

      {/* Desktop View: Table */}
      <div className="hidden sm:block bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <Table columns={columns} data={loans || []} />
        </div>
      </div>

      {/* Mobile Loan Details Modal */}
      {selectedLoan && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-end sm:hidden"
          onClick={() => setSelectedLoan(null)}
        >
          <div
            className="bg-white rounded-t-2xl w-full max-h-[90vh] overflow-y-auto animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b px-4 py-3 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Loan Request Details</h3>
              <button
                onClick={() => setSelectedLoan(null)}
                className="p-1 hover:bg-gray-100 rounded-full"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              {/* Member Info */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-md">
                  {selectedLoan.memberName?.charAt(0) || "?"}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{selectedLoan.memberName}</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Requested {formatDate(selectedLoan.requestDate)}
                  </p>
                </div>
              </div>

              {/* Amount Details */}
              <div className="bg-gray-50 p-4 rounded-xl space-y-3">
                <DetailRow 
                  label="Requested Amount" 
                  value={formatCurrency(selectedLoan.requestedAmount)} 
                />
                <DetailRow 
                  label="Eligible Amount" 
                  value={formatCurrency(selectedLoan.eligibleAmount)}
                  highlight 
                />
              </div>

              {/* Additional Info */}
              <div className="bg-gray-50 p-4 rounded-xl">
                <DetailRow 
                  label="Status" 
                  value={
                    <span className="inline-block px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
                      Pending Approval
                    </span>
                  } 
                />
              </div>

              {/* Action Buttons */}
              {selectedLoan.memberId !== currentMemberId && (
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => {
                      setConfirmVote({ id: selectedLoan.id, decision: VoteDecision.APPROVE });
                      setSelectedLoan(null);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors"
                  >
                    <Check size={18} />
                    Approve
                  </button>
                  <button
                    onClick={() => {
                      setConfirmVote({ id: selectedLoan.id, decision: VoteDecision.REJECT });
                      setSelectedLoan(null);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors"
                  >
                    <X size={18} />
                    Reject
                  </button>
                </div>
              )}

              <button
                onClick={() => setSelectedLoan(null)}
                className="w-full py-3 text-gray-600 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Voting - Mobile Optimized */}
      <Modal
        isOpen={!!confirmVote}
        onClose={() => setConfirmVote(null)}
        title="Confirm Decision"
      >
        <div className="p-1 sm:p-4 text-center">
          <div
            className={`mx-auto mb-4 flex h-14 w-14 sm:h-12 sm:w-12 items-center justify-center rounded-full ${
              confirmVote?.decision === VoteDecision.APPROVE
                ? "bg-green-100 text-green-600"
                : "bg-red-100 text-red-600"
            }`}
          >
            <AlertCircle size={26} className="sm:w-6 sm:h-6" />
          </div>
          <h3 className="text-lg sm:text-base font-bold text-gray-900">Are you sure?</h3>
          <p className="text-sm text-gray-500 mt-2 px-2">
            You are about to{" "}
            <span className={`font-bold uppercase ${
              confirmVote?.decision === VoteDecision.APPROVE
                ? "text-green-600"
                : "text-red-600"
            }`}>
              {confirmVote?.decision}
            </span>{" "}
            this loan request. This action cannot be undone.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 mt-8">
            <button
              onClick={() => setConfirmVote(null)}
              className="px-4 py-3 sm:py-2.5 text-gray-600 font-medium hover:bg-gray-100 rounded-xl transition-colors order-2 sm:order-1"
            >
              Cancel
            </button>
            <button
              onClick={processVote}
              className={`px-4 py-3 sm:py-2.5 text-white font-bold rounded-xl shadow-sm transition-all order-1 sm:order-2 ${
                confirmVote?.decision === VoteDecision.APPROVE
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-red-600 hover:bg-red-700"
              }`}
            >
              Confirm {confirmVote?.decision}
            </button>
          </div>
        </div>
      </Modal>

      {/* Request Modal - Mobile Optimized */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Request Loan"
      >
        <form onSubmit={handleRequestSubmit} className="p-1 sm:p-4">
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
                className="block w-full pl-10 pr-4 py-4 sm:py-3 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-base sm:text-lg font-medium"
              />
            </div>
            <p className="mt-2 text-xs text-gray-400">
              The request will be sent to members for immediate review.
            </p>
          </div>

          <div className="flex flex-col-reverse sm:flex-row gap-3 mt-8">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-3 sm:py-2.5 text-gray-600 font-medium hover:bg-gray-100 rounded-xl transition-colors order-2 sm:order-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-3 sm:py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 disabled:opacity-50 shadow-sm order-1 sm:order-2"
            >
              {submitting ? "Sending..." : "Submit Request"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

// Helper component for detail rows
function DetailRow({ label, value, highlight = false }: { label: string; value: string | React.ReactNode; highlight?: boolean }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm text-gray-500">{label}</span>
      <span className={`text-sm font-medium ${highlight ? 'font-bold text-indigo-600' : 'text-gray-900'}`}>
        {value}
      </span>
    </div>
  );
}

export default PendingLoans;