import React, { useEffect, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import { AlertCircle, CheckCircle, Gavel, Plus } from "lucide-react";
import { useApi } from "../hooks/useApi";
import { finesApi, membersApi } from "../services/api";
import { FineRequest, FineStatus, FineTyp } from "../types";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { ErrorMessage } from "../components/ErrorMessage";
import { formatCurrency, formatDate } from "../utils/format";

const Fines: React.FC = () => {
  const [activeTab, setActiveTab] = useState<FineStatus>(FineStatus.UNPAID);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<FineRequest>({
    memberId: 0,
    type: FineTyp.LATE_MEETINGS,
    amount: 0,
    fineDate: new Date().toISOString().split("T")[0],
  });

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
    refetchFines();
  };

  const handleSettle = async (fineId: number) => {
    await toast.promise(finesApi.settle(fineId), {
      loading: "Settling...",
      success: "Fine Settled!",
      error: "Failed to settle.",
    });
    refetchFines();
  };

  if (finesLoading) return <LoadingSpinner />;
  if (finesError)
    return <ErrorMessage message={finesError} onRetry={refetchFines} />;

  return (
    <div className="p-6 space-y-6">
      <Toaster position="top-right" reverseOrder={false} />
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Gavel className="w-6 h-6" /> Fine Records
          </h2>
        </div>

        <div className="bg-gray-100 p-1 rounded-xl flex items-center w-fit shadow-inner">
          <button
            onClick={() => setActiveTab(FineStatus.PAID)}
            className={`px-6 py-2 text-sm font-semibold rounded-lg transition-all ${
              activeTab === FineStatus.PAID
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Paid
          </button>
          <button
            onClick={() => setActiveTab(FineStatus.UNPAID)}
            className={`px-6 py-2 text-sm font-semibold rounded-lg transition-all ${
              activeTab === FineStatus.UNPAID
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Unpaid
          </button>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700"
        >
          <Plus className="w-4 h-4" /> Record New Fine
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {activeTab === FineStatus.UNPAID && (
          <div className="bg-white p-5 rounded-xl shadow-sm border-l-4 border-red-500">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500 font-medium">
                  Total Unpaid Fines
                </p>
                <p className="text-2xl font-bold text-gray-800">
                  {formatCurrency(totalUnpaid)}
                </p>
              </div>
              <AlertCircle className="text-red-500 w-8 h-8" />
            </div>
          </div>
        )}
        {activeTab === FineStatus.PAID && (
          <div className="bg-white p-5 rounded-xl shadow-sm border-l-4 border-green-500">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500 font-medium">
                  Total Collected
                </p>
                <p className="text-2xl font-bold text-gray-800">
                  {formatCurrency(totalPaid)}
                </p>
              </div>
              <CheckCircle className="text-green-500 w-8 h-8" />
            </div>
          </div>
        )}
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
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

                {activeTab === FineStatus.UNPAID && (
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

        {fines?.length === 0 && !finesLoading && (
          <div className="p-10 text-center text-gray-400 italic">
            No {activeTab.toLowerCase()} fines found.
          </div>
        )}
      </div>

      {/* 4. MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-xl font-bold mb-6">Record New Fine</h3>
            <form onSubmit={handleRecordFine} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1">
                  Member
                </label>
                <select
                  className="w-full border rounded-lg p-2.5 bg-gray-50"
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      memberId: Number(e.target.value),
                    })
                  }
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1">
                    Type
                  </label>
                  <select
                    className="w-full border rounded-lg p-2.5 bg-gray-50"
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
                    Amount
                  </label>
                  <input
                    type="number"
                    className="w-full border rounded-lg p-2.5 bg-gray-50"
                    placeholder="0.00"
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        amount: Number(e.target.value),
                      })
                    }
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-500 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700"
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

export default Fines;
