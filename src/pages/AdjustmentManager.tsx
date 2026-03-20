import React, { useState, useEffect } from "react";
import {
  Plus,
  Download,
  MoreHorizontal,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  ChevronRight,
  X,
} from "lucide-react";
import { adjustmentApi } from "../services/api";
import { AccountAdjustment, AdjustmentType } from "../types";
import { formatCurrency, formatDate } from "../utils/format";
import toast from "react-hot-toast";

const AdjustmentDashboard = () => {
  const [adjustments, setAdjustments] = useState<AccountAdjustment[]>([]);
  const [activeType, setActiveType] = useState<AdjustmentType>(
    AdjustmentType.CREDIT,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAdjustment, setSelectedAdjustment] =
    useState<AccountAdjustment | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    amount: 0,
    transactionCost: 0,
    description: "",
    date: new Date().toISOString().split("T")[0],
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const data = await adjustmentApi.getAll(activeType);
      setAdjustments(data);
    } catch (error) {
      console.error("Data fetch failed", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeType]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...formData,
      type: activeType,
      transactionCost:
        activeType === AdjustmentType.CREDIT ? formData.transactionCost : 0,
      totalCost:
        activeType === AdjustmentType.CREDIT
          ? formData.amount + formData.transactionCost
          : formData.amount,
    };

    await adjustmentApi.create(payload);
    setIsModalOpen(false);
    toast.success("Adjustment created successfully!");
    setFormData({
      amount: 0,
      transactionCost: 0,
      description: "",
      date: new Date().toISOString().split("T")[0],
    });
    fetchData();
  };

  const totalCredits = adjustments
    .filter((a) => a.type === AdjustmentType.CREDIT)
    .reduce((sum, a) => sum + a.totalCost, 0);

  const totalDebits = adjustments
    .filter((a) => a.type === AdjustmentType.DEBIT)
    .reduce((sum, a) => sum + a.totalCost, 0);

  return (
    <div className="min-h-screen bg-gray-50 px-3 sm:px-4 md:px-6 lg:px-8 py-4 md:py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Section - Mobile Optimized */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 md:mb-8">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
              Account Adjustments
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Manage and track manual debit/credit entries.
            </p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <button className="flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 sm:py-2 text-xs sm:text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex-1 sm:flex-none">
              <Download size={14} className="sm:w-4 sm:h-4" />
              <span className="hidden xs:inline">Export</span>
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 sm:py-2 text-xs sm:text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-sm transition-all flex-1 sm:flex-none"
            >
              <Plus size={14} className="sm:w-4 sm:h-4" />
              <span className="hidden xs:inline">Add Adjustment</span>
              <span className="xs:hidden">Add</span>
            </button>
          </div>
        </div>

        {/* Summary Cards - Mobile View */}
        <div className="grid grid-cols-2 gap-3 mb-6 md:hidden">
          <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-emerald-500">
            <p className="text-xs text-gray-500 mb-1">Total Credits</p>
            <p className="text-lg font-bold text-emerald-600">
              {formatCurrency(totalCredits)}
            </p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-red-500">
            <p className="text-xs text-gray-500 mb-1">Total Debits</p>
            <p className="text-lg font-bold text-red-600">
              {formatCurrency(totalDebits)}
            </p>
          </div>
        </div>

        {/* Tab Switcher - Mobile Optimized */}
        <div className="flex bg-gray-100 p-1 rounded-xl mb-6 md:mb-8">
          {(["CREDIT", "DEBIT"] as AdjustmentType[]).map((type) => (
            <button
              key={type}
              onClick={() => setActiveType(type)}
              className={`flex-1 py-3 text-sm font-medium rounded-lg transition-all ${
                activeType === type
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        {/* Mobile View: Card Layout */}
        <div className="block md:hidden space-y-3">
          {isLoading ? (
            Array(3)
              .fill(0)
              .map((_, i) => (
                <div
                  key={i}
                  className="bg-white p-4 rounded-xl shadow-sm animate-pulse"
                >
                  <div className="h-4 bg-gray-200 rounded w-1/3 mb-3"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))
          ) : adjustments.length === 0 ? (
            <div className="bg-white p-8 rounded-xl text-center">
              <p className="text-gray-400 italic">
                No {activeType.toLowerCase()} adjustments found.
              </p>
            </div>
          ) : (
            adjustments.map((adj) => (
              <div
                key={adj.id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
                onClick={() => setSelectedAdjustment(adj)}
              >
                <div className="p-4">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div
                        className={`p-2 rounded-lg ${
                          adj.type === AdjustmentType.CREDIT
                            ? "bg-emerald-100"
                            : "bg-red-100"
                        }`}
                      >
                        {adj.type === AdjustmentType.CREDIT ? (
                          <ArrowDownLeft
                            size={16}
                            className="text-emerald-600"
                          />
                        ) : (
                          <ArrowUpRight size={16} className="text-red-600" />
                        )}
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">
                          {formatDate(adj.date)}
                        </p>
                      </div>
                    </div>
                    <ChevronRight size={18} className="text-gray-400" />
                  </div>

                  {/* Description */}
                  <p className="text-sm font-medium text-gray-900 mb-3 line-clamp-2">
                    {adj.description}
                  </p>

                  {/* Amount Details */}
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    <div className="bg-gray-50 p-2 rounded-lg">
                      <p className="text-[10px] text-gray-500 mb-1">
                        Base Amount
                      </p>
                      <p className="text-sm font-mono">
                        {formatCurrency(adj.amount)}
                      </p>
                    </div>
                    {adj.type === AdjustmentType.CREDIT && (
                      <div className="bg-gray-50 p-2 rounded-lg">
                        <p className="text-[10px] text-gray-500 mb-1">
                          Transaction Fee
                        </p>
                        <p className="text-sm font-mono">
                          {formatCurrency(adj.transactionCost)}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Total */}
                  <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-xs text-gray-500">Total</span>
                    <span
                      className={`font-bold font-mono ${
                        adj.type === AdjustmentType.CREDIT
                          ? "text-emerald-600"
                          : "text-red-600"
                      }`}
                    >
                      {formatCurrency(adj.totalCost)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop View: Table */}
        <div className="hidden md:block bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">
                    Amount
                  </th>
                  {activeType === AdjustmentType.CREDIT && (
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">
                      Trans. Cost
                    </th>
                  )}
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">
                    Total Cost
                  </th>
                  <th className="px-6 py-4 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {isLoading ? (
                  Array(5)
                    .fill(0)
                    .map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td colSpan={6} className="px-6 py-4 bg-gray-50/50" />
                      </tr>
                    ))
                ) : adjustments.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-12 text-center text-gray-400 italic"
                    >
                      No adjustments found for this category.
                    </td>
                  </tr>
                ) : (
                  adjustments.map((adj) => (
                    <tr
                      key={adj.id}
                      className="hover:bg-gray-50/80 transition-colors group"
                    >
                      <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                        {formatDate(adj.date)}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {adj.description}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 text-right font-mono">
                        {formatCurrency(adj.amount)}
                      </td>
                      {activeType === AdjustmentType.CREDIT && (
                        <td className="px-6 py-4 text-sm text-gray-400 text-right font-mono">
                          {formatCurrency(adj.transactionCost)}
                        </td>
                      )}
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 font-bold font-mono ${
                            adj.type === AdjustmentType.CREDIT
                              ? "text-emerald-600"
                              : "text-red-600"
                          }`}
                        >
                          {adj.type === AdjustmentType.CREDIT ? (
                            <ArrowDownLeft size={14} />
                          ) : (
                            <ArrowUpRight size={14} />
                          )}
                          {formatCurrency(adj.totalCost)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => setSelectedAdjustment(adj)}
                          className="text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <MoreHorizontal size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile Details Modal */}
        {selectedAdjustment && (
          <div
            className="fixed inset-0 bg-black/50 z-50 flex items-end md:hidden"
            onClick={() => setSelectedAdjustment(null)}
          >
            <div
              className="bg-white rounded-t-2xl w-full max-h-[90vh] overflow-y-auto animate-slide-up"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-white border-b px-4 py-3 flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">
                  Adjustment Details
                </h3>
                <button
                  onClick={() => setSelectedAdjustment(null)}
                  className="p-1 hover:bg-gray-100 rounded-full"
                >
                  <X size={20} className="text-gray-500" />
                </button>
              </div>

              <div className="p-4 space-y-4">
                {/* Type Badge */}
                <div
                  className={`inline-block px-3 py-1.5 rounded-lg text-xs font-bold ${
                    selectedAdjustment.type === AdjustmentType.CREDIT
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {selectedAdjustment.type}
                </div>

                {/* Description */}
                <div className="bg-gray-50 p-4 rounded-xl">
                  <p className="text-xs text-gray-500 mb-1">Description</p>
                  <p className="text-gray-900 font-medium">
                    {selectedAdjustment.description}
                  </p>
                </div>

                {/* Date */}
                <div className="bg-gray-50 p-4 rounded-xl">
                  <p className="text-xs text-gray-500 mb-1">Transaction Date</p>
                  <p className="text-gray-900 font-medium">
                    {formatDate(selectedAdjustment.date)}
                  </p>
                </div>

                {/* Financial Details */}
                <div className="bg-gray-50 p-4 rounded-xl space-y-3">
                  <DetailRow
                    label="Base Amount"
                    value={formatCurrency(selectedAdjustment.amount)}
                  />
                  {selectedAdjustment.type === AdjustmentType.CREDIT && (
                    <DetailRow
                      label="Transaction Fee"
                      value={formatCurrency(selectedAdjustment.transactionCost)}
                    />
                  )}
                  <div className="pt-2 border-t border-gray-200">
                    <DetailRow
                      label="Total"
                      value={formatCurrency(selectedAdjustment.totalCost)}
                      highlight
                    />
                  </div>
                </div>

                <button
                  onClick={() => setSelectedAdjustment(null)}
                  className="w-full py-3 text-gray-600 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal - Mobile Friendly */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40 backdrop-blur-[2px]">
            <div className="bg-white w-full md:max-w-lg rounded-t-2xl md:rounded-2xl shadow-2xl overflow-hidden animate-slide-up md:animate-none max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white px-4 sm:px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                  New {activeType} Adjustment
                </h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <X size={18} className="text-gray-500" />
                </button>
              </div>

              <form onSubmit={handleCreate} className="p-4 sm:p-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-500 uppercase">
                    Transaction Date
                  </label>
                  <div className="relative">
                    <Calendar
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                      size={16}
                    />
                    <input
                      type="date"
                      required
                      className="w-full pl-9 pr-3 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none text-sm"
                      value={formData.date}
                      onChange={(e) =>
                        setFormData({ ...formData, date: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-500 uppercase">
                    Description
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={100}
                    className="w-full px-3 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none text-sm"
                    placeholder="e.g. Monthly maintenance fee"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-500 uppercase">
                      Base Amount
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      className="w-full px-3 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none text-sm"
                      value={formData.amount || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          amount: parseFloat(e.target.value) || 0,
                        })
                      }
                    />
                  </div>

                  {activeType === AdjustmentType.CREDIT ? (
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-gray-500 uppercase">
                        Transaction Fee
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        className="w-full px-3 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none text-sm"
                        value={formData.transactionCost || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            transactionCost: parseFloat(e.target.value) || 0,
                          })
                        }
                      />
                    </div>
                  ) : (
                    <div className="space-y-2 opacity-50">
                      <label className="text-xs font-semibold text-gray-500 uppercase">
                        Transaction Fee
                      </label>
                      <div className="w-full px-3 py-3 bg-gray-100 border border-gray-200 rounded-lg text-sm text-gray-400">
                        N/A for Debits
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-4 p-4 bg-blue-50 rounded-xl flex items-center justify-between border border-blue-100">
                  <span className="text-xs font-medium text-blue-700">
                    Calculated Total:
                  </span>
                  <span className="text-lg font-black text-blue-900 font-mono">
                    {(activeType === AdjustmentType.CREDIT
                      ? (formData.amount || 0) + (formData.transactionCost || 0)
                      : formData.amount || 0
                    ).toLocaleString()}
                  </span>
                </div>

                <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4 sticky bottom-0 bg-white pb-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-3 text-sm font-semibold text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors w-full sm:w-auto"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-3 text-sm font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all w-full sm:w-auto"
                  >
                    Confirm Adjustment
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

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

export default AdjustmentDashboard;
