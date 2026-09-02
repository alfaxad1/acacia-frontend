/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { Table } from "../components/Table";
import { Modal } from "../components/Modal";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { ErrorMessage } from "../components/ErrorMessage";
import { useApi } from "../hooks/useApi";
import { loansApi } from "../services/api";
import { formatCurrency, formatDate, getStatusColor } from "../utils/format";
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
  PieChart,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { API_URL } from "../config/constant";

const ProgressRing = ({ radius, stroke, progress }: { radius: number; stroke: number; progress: number }) => {
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const safeProgress = isNaN(progress) ? 0 : Math.min(100, Math.max(0, progress));
  const strokeDashoffset = circumference - (safeProgress / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg height={radius * 2} width={radius * 2} className="transform -rotate-90">
        <circle
          stroke="#f8f8f6" // gray-50
          fill="transparent"
          strokeWidth={stroke}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        <circle
          stroke="#0f7053" // brand-600
          fill="transparent"
          strokeWidth={stroke}
          strokeDasharray={circumference + " " + circumference}
          style={{ strokeDashoffset }}
          strokeLinecap="round"
          r={normalizedRadius}
          cx={radius}
          cy={radius}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <span className="absolute text-[9px] font-black text-gray-700">
        {Math.round(safeProgress)}%
      </span>
    </div>
  );
};

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

  const pollStatus = async (
    checkoutId: string,
    toastId: string,
  ) => {
    const sseUrl = `${API_URL}/stk/stream/${checkoutId}`;
    const eventSource = new EventSource(sseUrl);

    // Timeout fallback just in case
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
        toast.success("Repayment Success!", { id: toastId });
        setIsSubmitting(false);
        handleCloseModal();
        refetch();
      } else if (res === "FAILED" || res === "CANCELLED") {
        eventSource.close();
        toast.error("Payment failed or was cancelled", { id: toastId });
        setIsSubmitting(false);
      }
    });

    eventSource.onerror = (err) => {
      console.warn("SSE connection error", err);
    };
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

      const checkoutId = response.data?.checkoutRequestId || response.data?.message;

      if (!checkoutId) {
        throw new Error("No Response received");
      }

      toast.loading("Check your phone for PIN prompt...", { id: loadingToast });
      await pollStatus(checkoutId, loadingToast);
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

  const columns = [
    {
      key: "member",
      header: "Member",
      render: (loan: Loan) => (
        <div className="py-2 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-sm">
             {loan.memberName?.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="font-bold text-gray-900">{loan.memberName}</div>
            <div className="text-[10px] font-bold text-gray-400 tracking-wider">
              {loan.memberNo}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "amount",
      header: "Financials",
      render: (loan: Loan) => (
        <div className="py-2">
          <div className="font-black text-gray-900 text-sm">
            {formatCurrency(loan.totalPayableAmount)}
          </div>
          <div className="text-[11px] text-gray-500 font-semibold mt-0.5">
            Bal: <span className="text-gray-900">{formatCurrency(loan.balance)}</span>
          </div>
          {loan.totalPenalties && loan.totalPenalties > 0 ? (
            <div className="text-[10px] text-red-600 font-bold mt-1 bg-red-50 inline-block px-2 py-0.5 rounded-full border border-red-100">
              Penalties: {formatCurrency(loan.totalPenalties)}
            </div>
          ) : null}
        </div>
      ),
    },
    {
      key: "progress",
      header: "Progress",
      render: (loan: Loan) => {
        const progress = loan.totalPayableAmount > 0 
          ? ((loan.paidAmount || 0) / loan.totalPayableAmount) * 100 
          : 0;
        return (
          <div className="py-2">
             <ProgressRing radius={24} stroke={4} progress={progress} />
          </div>
        );
      },
    },
    {
      key: "dates",
      header: "Schedule",
      render: (loan: Loan) => (
        <div className="text-[11px] font-semibold py-2">
          <div className="text-gray-500">
            Start: {formatDate(loan.requestDate)}
          </div>
          {loan.dueDate && (
            <div
              className={`mt-1 ${
                activeTab === LoanStatus.DISBURSED
                  ? "text-brand-600"
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
          className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider ${getStatusColor(
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
        <div className="flex justify-end py-2">
          {(activeTab === LoanStatus.DISBURSED ||
            activeTab === LoanStatus.DEFAULTED) &&
          loan.memberId === userData?.memberId ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleOpenModal(loan);
              }}
              className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95"
            >
              <Banknote size={14} />
              Pay
            </button>
          ) : (
            <div className="text-brand-600 p-2.5 bg-brand-50 rounded-full border border-brand-100">
              <CheckCircle2 size={18} />
            </div>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 md:space-y-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto py-6">
      {/* Premium Solid Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-brand-900 p-6 md:p-8 rounded-3xl shadow-xl overflow-hidden">
        <div className="relative z-10 space-y-2">
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Loan Portfolio
          </h1>
          <p className="text-sm sm:text-base text-brand-100 font-medium tracking-wide">
            Track active credit, manage defaults, and view settled balances.
          </p>
        </div>
        <button
          onClick={() => setIsRequestModalOpen(true)}
          className="relative z-10 inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-white text-brand-900 text-sm sm:text-base font-black rounded-2xl hover:bg-brand-50 transition-all shadow-lg active:scale-95 w-full md:w-auto border border-white/20"
        >
          <Plus size={20} className="text-brand-600" />
          Request Loan
        </button>
      </div>

      {/* Solid Tabs */}
      <div className="flex justify-center w-full">
        <div className="flex p-1.5 bg-gray-50 rounded-2xl border border-gray-200 shadow-sm w-full md:w-auto overflow-x-auto mx-auto relative z-20">
          <div className="flex gap-1 min-w-full md:min-w-0">
            <button
              onClick={() => setActiveTab(LoanStatus.DISBURSED)}
              className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 md:px-10 py-3 rounded-xl text-xs md:text-sm font-bold transition-all duration-200 ${
                activeTab === LoanStatus.DISBURSED
                  ? "bg-brand-600 text-white shadow-md"
                  : "text-gray-500 hover:bg-gray-100"
              }`}
            >
              <Clock size={16} />
              <span>Active</span>
            </button>

            <button
              onClick={() => setActiveTab(LoanStatus.DEFAULTED)}
              className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 md:px-10 py-3 rounded-xl text-xs md:text-sm font-bold transition-all duration-200 ${
                activeTab === LoanStatus.DEFAULTED
                  ? "bg-red-600 text-white shadow-md"
                  : "text-gray-500 hover:bg-gray-100"
              }`}
            >
              <X size={16} />
              <span>Defaulted</span>
            </button>

            <button
              onClick={() => setActiveTab(LoanStatus.REPAID)}
              className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 md:px-10 py-3 rounded-xl text-xs md:text-sm font-bold transition-all duration-200 ${
                activeTab === LoanStatus.REPAID
                  ? "bg-brand-600 text-white shadow-md"
                  : "text-gray-500 hover:bg-gray-100"
              }`}
            >
              <CheckCircle2 size={16} />
              <span>Settled</span>
            </button>
          </div>
        </div>
      </div>

      {loading && (
        <div className="py-20 flex justify-center">
          <LoadingSpinner />
        </div>
      )}
      
      {error && !loading && (
        <ErrorMessage message={error} onRetry={refetch} />
      )}

      {/* Content Area */}
      {!loading && !error && (
        <>
          {/* Mobile View */}
          <div className="block md:hidden space-y-4">
            {loans?.map((loan) => {
              const progress = loan.totalPayableAmount > 0 ? ((loan.paidAmount || 0) / loan.totalPayableAmount) * 100 : 0;
              
              return (
              <div
                key={loan.id}
                className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden active:scale-[0.99] transition-transform duration-200"
                onClick={() => setSelectedLoanDetails(loan)}
              >
                <div className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold text-lg border border-brand-200">
                        {loan.memberName?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-black text-gray-900 text-base">
                          {loan.memberName}
                        </h3>
                        <p className="text-[10px] font-bold text-gray-400 tracking-wider">
                          {loan.memberNo}
                        </p>
                      </div>
                    </div>
                    <ProgressRing radius={22} stroke={3.5} progress={progress} />
                  </div>

                  {/* Loan Details Grid */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100">
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">Total Payable</p>
                      <p className="font-black text-gray-900 text-lg">
                        {formatCurrency(loan.totalPayableAmount)}
                      </p>
                    </div>
                    <div className="bg-brand-50 p-3 rounded-2xl border border-brand-100">
                      <p className="text-[10px] font-bold text-brand-700 uppercase tracking-wide mb-1">Remaining Bal</p>
                      <p className="font-black text-brand-950 text-lg">
                        {formatCurrency(loan.balance || 0)}
                      </p>
                    </div>
                  </div>
                  
                  {loan.totalPenalties && loan.totalPenalties > 0 ? (
                    <div className="mb-4 bg-red-50 px-3 py-2 rounded-xl flex items-center justify-between border border-red-100">
                      <span className="text-[10px] font-bold text-red-600 uppercase">Applied Penalties</span>
                      <span className="text-sm font-black text-red-700">{formatCurrency(loan.totalPenalties)}</span>
                    </div>
                  ) : null}

                  {/* Dates and Status */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                        Disbursed: <span className="text-gray-700">{formatDate(loan.requestDate)}</span>
                      </p>
                      {loan.dueDate && activeTab === LoanStatus.DISBURSED && (
                        <p className="text-[10px] font-bold text-brand-600 uppercase tracking-wider">
                          Due: <span className="text-brand-800">{formatDate(loan.dueDate)}</span>
                        </p>
                      )}
                    </div>
                    <span
                      className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider ${getStatusColor(
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
                        className="w-full mt-4 flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white py-3.5 rounded-xl text-sm font-black transition-all shadow-md active:scale-95"
                      >
                        <Banknote size={18} />
                        Make Repayment
                      </button>
                    )}
                </div>
              </div>
            )})}
          </div>

          {/* Desktop View: Table */}
          <div className="hidden md:block bg-white rounded-3xl shadow-card border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <Table columns={columns} data={loans || []} onRowClick={(loan) => setSelectedLoanDetails(loan)} />
            </div>
          </div>

          {/* Empty States */}
          {loans?.length === 0 && (
            <div className="p-16 flex flex-col items-center justify-center bg-white rounded-3xl border border-gray-100 shadow-sm mt-6">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                <PieChart size={32} className="text-gray-300" />
              </div>
              <h3 className="text-lg font-black text-gray-900 mb-1">No {activeTab.toLowerCase()} loans</h3>
              <p className="text-sm font-medium text-gray-500 text-center max-w-sm">
                There are currently no records in this category. Apply for a new loan or check another tab.
              </p>
            </div>
          )}
        </>
      )}

      {/* Loan Details Modal (Enhanced) */}
      {selectedLoanDetails && (
        <div
          className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-0 md:p-4"
          onClick={() => setSelectedLoanDetails(null)}
        >
          <div
            className="bg-white rounded-t-[32px] md:rounded-[32px] w-full md:max-w-md max-h-[90vh] overflow-y-auto shadow-lift animate-slide-up md:animate-none"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-gray-100 px-6 py-5 flex items-center justify-between z-10">
              <h3 className="font-black text-gray-900 text-lg">Loan Overview</h3>
              <button
                onClick={() => setSelectedLoanDetails(null)}
                className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
              >
                <X size={18} className="text-gray-600" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Member Profile */}
              <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-2xl">
                <div className="w-14 h-14 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold text-xl border border-brand-200 shrink-0">
                  {selectedLoanDetails.memberName?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-base font-black text-gray-900">
                    {selectedLoanDetails.memberName}
                  </h2>
                  <p className="text-xs font-bold text-gray-400 tracking-wider">
                    {selectedLoanDetails.memberNo}
                  </p>
                </div>
                <div className="ml-auto">
                   <span
                    className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider ${getStatusColor(
                      selectedLoanDetails.status,
                    )} shadow-sm`}
                  >
                    {selectedLoanDetails.status}
                  </span>
                </div>
              </div>

              {/* Financial Breakdown */}
              <div className="bg-brand-50 p-5 rounded-3xl border border-brand-100 space-y-4">
                <h4 className="font-black text-brand-900 text-xs uppercase tracking-widest mb-2 flex items-center gap-2">
                  <PieChart size={14} className="text-brand-600" /> Financial Breakdown
                </h4>
                
                <div className="space-y-3">
                  <DetailRow label="Principal Approved" value={formatCurrency(selectedLoanDetails.approvedAmount)} />
                  <DetailRow label="Interest Accrued" value={formatCurrency(selectedLoanDetails.interestAmount || 0)} />
                  {selectedLoanDetails.transactionCost !== undefined && (
                     <DetailRow label="Transaction Fees" value={formatCurrency(selectedLoanDetails.transactionCost)} />
                  )}
                  {selectedLoanDetails.totalPenalties && selectedLoanDetails.totalPenalties > 0 ? (
                     <DetailRow label="Penalties" value={formatCurrency(selectedLoanDetails.totalPenalties)} highlight valueClass="text-red-600" />
                  ) : null}
                  
                  <div className="pt-4 border-t border-brand-200">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-bold text-brand-800 uppercase tracking-widest">Total Payable</span>
                      <span className="text-lg font-black text-brand-950">{formatCurrency(selectedLoanDetails.totalPayableAmount)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Balances */}
              <div className="grid grid-cols-2 gap-4">
                 <div className="bg-gray-50 p-4 rounded-3xl border border-gray-100">
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-wider mb-1">Total Paid</p>
                    <p className="text-lg font-black text-gray-900">{formatCurrency(selectedLoanDetails.paidAmount || 0)}</p>
                 </div>
                 <div className="bg-white p-4 rounded-3xl border border-gray-200 shadow-sm">
                    <p className="text-[10px] font-black text-brand-600 uppercase tracking-wider mb-1">Outstanding</p>
                    <p className="text-lg font-black text-brand-900">{formatCurrency(selectedLoanDetails.balance)}</p>
                 </div>
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
                    className="w-full bg-brand-600 hover:bg-brand-700 text-white py-4 rounded-2xl font-black text-sm transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
                  >
                    <Banknote size={18} />
                    Proceed to Payment
                  </button>
                )}
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {isModalOpen && selectedLoan && (
        <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
          <div className="w-full md:max-w-md bg-white rounded-[32px] shadow-lift overflow-hidden animate-slide-up md:animate-none">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-brand-100 text-brand-700 rounded-xl shadow-sm border border-brand-200">
                  <Banknote size={20} />
                </div>
                <div>
                  <h3 className="font-black text-gray-900">Make Repayment</h3>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">M-Pesa Express</p>
                </div>
              </div>
              <button
                onClick={handleCloseModal}
                className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
              >
                <X size={18} className="text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleRepaySubmit} className="p-6 space-y-6">
              <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100 flex justify-between items-center">
                 <div>
                   <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">
                     Outstanding Balance
                   </p>
                   <p className="font-black text-gray-900 text-xl font-mono">
                     {formatCurrency(selectedLoan.balance)}
                   </p>
                 </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">
                  M-Pesa Phone Number
                </label>
                <div className="relative">
                  <Phone
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="tel"
                    required
                    value={repayPhone}
                    onChange={(e) => setRepayPhone(e.target.value)}
                    placeholder="e.g. 0712345678"
                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-500/10 font-bold text-base transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">
                  Amount to Pay (KES)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-black">
                    Ksh
                  </span>
                  <input
                    autoFocus
                    type="number"
                    required
                    min="1"
                    max={selectedLoan.balance}
                    value={repayAmount}
                    onChange={(e) => setRepayAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-14 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-500/10 font-black text-xl transition-all font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 bg-brand-600 hover:bg-brand-700 text-white font-black text-sm rounded-2xl shadow-md flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
              >
                {isSubmitting ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  "Initiate Payment"
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Request Modal */}
      <Modal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        title="Apply for a Loan"
      >
        <form onSubmit={handleRequestSubmit} className="p-2 sm:p-4">
          <div className="mb-8">
            <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-3">
              Requested Amount (KES)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 font-black">
                Ksh
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
                className="block w-full pl-14 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-500/10 transition-all font-black text-xl font-mono"
              />
            </div>
            <p className="mt-3 text-[11px] font-semibold text-gray-400">
              Your request will be submitted to the committee for immediate review and approval.
            </p>
          </div>

          <div className="flex flex-col-reverse sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => setIsRequestModalOpen(false)}
              className="flex-1 py-4 text-gray-600 font-black text-sm hover:bg-gray-100 rounded-2xl transition-colors order-2 sm:order-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isRequesting}
              className="flex-1 py-4 bg-brand-600 hover:bg-brand-700 text-white font-black text-sm rounded-2xl disabled:opacity-50 shadow-md order-1 sm:order-2 transition-all active:scale-95"
            >
              {isRequesting ? "Submitting..." : "Submit Application"}
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
  valueClass = "",
}: {
  label: string;
  value: string;
  highlight?: boolean;
  valueClass?: string;
}) {
  return (
    <div className="flex justify-between items-center py-1">
      <span className="text-xs font-bold text-gray-500">{label}</span>
      <span
        className={`text-sm ${highlight ? "font-black" : "font-bold text-gray-700"} ${valueClass ? valueClass : (highlight ? "text-gray-900" : "")}`}
      >
        {value}
      </span>
    </div>
  );
}
