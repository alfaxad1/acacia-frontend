import { useState, useEffect } from "react";
import {
  Search,
  Download,
  AlertCircle,
  Calendar,
  User,
  ArrowRight,
  X,
  ChevronRight,
} from "lucide-react";
import { ContributionArrearDto } from "../types";
import { arrearsApi } from "../services/api";

const ContributionArrears = () => {
  const [data, setData] = useState<ContributionArrearDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedArrear, setSelectedArrear] = useState<ContributionArrearDto | null>(null);

  const fetchArrears = async () => {
    setLoading(true);
    try {
      const response = await arrearsApi.getArrears();
      setData(response);
    } catch (error) {
      console.error("Network or Server error", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArrears();
  }, []);

  const filteredData = data.filter((item) =>
    item.memberName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalArrears = filteredData.reduce(
    (sum, item) => sum + item.arrearAmount,
    0
  );
  const totalFines = filteredData.reduce(
    (sum, item) => sum + item.fineAmount,
    0
  );
  const totalOutstanding = totalArrears + totalFines;

  return (
    <div className="min-h-screen bg-gray-50/50 px-3 sm:px-4 md:px-6 lg:px-8 py-4 md:py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Area - Mobile Optimized */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 md:mb-8">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-gray-900 flex items-center gap-2">
              <AlertCircle className="text-red-500 w-5 h-5 sm:w-6 sm:h-6" /> 
              Missed Contributions
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 font-medium mt-1">
              Tracking members with outstanding contributions.
            </p>
          </div>
          <div className="flex gap-2">
            <button className="p-2.5 sm:p-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
              <Download size={18} className="sm:w-5 sm:h-5 text-gray-600" />
            </button>
            <button className="bg-blue-600 text-white px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl font-bold text-xs sm:text-sm shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all flex-1 sm:flex-none">
              Generate Report
            </button>
          </div>
        </div>

        {/* Summary Cards - Mobile Optimized */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6 mb-6 md:mb-8">
          <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-gray-100 shadow-sm">
            <p className="text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-widest mb-1 sm:mb-2">
              Total Arrears
            </p>
            <p className="text-xl sm:text-2xl lg:text-3xl font-black text-gray-900">
              KSh {totalArrears.toLocaleString()}
            </p>
          </div>
          <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-gray-100 shadow-sm">
            <p className="text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-widest mb-1 sm:mb-2">
              Accumulated Fines
            </p>
            <p className="text-xl sm:text-2xl lg:text-3xl font-black text-orange-600">
              KSh {totalFines.toLocaleString()}
            </p>
          </div>
          <div className="bg-blue-600 p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-xl shadow-blue-100 col-span-1 sm:col-span-2 lg:col-span-1">
            <p className="text-[10px] sm:text-xs font-black text-blue-100 uppercase tracking-widest mb-1 sm:mb-2">
              Total Outstanding
            </p>
            <p className="text-xl sm:text-2xl lg:text-3xl font-black text-white">
              KSh {totalOutstanding.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Search Bar - Mobile Optimized */}
        <div className="bg-white rounded-t-2xl sm:rounded-t-[2rem] border-x border-t border-gray-100 p-4 sm:p-6">
          <div className="relative">
            <Search
              className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-gray-400"
              size={16}
            />
            <input
              type="text"
              placeholder="Search member name..."
              className="w-full pl-9 sm:pl-12 pr-4 py-2.5 sm:py-3 bg-gray-50 border-none rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-sm sm:text-base transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Mobile View: Card Layout */}
        <div className="block md:hidden bg-white rounded-b-2xl border-x border-b border-gray-100 shadow-xl shadow-gray-200/40 p-3">
          {loading ? (
            <div className="p-8 text-center">
              <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-400 text-sm font-medium">Loading arrears...</p>
            </div>
          ) : filteredData.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                <AlertCircle size={24} className="text-gray-300" />
              </div>
              <p className="text-sm">No arrears found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredData.map((item) => (
                <div
                  key={item.id}
                  className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm hover:shadow-md transition-all"
                  onClick={() => setSelectedArrear(item)}
                >
                  {/* Member Info */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                        {item.memberName?.charAt(0).toUpperCase() || '?'}
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">{item.memberName}</h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {new Date(item.periodDate).toLocaleDateString("en-US", {
                            month: "short",
                            year: "numeric"
                          })}
                        </p>
                      </div>
                    </div>
                    <ChevronRight size={18} className="text-gray-400" />
                  </div>

                  {/* Amounts */}
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    <div className="bg-gray-50 p-2 rounded-lg">
                      <p className="text-[10px] text-gray-500 mb-1">Arrear</p>
                      <p className="text-sm font-bold text-gray-700">
                        KSh {item.arrearAmount.toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-gray-50 p-2 rounded-lg">
                      <p className="text-[10px] text-gray-500 mb-1">Fine</p>
                      <p className="text-sm font-bold text-orange-600">
                        KSh {item.fineAmount.toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-red-50 p-2 rounded-lg">
                      <p className="text-[10px] text-gray-500 mb-1">Total</p>
                      <p className="text-sm font-bold text-red-600">
                        KSh {(item.arrearAmount + item.fineAmount).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Desktop View: Table */}
        <div className="hidden md:block bg-white rounded-b-[2rem] border-x border-b border-gray-100 shadow-xl shadow-gray-200/40 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="px-6 lg:px-8 py-4 lg:py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                    Member
                  </th>
                  <th className="px-6 lg:px-8 py-4 lg:py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                    Period
                  </th>
                  <th className="px-6 lg:px-8 py-4 lg:py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-right">
                    Arrear Amount
                  </th>
                  <th className="px-6 lg:px-8 py-4 lg:py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-right">
                    Fine
                  </th>
                  <th className="px-6 lg:px-8 py-4 lg:py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-right">
                    Total Payable
                  </th>
                  <th className="px-6 lg:px-8 py-4 lg:py-5"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredData.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-blue-50/30 transition-colors group"
                  >
                    <td className="px-6 lg:px-8 py-4 lg:py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                          <User size={16} className="lg:w-[18px] lg:h-[18px]" />
                        </div>
                        <span className="font-bold text-gray-900 text-sm lg:text-base">
                          {item.memberName}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 lg:px-8 py-4 lg:py-5">
                      <div className="flex items-center gap-2 text-gray-500 font-medium text-xs lg:text-sm">
                        <Calendar size={12} className="lg:w-4 lg:h-4" />
                        {new Date(item.periodDate).toLocaleDateString(
                          "en-US",
                          { month: "short", year: "numeric" }
                        )}
                      </div>
                    </td>
                    <td className="px-6 lg:px-8 py-4 lg:py-5 text-right font-mono font-bold text-gray-700 text-sm lg:text-base">
                      KSh {item.arrearAmount.toLocaleString()}
                    </td>
                    <td className="px-6 lg:px-8 py-4 lg:py-5 text-right font-mono font-bold text-orange-500 text-sm lg:text-base">
                      KSh {item.fineAmount.toLocaleString()}
                    </td>
                    <td className="px-6 lg:px-8 py-4 lg:py-5 text-right">
                      <div className="inline-block px-3 lg:px-4 py-1.5 lg:py-2 bg-red-50 text-red-700 rounded-lg lg:rounded-xl font-black font-mono text-xs lg:text-sm">
                        KSh {(item.arrearAmount + item.fineAmount).toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 lg:px-8 py-4 lg:py-5 text-right">
                      <button className="text-gray-300 hover:text-blue-600 transition-colors">
                        <ArrowRight size={18} className="lg:w-5 lg:h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile Details Modal */}
        {selectedArrear && (
          <div
            className="fixed inset-0 bg-black/50 z-50 flex items-end md:hidden"
            onClick={() => setSelectedArrear(null)}
          >
            <div
              className="bg-white rounded-t-2xl w-full max-h-[90vh] overflow-y-auto animate-slide-up"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-white border-b px-4 py-3 flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Arrear Details</h3>
                <button
                  onClick={() => setSelectedArrear(null)}
                  className="p-1 hover:bg-gray-100 rounded-full"
                >
                  <X size={20} className="text-gray-500" />
                </button>
              </div>
              
              <div className="p-4 space-y-4">
                {/* Member Info */}
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-xl shadow-md">
                    {selectedArrear.memberName?.charAt(0).toUpperCase() || '?'}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{selectedArrear.memberName}</h2>
                    <p className="text-sm text-gray-500 mt-1">Member</p>
                  </div>
                </div>

                {/* Period */}
                <div className="bg-gray-50 p-4 rounded-xl">
                  <p className="text-xs text-gray-500 mb-1">Contribution Period</p>
                  <p className="text-base font-medium text-gray-900">
                    {new Date(selectedArrear.periodDate).toLocaleDateString("en-US", {
                      month: "long",
                      year: "numeric"
                    })}
                  </p>
                </div>

                {/* Amount Details */}
                <div className="bg-gray-50 p-4 rounded-xl space-y-3">
                  <DetailRow 
                    label="Arrear Amount" 
                    value={`KSh ${selectedArrear.arrearAmount.toLocaleString()}`}
                  />
                  <DetailRow 
                    label="Fine Amount" 
                    value={`KSh ${selectedArrear.fineAmount.toLocaleString()}`}
                    highlight
                  />
                  <div className="pt-2 border-t border-gray-200">
                    <DetailRow 
                      label="Total Payable" 
                      value={`KSh ${(selectedArrear.arrearAmount + selectedArrear.fineAmount).toLocaleString()}`}
                      bold
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => {
                      // Handle payment
                      setSelectedArrear(null);
                    }}
                    className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors"
                  >
                    Record Payment
                  </button>
                </div>

                <button
                  onClick={() => setSelectedArrear(null)}
                  className="w-full py-3 text-gray-600 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Helper component for detail rows
function DetailRow({ label, value, highlight = false, bold = false }: { 
  label: string; 
  value: string; 
  highlight?: boolean;
  bold?: boolean;
}) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm text-gray-500">{label}</span>
      <span className={`text-sm ${bold ? 'font-bold' : 'font-medium'} ${
        highlight ? 'text-orange-600' : 'text-gray-900'
      }`}>
        {value}
      </span>
    </div>
  );
}

export default ContributionArrears;