import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { AlertCircle, CheckCircle, Gavel, Plus, ChevronRight } from "lucide-react";
import { useApi } from "../hooks/useApi";
import { finesApi, membersApi } from "../services/api";
import { FineRequest, FineStatus, FineTyp, Role } from "../types";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { ErrorMessage } from "../components/ErrorMessage";
import { formatCurrency, formatDate } from "../utils/format";

const Fines: React.FC = () => {
  const [activeTab, setActiveTab] = useState<FineStatus>(FineStatus.UNPAID);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFine, setSelectedFine] = useState<any>(null);
  const [formData, setFormData] = useState<FineRequest>({
    memberId: 0,
    type: FineTyp.LATE_MEETINGS,
    amount: 0,
    fineDate: new Date().toISOString().split("T")[0],
  });

  const role: Role = (localStorage.getItem("role") as Role) || "MEMBER";

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
    refetchFines();
  }, [activeTab]);

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

    await toast.promise(finesApi.record(formData), {
      loading: "Saving...",
      success: "Fine recorded!",
      error: "Error recording fine.",
    });
    setIsModalOpen(false);
    setFormData({
      memberId: 0,
      type: FineTyp.LATE_MEETINGS,
      amount: 0,
      fineDate: new Date().toISOString().split("T")[0],
    });
    refetchFines();
  };

  const handleSettle = async (fineId: number) => {
    await toast.promise(finesApi.settle(fineId), {
      loading: "Settling...",
      success: "Fine Settled!",
      error: "Failed to settle.",
    });
    setSelectedFine(null);
    refetchFines();
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
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm sm:text-base w-full sm:w-auto"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" /> Record New Fine
          </button>
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
                    <h3 className="font-semibold text-gray-900">{fine.memberName}</h3>
                    <p className="text-xs text-gray-500">
                      {fine.type.replace("_", " ")}
                    </p>
                  </div>
                </div>
                <ChevronRight size={18} className="text-gray-400" />
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-gray-500">Amount</p>
                  <p className="font-bold text-gray-900">{formatCurrency(fine.amount)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Fine Date</p>
                  <p className="text-gray-900">{formatDate(fine.date)}</p>
                </div>
                {activeTab === FineStatus.PAID && fine.paidDate && (
                  <div className="col-span-2">
                    <p className="text-xs text-gray-500">Paid Date</p>
                    <p className="text-gray-900">{formatDate(fine.paidDate)}</p>
                  </div>
                )}
              </div>

              {activeTab === FineStatus.UNPAID && role === "ADMIN" && (
                <div className="mt-3 pt-3 border-t">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSettle(fine.id);
                    }}
                    className="w-full bg-indigo-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
                  >
                    Settle Fine
                  </button>
                </div>
              )}
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
                {activeTab === FineStatus.UNPAID && (
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase">
                    Action
                  </th>
                )}
                {activeTab === FineStatus.PAID && (
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">
                    Paid Date
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {fines?.map((fine) => (
                <tr key={fine.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {fine.memberName}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {fine.type.replace("_", " ")}
                  </td>
                  <td className="px-6 py-4 text-sm font-bold">
                    {formatCurrency(fine.amount)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {formatDate(fine.date)}
                  </td>
                  {activeTab === FineStatus.PAID && (
                    <td className="px-6 py-4 text-sm font-bold">
                      {formatDate(fine.paidDate)}
                    </td>
                  )}

                  {activeTab === FineStatus.UNPAID && role === "ADMIN" && (
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleSettle(fine.id)}
                        className="text-xs bg-indigo-600 text-white px-4 py-1.5 rounded-md hover:bg-indigo-700 shadow-sm"
                      >
                        Settle
                      </button>
                    </td>
                  )}
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
                  <h2 className="text-xl font-bold text-gray-900">{selectedFine.memberName}</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {selectedFine.type.replace("_", " ")}
                  </p>
                </div>
              </div>

              <div className="space-y-3 bg-gray-50 p-4 rounded-xl">
                <DetailRow 
                  label="Amount" 
                  value={<span className="font-bold">{formatCurrency(selectedFine.amount)}</span>}
                />
                <DetailRow 
                  label="Fine Date" 
                  value={formatDate(selectedFine.date)} 
                />
                {activeTab === FineStatus.PAID && selectedFine.paidDate && (
                  <DetailRow 
                    label="Paid Date" 
                    value={formatDate(selectedFine.paidDate)} 
                  />
                )}
                <DetailRow 
                  label="Status" 
                  value={
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                      selectedFine.status === FineStatus.PAID 
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}>
                      {selectedFine.status}
                    </span>
                  } 
                />
              </div>

              {activeTab === FineStatus.UNPAID && role === "ADMIN" && (
                <button
                  onClick={() => {
                    handleSettle(selectedFine.id);
                    setSelectedFine(null);
                  }}
                  className="w-full bg-indigo-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
                >
                  Settle Fine
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
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        type: e.target.value as FineTyp,
                      })
                    }
                  >
                    {Object.values(FineTyp).map((t) => (
                      <option key={t} value={t}>
                        {t.replace("_", " ")}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold mb-1">
                    Amount (UGX)
                  </label>
                  <input
                    type="number"
                    className="w-full border rounded-lg p-3 bg-gray-50 text-sm"
                    placeholder="0.00"
                    value={formData.amount || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        amount: Number(e.target.value),
                      })
                    }
                    required
                    min="0"
                    step="100"
                  />
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
    </div>
  );
};

// Helper component for detail rows
function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-900">{value}</span>
    </div>
  );
}

export default Fines;