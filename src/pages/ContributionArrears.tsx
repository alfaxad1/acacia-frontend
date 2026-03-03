import { useState, useEffect } from "react";
import {
  Search,
  Download,
  AlertCircle,
  Calendar,
  User,
  ArrowRight,
} from "lucide-react";
import { ContributionArrearDto } from "../types";
import { arrearsApi } from "../services/api";

const ContributionArrears = () => {
  const [data, setData] = useState<ContributionArrearDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchArrears = async () => {
    setLoading(true);
    try {
      const response = await arrearsApi.getArrears(); // Fetching first 100 for the list
      if (response.message === "SUCCESS") {
        setData(response.data);
      }
      console.log("Arrears data loaded successfully", response.data);
    } catch (error) {
      console.error("Failed to load arrears", error);
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

  // Totals for the header cards
  const totalArrears = filteredData.reduce(
    (sum, item) => sum + item.arrearAmount,
    0
  );
  const totalFines = filteredData.reduce(
    (sum, item) => sum + item.fineAmount,
    0
  );

  return (
    <div className="min-h-screen bg-gray-50/50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Area */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
              <AlertCircle className="text-red-500" /> Missed Contributions
            </h1>
            <p className="text-gray-500 text-sm font-medium">
              Tracking members with outstanding contributions.
            </p>
          </div>
          <div className="flex gap-2">
            <button className="p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
              <Download size={20} className="text-gray-600" />
            </button>
            <button className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all">
              Generate Report
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">
              Total Arrears
            </p>
            <p className="text-3xl font-black text-gray-900">
              ${totalArrears.toLocaleString()}
            </p>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">
              Accumulated Fines
            </p>
            <p className="text-3xl font-black text-orange-600">
              ${totalFines.toLocaleString()}
            </p>
          </div>
          <div className="bg-blue-600 p-6 rounded-3xl shadow-xl shadow-blue-100">
            <p className="text-xs font-black text-blue-100 uppercase tracking-widest mb-2">
              Total Outstanding
            </p>
            <p className="text-3xl font-black text-white">
              ${(totalArrears + totalFines).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Table Controls */}
        <div className="bg-white rounded-t-[2rem] border-x border-t border-gray-100 p-6">
          <div className="relative max-w-md">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Search member name..."
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-medium transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* The Table */}
        <div className="bg-white rounded-b-[2rem] border border-gray-100 shadow-xl shadow-gray-200/40 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                    Member
                  </th>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                    Period
                  </th>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-right">
                    Arrear Amount
                  </th>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-right">
                    Fine
                  </th>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-right">
                    Total Payable
                  </th>
                  <th className="px-8 py-5"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="p-20 text-center text-gray-400 animate-pulse font-bold uppercase tracking-widest"
                    >
                      Synchronizing Data...
                    </td>
                  </tr>
                ) : filteredData.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="p-20 text-center text-gray-400 font-medium"
                    >
                      No arrears found for the selected criteria.
                    </td>
                  </tr>
                ) : (
                  filteredData.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-blue-50/30 transition-colors group"
                    >
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                            <User size={18} />
                          </div>
                          <span className="font-bold text-gray-900">
                            {item.memberName}
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-2 text-gray-500 font-medium text-sm">
                          <Calendar size={14} />
                          {new Date(item.periodDate).toLocaleDateString(
                            "en-US",
                            { month: "short", year: "numeric" }
                          )}
                        </div>
                      </td>
                      <td className="px-8 py-5 text-right font-mono font-bold text-gray-700">
                        ${item.arrearAmount.toFixed(2)}
                      </td>
                      <td className="px-8 py-5 text-right font-mono font-bold text-orange-500">
                        ${item.fineAmount.toFixed(2)}
                      </td>
                      <td className="px-8 py-5 text-right">
                        <div className="inline-block px-4 py-2 bg-red-50 text-red-700 rounded-xl font-black font-mono">
                          ${(item.arrearAmount + item.fineAmount).toFixed(2)}
                        </div>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <button className="text-gray-300 hover:text-blue-600 transition-colors">
                          <ArrowRight size={20} />
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
    </div>
  );
};

export default ContributionArrears;
