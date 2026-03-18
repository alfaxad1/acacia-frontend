import { DollarSign, TrendingUp, AlertTriangle } from "lucide-react";
import { StatCard } from "../components/StatCard";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { ErrorMessage } from "../components/ErrorMessage";
import { useApi } from "../hooks/useApi";
import { dashboardApi } from "../services/api";
import { formatCurrency } from "../utils/format";

export function Dashboard() {
  const memberd = Number(localStorage.getItem("memberId"));
  const {
    data: summary,
    loading,
    error,
    refetch,
  } = useApi(() => dashboardApi.getSummary(memberd));

  console.log("DATA: ", summary);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} onRetry={refetch} />;
  if (!summary) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Overview of your SACCO operations
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="SACCO Balance"
          value={formatCurrency(summary.saccoBalance)}
          icon={DollarSign}
          iconColor="text-green-600"
        />
        <StatCard
          title="Active Loans"
          value={summary.activeLoans}
          icon={TrendingUp}
          iconColor="text-blue-600"
        />
        <StatCard
          title="Loans Issued"
          value={formatCurrency(summary.totalLoansIssued)}
          icon={DollarSign}
          iconColor="text-blue-600"
        />
        <StatCard
          title="Loanable Amount"
          value={formatCurrency(summary.availableLoanAmount)}
          icon={AlertTriangle}
          iconColor="text-red-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Personal Stats
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">
                Loan Amount
              </span>
              <span className="text-sm font-semibold text-gray-900">
                {formatCurrency(summary.personalStats.totalLoanAmount) +
                  " (" +
                  summary.personalStats.numberOfLoans +
                  ")"}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Fines</span>
              <span className="text-sm font-semibold text-gray-900">
                {formatCurrency(summary.personalStats.totalFinesAmount) +
                  " (" +
                  summary.personalStats.numberOfFines +
                  ")"}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">
                Missed contributions Amount
              </span>
              <span className="text-sm font-semibold text-gray-900">
                {formatCurrency(
                  summary.personalStats.missedContributionsAmount
                ) +
                  " (" +
                  summary.personalStats.numberOfMissedContributions +
                  ")"}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Quick Stats
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Active</span>
              <span className="text-sm font-semibold text-gray-900">
                {"something else..."}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">
                Available Loan Amount
              </span>
              <span className="text-sm font-semibold text-gray-900">
                {"something else..."}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">
                Collection Efficiency
              </span>
              <span className="text-sm font-semibold text-gray-900">
                {"something else..."}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
