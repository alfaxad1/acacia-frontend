import {
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Wallet,
  Clock,
  XCircle,
  PieChart,
  Calendar,
  CreditCard,
  Shield,
  Award,
  Activity,
  User,
} from "lucide-react";
import { StatCard } from "../components/StatCard";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { ErrorMessage } from "../components/ErrorMessage";
import { useApi } from "../hooks/useApi";
import { dashboardApi } from "../services/api";
import { formatCurrency, formatDate } from "../utils/format";
import { useState } from "react";

export function Dashboard() {
  const memberId = Number(localStorage.getItem("memberId"));
  const memberName = localStorage.getItem("userName") || "Member";

  const {
    data: summary,
    loading,
    error,
    refetch,
  } = useApi(() => dashboardApi.getSummary(memberId));

  const [selectedPeriod, setSelectedPeriod] = useState<
    "week" | "month" | "year"
  >("month");

  console.log("Summary ", summary);

  const mockData = {
    recentTransactions: [
      {
        type: "Contribution",
        amount: 5000,
        date: "2024-01-15",
        status: "completed",
      },
      {
        type: "Loan Repayment",
        amount: 2500,
        date: "2024-01-14",
        status: "completed",
      },
      {
        type: "Fine Payment",
        amount: 1000,
        date: "2024-01-13",
        status: "completed",
      },
      {
        type: "Contribution",
        amount: 5000,
        date: "2024-01-12",
        status: "pending",
      },
    ],
    upcomingPayments: [
      { type: "Contribution", amount: 5000, dueDate: "2024-02-01" },
      { type: "Loan Installment", amount: 2500, dueDate: "2024-02-05" },
    ],
    performanceMetrics: {
      repaymentRate: 95,
      onTimePayments: 87,
      savingsGrowth: 12,
    },
    notifications: [
      { message: "Your loan application is being reviewed", type: "info" },
      { message: "Contribution due in 3 days", type: "warning" },
    ],
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} onRetry={refetch} />;
  if (!summary) return null;

  const savingsProgress =
    (summary.personalStats.totalLoanAmount / summary.availableLoanAmount) *
      100 || 0;

  return (
    <div className="space-y-4 md:space-y-6 px-2 sm:px-4 md:px-0 max-w-7xl mx-auto">
      {/* Welcome Section with Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">
            Welcome back, {memberName.split(" ")[0]}! 👋
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>

        {/* Period Selector */}
        <div className="flex bg-gray-100 p-1 rounded-xl w-fit">
          {(["week", "month", "year"] as const).map((period) => (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-lg capitalize transition-all ${
                selectedPeriod === period
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {period}
            </button>
          ))}
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        <StatCard
          title="SACCO Balance"
          value={formatCurrency(summary.saccoBalance)}
          icon={Wallet}
          iconColor="text-green-600"
          trend={+2.5}
          trendLabel="vs last month"
        />
        <StatCard
          title="Active Loans"
          value={summary.activeLoans.toString()}
          icon={TrendingUp}
          iconColor="text-blue-600"
          subtitle={`${summary.personalStats.numberOfLoans} personal loans`}
        />
        <StatCard
          title="Loans Issued"
          value={formatCurrency(summary.totalLoansIssued)}
          icon={DollarSign}
          iconColor="text-indigo-600"
          subtitle="Total disbursed"
        />
        <StatCard
          title="Available Credit"
          value={formatCurrency(summary.availableLoanAmount)}
          icon={CreditCard}
          iconColor="text-purple-600"
          progress={savingsProgress}
        />
      </div>

      {/* Secondary Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-3 md:p-4 rounded-xl">
          <p className="text-[10px] md:text-xs text-blue-600 font-semibold uppercase tracking-wider">
            Members
          </p>
          <p className="text-lg md:text-2xl font-bold text-blue-900">
            {summary.members}
          </p>
          <p className="text-[10px] md:text-xs text-blue-600 mt-1">
            ↑ 0 this month
          </p>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 p-3 md:p-4 rounded-xl">
          <p className="text-[10px] md:text-xs text-green-600 font-semibold uppercase tracking-wider">
            Total Contributions
          </p>
          <p className="text-lg md:text-2xl font-bold text-green-900">
            {formatCurrency(summary.totalContributions)}
          </p>
          <p className="text-[10px] md:text-xs text-green-600 mt-1">
            ↑ 8% growth
          </p>
        </div>
        <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-3 md:p-4 rounded-xl">
          <p className="text-[10px] md:text-xs text-amber-600 font-semibold uppercase tracking-wider">
            Fines
          </p>
          <p className="text-lg md:text-2xl font-bold text-amber-900">
            {formatCurrency(summary.personalStats.totalFinesAmount)}
          </p>
          <p className="text-[10px] md:text-xs text-amber-600 mt-1">
            {summary.personalStats.numberOfFines} pending
          </p>
        </div>
        <div className="bg-gradient-to-br from-red-50 to-red-100 p-3 md:p-4 rounded-xl">
          <p className="text-[10px] md:text-xs text-red-600 font-semibold uppercase tracking-wider">
            Arrears
          </p>
          <p className="text-lg md:text-2xl font-bold text-red-900">
            {formatCurrency(summary.personalStats.missedContributionsAmount)}
          </p>
          <p className="text-[10px] md:text-xs text-red-600 mt-1">
            {summary.personalStats.numberOfMissedContributions} entries
          </p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Left Column - Personal Stats & Performance */}
        <div className="lg:col-span-2 space-y-4 md:space-y-6">
          {/* Personal Stats Card */}
          <div className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 md:p-6 border-b border-gray-100">
              <h2 className="text-base md:text-lg font-semibold text-gray-900 flex items-center gap-2">
                <User size={18} className="text-blue-600" />
                Personal Financial Summary
              </h2>
            </div>
            <div className="p-4 md:p-6 space-y-4">
              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs md:text-sm">
                  <span className="text-gray-600">Loan Utilization</span>
                  <span className="font-semibold text-gray-900">
                    {savingsProgress.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(savingsProgress, 100)}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-gray-50 p-3 md:p-4 rounded-xl">
                  <p className="text-[10px] md:text-xs text-gray-500 mb-1">
                    Total Loans
                  </p>
                  <p className="text-sm md:text-base font-bold text-gray-900">
                    {formatCurrency(summary.personalStats.totalLoanAmount)}
                  </p>
                  <p className="text-[10px] md:text-xs text-gray-500 mt-1">
                    {summary.personalStats.numberOfLoans} active loans
                  </p>
                </div>
                <div className="bg-gray-50 p-3 md:p-4 rounded-xl">
                  <p className="text-[10px] md:text-xs text-gray-500 mb-1">
                    Contribution
                  </p>
                  <p className="text-sm md:text-base font-bold text-gray-900">
                    {summary.personalStats.totalMemberContribution}
                  </p>
                  <p className="text-[10px] md:text-xs text-gray-500 mt-1">
                    Total amount from contributions
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-amber-50 p-3 md:p-4 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] md:text-xs text-amber-600 font-semibold">
                      Fines
                    </span>
                    <AlertTriangle size={14} className="text-amber-500" />
                  </div>
                  <p className="text-sm md:text-base font-bold text-amber-900">
                    {formatCurrency(summary.personalStats.totalFinesAmount)}
                  </p>
                  <p className="text-[10px] md:text-xs text-amber-600 mt-1">
                    {summary.personalStats.numberOfFines} outstanding
                  </p>
                </div>
                <div className="bg-red-50 p-3 md:p-4 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] md:text-xs text-red-600 font-semibold">
                      Missed Contributions
                    </span>
                    <XCircle size={14} className="text-red-500" />
                  </div>
                  <p className="text-sm md:text-base font-bold text-red-900">
                    {formatCurrency(
                      summary.personalStats.missedContributionsAmount,
                    )}
                  </p>
                  <p className="text-[10px] md:text-xs text-red-600 mt-1">
                    {summary.personalStats.numberOfMissedContributions} entries
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 md:p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-base md:text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Activity size={18} className="text-green-600" />
                Recent Transactions
              </h2>
              <button className="text-xs md:text-sm text-blue-600 font-medium hover:text-blue-700">
                View All
              </button>
            </div>
            <div className="divide-y divide-gray-100">
              {mockData.recentTransactions.map((tx, idx) => (
                <div
                  key={idx}
                  className="p-3 md:p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          tx.type === "Contribution"
                            ? "bg-green-100"
                            : "bg-blue-100"
                        }`}
                      >
                        {tx.type === "Contribution" ? (
                          <Wallet size={14} className="text-green-600" />
                        ) : (
                          <DollarSign size={14} className="text-blue-600" />
                        )}
                      </div>
                      <div>
                        <p className="text-xs md:text-sm font-medium text-gray-900">
                          {tx.type}
                        </p>
                        <p className="text-[10px] md:text-xs text-gray-500">
                          {tx.date}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs md:text-sm font-bold text-gray-900">
                        KSh {tx.amount.toLocaleString()}
                      </p>
                      <span
                        className={`text-[10px] md:text-xs ${
                          tx.status === "completed"
                            ? "text-green-600"
                            : "text-amber-600"
                        }`}
                      >
                        {tx.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Quick Stats & Notifications */}
        <div className="space-y-4 md:space-y-6">
          {/* Performance Metrics */}
          <div className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 md:p-6 border-b border-gray-100">
              <h2 className="text-base md:text-lg font-semibold text-gray-900 flex items-center gap-2">
                <PieChart size={18} className="text-purple-600" />
                Performance Metrics
              </h2>
            </div>
            <div className="p-4 md:p-6 space-y-4">
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs md:text-sm mb-1">
                    <span className="text-gray-600">Repayment Rate</span>
                    <span className="font-semibold text-gray-900">
                      {mockData.performanceMetrics.repaymentRate}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div
                      className="bg-green-500 h-1.5 rounded-full"
                      style={{
                        width: `${mockData.performanceMetrics.repaymentRate}%`,
                      }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs md:text-sm mb-1">
                    <span className="text-gray-600">On-time Payments</span>
                    <span className="font-semibold text-gray-900">
                      {mockData.performanceMetrics.onTimePayments}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div
                      className="bg-blue-500 h-1.5 rounded-full"
                      style={{
                        width: `${mockData.performanceMetrics.onTimePayments}%`,
                      }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs md:text-sm mb-1">
                    <span className="text-gray-600">Savings Growth</span>
                    <span className="font-semibold text-gray-900">
                      +{mockData.performanceMetrics.savingsGrowth}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div
                      className="bg-purple-500 h-1.5 rounded-full"
                      style={{
                        width: `${mockData.performanceMetrics.savingsGrowth * 5}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Upcoming Payments */}
          <div className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 md:p-6 border-b border-gray-100">
              <h2 className="text-base md:text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Calendar size={18} className="text-orange-600" />
                Upcoming Payments
              </h2>
            </div>
            <div className="divide-y divide-gray-100">
              {mockData.upcomingPayments.map((payment, idx) => (
                <div key={idx} className="p-3 md:p-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs md:text-sm font-medium text-gray-900">
                      {payment.type}
                    </span>
                    <span className="text-xs md:text-sm font-bold text-gray-900">
                      KSh {payment.amount.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] md:text-xs text-amber-600">
                    <Clock size={10} />
                    <span>Due {payment.dueDate}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Notifications */}
          <div className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 md:p-6 border-b border-gray-100">
              <h2 className="text-base md:text-lg font-semibold text-gray-900 flex items-center gap-2">
                <AlertTriangle size={18} className="text-amber-600" />
                Notifications
              </h2>
            </div>
            <div className="p-3 md:p-4 space-y-2">
              {mockData.notifications.map((notif, idx) => (
                <div
                  key={idx}
                  className={`p-2 md:p-3 rounded-lg text-xs md:text-sm ${
                    notif.type === "warning"
                      ? "bg-amber-50 text-amber-700"
                      : "bg-blue-50 text-blue-700"
                  }`}
                >
                  {notif.message}
                </div>
              ))}
            </div>
          </div>

          {/* Member Badge */}
          <div
            className={`rounded-xl md:rounded-2xl p-4 md:p-6 text-white bg-gradient-to-br 
            ${
              summary.personalStats.premium
                ? "from-amber-400 via-yellow-500 to-amber-600 shadow-lg"
                : "from-slate-600 to-slate-700"
            }`}
          >
            <div className="flex items-center gap-3 mb-3">
              <Shield size={24} />
              <div>
                <p className="text-xs opacity-90">Member Since</p>
                <p className="text-sm font-bold">
                  {formatDate(summary.personalStats.joinDate)}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs opacity-90">Membership Tier</p>
                <p className="text-base font-bold">
                  {summary.personalStats.premium ? "Premium" : "Standard"}
                </p>
              </div>
              <Award
                size={32}
                className={
                  summary.personalStats.premium
                    ? "text-amber-100"
                    : "opacity-80"
                }
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
