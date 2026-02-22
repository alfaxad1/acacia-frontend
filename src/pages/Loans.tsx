import { Table } from "../components/Table";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { ErrorMessage } from "../components/ErrorMessage";
import { useApi } from "../hooks/useApi";
import { loansApi } from "../services/api";
import { formatCurrency, formatDate, getStatusColor } from "../utils/format";
import { LoanStatus, type Loan } from "../types";

export function Loans() {
  const {
    data: loans,
    loading,
    error,
    refetch,
  } = useApi(() => loansApi.getAll(LoanStatus.DISBURSED));

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
          <div>
            {formatCurrency(loan.approvedAmount || loan.requestedAmount)}
          </div>
          {loan.paidAmount && (
            <div className="text-xs text-gray-500">
              Total: {formatCurrency(loan.paidAmount)}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "dates",
      header: "Dates",
      render: (loan: Loan) => (
        <div className="text-sm">
          <div>Requested: {formatDate(loan.requestDate)}</div>
          {loan.approvedDate && (
            <div className="text-xs text-gray-500">
              Approved: {formatDate(loan.approvedDate)}
            </div>
          )}
          {loan.dueDate && (
            <div className="text-xs text-gray-500">
              Due: {formatDate(loan.dueDate)}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "duration",
      header: "Duration",
      render: (loan: Loan) => `${loan.duration} days`,
    },
    {
      key: "status",
      header: "Status",
      render: (loan: Loan) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
            loan.status
          )}`}
        >
          {loan.status}
        </span>
      ),
    },
  ];

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} onRetry={refetch} />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="space-y-2 py-2">
          <h1 className="text-2xl font-bold text-gray-900">Active Loans</h1>
          <p className="mt-1 text-sm text-gray-500">
            View and manage active loans for members
          </p>
        </div>
      </div>
      <div className="bg-white rounded-lg shadow">
        <Table columns={columns} data={loans || []} />
      </div>
    </div>
  );
}
