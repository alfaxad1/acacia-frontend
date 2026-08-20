/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { Plus, Eye, Loader2, CreditCard, X, Phone } from "lucide-react";
import { Table } from "../components/Table";
import Pagination from "../components/Pagination";
import { Modal } from "../components/Modal";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { ErrorMessage } from "../components/ErrorMessage";
import { useApi } from "../hooks/useApi";
import { contributionsApi, periodsApi } from "../services/api";
import { formatCurrency, formatDateTime, formatDate } from "../utils/format";
import type { ContributionPeriod, Role } from "../types";
import toast from "react-hot-toast";
import { contributionApi } from "../services/api";
import { API_URL } from "../config/constant";

export function Contributions() {
  const [selectedPeriod, setSelectedPeriod] =
    useState<ContributionPeriod | null>(null);
  const [activePaymentId, setActivePaymentId] = useState<number | null>(null);
  const memberId = Number(localStorage.getItem("memberId"));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [surplusBalance, setSurplusBalance] = useState(0);

  useEffect(() => {
    contributionApi.getMemberSurplus(memberId)
      .then(res => setSurplusBalance(res.data))
      .catch(err => console.error("Failed to fetch surplus", err));
  }, [memberId]);

  // STK confirmation modal state
  const [stkPeriodId, setStkPeriodId] = useState<number | null>(null);
  const [stkPhone, setStkPhone] = useState("");
  const [isStkModalOpen, setIsStkModalOpen] = useState(false);
  const [isStkSubmitting, setIsStkSubmitting] = useState(false);
  const [amountToPay, setAmountToPay] = useState("");

  const [currentPage, setCurrentPage] = useState(0);

  const {
    data: apiResponse,
    loading,
    error,
    refetch,
  } = useApi(async () => {
    const res = await periodsApi.getWithContributions(currentPage, 10);
    return { data: res };
  });

  const role: Role = (localStorage.getItem("role") as Role) || "MEMBER";
  const periods: ContributionPeriod[] = (apiResponse as any)?.data || [];
  const metaData = (apiResponse as any)?.metaData;

  const openStkModal = (periodId: number) => {
    const period = periods.find(p => p.id === periodId);
    const requiredAmount = period?.amountRequired || 0;
    let defaultAmount = requiredAmount;
    
    // Suggest a reduced amount if they have surplus
    if (surplusBalance > 0 && surplusBalance < requiredAmount) {
        defaultAmount = requiredAmount - surplusBalance;
    } else if (surplusBalance >= requiredAmount) {
        // Even if surplus covers it, they might want to pay 0 via MPESA, but MPESA minimum is 1.
        // We will just set it to requiredAmount, or 1? MPESA requires >= 1. 
        // We'll set it to 0 and handle it as a manual "Pay with Surplus" if 0? 
        // Wait, the backend doesn't support 0 stk push. Let's default to requiredAmount.
        defaultAmount = requiredAmount; 
    }

    const userData = JSON.parse(localStorage.getItem("userData") || "{}");
    setStkPhone(userData?.phone || "");
    setStkPeriodId(periodId);
    setAmountToPay(String(defaultAmount));
    setIsStkModalOpen(true);
  };

  const closeStkModal = () => {
    if (isStkSubmitting) return;
    setIsStkModalOpen(false);
    setStkPeriodId(null);
    setStkPhone("");
    setAmountToPay("");
  };

  const handleStkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stkPeriodId) return;

    setIsStkSubmitting(true);
    setActivePaymentId(stkPeriodId);
    setIsStkModalOpen(false);

    const loadingToast = toast.loading("Initiating STK Push...");

    try {
      const response = await contributionsApi.initiateStk(
        stkPeriodId,
        memberId,
        stkPhone.trim() || undefined,
        Number(amountToPay)
      );

      const checkoutId = response.data?.checkoutRequestId;
      if (!checkoutId) throw new Error("No Checkout ID received");

      toast.loading("Check your phone for PIN prompt...", { id: loadingToast });

      await pollStatus(checkoutId, loadingToast);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to start payment", {
        id: loadingToast,
      });
      setActivePaymentId(null);
    } finally {
      setIsStkSubmitting(false);
      setStkPeriodId(null);
      setStkPhone("");
      setAmountToPay("");
    }
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
      setActivePaymentId(null);
    }, 60000); // 60 seconds

    eventSource.addEventListener("payment-status", (event: any) => {
      const res = event.data;
      clearTimeout(timeout);
      
      if (res === "COMPLETED") {
        eventSource.close();
        toast.success("Contribution Paid!", { id: toastId });
        setIsSubmitting(false);
        setActivePaymentId(null);
        refetch();
      } else if (res === "FAILED" || res === "CANCELLED") {
        eventSource.close();
        toast.error("Payment failed or was cancelled", { id: toastId });
        setIsSubmitting(false);
        setActivePaymentId(null);
      }
    });

    eventSource.onerror = (err) => {
      console.warn("SSE connection connection error", err);
    };
  };

  useEffect(() => {
    refetch();
  }, [currentPage]);

  const columns = [
    {
      key: "date",
      header: "Period Date",
      render: (p: ContributionPeriod) => (
        <div className="font-bold text-gray-900">{formatDate(p.date)}</div>
      ),
    },
    {
      key: "required",
      header: "Target",
      render: (p: ContributionPeriod) => formatCurrency(p.totalTarget),
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
      render: (p: ContributionPeriod) => {
        const hasPaid = p.contributions?.some((c) => c.memberId === memberId);

        return (
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => setSelectedPeriod(p)}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-full"
            >
              <Eye size={18} />
            </button>

            {!hasPaid && (
              <button
                onClick={() => openStkModal(p.id)}
                disabled={activePaymentId === p.id}
                className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-full"
              >
                {activePaymentId === p.id ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <CreditCard size={18} />
                )}
              </button>
            )}
          </div>
        );
      },
    },
  ];

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} onRetry={refetch} />;

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Contributions</h1>
          <p className="text-sm text-gray-500 font-medium">
            Weekly Contributions tracking
          </p>
        </div>
        {/* Admin 'New Period' button removed */}
      </div>

      {/* Mobile & Desktop layouts */}
      <div className="md:hidden space-y-4">
        {periods.map((p) => {
          const hasPaid = p.contributions?.some((c) => c.memberId === memberId);

          return (
            <div
              key={p.id}
              className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-4"
            >
              <div className="flex justify-between items-center">
                <div className="font-bold text-gray-900">
                  {formatDate(p.date)}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedPeriod(p)}
                    className="p-2 bg-gray-50 rounded-full"
                  >
                    <Eye size={20} />
                  </button>

                  {!hasPaid && (
                    <button
                      onClick={() => openStkModal(p.id)}
                      disabled={activePaymentId === p.id}
                      className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-full"
                    >
                      {activePaymentId === p.id ? (
                        <Loader2 className="animate-spin" size={18} />
                      ) : (
                        <CreditCard size={18} />
                      )}
                    </button>
                  )}
                </div>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Collected:</span>
                <span className="font-bold text-emerald-600">
                  {formatCurrency(
                    p.contributions?.reduce((s, c) => s + c.amount, 0) || 0,
                  )}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="hidden md:block bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
        <Table columns={columns} data={periods} />
      </div>

      {metaData && metaData.totalPages > 1 && (
        <div className="flex justify-center mt-6">
          <Pagination
            page={currentPage}
            totalPages={metaData.totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      )}

      {/* Breakdown Modal */}
      <Modal
        isOpen={!!selectedPeriod}
        onClose={() => setSelectedPeriod(null)}
        title="Breakdown"
        size="lg"
      >
        <table className="min-w-full divide-y divide-gray-200 mt-4">
          <tbody className="bg-white divide-y divide-gray-100">
            {selectedPeriod?.contributions.map((c) => (
              <tr key={c.id}>
                <td className="px-6 py-4 text-sm font-semibold">
                  {c.memberName}
                </td>
                <td className="px-6 py-4 text-sm text-emerald-600 font-bold">
                  {formatCurrency(c.amount)}
                </td>
                <td className="px-6 py-4 text-xs text-gray-400">
                  {formatDateTime(c.paymentDate)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Modal>

      {/* New Period Modal removed */}

      {/* STK Push Confirmation Modal */}
      {isStkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full md:max-w-md bg-white rounded-t-3xl md:rounded-3xl shadow-2xl overflow-hidden animate-slide-up md:animate-none">
            {/* Header */}
            <div className="sticky top-0 p-4 border-b flex justify-between items-center bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                  <CreditCard size={18} />
                </div>
                <h3 className="font-bold text-gray-900">M-Pesa Payment</h3>
              </div>
              <button
                onClick={closeStkModal}
                className="p-2 hover:bg-gray-200 rounded-full"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleStkSubmit} className="p-4 space-y-4">
              {/* Info box */}
              <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100">
                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">
                  Weekly Contribution
                </p>
                <p className="text-xs text-emerald-700 font-medium mb-2">
                  An STK Push will be sent to the number below. You can also pay more to add to your surplus.
                </p>
                {surplusBalance > 0 && (
                  <div className="mt-2 p-2 bg-emerald-100 rounded text-xs text-emerald-800 font-bold">
                    You have a surplus of {formatCurrency(surplusBalance)}. 
                    {surplusBalance < (periods.find(p => p.id === stkPeriodId)?.amountRequired || 0) && (
                      <span> We recommend paying {formatCurrency((periods.find(p => p.id === stkPeriodId)?.amountRequired || 0) - surplusBalance)} to cover the rest.</span>
                    )}
                  </div>
                )}
              </div>

              {/* Amount input */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                  Amount to Pay (Ksh)
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={amountToPay}
                  onChange={(e) => setAmountToPay(e.target.value)}
                  className="w-full px-4 py-4 bg-gray-50 border-2 border-transparent rounded-xl outline-none focus:border-emerald-500 focus:bg-white font-bold text-base transition-all"
                />
              </div>

              {/* Phone input */}
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
                    autoFocus
                    type="tel"
                    required
                    value={stkPhone}
                    onChange={(e) => setStkPhone(e.target.value)}
                    placeholder="e.g. 0712345678"
                    className="w-full pl-10 pr-4 py-4 bg-gray-50 border-2 border-transparent rounded-xl outline-none focus:border-emerald-500 focus:bg-white font-bold text-base transition-all"
                  />
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeStkModal}
                  className="flex-1 py-4 font-bold text-gray-500 hover:bg-gray-100 rounded-xl transition-all border border-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isStkSubmitting}
                  className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl shadow-xl shadow-emerald-200 flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                  {isStkSubmitting ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : (
                    <>
                      <CreditCard size={16} />
                      Send STK Push
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
