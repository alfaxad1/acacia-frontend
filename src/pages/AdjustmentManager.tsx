import React, { useState, useEffect } from "react";
import {
  Plus,
  Download,
  MoreHorizontal,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
} from "lucide-react";
import { adjustmentApi } from "../services/api";
import { AccountAdjustment, AdjustmentType } from "../types";
import { formatCurrency, formatDate } from "../utils/format";
import toast from "react-hot-toast";

const AdjustmentDashboard = () => {
  const [adjustments, setAdjustments] = useState<AccountAdjustment[]>([]);
  const [activeType, setActiveType] = useState<AdjustmentType>(
    AdjustmentType.CREDIT
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

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
      ...formData,
      amount: 0,
      transactionCost: 0,
      description: "",
    });
    fetchData();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              Account Adjustments
            </h1>
            <p className="text-gray-500 text-sm">
              Manage and track manual debit/credit entries.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <Download size={16} /> Export
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-sm transition-all"
            >
              <Plus size={16} /> Add Adjustment
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-gray-200 mb-6">
          {(["CREDIT", "DEBIT"] as AdjustmentType[]).map((type) => (
            <button
              key={type}
              onClick={() => setActiveType(type)}
              className={`px-6 py-3 text-sm font-medium transition-colors relative ${
                activeType === type
                  ? "text-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {type}
              {activeType === type && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
              )}
            </button>
          ))}
        </div>

        {/* Table Container */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
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
                            activeType === AdjustmentType.CREDIT
                              ? "text-red-600"
                              : "text-emerald-600"
                          }`}
                        >
                          {activeType === AdjustmentType.CREDIT ? (
                            <ArrowDownLeft size={14} />
                          ) : (
                            <ArrowUpRight size={14} />
                          )}
                          {formatCurrency(adj.totalCost)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity">
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
      </div>

      {/* Slide-over Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">
                New {activeType} Adjustment
              </h2>
              <span
                className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                  activeType === AdjustmentType.CREDIT
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                Manual Entry
              </span>
            </div>

            <form onSubmit={handleCreate} className="p-8 space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
                  Transaction Date
                </label>
                <div className="relative">
                  <Calendar
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                    size={18}
                  />
                  <input
                    type="date"
                    required
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-100 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-700"
                    value={formData.date}
                    onChange={(e) =>
                      setFormData({ ...formData, date: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase">
                  Description
                </label>
                <input
                  type="text"
                  required
                  maxLength={100}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none"
                  placeholder="e.g. Monthly maintenance fee"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase">
                    Base Amount
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none"
                    value={formData.amount || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        amount: parseFloat(e.target.value),
                      })
                    }
                  />
                </div>
                {activeType === AdjustmentType.CREDIT ? (
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-500 uppercase">
                      Transaction Fee
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none"
                      value={formData.transactionCost || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          transactionCost: parseFloat(e.target.value),
                        })
                      }
                    />
                  </div>
                ) : (
                  <div className="space-y-1 opacity-50">
                    <label className="text-xs font-semibold text-gray-500 uppercase">
                      Transaction Fee
                    </label>
                    <div className="w-full px-4 py-2.5 bg-gray-100 border border-gray-200 rounded-lg text-sm text-gray-400">
                      N/A for Debits
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 p-4 bg-blue-50 rounded-xl flex items-center justify-between border border-blue-100">
                <span className="text-sm font-medium text-blue-700">
                  Calculated Total:
                </span>
                <span className="text-2xl font-black text-blue-900 font-mono">
                  $
                  {(activeType === AdjustmentType.CREDIT
                    ? formData.amount + formData.transactionCost
                    : formData.amount
                  ).toFixed(2)}
                </span>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-3 text-sm font-semibold text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all"
                >
                  Confirm Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdjustmentDashboard;
