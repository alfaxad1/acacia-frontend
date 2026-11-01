import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  Search,
  ScrollText,
  Shield,
  User,
  Settings,
  Wallet,
  Gavel,
  HeartHandshake,
  HandCoins,
  BarChart3,
  Building2,
  RefreshCw,
  Calendar,
  ChevronDown,
} from "lucide-react";
import { auditApi, AuditLogDto } from "../services/api";
import { formatDateTime } from "../utils/format";
import { LoadingSpinner } from "../components/LoadingSpinner";
import Pagination from "../components/Pagination";

// ─── Category config ────────────────────────────────────────────────────────

const CATEGORIES = [
  { value: "",             label: "All",          icon: ScrollText,    color: "bg-gray-100 text-gray-700" },
  { value: "CONTRIBUTION", label: "Contributions", icon: Wallet,        color: "bg-emerald-100 text-emerald-700" },
  { value: "LOAN",         label: "Loans",         icon: HandCoins,     color: "bg-blue-100 text-blue-700" },
  { value: "FINE",         label: "Fines",         icon: Gavel,         color: "bg-red-100 text-red-700" },
  { value: "MEMBER",       label: "Members",       icon: User,          color: "bg-purple-100 text-purple-700" },
  { value: "WELFARE",      label: "Welfare",       icon: HeartHandshake, color: "bg-pink-100 text-pink-700" },
  { value: "INVESTMENT",   label: "Investments",   icon: Building2,     color: "bg-amber-100 text-amber-700" },
  { value: "DIVIDEND",     label: "Dividends",     icon: BarChart3,     color: "bg-teal-100 text-teal-700" },
  { value: "SETTINGS",     label: "Settings",      icon: Settings,      color: "bg-indigo-100 text-indigo-700" },
  { value: "SYSTEM",       label: "System",        icon: Shield,        color: "bg-slate-100 text-slate-700" },
];

const ACTION_COLORS: Record<string, string> = {
  CREATE:          "bg-emerald-50 text-emerald-700 border border-emerald-200",
  UPDATE:          "bg-blue-50 text-blue-700 border border-blue-200",
  DELETE:          "bg-red-50 text-red-700 border border-red-200",
  PAYMENT:         "bg-teal-50 text-teal-700 border border-teal-200",
  APPROVAL:        "bg-green-50 text-green-700 border border-green-200",
  REJECTION:       "bg-rose-50 text-rose-700 border border-rose-200",
  LOGIN:           "bg-gray-50 text-gray-700 border border-gray-200",
  SETTINGS_CHANGE: "bg-indigo-50 text-indigo-700 border border-indigo-200",
  DISBURSEMENT:    "bg-violet-50 text-violet-700 border border-violet-200",
  WAIVER:          "bg-orange-50 text-orange-700 border border-orange-200",
  SYSTEM:          "bg-slate-50 text-slate-700 border border-slate-200",
};

// ─── Component ──────────────────────────────────────────────────────────────

export default function AuditLogs() {
  const [logs, setLogs]             = useState<AuditLogDto[]>([]);
  const [page, setPage]             = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading]       = useState(true);
  const [totalElements, setTotalElements] = useState(0);

  // Filters
  const [category, setCategory]   = useState("");
  const [action, setAction]       = useState("");
  const [search, setSearch]       = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [from, setFrom]           = useState("");
  const [to, setTo]               = useState("");

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(0); }, 450);
    return () => clearTimeout(t);
  }, [search]);

  // Reset page when filters change
  useEffect(() => { setPage(0); }, [category, action, from, to]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const filters: Record<string, string> = {};
      if (category) filters.category = category;
      if (action)   filters.action   = action;
      if (debouncedSearch) filters.search = debouncedSearch;
      if (from) filters.from = from;
      if (to)   filters.to   = to;

      const data = await auditApi.getAll(page, 20, filters);
      setLogs(data.data ?? []);
      setTotalPages(Math.max(data.metaData?.totalPages ?? 1, 1));
      setTotalElements(data.metaData?.totalElements ?? 0);
    } catch {
      toast.error("Could not load audit logs");
    } finally {
      setLoading(false);
    }
  }, [page, category, action, debouncedSearch, from, to]);

  useEffect(() => { load(); }, [load]);

  const getCategoryConfig = (cat: string) =>
    CATEGORIES.find((c) => c.value === cat) ?? CATEGORIES[0];

  const initials = (name?: string | null) => {
    if (!name) return "?";
    const parts = name.trim().split(/\s+/);
    return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md">
            <ScrollText size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 md:text-2xl">Audit Log</h1>
            <p className="text-xs text-gray-500">
              {totalElements.toLocaleString()} event{totalElements !== 1 ? "s" : ""} recorded
            </p>
          </div>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 active:scale-95"
        >
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* ── Category Pill Filter ── */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const active = category === cat.value;
          return (
            <button
              key={cat.value}
              onClick={() => setCategory(cat.value)}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all duration-150 ${
                active
                  ? "bg-indigo-600 text-white shadow-md scale-105"
                  : "bg-white text-gray-600 border border-gray-200 hover:border-indigo-300 hover:text-indigo-700"
              }`}
            >
              <Icon size={13} />
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* ── Filter Bar ── */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        {/* Search */}
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
          <input
            type="text"
            placeholder="Search description or actor…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2 pl-9 pr-4 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          />
        </div>

        {/* Action filter */}
        <div className="relative">
          <select
            value={action}
            onChange={(e) => setAction(e.target.value)}
            className="appearance-none rounded-xl border border-gray-200 bg-gray-50 py-2 pl-3 pr-8 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          >
            <option value="">All actions</option>
            <option value="CREATE">Create</option>
            <option value="UPDATE">Update</option>
            <option value="DELETE">Delete</option>
            <option value="PAYMENT">Payment</option>
            <option value="APPROVAL">Approval</option>
            <option value="REJECTION">Rejection</option>
            <option value="DISBURSEMENT">Disbursement</option>
            <option value="WAIVER">Waiver</option>
            <option value="LOGIN">Login</option>
            <option value="SETTINGS_CHANGE">Settings change</option>
          </select>
          <ChevronDown size={13} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
        </div>

        {/* Date range */}
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Calendar size={15} className="text-gray-400 shrink-0" />
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          />
          <span className="text-gray-400">—</span>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          />
        </div>

        {/* Clear */}
        {(category || action || search || from || to) && (
          <button
            onClick={() => {
              setCategory(""); setAction(""); setSearch(""); setFrom(""); setTo("");
            }}
            className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-100 transition"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* ── Table ── */}
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center p-16">
            <LoadingSpinner />
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 p-16 text-gray-400">
            <ScrollText size={40} strokeWidth={1.2} />
            <p className="text-sm font-medium">No audit events match your filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-100 bg-gray-50 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                <tr>
                  <th className="px-5 py-4">Timestamp</th>
                  <th className="px-5 py-4">Actor</th>
                  <th className="px-5 py-4">Category</th>
                  <th className="px-5 py-4">Action</th>
                  <th className="px-5 py-4">Description</th>
                  <th className="px-5 py-4 hidden lg:table-cell">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {logs.map((log) => {
                  const catCfg = getCategoryConfig(log.category);
                  const CatIcon = catCfg.icon;
                  return (
                    <tr
                      key={log.id}
                      className="group transition-colors hover:bg-indigo-50/40"
                    >
                      {/* Timestamp */}
                      <td className="whitespace-nowrap px-5 py-3.5 text-gray-500">
                        <span className="font-mono text-[11px]">
                          {formatDateTime(log.occurredAt)}
                        </span>
                      </td>

                      {/* Actor */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-bold text-indigo-700">
                            {initials(log.actorName)}
                          </div>
                          <span className="font-medium text-gray-800 whitespace-nowrap">
                            {log.actorName ?? <span className="italic text-gray-400">System</span>}
                          </span>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${catCfg.color}`}>
                          <CatIcon size={11} />
                          {catCfg.label}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="px-5 py-3.5">
                        <span className={`inline-block rounded-md px-2 py-0.5 text-[11px] font-semibold ${ACTION_COLORS[log.action] ?? "bg-gray-50 text-gray-600 border border-gray-200"}`}>
                          {log.action.replace("_", " ")}
                        </span>
                      </td>

                      {/* Description */}
                      <td className="max-w-[320px] px-5 py-3.5">
                        <p className="truncate text-gray-700" title={log.description}>
                          {log.description}
                        </p>
                        {log.entityType && log.entityId && (
                          <p className="mt-0.5 font-mono text-[10px] text-gray-400">
                            {log.entityType} #{log.entityId}
                          </p>
                        )}
                      </td>

                      {/* IP */}
                      <td className="hidden px-5 py-3.5 lg:table-cell">
                        <span className="font-mono text-[11px] text-gray-400">
                          {log.ipAddress ?? "—"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="border-t border-gray-100">
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      </div>
    </div>
  );
}
