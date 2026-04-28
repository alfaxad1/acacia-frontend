/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { Plus, Eye, Loader2, CreditCard } from "lucide-react";
import { Table } from "../components/Table";
import { Modal } from "../components/Modal";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { ErrorMessage } from "../components/ErrorMessage";
import { useApi } from "../hooks/useApi";
import { contributionsApi, periodsApi } from "../services/api";
import { formatCurrency, formatDateTime, formatDate } from "../utils/format";
import type { ContributionPeriod, Role } from "../types";
import toast from "react-hot-toast";

export function Contributions() {
  const [selectedPeriod, setSelectedPeriod] =
    useState<ContributionPeriod | null>(null);
  const [activePaymentId, setActivePaymentId] = useState<number | null>(null);
  const [isPeriodModalOpen, setIsPeriodModalOpen] = useState(false);
  const [periodDate, setPeriodDate] = useState("");
  const memberId = Number(localStorage.getItem("memberId"));
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    data: apiResponse,
    loading,
    error,
    refetch,
  } = useApi(async () => {
    const periodsRes = await periodsApi.getWithContributions();
    return { data: { periods: periodsRes } };
  });

  const role: Role = (localStorage.getItem("role") as Role) || "MEMBER";
  const periods: ContributionPeriod[] = apiResponse?.periods || [];

  const handleInitiatePayment = async (periodId: number) => {
    const memberId = localStorage.getItem("memberId");
    if (!memberId) return toast.error("Please log in again");

    const confirmPay = window.confirm(
      "Initiate M-Pesa STK Push for this period?",
    );
    if (!confirmPay) return;

    setActivePaymentId(periodId);

    const loadingToast = toast.loading("Initiating STK Push...");

    try {
      const response = await contributionsApi.initiateStk(
        periodId,
        Number(memberId),
      );

      const checkoutId = response.data?.checkoutRequestId;
      if (!checkoutId) throw new Error("No Checkout ID received");

      toast.loading("Check your phone for PIN prompt...", { id: loadingToast });

      await pollStatus(checkoutId, loadingToast, periodId);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to start payment", {
        id: loadingToast,
      });
      setActivePaymentId(null);
    }
  };

  const pollStatus = async (
    checkoutId: string,
    toastId: string,
    periodId: number,
  ) => {
    console.log("Polling for period:", periodId);
    let attempts = 0;

    const interval = setInterval(async () => {
      try {
        attempts++;

        const res = await contributionsApi.checkStatus(checkoutId);

        if (res === "COMPLETED") {
          clearInterval(interval);
          toast.success("Contribution Paid!", { id: toastId });
          setIsSubmitting(false);
          setActivePaymentId(null);
          refetch();
        } else if (res === "FAILED") {
          clearInterval(interval);
          toast.error("Payment failed", { id: toastId });
          setActivePaymentId(null);
        }

        if (attempts >= 15) {
          clearInterval(interval);
          toast.error("Timed out. Check status later", { id: toastId });
          setIsSubmitting(false);
          setActivePaymentId(null);
        }
      } catch (e) {
        console.error("Error checking payment status:", e);
        console.warn("Polling...");
      }
    }, 5000);
  };

  const handlePeriodSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await periodsApi.create({ date: periodDate });
      setIsPeriodModalOpen(false);
      setPeriodDate("");
      refetch();
      toast.success("Period created");
    } catch (err) {
      console.error(err);
      toast.error("Failed to create period");
    } finally {
      setIsSubmitting(false);
    }
  };

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
      render: (p: ContributionPeriod) => formatCurrency(p.amountRequired),
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
                onClick={() => handleInitiatePayment(p.id)}
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
        {role === "ADMIN" && (
          <button
            onClick={() => setIsPeriodModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-100 active:scale-95 transition-all"
          >
            <Plus size={18} /> <span>New Period</span>
          </button>
        )}
      </div>

      {/* Mobile & Desktop layouts use same simple patterns as Loans/Fines */}
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
                      onClick={() => handleInitiatePayment(p.id)}
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

      {/* Simple Modals */}
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

      <Modal
        isOpen={isPeriodModalOpen}
        onClose={() => setIsPeriodModalOpen(false)}
        title="New Period"
      >
        <form onSubmit={handlePeriodSubmit} className="space-y-4 p-2">
          <input
            type="date"
            required
            className="w-full p-4 bg-gray-50 border rounded-xl"
            value={periodDate}
            onChange={(e) => setPeriodDate(e.target.value)}
          />
          <button
            disabled={isSubmitting}
            className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl shadow-blue-100 transition-all active:scale-95"
          >
            {isSubmitting ? (
              <Loader2 className="animate-spin mx-auto" />
            ) : (
              "Confirm New Period"
            )}
          </button>
        </form>
      </Modal>
    </div>
  );
}
