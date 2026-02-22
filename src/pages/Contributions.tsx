import { useState } from "react";
import { Plus, Eye, Calendar } from "lucide-react";
import { Table } from "../components/Table";
import { Modal } from "../components/Modal";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { ErrorMessage } from "../components/ErrorMessage";
import { useApi } from "../hooks/useApi";
import { contributionsApi, periodsApi, membersApi } from "../services/api";
import { formatCurrency, formatDateTime, formatDate } from "../utils/format";
import type { ContributionPeriod, Member } from "../types";
import toast, { Toaster } from "react-hot-toast";

export function Contributions() {
  // Combined Data Fetching to avoid hook collision
  const {
    data: apiResponse,
    loading,
    error,
    refetch,
  } = useApi(async () => {
    const [periodsRes, membersRes] = await Promise.all([
      periodsApi.getWithContributions(),
      membersApi.getAll(),
    ]);

    // This matches the structure your hook expects (returning an object with a 'data' property)
    return {
      data: {
        periods: periodsRes,
        members: membersRes,
      },
    };
  });

  // Correctly extract the nested data
  // Using optional chaining to prevent errors while loading
  const periods: ContributionPeriod[] = apiResponse?.periods || [];
  const members: Member[] = apiResponse?.members || [];

  // UI State
  const [isContributionModalOpen, setIsContributionModalOpen] = useState(false);
  const [isPeriodModalOpen, setIsPeriodModalOpen] = useState(false);
  const [selectedPeriod, setSelectedPeriod] =
    useState<ContributionPeriod | null>(null);

  // Form State
  const [submitting, setSubmitting] = useState(false);
  const [periodDate, setPeriodDate] = useState("");
  const [contributionForm, setContributionForm] = useState({
    memberId: 0,
    periodId: 0,
    amount: 0,
    paymentDate: new Date().toISOString().slice(0, 16),
  });

  const topFivePeriods = periods.slice(0, 5);

  const handlePeriodSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await periodsApi.create({ date: periodDate });
      setIsPeriodModalOpen(false);
      setPeriodDate("");
      refetch();
    } catch (err) {
      console.error("Failed to create period:", err);
      toast.error("Failed to create period");
    } finally {
      setSubmitting(false);
    }
  };

  const handleContributionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (contributionForm.memberId === 0 || contributionForm.periodId === 0) {
      toast.error("Please select both a member and a period");
      return;
    }
    setSubmitting(true);
    try {
      await contributionsApi.record(contributionForm);
      setIsContributionModalOpen(false);
      setContributionForm({
        memberId: 0,
        periodId: 0,
        amount: 0,
        paymentDate: new Date().toISOString().slice(0, 16),
      });
      refetch();
      toast.success("Contribution recorded successfully");
    } catch (err) {
      console.error("Failed to record contribution:", err);
      toast.error("Failed to record contribution");
    } finally {
      setSubmitting(false);
    }
  };

  const periodColumns = [
    {
      key: "date",
      header: "Period Date",
      render: (p: ContributionPeriod) => (
        <div className="font-medium text-gray-900">{formatDate(p.date)}</div>
      ),
    },
    {
      key: "required",
      header: "Required",
      render: (p: ContributionPeriod) => formatCurrency(p.amountRequired),
    },
    {
      key: "collected",
      header: "Total Collected",
      render: (p: ContributionPeriod) => {
        const total =
          p.contributions?.reduce((sum, c) => sum + c.amount, 0) || 0;
        return (
          <span className="font-bold text-blue-600">
            {formatCurrency(total)}
          </span>
        );
      },
    },
    {
      key: "actions",
      header: "Actions",
      render: (p: ContributionPeriod) => (
        <button
          onClick={() => setSelectedPeriod(p)}
          className="flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium"
        >
          <Eye size={16} /> View Details
        </button>
      ),
    },
  ];

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} onRetry={refetch} />;

  return (
    <div className="p-6 space-y-6">
      <Toaster position="top-right" reverseOrder={false} />
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">
          Contributions Management
        </h1>
        <div className="flex gap-3">
          <button
            onClick={() => setIsPeriodModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Calendar size={18} /> New Period
          </button>
          <button
            onClick={() => setIsContributionModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={18} /> Record Payment
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <Table columns={periodColumns} data={periods} />
      </div>

      {/* MODAL: View Contributions Detail */}
      <Modal
        isOpen={!!selectedPeriod}
        onClose={() => setSelectedPeriod(null)}
        title={`Details for ${
          selectedPeriod ? formatDate(selectedPeriod.date) : ""
        }`}
        size="lg"
      >
        <div className="space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-2">Member</th>
                  <th className="px-4 py-2">Amount</th>
                  <th className="px-4 py-2">Date</th>
                  <th className="px-4 py-2 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {selectedPeriod?.contributions.map((c) => (
                  <tr key={c.id}>
                    <td className="px-4 py-3 font-medium">
                      {c.memberName || "N/A"}
                    </td>
                    <td className="px-4 py-3">{formatCurrency(c.amount)}</td>
                    <td className="px-4 py-3 text-gray-500">
                      {formatDateTime(c.paymentDate)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className={`px-2 py-1 rounded text-xs font-bold ${
                          c.late
                            ? "bg-red-100 text-red-700"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        {c.late ? "LATE" : "ON TIME"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Modal>

      {/* MODAL: Add Period */}
      <Modal
        isOpen={isPeriodModalOpen}
        onClose={() => setIsPeriodModalOpen(false)}
        title="Add New Period"
      >
        <form onSubmit={handlePeriodSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Period Start Date
            </label>
            <input
              type="date"
              className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              value={periodDate}
              onChange={(e) => setPeriodDate(e.target.value)}
              required
            />
          </div>
          <button
            disabled={submitting}
            className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
          >
            {submitting ? "Saving..." : "Create Period"}
          </button>
        </form>
      </Modal>

      {/* MODAL: Add Contribution */}
      <Modal
        isOpen={isContributionModalOpen}
        onClose={() => setIsContributionModalOpen(false)}
        title="Record Contribution"
      >
        <form onSubmit={handleContributionSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Member
              </label>
              <select
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={contributionForm.memberId}
                onChange={(e) =>
                  setContributionForm({
                    ...contributionForm,
                    memberId: Number(e.target.value),
                  })
                }
                required
              >
                <option value={0}>Select Member</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.fullName} — {m.memberNumber}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Period (Top 5)
              </label>
              <select
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={contributionForm.periodId}
                onChange={(e) =>
                  setContributionForm({
                    ...contributionForm,
                    periodId: Number(e.target.value),
                  })
                }
                required
              >
                <option value={0}>Select Period</option>
                {topFivePeriods.map((p) => (
                  <option key={p.id} value={p.id}>
                    {formatDate(p.date)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Amount
              </label>
              <input
                type="number"
                className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                value={contributionForm.amount}
                onChange={(e) =>
                  setContributionForm({
                    ...contributionForm,
                    amount: Number(e.target.value),
                  })
                }
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payment Date
              </label>
              <input
                type="datetime-local"
                className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                value={contributionForm.paymentDate}
                onChange={(e) =>
                  setContributionForm({
                    ...contributionForm,
                    paymentDate: e.target.value,
                  })
                }
                required
              />
            </div>
          </div>
          <button
            disabled={submitting}
            className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
          >
            {submitting ? "Saving..." : "Save Contribution"}
          </button>
        </form>
      </Modal>
    </div>
  );
}
