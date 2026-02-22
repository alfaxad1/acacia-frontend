import React, { useState } from "react";
import toast from "react-hot-toast";
import { loansApi, membersApi } from "../services/api";
import { useApi } from "../hooks/useApi";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { ErrorMessage } from "../components/ErrorMessage";
import { LoanRequest, LoanStatus, VoteDecision } from "../types";
import { Plus } from "lucide-react";
import { Modal } from "../components/Modal";
import { formatCurrency, formatDate } from "../utils/format";

const PendingLoans: React.FC = () => {
  const {
    data: loans,
    loading,
    error,
    refetch,
  } = useApi(() => loansApi.getAll(LoanStatus.PENDING));

  const { data: members } = useApi(async () => ({
    data: await membersApi.getAll(),
  }));

  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<LoanRequest>({
    memberId: 0,
    amount: 0,
  });

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await loansApi.request(formData);
      setIsRequestModalOpen(false);
      setFormData({ memberId: 0, amount: 0 });
      refetch();
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "An error occurred while requesting loan"
      );
      console.error("Failed to request loan:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleVote = async (
    loanId: number,
    memberId: number,
    decision: VoteDecision
  ) => {
    const votePromise = loansApi.vote(loanId, memberId, decision);

    await toast.promise(votePromise, {
      loading: `Submitting ${decision.toLowerCase()}...`,
      success: `Loan ${
        decision === VoteDecision.APPROVE ? "APPROVE" : "REJECT"
      }!`,
      error: "Failed to submit vote.",
    });
    refetch();
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} onRetry={refetch} />;

  return (
    <div className="p-4">
      <div className="flex justify-between items-center">
        <div className="space-y-2 py-2">
          <h1 className="text-2xl font-bold text-gray-900">Pending Loans</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage loan pending loans for members. You can approve or reject
            loan requests.
          </p>
        </div>
        <button
          onClick={() => setIsRequestModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          Request
        </button>
      </div>
      <table className="min-w-full border-collapse border border-gray-200">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2">Member</th>
            <th className="border p-2">Requested Amount</th>
            <th className="border p-2">Date</th>
            <th className="border p-2">Status</th>
            <th className="border p-2">Action</th>
          </tr>
        </thead>
        <tbody>
          {loans?.map((loan) => (
            <tr key={loan.id} className="text-center">
              <td className="border p-2">{loan.memberName}</td>
              <td className="border p-2">
                {formatCurrency(loan.requestedAmount)}
              </td>
              <td className="border p-2">{formatDate(loan.requestDate)}</td>
              <td className="border p-2">
                <span className="px-2 py-1 rounded bg-yellow-100 text-yellow-800 text-xs">
                  {loan.status}
                </span>
              </td>
              <td className="border p-2">
                <div className="flex justify-center gap-3">
                  <button
                    onClick={() =>
                      handleVote(loan.id, loan.memberId, VoteDecision.APPROVE)
                    }
                    className="p-2 bg-green-100 text-green-700 rounded-full hover:bg-green-200 transition-all shadow-sm"
                    title="Approve"
                  >
                    <span className="text-xl font-bold">✓</span>
                  </button>

                  <button
                    onClick={() =>
                      handleVote(loan.id, loan.memberId, VoteDecision.REJECT)
                    }
                    className="p-2 bg-red-100 text-red-700 rounded-full hover:bg-red-200 transition-all shadow-sm"
                    title="Reject"
                  >
                    <span className="text-xl font-bold">✕</span>
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {loans?.length === 0 && (
            <tr>
              <td colSpan={5} className="p-4 text-gray-500">
                No pending loans found.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <Modal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        title="Request New Loan"
      >
        <form onSubmit={handleRequestSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Member
            </label>
            <select
              required
              value={formData.memberId}
              onChange={(e) =>
                setFormData({ ...formData, memberId: Number(e.target.value) })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value={0}>Select a member</option>
              {members?.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.fullName} ({member.memberNumber})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Requested Amount
            </label>
            <input
              type="number"
              required
              min="0"
              step="0.01"
              value={formData.amount}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  amount: Number(e.target.value),
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <button
              type="button"
              onClick={() => setIsRequestModalOpen(false)}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? "Submitting..." : "Request Loan"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default PendingLoans;
