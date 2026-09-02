/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  AlertCircle,
  CheckCircle,
  Gavel,
  Plus,
  ChevronRight,
  Phone,
  X,
} from "lucide-react";
import { useApi } from "../hooks/useApi";
import { contributionsApi, finesApi, membersApi } from "../services/api";
import { formatCurrency, formatDate } from "../utils/format";
import { API_URL } from "../config/constant";
import { FineRequest, FineStatus, Role, FineTypeRequest } from "../types";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { ErrorMessage } from "../components/ErrorMessage";

const Fines: React.FC = () => {
  const [activeTab, setActiveTab] = useState<FineStatus>(FineStatus.UNPAID);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRecordFineTypeModalOpen, setIsRecordFineTypeModalOpen] =
    useState(false);
  const [selectedFine, setSelectedFine] = useState<any>(null);

  const [isSettleModalOpen, setIsSettleModalOpen] = useState(false);
  const [fineToSettleObj, setFineToSettleObj] = useState<any>(null);
  const [repayPhone, setRepayPhone] = useState<string>("");
  const [surplusBalance, setSurplusBalance] = useState(0);
  const [formData, setFormData] = useState<FineRequest>({
    memberId: 0,
    fineTypeId: 0,
    fineDate: new Date().toISOString().split("T")[0],
  });
  const [fineTypeFormData, setFineTypeFormData] = useState<FineTypeRequest>({
    name: "",
    description: "",
    amount: 0,
    percentage: 0,
  });

  const role: Role = (localStorage.getItem("role") as Role) || "MEMBER";
  const userData = JSON.parse(localStorage.getItem("userData") || "{}");

  const {
    data: fines,
    loading: finesLoading,
    error: finesError,
    refetch: refetchFines,
  } = useApi(async () => {
    const data = await finesApi.getAll(activeTab);
    return { data };
  });
  const { data: members } = useApi(async () => ({
    data: await membersApi.getAll(),
  }));

  useEffect(() => {
    if (userData?.memberId) {
      // We can use fetch or useApi for surplus but let's just fetch it
      fetch(`${API_URL}/contribution/surplus/${userData.memberId}`)
        .then((res) => res.json())
        .then((data) => setSurplusBalance(data))
        .catch((err) => console.error("Error fetching surplus:", err));
    }
  }, [userData?.memberId]);

  const {
    data: fineTypes,
    loading: fineTypesLoading,
    error: fineTypesError,
  } = useApi(async () => ({
    data: await finesApi.getTypes(),
  }));

  useEffect(() => {
    refetchFines();
  }, [activeTab, refetchFines]);

  useEffect(() => {
    if (fineTypes?.length && formData.fineTypeId === 0) {
      setFormData((prev) => ({
        ...prev,
        fineTypeId: fineTypes[0].id,
      }));
    }
  }, [fineTypes, formData.fineTypeId]);

  const totalUnpaid =
    fines
      ?.filter((f) => f.status === FineStatus.UNPAID)
      .reduce((sum, f) => sum + f.amount, 0) || 0;
  const totalPaid =
    fines
      ?.filter((f) => f.status === FineStatus.PAID)
      .reduce((sum, f) => sum + f.amount, 0) || 0;

  const handleRecordFine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.memberId === 0) return toast.error("Please select a member");
    if (formData.fineTypeId === 0)
      return toast.error("Please select a fine type");

    await toast.promise(finesApi.record(formData), {
      loading: "Saving...",
      success: "Fine recorded!",
      error: "Error recording fine.",
    });
    setIsModalOpen(false);
    setFormData({
      memberId: 0,
      fineTypeId: fineTypes?.[0]?.id ?? 0,
      fineDate: new Date().toISOString().split("T")[0],
    });
    refetchFines();
  };

  const handleRecordFineType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fineTypeFormData.name.trim())
      return toast.error("Please enter a fine type name");
    if (fineTypeFormData.amount <= 0 && fineTypeFormData.percentage <= 0)
      return toast.error("Please enter either an amount or percentage");

    await toast.promise(finesApi.createType(fineTypeFormData), {
      loading: "Creating fine type...",
      success: "Fine type created successfully!",
      error: "Error creating fine type.",
    });
    setIsRecordFineTypeModalOpen(false);
    setFineTypeFormData({
      name: "",
      description: "",
      amount: 0,
      percentage: 0,
    });
    // Refetch fine types to update the dropdown
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOpenSettleModal = (fine: any) => {
    setFineToSettleObj(fine);
    setRepayPhone(userData?.phone || "");
    setIsSettleModalOpen(true);
  };

  const handleCloseSettleModal = () => {
    setIsSettleModalOpen(false);
    setFineToSettleObj(null);
    setRepayPhone("");
  };

  const handleSettleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fineToSettleObj) return;

    setIsSubmitting(true);
    const loadingToast = toast.loading("Initiating STK Push for fine...");

    try {
      const response = await finesApi.settle(
        fineToSettleObj.id,
        repayPhone.trim() || undefined,
      );

      // Extract the checkoutRequestId from your ResponseHandler
      const checkoutId = response.data?.checkoutRequestId;

      if (!checkoutId) throw new Error("No Checkout ID received");

      toast.loading("Check your phone for the PIN prompt...", {
        id: loadingToast,
      });

      await pollFineStatus(checkoutId, loadingToast);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to initiate payment", {
        id: loadingToast,
      });
      setIsSubmitting(false);
    }
  };

  const pollFineStatus = async (checkoutId: string, toastId: string) => {
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
        toast.success("Fine Paid Successfully!", { id: toastId });
        setIsSubmitting(false);
        handleCloseSettleModal();
        setSelectedFine(null);
        refetchFines();
      } else if (res === "FAILED" || res === "CANCELLED") {
        eventSource.close();
        toast.error("Payment failed or was cancelled.", { id: toastId });
        setIsSubmitting(false);
      }
    });

    eventSource.onerror = (err) => {
      console.warn("SSE connection error", err);
    };
  };

  const handleDelete = async (fineId: number) => {
    if (
      !window.confirm("Are you sure you want to permanently delete this fine?")
    )
      return;
    try {
      await toast.promise(finesApi.delete(fineId), {
        loading: "Deleting fine...",
        success: "Fine deleted successfully!",
        error: "Failed to delete fine",
      });
      refetchFines();
      setSelectedFine(null);
    } catch (e) {
      console.error(e);
    }
  };

  if (finesLoading) return <LoadingSpinner />;
  if (finesError)
    return <ErrorMessage message={finesError} onRetry={refetchFines} />;

  return (
    <div className="space-y-4 md:space-y-6 px-2 sm:px-4 md:px-0">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <Gavel className="w-5 h-5 sm:w-6 sm:h-6" /> Fine Records
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Manage member fines and payments
          </p>
        </div>

        {role === "ADMIN" && (
          <div className="flex gap-2 w-full sm:w-auto flex-col sm:flex-row">
            <button
              onClick={() => setIsRecordFineTypeModalOpen(true)}
              className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm sm:text-base"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" /> Add Fine Type
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm sm:text-base"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" /> Record New Fine
            </button>
          </div>
        )}
      </div>

      {/* Tab Navigation - Mobile Optimized */}
      <div className="bg-gray-100 p-1 rounded-xl flex items-center w-full sm:w-fit shadow-inner">
        <button
          onClick={() => setActiveTab(FineStatus.PAID)}
          className={`flex-1 sm:flex-none px-4 sm:px-6 py-2.5 sm:py-2 text-sm font-semibold rounded-lg transition-all ${
            activeTab === FineStatus.PAID
              ? "bg-white text-indigo-600 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Paid
        </button>
        <button
          onClick={() => setActiveTab(FineStatus.UNPAID)}
          className={`flex-1 sm:flex-none px-4 sm:px-6 py-2.5 sm:py-2 text-sm font-semibold rounded-lg transition-all ${
            activeTab === FineStatus.UNPAID
              ? "bg-white text-indigo-600 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Unpaid
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-3 sm:gap-4">
        {activeTab === FineStatus.UNPAID && (
          <div className="bg-white p-4 sm:p-5 rounded-xl shadow-sm border-l-4 border-red-500">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs sm:text-sm text-gray-500 font-medium">
                  Total Unpaid Fines
                </p>
                <p className="text-xl sm:text-2xl font-bold text-gray-800">
                  {formatCurrency(totalUnpaid)}
                </p>
              </div>
              <AlertCircle className="text-red-500 w-6 h-6 sm:w-8 sm:h-8" />
            </div>
          </div>
        )}
        {activeTab === FineStatus.PAID && (
          <div className="bg-white p-4 sm:p-5 rounded-xl shadow-sm border-l-4 border-green-500">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs sm:text-sm text-gray-500 font-medium">
                  Total Collected
                </p>
                <p className="text-xl sm:text-2xl font-bold text-gray-800">
                  {formatCurrency(totalPaid)}
                </p>
              </div>
              <CheckCircle className="text-green-500 w-6 h-6 sm:w-8 sm:h-8" />
            </div>
          </div>
        )}
      </div>

      {/* Mobile View: Card Layout */}
      <div className="block md:hidden space-y-3">
        {fines?.map((fine) => (
          <div
            key={fine.id}
            className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
            onClick={() => setSelectedFine(fine)}
          >
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm">
                    {fine.memberName?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {fine.memberName}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {fine.narrative?.includes("_")
                        ? fine.narrative.replace("_", " ")
                        : fine.narrative}
                    </p>
                  </div>
                </div>
                <ChevronRight size={18} className="text-gray-400" />
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-gray-500">Amount</p>
                  <p className="font-bold text-gray-900">
                    {formatCurrency(fine.amount)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Fine Date</p>
                  <p className="text-gray-900">{formatDate(fine.issuedOn)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Recorded</p>
                  <p className="text-gray-900">{formatDate(fine.issuedOn)}</p>
                </div>
                {activeTab === FineStatus.PAID && fine.paidOn && (
                  <div className="col-span-2">
                    <p className="text-xs text-gray-500">Paid Date</p>
                    <p className="text-gray-900">{formatDate(fine.paidOn)}</p>
                  </div>
                )}
              </div>

              <div className="mt-3 pt-3 border-t flex gap-2">
                {activeTab === FineStatus.UNPAID &&
                  fine.memberId === userData?.memberId && (
                    <button
                      disabled={isSubmitting}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenSettleModal(fine);
                      }}
                      className="flex-1 bg-indigo-600 disabled:bg-indigo-300 text-white px-4 py-2.5 rounded-lg text-sm font-medium"
                    >
                      {isSubmitting ? "Processing..." : "Settle Fine"}
                    </button>
                  )}
                {["ADMIN", "CHAIRPERSON", "TREASURER"].includes(role) && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(fine.id);
                    }}
                    className="flex-1 bg-red-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop View: Table */}
      <div className="hidden md:block bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">
                  Member
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">
                  Type
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">
                  Amount
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">
                  Fine Date
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">
                  Recorded
                </th>
                {activeTab === FineStatus.PAID && (
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">
                    Paid Date
                  </th>
                )}
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {fines?.map((fine) => (
                <tr
                  key={fine.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {fine.memberName}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {fine.narrative?.includes("_")
                      ? fine.narrative.replace("_", " ")
                      : fine.narrative}
                  </td>
                  <td className="px-6 py-4 text-sm font-bold">
                    {formatCurrency(fine.amount)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {formatDate(fine.issuedOn)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {formatDate(fine.issuedOn)}
                  </td>
                  {activeTab === FineStatus.PAID ? (
                    <td className="px-6 py-4 text-sm font-bold">
                      {formatDate(fine.paidOn)}
                    </td>
                  ) : null}
                  <td className="px-6 py-4 text-center flex items-center justify-center gap-2">
                    {activeTab === FineStatus.UNPAID &&
                      fine.memberId === userData?.memberId && (
                        <button
                          onClick={() => handleOpenSettleModal(fine)}
                          className="text-xs bg-indigo-600 text-white px-4 py-1.5 rounded-md hover:bg-indigo-700 shadow-sm"
                        >
                          Settle
                        </button>
                      )}
                    {["ADMIN", "CHAIRPERSON", "TREASURER"].includes(role) && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(fine.id);
                        }}
                        className="text-xs bg-red-600 text-white px-3 py-1.5 rounded-md hover:bg-red-700 shadow-sm"
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {fines?.length === 0 && !finesLoading && (
          <div className="p-10 text-center text-gray-400 italic">
            No {activeTab.toLowerCase()} fines found.
          </div>
        )}
      </div>

      {/* Mobile Empty State */}
      {fines?.length === 0 && !finesLoading && (
        <div className="block md:hidden p-8 text-center text-gray-400 italic bg-white rounded-xl border border-gray-100">
          No {activeTab.toLowerCase()} fines found.
        </div>
      )}

      {/* Mobile Fine Details Modal */}
      {selectedFine && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-end md:hidden"
          onClick={() => setSelectedFine(null)}
        >
          <div
            className="bg-white rounded-t-2xl w-full max-h-[90vh] overflow-y-auto animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b px-4 py-3 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Fine Details</h3>
              <button
                onClick={() => setSelectedFine(null)}
                className="p-1 hover:bg-gray-100 rounded-full"
              >
                <AlertCircle size={20} className="text-gray-500" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xl">
                  {selectedFine.memberName?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {selectedFine.memberName}
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {selectedFine.type}
                  </p>
                </div>
              </div>

              <div className="space-y-3 bg-gray-50 p-4 rounded-xl">
                <DetailRow
                  label="Amount"
                  value={
                    <span className="font-bold">
                      {formatCurrency(selectedFine.amount)}
                    </span>
                  }
                />
                <DetailRow
                  label="Fine Date"
                  value={formatDate(selectedFine.issuedOn)}
                />
                <DetailRow
                  label="Recorded On"
                  value={formatDate(selectedFine.createdAt)}
                />
                {activeTab === FineStatus.PAID && selectedFine.paidOn && (
                  <DetailRow
                    label="Paid Date"
                    value={formatDate(selectedFine.paidOn)}
                  />
                )}
                <DetailRow
                  label="Status"
                  value={
                    <span
                      className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                        selectedFine.status === FineStatus.PAID
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {selectedFine.status}
                    </span>
                  }
                />
              </div>

              {activeTab === FineStatus.UNPAID &&
                selectedFine.memberId === userData?.memberId && (
                  <button
                    disabled={isSubmitting}
                    onClick={() => handleOpenSettleModal(selectedFine)}
                    className="w-full bg-indigo-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
                  >
                    {isSubmitting ? "Processing..." : "Settle Fine"}
                  </button>
                )}

              <button
                onClick={() => setSelectedFine(null)}
                className="w-full px-4 py-3 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal - Mobile Friendly */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end md:items-center justify-center z-50 p-4">
          <div className="bg-white rounded-t-2xl md:rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-slide-up md:animate-none">
            <div className="sticky top-0 bg-white border-b px-4 py-3 flex items-center justify-between">
              <h3 className="text-lg font-bold">Record New Fine</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 hover:bg-gray-100 rounded-full"
              >
                <AlertCircle size={20} className="text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleRecordFine} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1">
                  Member <span className="text-red-500">*</span>
                </label>
                <select
                  className="w-full border rounded-lg p-3 bg-gray-50 text-sm"
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      memberId: Number(e.target.value),
                    })
                  }
                  value={formData.memberId || ""}
                  required
                >
                  <option value="">Choose a member...</option>
                  {members?.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.fullName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold mb-1">
                    Type
                  </label>
                  <select
                    className="w-full border rounded-lg p-3 bg-gray-50 text-sm"
                    value={formData.fineTypeId || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        fineTypeId: Number(e.target.value),
                      })
                    }
                    required
                    disabled={fineTypesLoading}
                  >
                    <option value="">Choose a fine type...</option>
                    {fineTypes?.map((t) => (
                      <option key={t.id} value={t.id}>
                        {(
                          t.name ||
                          t.type ||
                          t.fineTypeName ||
                          String(t.id)
                        ).replace("_", " ")}
                      </option>
                    ))}
                  </select>
                  {fineTypesError && (
                    <p className="mt-1 text-sm text-red-500">
                      Unable to load fine types. Please try again.
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">
                  Fine Date
                </label>
                <input
                  type="date"
                  className="w-full border rounded-lg p-3 bg-gray-50 text-sm"
                  value={formData.fineDate}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      fineDate: e.target.value,
                    })
                  }
                  required
                />
              </div>

              <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4 sticky bottom-0 bg-white pb-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-3 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors w-full sm:w-auto"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-colors w-full sm:w-auto"
                >
                  Save Fine
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Fine Type Modal - Mobile Friendly */}
      {isRecordFineTypeModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end md:items-center justify-center z-50 p-4">
          <div className="bg-white rounded-t-2xl md:rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-slide-up md:animate-none">
            <div className="sticky top-0 bg-white border-b px-4 py-3 flex items-center justify-between">
              <h3 className="text-lg font-bold">Record Fine Type</h3>
              <button
                onClick={() => setIsRecordFineTypeModalOpen(false)}
                className="p-1 hover:bg-gray-100 rounded-full"
              >
                <AlertCircle size={20} className="text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleRecordFineType} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1">
                  Fine Type Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g., Late Payment, Absenteeism"
                  className="w-full border rounded-lg p-3 bg-gray-50 text-sm"
                  value={fineTypeFormData.name}
                  onChange={(e) =>
                    setFineTypeFormData({
                      ...fineTypeFormData,
                      name: e.target.value,
                    })
                  }
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">
                  Description
                </label>
                <textarea
                  placeholder="Describe the fine type..."
                  className="w-full border rounded-lg p-3 bg-gray-50 text-sm resize-none"
                  rows={3}
                  value={fineTypeFormData.description}
                  onChange={(e) =>
                    setFineTypeFormData({
                      ...fineTypeFormData,
                      description: e.target.value,
                    })
                  }
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold mb-1">
                    Amount (Fixed)
                  </label>
                  <input
                    type="number"
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    className="w-full border rounded-lg p-3 bg-gray-50 text-sm"
                    value={fineTypeFormData.amount || ""}
                    onChange={(e) =>
                      setFineTypeFormData({
                        ...fineTypeFormData,
                        amount: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1">
                    Percentage (%)
                  </label>
                  <input
                    type="number"
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    max="100"
                    className="w-full border rounded-lg p-3 bg-gray-50 text-sm"
                    value={fineTypeFormData.percentage || ""}
                    onChange={(e) =>
                      setFineTypeFormData({
                        ...fineTypeFormData,
                        percentage: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>
              </div>

              <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4 sticky bottom-0 bg-white pb-2">
                <button
                  type="button"
                  onClick={() => setIsRecordFineTypeModalOpen(false)}
                  className="px-4 py-3 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors w-full sm:w-auto"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition-colors w-full sm:w-auto"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Settle Fine Modal */}
      {isSettleModalOpen && fineToSettleObj && (
        <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full md:max-w-md bg-white rounded-t-3xl md:rounded-3xl shadow-2xl overflow-hidden animate-slide-up md:animate-none">
            <div className="sticky top-0 p-4 border-b flex justify-between items-center bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                  <Gavel size={18} />
                </div>
                <h3 className="font-bold text-gray-900">Settle Fine</h3>
              </div>
              <button
                onClick={handleCloseSettleModal}
                className="p-2 hover:bg-gray-200 rounded-full"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSettleSubmit} className="p-4 space-y-4">
              <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100">
                <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-1">
                  Fine Details
                </p>
                <p className="font-black text-indigo-900">
                  {fineToSettleObj.fineTypeName?.includes("_")
                    ? fineToSettleObj.fineTypeName.replace("_", " ")
                    : fineToSettleObj.fineTypeName}
                </p>
                {surplusBalance > 0 && (
                  <div className="mt-2 p-2 bg-indigo-100 rounded text-xs text-indigo-800 font-bold">
                    You have a surplus of {formatCurrency(surplusBalance)}.
                    Contact an Admin to apply this surplus towards your fine
                    manually, or proceed to pay via M-Pesa.
                  </div>
                )}
                <div className="mt-3 pt-3 border-t border-indigo-100 flex justify-between items-center">
                  <span className="text-xs font-bold text-indigo-700">
                    Amount Due:
                  </span>
                  <span className="text-lg font-black text-indigo-900 font-mono">
                    {formatCurrency(fineToSettleObj.amount)}
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
                    className="w-full pl-10 pr-4 py-4 bg-gray-50 border-2 border-transparent rounded-xl outline-none focus:border-indigo-500 focus:bg-white font-bold text-base transition-all"
                  />
                </div>
                <p className="text-[10px] text-gray-400 ml-1">
                  STK push will be sent to this number. Edit if paying from a
                  different number.
                </p>
              </div>

              <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCloseSettleModal}
                  className="flex-1 py-4 font-bold text-gray-500 hover:bg-gray-100 rounded-xl transition-all border border-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl shadow-xl shadow-indigo-200 flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                  {isSubmitting ? "Processing..." : "Pay Fine"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper component for detail rows
function DetailRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-900">{value}</span>
    </div>
  );
}

export default Fines;
