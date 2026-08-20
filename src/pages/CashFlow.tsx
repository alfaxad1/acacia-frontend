import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { ArrowDownRight, ArrowUpRight, Plus, Receipt, Scale } from "lucide-react";
import { cashFlowApi, CashFlowRow, CashFlowSummary } from "../services/api";
import { formatCurrency, formatDate } from "../utils/format";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { Modal } from "../components/Modal";
import Pagination from "../components/Pagination";

type Direction = "ALL" | "IN" | "OUT" | "FEE";

const FILTERS: { key: Direction; label: string }[] = [
  { key: "ALL", label: "Everything" },
  { key: "IN", label: "Money in" },
  { key: "OUT", label: "Money out" },
  { key: "FEE", label: "Fees" },
];

export default function CashFlow() {
  const role = localStorage.getItem("role") || "MEMBER";
  const [direction, setDirection] = useState<Direction>("ALL");
  const [page, setPage] = useState(0);
  const [rows, setRows] = useState<CashFlowRow[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [summary, setSummary] = useState<CashFlowSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    direction: "IN" as "IN" | "OUT" | "FEE",
    amount: "",
    transactionFee: "",
    description: "",
    date: new Date().toISOString().slice(0, 10),
    reference: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [movements, sum] = await Promise.all([
        cashFlowApi.movements(page, 15, direction),
        cashFlowApi.summary(6),
      ]);
      setRows(movements.content ?? []);
      setTotalPages(Math.max(movements.totalPages ?? 1, 1));
      setSummary(sum);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Could not load the money records");
    } finally {
      setLoading(false);
    }
  }, [page, direction]);

  useEffect(() => {
    load();
  }, [load]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.amount || Number(form.amount) <= 0) return toast.error("Enter a valid amount");
    setSaving(true);
    try {
      await cashFlowApi.record({
        direction: form.direction,
        amount: Number(form.amount),
        transactionFee: form.transactionFee ? Number(form.transactionFee) : undefined,
        description: form.description || undefined,
        date: form.date || undefined,
        reference: form.reference || undefined,
      });
      toast.success("Recorded");
      setModalOpen(false);
      setForm({ ...form, amount: "", transactionFee: "", description: "", reference: "" });
      load();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Could not save the record");
    } finally {
      setSaving(false);
    }
  };

  const tiles = summary
    ? [
        { label: "Money in", value: summary.moneyIn, icon: ArrowDownRight, tone: "text-emerald-700 bg-emerald-50" },
        { label: "Money out", value: summary.moneyOut, icon: ArrowUpRight, tone: "text-rose-700 bg-rose-50" },
        { label: "Transaction fees", value: summary.transactionFees, icon: Receipt, tone: "text-amber-700 bg-amber-50" },
        { label: "What is left", value: summary.balance, icon: Scale, tone: "text-teal-700 bg-teal-50" },
      ]
    : [];

  return (
    <div className="space-y-4 md:space-y-6 max-w-7xl mx-auto px-2 sm:px-4 md:px-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Money in &amp; money out</h1>
          <p className="text-xs md:text-sm text-gray-500">
            Every shilling that entered or left the chama, in plain language.
          </p>
        </div>
        {role === "ADMIN" && (
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 active:scale-95 transition"
          >
            <Plus size={16} /> Record money
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {tiles.map(({ label, value, icon: Icon, tone }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-100 p-3 md:p-4 shadow-sm">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${tone}`}>
              <Icon size={16} />
            </div>
            <p className="text-[10px] md:text-xs uppercase tracking-wider text-gray-500 font-semibold">{label}</p>
            <p className="text-base md:text-xl font-bold text-gray-900">{formatCurrency(value)}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-full sm:w-fit overflow-x-auto">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => {
              setDirection(f.key);
              setPage(0);
            }}
            className={`flex-1 sm:flex-none whitespace-nowrap px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition ${
              direction === f.key ? "bg-white text-emerald-700 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16">
            <LoadingSpinner />
          </div>
        ) : rows.length === 0 ? (
          <p className="py-16 text-center text-sm text-gray-400">Nothing recorded for this filter yet.</p>
        ) : (
          <>
            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-gray-100">
              {rows.map((r) => (
                <div key={`${r.id}-${r.reference ?? ""}`} className="p-4 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-900">{r.category || "Movement"}</span>
                    <span
                      className={`text-sm font-bold ${
                        r.direction === "IN" ? "text-emerald-600" : "text-rose-600"
                      }`}
                    >
                      {r.direction === "IN" ? "+" : "-"}
                      {formatCurrency(r.amount)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">{r.description || r.memo || "—"}</p>
                  <p className="text-[11px] text-gray-400">
                    {formatDate(r.date)} {r.reference ? `· ${r.reference}` : ""}
                  </p>
                </div>
              ))}
            </div>

            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="text-left px-6 py-3 font-semibold">Date</th>
                    <th className="text-left px-6 py-3 font-semibold">What happened</th>
                    <th className="text-left px-6 py-3 font-semibold">Details</th>
                    <th className="text-left px-6 py-3 font-semibold">Reference</th>
                    <th className="text-right px-6 py-3 font-semibold">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {rows.map((r) => (
                    <tr key={`${r.id}-${r.reference ?? ""}`} className="hover:bg-gray-50">
                      <td className="px-6 py-3 text-gray-600 whitespace-nowrap">{formatDate(r.date)}</td>
                      <td className="px-6 py-3 font-medium text-gray-900">{r.category || "Movement"}</td>
                      <td className="px-6 py-3 text-gray-500">{r.description || r.memo || "—"}</td>
                      <td className="px-6 py-3 text-gray-400">{r.reference || "—"}</td>
                      <td
                        className={`px-6 py-3 text-right font-bold whitespace-nowrap ${
                          r.direction === "IN" ? "text-emerald-600" : "text-rose-600"
                        }`}
                      >
                        {r.direction === "IN" ? "+" : "-"}
                        {formatCurrency(r.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {totalPages > 1 && (
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Record money">
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Direction</label>
            <select
              value={form.direction}
              onChange={(e) => setForm({ ...form, direction: e.target.value as "IN" | "OUT" | "FEE" })}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm"
            >
              <option value="IN">Money in</option>
              <option value="OUT">Money out</option>
              <option value="FEE">Transaction fee</option>
            </select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Amount</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Transaction fee</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.transactionFee}
                onChange={(e) => setForm({ ...form, transactionFee: e.target.value })}
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Date</label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Description</label>
            <input
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="e.g. Hall hire for AGM"
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Reference</label>
            <input
              value={form.reference}
              onChange={(e) => setForm({ ...form, reference: e.target.value })}
              placeholder="M-Pesa code or receipt no."
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
