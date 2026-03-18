import React from "react";
import toast from "react-hot-toast";
import { Banknote, Clock, User, ArrowUpRight, ChevronRight, X } from "lucide-react";
import { loansApi } from "../services/api";
import { useApi } from "../hooks/useApi";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { ErrorMessage } from "../components/ErrorMessage";
import { Loan, LoanStatus } from "../types";
import { Table } from "../components/Table";
import { formatCurrency, formatDate } from "../utils/format";
import { useState } from "react";

const PendingDisbursement: React.FC = () => {
  const { data: loans, loading, error, refetch } = useApi(() => 
    loansApi.getAll(LoanStatus.APPROVED)
  );

  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [processingId, setProcessingId] = useState<number | null>(null);

  const handleDisburse = async (loanId: number) => {
    setProcessingId(loanId);
    try {
      await loansApi.disburse(loanId);
      toast.success("Funds disbursed successfully!");
      setSelectedLoan(null);
      refetch();
    } catch (err: any) {
      toast.error(err?.message || "Failed to disburse funds.");
    } finally {
      setProcessingId(null);
    }
  };

  const totalVolume = loans?.reduce((acc, curr) => acc + curr.eligibleAmount, 0) || 0;

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
          disabled={processingId === loan.id}
          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-bold rounded-lg hover:bg-emerald-700 transition-all shadow-sm hover:shadow-emerald-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {processingId === loan.id ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Banknote size={16} />
              Disburse
              <ArrowUpRight size={14} className="opacity-70" />
            </>
          )}
        </button>
      ),
    },
  ];

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} onRetry={refetch} />;

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-4 md:px-6 py-4 md:py-6">
      {/* Page Header - Mobile Optimized */}
      <div className="mb-6 md:mb-8">
        <div className="flex items-center gap-2 md:gap-3 mb-2">
          <div className="p-1.5 md:p-2 bg-emerald-600 rounded-lg text-white">
            <Banknote size={20} className="md:w-6 md:h-6" />
          </div>
          <h1 className="text-xl md:text-2xl font-extrabold text-gray-900 tracking-tight">
            Pending Disbursement
          </h1>
        </div>
        <p className="text-xs md:text-sm text-gray-500 ml-9 md:ml-11">
          These loans have been approved and are awaiting fund transfer to the members.
        </p>
      </div>

      {/* Stats Overview - Mobile Optimized */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 mb-6">
        <div className="bg-white p-3 md:p-4 rounded-xl md:rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-xs md:text-sm font-medium text-gray-500">Pending</p>
          <p className="text-lg md:text-2xl font-bold text-gray-900">{loans?.length || 0}</p>
        </div>
        <div className="bg-white p-3 md:p-4 rounded-xl md:rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-xs md:text-sm font-medium text-gray-500">Total Volume</p>
          <p className="text-sm md:text-2xl font-bold text-emerald-600 truncate">
            {formatCurrency(totalVolume)}
          </p>
        </div>
      </div>

      {/* Mobile View: Card Layout */}
      <div className="block md:hidden space-y-3">
        {loans?.map((loan) => (
          <div
            key={loan.id}
            className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
            onClick={() => setSelectedLoan(loan)}
          >
            <div className="p-4">
              {/* Header with Member Info */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                    {loan.memberName?.charAt(0) || "?"}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{loan.memberName}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">Approved</p>
                  </div>
                </div>
                <ChevronRight size={18} className="text-gray-400" />
              </div>

              {/* Amount and Date */}
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div className="bg-gray-50 p-2.5 rounded-lg">
                  <p className="text-[10px] text-gray-500 mb-1">Amount</p>
                  <p className="text-sm font-bold text-gray-900">
                    {formatCurrency(loan.eligibleAmount)}
                  </p>
                </div>
                <div className="bg-gray-50 p-2.5 rounded-lg">
                  <p className="text-[10px] text-gray-500 mb-1">Approved</p>
                  <p className="text-xs font-medium text-gray-600">
                    {formatDate(loan.requestDate)}
                  </p>
                </div>
              </div>

              {/* Status Badge */}
              <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-bold bg-emerald-100 text-emerald-700">
                  Ready for Disbursement
                </span>
              </div>

              {/* Disburse Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDisburse(loan.id);
                }}
                disabled={processingId === loan.id}
                className="w-full mt-3 flex items-center justify-center gap-2 py-3 bg-emerald-600 text-white text-sm font-bold rounded-lg hover:bg-emerald-700 transition-all shadow-sm active:scale-95 disabled:opacity-50"
              >
                {processingId === loan.id ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Banknote size={16} />
                    Disburse Funds
                  </>
                )}
              </button>
            </div>
          </div>
        ))}

        {loans?.length === 0 && (
          <div className="bg-white p-8 rounded-xl text-center border border-gray-200">
            <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-3">
              <Banknote size={24} className="text-emerald-400" />
            </div>
            <p className="text-gray-400">No loans pending disbursement</p>
          </div>
        )}
      </div>

      {/* Desktop View: Table */}
      <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <Table columns={columns} data={loans || []} />
        </div>
      </div>

      {/* Mobile Loan Details Modal */}
      {selectedLoan && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-end md:hidden"
          onClick={() => setSelectedLoan(null)}
        >
          <div
            className="bg-white rounded-t-2xl w-full max-h-[90vh] overflow-y-auto animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b px-4 py-3 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Disbursement Details</h3>
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
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white font-bold text-xl shadow-md">
                  {selectedLoan.memberName?.charAt(0) || "?"}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{selectedLoan.memberName}</h2>
                  <p className="text-sm text-gray-500 mt-1">Approved Loan</p>
                </div>
              </div>

              {/* Loan Details */}
              <div className="bg-gray-50 p-4 rounded-xl space-y-3">
                <DetailRow 
                  label="Amount to Disburse" 
                  value={formatCurrency(selectedLoan.eligibleAmount)}
                  highlight 
                />
                <DetailRow 
                  label="Approval Date" 
                  value={formatDate(selectedLoan.requestDate)} 
                />
                <DetailRow 
                  label="Status" 
                  value={
                    <span className="inline-block px-2 py-1 bg-emerald-100 text-emerald-700 rounded-md text-xs font-bold">
                      Ready for Disbursement
                    </span>
                  } 
                />
              </div>

              {/* Additional Info */}
              <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
                <p className="text-xs font-medium text-amber-800 mb-2">⚠️ Important</p>
                <p className="text-xs text-amber-700">
                  Disbursing funds will transfer the full amount to the member's account. Please verify all details before proceeding.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    handleDisburse(selectedLoan.id);
                    setSelectedLoan(null);
                  }}
                  disabled={processingId === selectedLoan.id}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50"
                >
                  {processingId === selectedLoan.id ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Banknote size={18} />
                      Confirm Disbursement
                    </>
                  )}
                </button>
              </div>

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
    </div>
  );
};

// Helper component for detail rows
function DetailRow({ label, value, highlight = false }: { label: string; value: string | React.ReactNode; highlight?: boolean }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm text-gray-500">{label}</span>
      <span className={`text-sm font-medium ${highlight ? 'font-bold text-emerald-600' : 'text-gray-900'}`}>
        {value}
      </span>
    </div>
  );
}

export default PendingDisbursement;