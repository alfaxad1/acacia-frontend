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
    return { data: { periods: periodsRes, members: membersRes } };
  });

  const periods: ContributionPeriod[] = apiResponse?.periods || [];
  const members: Member[] = apiResponse?.members || [];

  const [isContributionModalOpen, setIsContributionModalOpen] = useState(false);
  const [isPeriodModalOpen, setIsPeriodModalOpen] = useState(false);
  const [selectedPeriod, setSelectedPeriod] =
    useState<ContributionPeriod | null>(null);
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
      toast.success("Period created");
    } catch (err) {
      toast.error("Failed to create period");
      console.error("Error creating period:", err);
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
      toast.success("Contribution recorded");
    } catch (err) {
      toast.error("Failed to record contribution");
      console.error("Error recording contribution:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const periodColumns = [
    {
      key: "date",
      header: "Period Date",
      render: (p: ContributionPeriod) => (
        <div className="flex items-center gap-2">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-md hidden sm:block">
            <Calendar size={14} />
          </div>
          <span className="font-medium text-gray-900">
            {formatDate(p.date)}
          </span>
        </div>
      ),
    },
    {
      key: "required",
      header: "Target",
      render: (p: ContributionPeriod) => (
        <span className="text-gray-600">
          {formatCurrency(p.amountRequired)}
        </span>
      ),
    },
    {
      key: "collected",
      header: "Collected",
      render: (p: ContributionPeriod) => {
        const total =
          p.contributions?.reduce((sum, c) => sum + c.amount, 0) || 0;
        return (
          <div className="flex flex-col">
            <span className="font-bold text-emerald-600">
              {formatCurrency(total)}
            </span>
            <div className="w-16 h-1 bg-gray-100 rounded-full mt-1 overflow-hidden">
              <div
                className="h-full bg-emerald-500"
                style={{
                  width: `${Math.min((total / p.amountRequired) * 100, 100)}%`,
                }}
              />
            </div>
          </div>
        );
      },
    },
    {
      key: "actions",
      header: "",
      render: (p: ContributionPeriod) => (
        <button
          onClick={() => setSelectedPeriod(p)}
          className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
          title="View Details"
        >
          <Eye size={18} />
        </button>
      ),
    },
  ];

  if (loading)
    return (
      <div className="h-64 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  if (error) return <ErrorMessage message={error} onRetry={refetch} />;

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
      <Toaster position="top-right" />

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
            Contributions
          </h1>
          <p className="text-sm text-gray-500">
            Track and record member monthly savings.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPeriodModalOpen(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 transition-all"
          >
            <Calendar size={18} />{" "}
            <span className="hidden xs:inline">New Period</span>
          </button>
          <button
            onClick={() => setIsContributionModalOpen(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg shadow-md hover:bg-blue-700 active:transform active:scale-95 transition-all"
          >
            <Plus size={18} /> <span>Record Payment</span>
          </button>
        </div>
      </div>
      {/* 1. MOBILE CARDS (Visible only on small screens) */}
      <div className="grid grid-cols-1 gap-4 sm:hidden">
        {periods.map((p) => {
          const total =
            p.contributions?.reduce((sum, c) => sum + c.amount, 0) || 0;
          const progress = Math.min((total / p.amountRequired) * 100, 100);

          return (
            <div
              key={p.id}
              className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-4"
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                    <Calendar size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">
                      {formatDate(p.date)}
                    </h3>
                    <p className="text-xs text-gray-500">Contribution Period</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedPeriod(p)}
                  className="p-2 bg-gray-50 text-gray-400 rounded-full"
                >
                  <Eye size={20} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 py-2 border-y border-gray-50">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">
                    Target
                  </p>
                  <p className="text-sm font-semibold text-gray-700">
                    {formatCurrency(p.amountRequired)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">
                    Collected
                  </p>
                  <p className="text-sm font-bold text-emerald-600">
                    {formatCurrency(total)}
                  </p>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-gray-500">Collection Progress</span>
                  <span className="text-emerald-600 font-bold">
                    {progress.toFixed(0)}%
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 2. DESKTOP TABLE (Hidden on mobile) */}
      <div className="hidden sm:block bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <Table columns={periodColumns} data={periods} />
      </div>

      {/* MODAL: View Detail - Optimized Table */}
      <Modal
        isOpen={!!selectedPeriod}
        onClose={() => setSelectedPeriod(null)}
        title={`Breakdown: ${
          selectedPeriod ? formatDate(selectedPeriod.date) : ""
        }`}
        size="lg"
      >
        <div className="mt-2 -mx-6 sm:mx-0">
          <div className="inline-block min-w-full align-middle">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Member
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {selectedPeriod?.contributions.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-800">
                      {c.memberName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {formatCurrency(c.amount)}
                    </td>
                    <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                      {formatDateTime(c.paymentDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          c.late
                            ? "bg-amber-100 text-amber-800"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {c.late ? "Late" : "On Time"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Modal>

      {/* Form Modals (Add Period & Contribution) - Responsive Grids */}
      <Modal
        isOpen={isPeriodModalOpen}
        onClose={() => setIsPeriodModalOpen(false)}
        title="Create Period"
      >
        <form onSubmit={handlePeriodSubmit} className="space-y-5 p-1">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Starting Date
            </label>
            <input
              type="date"
              className="block w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all"
              value={periodDate}
              onChange={(e) => setPeriodDate(e.target.value)}
              required
            />
          </div>
          <button
            disabled={submitting}
            className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:bg-blue-700 disabled:bg-gray-300 transition-all"
          >
            {submitting ? "Processing..." : "Confirm New Period"}
          </button>
        </form>
      </Modal>

      <Modal
        isOpen={isContributionModalOpen}
        onClose={() => setIsContributionModalOpen(false)}
        title="Record Contribution"
      >
        <form onSubmit={handleContributionSubmit} className="space-y-5 p-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700">
                Member
              </label>
              <select
                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
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
                    {m.fullName}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700">
                Period
              </label>
              <select
                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700">
                Amount (KES)
              </label>
              <input
                type="number"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                value={contributionForm.amount}
                onChange={(e) =>
                  setContributionForm({
                    ...contributionForm,
                    amount: Number(e.target.value),
                  })
                }
                placeholder="0.00"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700">
                Payment Date
              </label>
              <input
                type="datetime-local"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
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
            className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:bg-blue-700 active:scale-[0.98] transition-all disabled:bg-gray-300"
          >
            {submitting ? "Saving..." : "Record Payment"}
          </button>
        </form>
      </Modal>
    </div>
  );
}
