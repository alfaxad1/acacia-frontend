/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { Table } from "../components/Table";
import { Modal } from "../components/Modal";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { ErrorMessage } from "../components/ErrorMessage";
import { useApi } from "../hooks/useApi";
import { loansApi } from "../services/api";
import { formatCurrency, formatDate, getStatusColor } from "../utils/format";
import { API_URL } from "../config/constant";
import { LoanStatus, type Loan } from "../types";
import {
  Banknote,
  X,
  Loader2,
  CheckCircle2,
  Clock,
  ChevronRight,
  Phone,
  Plus,
  DollarSign,
} from "lucide-react";
import { toast } from "react-hot-toast";

export function Loans() {
  const [activeTab, setActiveTab] = useState<LoanStatus>(LoanStatus.DISBURSED);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // States for Request Loan
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [requestAmount, setRequestAmount] = useState<number>(0);
  const [isRequesting, setIsRequesting] = useState(false);

  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [selectedLoanDetails, setSelectedLoanDetails] = useState<Loan | null>(null);
  const [loanRepayments, setLoanRepayments] = useState<any[]>([]);
  const [isLoadingRepayments, setIsLoadingRepayments] = useState(false);
  const [repayAmount, setRepayAmount] = useState<string>("");
  const [repayPhone, setRepayPhone] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const userData = JSON.parse(localStorage.getItem("userData") || "{}");
  const currentMemberId = Number(localStorage.getItem("memberId"));

  const {
    data: loans,
    loading,
    error,
    refetch,
  } = useApi(() => loansApi.getAll(activeTab));

  useEffect(() => {
    refetch();
  }, [activeTab]);

  useEffect(() => {
    if (selectedLoanDetails) {
      setIsLoadingRepayments(true);
      loansApi.getLoanRepayments(selectedLoanDetails.id)
        .then(setLoanRepayments)
        .catch((err) => {
          console.error("Failed to fetch repayments:", err);
          setLoanRepayments([]);
        })
        .finally(() => setIsLoadingRepayments(false));
    } else {
      setLoanRepayments([]);
    }
  }, [selectedLoanDetails]);

  const handleOpenModal = (loan: Loan) => {
    const userData = JSON.parse(localStorage.getItem("userData") || "{}");
    setSelectedLoan(loan);
    setRepayAmount("");
    setRepayPhone(userData?.phone || "");
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedLoan(null);
    setRepayAmount("");
    setRepayPhone("");
  };

  const handleRepaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLoan || !repayAmount) return;

    setIsSubmitting(true);
    const loadingToast = toast.loading("Initiating M-Pesa STK Push...");

    try {
      const response = await loansApi.postRepayment(
        selectedLoan.id,
        Number(repayAmount),
        repayPhone.trim() || undefined,
      );

      const checkoutId = response.data?.checkoutRequestId;

      if (!checkoutId) {
        throw new Error("No Checkout ID received");
      }

      toast.loading("PIN prompt sent! Waiting for confirmation...", {
        id: loadingToast,
      });

      await pollLoanStatus(checkoutId, loadingToast);
    } catch (err: any) {
      console.error("Error initiating repayment:", err);
      toast.error(
        err.response?.data?.message || "Failed to initiate repayment",
        { id: loadingToast },
      );
      setIsSubmitting(false);
    }
  };

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (requestAmount <= 0) return toast.error("Please enter a valid amount");

    setIsRequesting(true);
    try {
      await loansApi.request({ memberId: currentMemberId, amount: requestAmount });
      toast.success("Loan request submitted successfully");
      setIsRequestModalOpen(false);
      setRequestAmount(0);
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Request failed");
    } finally {
      setIsRequesting(false);
    }
  };

  const pollLoanStatus = async (checkoutId: string, toastId: string) => {
    const sseUrl = `${API_URL}/stk/stream/${checkoutId}`;
    const eventSource = new EventSource(sseUrl);

    const timeout = setTimeout(() => {
      eventSource.close();
      toast.error("Timed out waiting for STK status.", { id: toastId });
      setIsSubmitting(false);
    }, 60000); // 60 seconds

    eventSource.addEventListener("payment-status", (event: any) => {
      const res = event.data;
      clearTimeout(timeout);
      
      if (res === "COMPLETED") {
        eventSource.close();
        toast.success("Repayment Successful!", { id: toastId });
        setIsSubmitting(false);
        handleCloseModal();
        refetch(); // Refresh the loan table/balance
      } else if (res === "FAILED" || res === "CANCELLED") {
        eventSource.close();
        toast.error("Payment was declined or cancelled.", { id: toastId });
        setIsSubmitting(false);
      }
    });

    eventSource.onerror = (err) => {
      console.warn("SSE connection error", err);
    };
  };

  const columns = [
    {
      key: "member",
      header: "Member",
      render: (loan: Loan) => (
        <div className="py-1">
          <div className="font-bold text-gray-900">{loan.memberName}</div>
          <div className="text-[10px] font-medium text-gray-400 uppercase tracking-tight">
            {loan.memberNo}
          </div>
        </div>
      ),
    },
    {
      key: "amount",
      header: "Financials",
      render: (loan: Loan) => (
        <div>
          <div className="font-bold text-gray-900">
            {formatCurrency(loan.totalPayableAmount)}
          </div>
          <div className="text-[10px] text-gray-500 font-medium">
            Requested: {formatCurrency(loan.requestedAmount)}
          </div>
          <div className="text-[10px] text-gray-500 font-medium">
            Approved: {formatCurrency(loan.approvedAmount)}
          </div>
          <div className="text-[10px] text-gray-500 font-medium">
            Balance: {formatCurrency(loan.balance)}
          </div>
          {loan.totalPenalties && loan.totalPenalties > 0 && (
            <div className="text-[10px] text-red-500 font-bold mt-1">
              + Penalties: {formatCurrency(loan.totalPenalties)}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "dates",
      header: "Schedule",
      render: (loan: Loan) => (
        <div className="text-xs">
          <div className="text-gray-500">
            Disbursed: {formatDate(loan.requestDate)}
          </div>
          {loan.dueDate && (
            <div
              className={`font-bold mt-0.5 ${
                activeTab === LoanStatus.DISBURSED
                  ? "text-amber-600"
                  : "text-gray-400"
              }`}
            >
              Due: {formatDate(loan.dueDate)}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (loan: Loan) => (
        <span
          className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${getStatusColor(
            loan.status,
          )} shadow-sm border border-black/5`}
        >
          {loan.status}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      render: (loan: Loan) => (
        <div className="flex justify-end">
          {(activeTab === LoanStatus.DISBURSED ||
            activeTab === LoanStatus.DEFAULTED) &&
          loan.memberId === userData?.memberId ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleOpenModal(loan);
              }}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-lg shadow-emerald-100 active:scale-95"
            >
              <Banknote size={14} />
              Pay
            </button>
          ) : (
            <div className="text-emerald-500 p-2 bg-emerald-50 rounded-full">
              <CheckCircle2 size={20} />
            </div>
          )}
        </div>
      ),
    },
  ];

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} onRetry={refetch} />;

  return (
    <div className="space-y-4 md:space-y-6 px-2 sm:px-4 md:px-0 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
            Loan Portfolio
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 font-medium tracking-wide">
            Monitoring active credit and settled repayments
          </p>
        </div>
        <button
          onClick={() => setIsRequestModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-3 sm:py-2.5 bg-indigo-600 text-white text-sm sm:text-base font-semibold rounded-xl hover:bg-indigo-700 transition-all shadow-md active:scale-95 w-full sm:w-auto"
        >
          <Plus size={18} className="sm:w-5 sm:h-5" />
          Request Loan
        </button>
      </div>

      {/* Tab Toggles - Mobile Optimized */}
      <div className="flex p-1.5 bg-gray-100/80 rounded-2xl border border-gray-200 shadow-inner w-full md:w-auto overflow-x-auto">
        <div className="flex gap-1 min-w-full md:min-w-0">
          <button
            onClick={() => setActiveTab(LoanStatus.DISBURSED)}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 md:px-8 py-3 md:py-2.5 rounded-xl text-xs md:text-sm font-bold transition-all ${
              activeTab === LoanStatus.DISBURSED
                ? "bg-white text-blue-600 shadow-md ring-1 ring-black/5"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <Clock size={16} />
            <span>Active</span>
          </button>

          <button
            onClick={() => setActiveTab(LoanStatus.DEFAULTED)}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 md:px-8 py-3 md:py-2.5 rounded-xl text-xs md:text-sm font-bold transition-all ${
              activeTab === LoanStatus.DEFAULTED
                ? "bg-white text-rose-600 shadow-md ring-1 ring-black/5"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <X size={16} className="text-rose-500" />
            <span>Defaulted</span>
          </button>

          <button
            onClick={() => setActiveTab(LoanStatus.REPAID)}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 md:px-8 py-3 md:py-2.5 rounded-xl text-xs md:text-sm font-bold transition-all ${
              activeTab === LoanStatus.REPAID
                ? "bg-white text-emerald-600 shadow-md ring-1 ring-black/5"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <CheckCircle2 size={16} />
            <span>Settled</span>
          </button>
        </div>
      </div>

      {/* Mobile View: Card Layout */}
      <div className="block md:hidden space-y-3">
        {loans?.map((loan) => (
          <div
            key={loan.id}
            className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden"
            onClick={() => setSelectedLoanDetails(loan)}
          >
            <div className="p-4">
              {/* Header with Member Info */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                    {loan.memberName?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">
                      {loan.memberName}
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {loan.memberNo}
                    </p>
                  </div>
                </div>
                <ChevronRight size={20} className="text-gray-400" />
              </div>

              {/* Loan Details */}
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div className="bg-gray-50 p-3 rounded-xl">
                  <p className="text-xs text-gray-500 mb-1">Amount</p>
                  <p className="font-bold text-gray-900">
                    {formatCurrency(loan.totalPayableAmount)}
                  </p>
                </div>
                <div className="bg-gray-50 p-3 rounded-xl">
                  <p className="text-xs text-gray-500 mb-1">Balance</p>
                  <p className="font-bold text-gray-900">
                    {formatCurrency(loan.balance || 0)}
                  </p>
                  {loan.totalPenalties && loan.totalPenalties > 0 && (
                    <p className="text-[10px] font-bold text-red-500 mt-1">
                      Includes {formatCurrency(loan.totalPenalties)} penalties
                    </p>
                  )}
                </div>
              </div>

              {/* Dates and Status */}
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                <div>
                  <p className="text-xs text-gray-500">
                    Disbursed: {formatDate(loan.requestDate)}
                  </p>
                  {loan.dueDate && activeTab === LoanStatus.DISBURSED && (
                    <p className="text-xs font-bold text-amber-600 mt-1">
                      Due: {formatDate(loan.dueDate)}
                    </p>
                  )}
                </div>
                <span
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${getStatusColor(
                    loan.status,
                  )} shadow-sm`}
                >
                  {loan.status}
                </span>
              </div>

              {/* Action Button for Active Loans */}
              {(activeTab === LoanStatus.DISBURSED ||
                activeTab === LoanStatus.DEFAULTED) &&
                loan.memberId === userData?.memberId && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenModal(loan);
                    }}
                    className="w-full mt-4 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl text-sm font-bold transition-all shadow-lg shadow-emerald-100 active:scale-95"
                  >
                    <Banknote size={16} />
                    Pay
                  </button>
                )}
            </div>
          </div>
        ))}
      </div>

      {/* Desktop View: Table */}
      <div className="hidden md:block bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <Table columns={columns} data={loans || []} onRowClick={(loan) => setSelectedLoanDetails(loan)} />
        </div>
        {loans?.length === 0 && (
          <div className="p-20 text-center flex flex-col items-center gap-3">
            <div className="p-4 bg-gray-50 rounded-full text-gray-300">
              <Banknote size={40} />
            </div>
            <p className="text-gray-400 font-medium text-center">
              No {activeTab.toLowerCase()} loans found.
            </p>
          </div>
        )}
      </div>

      {/* Mobile Empty State */}
      {loans?.length === 0 && (
        <div className="block md:hidden p-10 text-center bg-white rounded-2xl border border-gray-100">
          <div className="p-4 bg-gray-50 rounded-full text-gray-300 mx-auto w-fit mb-3">
            <Banknote size={32} />
          </div>
          <p className="text-gray-400 font-medium">
            No {activeTab.toLowerCase()} loans found.
          </p>
        </div>
      )}

      {/* Loan Details Modal */}
      {selectedLoanDetails && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center p-0 md:p-4"
          onClick={() => setSelectedLoanDetails(null)}
        >
          <div
            className="bg-white rounded-t-3xl md:rounded-3xl w-full md:max-w-xl max-h-[90vh] overflow-y-auto animate-slide-up md:animate-none"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b px-4 py-3 flex items-center justify-between z-10">
              <h3 className="font-bold text-gray-900">Loan Details</h3>
              <button
                onClick={() => setSelectedLoanDetails(null)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Member Info */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shrink-0">
                  {selectedLoanDetails.memberName?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {selectedLoanDetails.memberName}
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {selectedLoanDetails.memberNo}
                  </p>
                </div>
              </div>

              {/* Financial Details */}
              <div className="bg-gray-50 p-4 rounded-2xl space-y-3">
                <DetailRow
                  label="Loan Amount"
                  value={formatCurrency(selectedLoanDetails.totalPayableAmount)}
                  highlight
                />
                <DetailRow
                  label="Paid Amount"
                  value={formatCurrency(selectedLoanDetails.paidAmount || 0)}
                />
                {selectedLoanDetails.totalPenalties && selectedLoanDetails.totalPenalties > 0 && (
                  <DetailRow
                    label="Penalties"
                    value={formatCurrency(selectedLoanDetails.totalPenalties)}
                    highlight
                  />
                )}
                <DetailRow
                  label="Balance"
                  value={formatCurrency(selectedLoanDetails.balance)}
                  highlight
                />
              </div>

              {selectedLoanDetails.penalties && selectedLoanDetails.penalties.length > 0 && (
                <div className="bg-red-50 p-4 rounded-2xl space-y-3 border border-red-100">
                  <h4 className="font-bold text-red-900 text-sm">Penalty Breakdown</h4>
                  <div className="space-y-2">
                    {selectedLoanDetails.penalties.map((penalty: any, index: number) => (
                      <div key={index} className="flex justify-between items-center text-sm">
                        <span className="text-red-700">{formatDate(penalty.penaltyDate)}</span>
                        <span className="font-bold text-red-900">{formatCurrency(penalty.amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Dates */}
              <div className="bg-gray-50 p-4 rounded-2xl space-y-3">
                <DetailRow
                  label="Disbursed Date"
                  value={formatDate(selectedLoanDetails.requestDate)}
                />
                {selectedLoanDetails.dueDate && (
                  <DetailRow
                    label="Due Date"
                    value={formatDate(selectedLoanDetails.dueDate)}
                  />
                )}
                {selectedLoanDetails.repaidDate && (
                  <DetailRow
                    label="Repaid Date"
                    value={formatDate(selectedLoanDetails.repaidDate)}
                  />
                )}
              </div>

              {/* Status */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                <span className="text-sm text-gray-500">Status</span>
                <span
                  className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider ${getStatusColor(
                    selectedLoanDetails.status,
                  )}`}
                >
                  {selectedLoanDetails.status}
                </span>
              </div>

              {/* Repayments History */}
              <div className="bg-gray-50 p-4 rounded-2xl space-y-3">
                <h4 className="font-bold text-gray-900 text-sm">Payment History</h4>
                {isLoadingRepayments ? (
                  <div className="flex justify-center p-4">
                    <Loader2 className="animate-spin text-gray-400" size={20} />
                  </div>
                ) : loanRepayments.length > 0 ? (
                  <div className="space-y-2">
                    {loanRepayments.map((repayment) => (
                      <div key={repayment.id} className="flex justify-between items-center bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                            <Banknote size={16} />
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 text-sm">{formatCurrency(repayment.amount)}</p>
                            <p className="text-xs text-gray-500">{formatDate(repayment.paymentDate)}</p>
                          </div>
                        </div>
                        <div className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">Paid</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic text-center p-4">No payments made yet.</p>
                )}
              </div>

              {/* Action Buttons */}
              {(activeTab === LoanStatus.DISBURSED ||
                activeTab === LoanStatus.DEFAULTED) &&
                selectedLoanDetails.memberId === userData?.memberId && (
                  <button
                    onClick={() => {
                      handleOpenModal(selectedLoanDetails);
                      setSelectedLoanDetails(null);
                    }}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-xl font-bold transition-all shadow-lg shadow-emerald-100 active:scale-95 flex items-center justify-center gap-2"
                  >
                    <Banknote size={18} />
                    Pay
                  </button>
                )}

              <button
                onClick={() => setSelectedLoanDetails(null)}
                className="w-full py-4 text-gray-600 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors font-medium"
              >
                 Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal - Mobile Friendly */}
      {isModalOpen && selectedLoan && (
        <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full md:max-w-md bg-white rounded-t-3xl md:rounded-3xl shadow-2xl overflow-hidden animate-slide-up md:animate-none">
            <div className="sticky top-0 p-4 border-b flex justify-between items-center bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 text-green-600 rounded-lg">
                  <Banknote size={18} />
                </div>
                <h3 className="font-bold text-gray-900">Record Repayment</h3>
              </div>
              <button
                onClick={handleCloseModal}
                className="p-2 hover:bg-gray-200 rounded-full"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleRepaySubmit} className="p-4 space-y-4">
              <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100">
                <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1">
                  Target Account
                </p>
                <p className="font-black text-blue-900">
                  {selectedLoan.memberName}
                </p>
                <div className="mt-3 pt-3 border-t border-blue-100 flex justify-between items-center">
                  <span className="text-xs font-bold text-blue-700">
                    Outstanding Balance:
                  </span>
                  <span className="text-lg font-black text-blue-900 font-mono">
                    {formatCurrency(selectedLoan.totalPayableAmount)}
                  </span>
                </div>
              </div>

              {/* Phone number input */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                  M-Pesa Phone Number
                </label>
                <div className="relative">
                  <Phone
                    size={16}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="tel"
                    required
                    value={repayPhone}
                    onChange={(e) => setRepayPhone(e.target.value)}
                    placeholder="e.g. 0712345678"
                    className="w-full pl-10 pr-4 py-4 bg-gray-50 border-2 border-transparent rounded-xl outline-none focus:border-blue-500 focus:bg-white font-bold text-base transition-all"
                  />
                </div>
                <p className="text-[10px] text-gray-400 ml-1">
                  STK push will be sent to this number. Edit if paying from a
                  different number.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                  Payment Amount (KES)
                </label>
                <input
                  autoFocus
                  type="number"
                  required
                  min="1"
                  value={repayAmount}
                  onChange={(e) => setRepayAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full p-4 bg-gray-50 border-2 border-transparent rounded-xl outline-none focus:border-emerald-500 focus:bg-white font-black text-xl transition-all font-mono"
                />
              </div>

              <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 py-4 font-bold text-gray-500 hover:bg-gray-100 rounded-xl transition-all border border-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl shadow-xl shadow-emerald-200 flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                  {isSubmitting ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : (
                    "Pay"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Request Modal */}
      <Modal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
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
                value={requestAmount || ""}
                onChange={(e) => setRequestAmount(Number(e.target.value))}
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
              onClick={() => setIsRequestModalOpen(false)}
              className="px-4 py-3 sm:py-2.5 text-gray-600 font-medium hover:bg-gray-100 rounded-xl transition-colors order-2 sm:order-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isRequesting}
              className="px-4 py-3 sm:py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 disabled:opacity-50 shadow-sm order-1 sm:order-2"
            >
              {isRequesting ? "Sending..." : "Submit Request"}
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
}

// Helper component for detail rows
function DetailRow({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm text-gray-500">{label}</span>
      <span
        className={`text-sm font-medium ${highlight ? "font-bold text-gray-900" : "text-gray-600"}`}
      >
        {value}
      </span>
    </div>
  );
}
