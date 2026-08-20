import { Link } from "react-router-dom";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart as RePieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { ArrowDownRight, ArrowUpRight, Receipt, Scale } from "lucide-react";
import { useEffect, useState } from "react";
import { analyticsApi, DashboardAnalytics } from "../services/api";
import { formatCurrency } from "../utils/format";

const SLICE_COLORS = ["#059669", "#0d9488", "#0891b2", "#6366f1", "#f59e0b", "#ef4444", "#8b5cf6"];

export function TreasuryAnalytics({ months = 6 }: { months?: number }) {
  const [data, setData] = useState<DashboardAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    analyticsApi
      .get(months)
      .then((d) => mounted && setData(d))
      .catch(() => mounted && setData(null))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, [months]);

  if (loading)
    return <div className="h-64 rounded-2xl bg-gray-100 animate-pulse" aria-hidden />;
  if (!data) return null;

  const trend = data.cashFlowTrend ?? [];
  const equity = (data.equityDistribution ?? [])
    .filter((e) => e.equityPercentage > 0)
    .slice(0, 7);

  const tiles = [
    {
      label: "Money in",
      value: data.moneyIn,
      icon: ArrowDownRight,
      tone: "text-emerald-700 bg-emerald-50",
    },
    {
      label: "Money out",
      value: data.moneyOut,
      icon: ArrowUpRight,
      tone: "text-rose-700 bg-rose-50",
    },
    {
      label: "Transaction fees",
      value: data.transactionFees,
      icon: Receipt,
      tone: "text-amber-700 bg-amber-50",
    },
    {
      label: "Liquid balance",
      value: data.liquidBalance,
      icon: Scale,
      tone: "text-teal-700 bg-teal-50",
    },
  ];

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {tiles.map(({ label, value, icon: Icon, tone }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-100 p-3 md:p-4 shadow-sm">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${tone}`}>
              <Icon size={16} />
            </div>
            <p className="text-[10px] md:text-xs uppercase tracking-wider text-gray-500 font-semibold">
              {label}
            </p>
            <p className="text-base md:text-xl font-bold text-gray-900">{formatCurrency(value)}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-4 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base md:text-lg font-semibold text-gray-900">
              Money in &amp; money out
            </h2>
            <Link to="/cash-flow" className="text-xs md:text-sm font-medium text-emerald-700 hover:text-emerald-800">
              View ledger
            </Link>
          </div>
          <div className="h-56 md:h-72 -ml-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend}>
                <defs>
                  <linearGradient id="inGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#059669" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="outGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" width={70} />
                <Tooltip formatter={(v: any) => formatCurrency(Number(v))} />
                <Area
                  type="monotone"
                  dataKey="moneyIn"
                  name="Money in"
                  stroke="#059669"
                  fill="url(#inGrad)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="moneyOut"
                  name="Money out"
                  stroke="#f43f5e"
                  fill="url(#outGrad)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 md:p-6">
          <h2 className="text-base md:text-lg font-semibold text-gray-900 mb-2">Ownership split</h2>
          <p className="text-xs text-gray-500 mb-2">Equity from valid general-fund savings</p>
          {equity.length === 0 ? (
            <p className="text-sm text-gray-400 py-10 text-center">No savings recorded yet</p>
          ) : (
            <div className="h-56 md:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RePieChart>
                  <Pie
                    data={equity}
                    dataKey="equityPercentage"
                    nameKey="memberName"
                    innerRadius="55%"
                    outerRadius="85%"
                    paddingAngle={2}
                  >
                    {equity.map((_: unknown, i: number) => (
                      <Cell key={i} fill={SLICE_COLORS[i % SLICE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: any) => `${Number(v).toFixed(2)}%`} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </RePieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MiniStat label="Total savings" value={formatCurrency(data.totalSavings)} />
        <MiniStat label="Outstanding loans" value={formatCurrency(data.outstandingLoans)} />
        <MiniStat label="Unpaid fines" value={formatCurrency(data.unpaidFines)} />
        <MiniStat label="Loan recovery" value={`${Number(data.recoveryRate ?? 0).toFixed(1)}%`} />
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-3 md:p-4">
      <p className="text-[10px] md:text-xs text-gray-500 uppercase tracking-wider font-semibold">
        {label}
      </p>
      <p className="text-sm md:text-lg font-bold text-gray-900 mt-1">{value}</p>
    </div>
  );
}
