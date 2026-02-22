import {  DollarSign, TrendingUp, AlertTriangle } from 'lucide-react';
import { StatCard } from '../components/StatCard';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorMessage } from '../components/ErrorMessage';
import { useApi } from '../hooks/useApi';
import { dashboardApi } from '../services/api';
import { formatCurrency, formatPercent } from '../utils/format';

export function Dashboard() {
  const { data: summary, loading, error, refetch } = useApi(() => dashboardApi.getSummary());

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} onRetry={refetch} />;
  if (!summary) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">Overview of your SACCO operations</p>
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
          title="Total Loans Issued"
          value={formatCurrency(summary.totalLoansIssued)}
          icon={DollarSign}
          iconColor="text-blue-600"
        />
        <StatCard
          title="Members with Arrears"
          value={summary.membersWithArrears}
          icon={AlertTriangle}
          iconColor="text-red-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Weekly Compliance Rate</h2>
          <div className="flex items-center justify-center h-48">
            <div className="text-center">
              <div className="text-6xl font-bold text-blue-600">
                {formatPercent(summary.weeklyComplianceRate)}
              </div>
              <p className="mt-2 text-gray-600">Members paid on time</p>
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div
                className="bg-blue-600 h-4 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(summary.weeklyComplianceRate, 100)}%` }}
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Average Loan Size</span>
              <span className="text-sm font-semibold text-gray-900">
                {summary.activeLoans > 0
                  ? formatCurrency(summary.totalLoansIssued / summary.activeLoans)
                  : formatCurrency(0)}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Arrears Rate</span>
              <span className="text-sm font-semibold text-gray-900">
                {summary.membersWithArrears > 0
                  ? formatPercent((summary.membersWithArrears / Math.max(summary.activeLoans, 1)) * 100)
                  : '0%'}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Collection Efficiency</span>
              <span className="text-sm font-semibold text-gray-900">
                {formatPercent(summary.weeklyComplianceRate)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
