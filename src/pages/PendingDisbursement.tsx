import React from "react";
import toast from "react-hot-toast";
import { Banknote, Clock, User, ArrowUpRight } from "lucide-react";
import { loansApi } from "../services/api";
import { useApi } from "../hooks/useApi";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { ErrorMessage } from "../components/ErrorMessage";
import { Loan, LoanStatus } from "../types";
import { Table } from "../components/Table";
import { formatCurrency, formatDate } from "../utils/format";

const PendingDisbursement: React.FC = () => {
  const { data: loans, loading, error, refetch } = useApi(() => 
    loansApi.getAll(LoanStatus.APPROVED)
  );

  const handleDisburse = async (loanId: number) => {
    const disbursePromise = loansApi.disburse(loanId);

    await toast.promise(disbursePromise, {
      loading: "Processing disbursement...",
      success: "Funds disbursed successfully!",
      error: (err) => err?.message || "Failed to disburse funds.",
    });
    
    refetch();
  };

  const columns = [
    {
      key: "member",
      header: "Recipient",
      render: (loan: Loan) => (
        <div className="flex items-center">
          <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-sm mr-3 border border-emerald-100">
            <User size={16} />
          </div>
          <div>
            <div className="font-semibold text-gray-900">{loan.memberName}</div>
            <div className="text-xs text-gray-500 font-medium">Approved</div>
          </div>
        </div>
      ),
    },
    {
      key: "amount",
      header: "Amount to Disburse",
      render: (loan: Loan) => (
        <div className="flex flex-col">
          <span className="font-bold text-gray-900 text-base">
            {formatCurrency(loan.eligibleAmount)}
          </span>
          <span className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">
            Full Amount
          </span>
        </div>
      ),
    },
    {
      key: "date",
      header: "Approval Date",
      render: (loan: Loan) => (
        <div className="flex items-center text-gray-500 text-sm">
          <Clock size={14} className="mr-2 opacity-70" />
          {formatDate(loan.requestDate)}
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (loan: Loan) => (
        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-100 text-emerald-700 uppercase tracking-wide">
          Ready
        </span>
      ),
    },
    {
      key: "actions",
      header: "Action",
      render: (loan: Loan) => (
        <button
          onClick={() => handleDisburse(loan.id)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-bold rounded-lg hover:bg-emerald-700 transition-all shadow-sm hover:shadow-emerald-200 active:scale-95"
        >
          <Banknote size={16} />
          Disburse
          <ArrowUpRight size={14} className="opacity-70" />
        </button>
      ),
    },
  ];

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} onRetry={refetch} />;

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2 bg-emerald-600 rounded-lg text-white">
            <Banknote size={24} />
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
            Pending Disbursement
          </h1>
        </div>
        <p className="text-gray-500 ml-11">
          These loans have been approved and are awaiting fund transfer to the members.
        </p>
      </div>

      {/* Stats Overview (Optional Detail) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Total Pending</p>
          <p className="text-2xl font-bold text-gray-900">{loans?.length || 0}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Total Volume</p>
          <p className="text-2xl font-bold text-emerald-600">
            {formatCurrency(loans?.reduce((acc, curr) => acc + curr.requestedAmount, 0) || 0)}
          </p>
        </div>
      </div>

      {/* Custom Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <Table columns={columns} data={loans || []} />
      </div>
    </div>
  );
};

export default PendingDisbursement;