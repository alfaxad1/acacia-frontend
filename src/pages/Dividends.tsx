import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Coins, PieChart, Plus, Send } from "lucide-react";
import { Modal } from "../components/Modal";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { ErrorMessage } from "../components/ErrorMessage";
import { StatCard } from "../components/StatCard";
import { formatCurrency, formatDate } from "../utils/format";
import {
  DividendDeclaration,
  DividendView,
  EquityShare,
  InvestmentView,
  dividendsApi,
  investmentsApi,
} from "../services/saasApi";

const today = () => new Date().toISOString().slice(0, 10);

export default function Dividends() {
  const [declarations, setDeclarations] = useState<DividendDeclaration[]>([]);
  const [equity, setEquity] = useState<EquityShare[]>([]);
  const [investments, setInvestments] = useState<InvestmentView[]>([]);
  const [distributable, setDistributable] = useState(0);
  const [detail, setDetail] = useState<DividendView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeclareOpen, setDeclareOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    investmentId: "",
    payoutPool: "",
    declarationDate: today(),
    note: "",
  });

  const load = async (keepDetail = false) => {
    try {
      setLoading(true);
      setError(null);
      const [list, eq, inv, dist] = await Promise.all([
        dividendsApi.list(),
        dividendsApi.equity(),
        investmentsApi.list(),
        dividendsApi.distributable(),
      ]);
      setDeclarations(list);
      setEquity(eq);
      setInvestments(inv);
      setDistributable(dist);
      const targetId = keepDetail && detail ? detail.declaration.id : list[0]?.id;
      if (targetId) setDetail(await dividendsApi.get(targetId));
      else setDetail(null);
    } catch {
      setError("Could not load dividends");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalSavings = useMemo(
    () => equity.reduce((s, e) => s + Number(e.validSavings || 0), 0),
    [equity],
  );

  const open = async (id: number) => {
    try {
      setDetail(await dividendsApi.get(id));
    } catch {
      toast.error("Could not open that declaration");
    }
  };

  const declare = async () => {
    if (!form.title.trim() || !form.payoutPool) {
      toast.error("Add a title and the amount to share out");
      return;
    }
    try {
      const view = await dividendsApi.declare({
        title: form.title.trim(),
        investmentId: form.investmentId ? Number(form.investmentId) : undefined,
        payoutPool: Number(form.payoutPool),
        declarationDate: form.declarationDate,
        note: form.note || undefined,
      });
      toast.success("Dividend declared and allocated by equity");
      setDeclareOpen(false);
      setForm({ title: "", investmentId: "", payoutPool: "", declarationDate: today(), note: "" });
      setDetail(view);
      load(true);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Could not declare the dividend");
    }
  };

  const payOne = async (allocationId: number) => {
    if (!detail) return;
    const reference = window.prompt("M-Pesa receipt or payment reference") || undefined;
    try {
      setDetail(await dividendsApi.pay(detail.declaration.id, allocationId, reference));
      toast.success("Payout recorded");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Payout failed");
    }
  };

  const payAll = async () => {
    if (!detail) return;
    if (!window.confirm("Pay every unpaid member in this declaration?")) return;
    const reference = window.prompt("Batch reference") || undefined;
    try {
      setDetail(await dividendsApi.payAll(detail.declaration.id, reference));
      toast.success("Batch payout recorded");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Batch payout failed");
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} onRetry={() => load()} />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">Dividends & equity</h1>
          <p className="text-sm text-gray-500">
            Profit is shared strictly by each member's savings equity. Fines, interest and welfare
            money never count.
          </p>
        </div>
        <button
          onClick={() => setDeclareOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
        >
          <Plus size={18} /> Declare dividend
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard title="Distributable profit" value={formatCurrency(distributable)} icon={Coins} />
        <StatCard title="Total savings pool" value={formatCurrency(totalSavings)} icon={PieChart} />
        <StatCard title="Declarations" value={declarations.length} icon={Send} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
          <div className="border-b border-gray-200 px-5 py-3">
            <h2 className="font-semibold text-gray-900">Equity table</h2>
          </div>
          <div className="max-h-[26rem] overflow-auto">
            <table className="min-w-full text-sm">
              <thead className="sticky top-0 bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-5 py-3">Member</th>
                  <th className="px-5 py-3 text-right">Valid savings</th>
                  <th className="px-5 py-3 text-right">Equity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {equity.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-5 py-6 text-center text-gray-400">
                      No contributions recorded yet.
                    </td>
                  </tr>
                )}
                {equity.map((e) => (
                  <tr key={e.memberId}>
                    <td className="px-5 py-3 text-gray-800">{e.memberName}</td>
                    <td className="px-5 py-3 text-right text-gray-700">
                      {formatCurrency(Number(e.validSavings || 0))}
                    </td>
                    <td className="px-5 py-3 text-right font-semibold text-brand-700">
                      {Number(e.equityPercentage || 0).toFixed(2)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="font-semibold text-gray-900">Declarations</h2>
          {declarations.length === 0 && (
            <p className="rounded-2xl border border-dashed border-gray-300 bg-white p-6 text-center text-sm text-gray-500">
              Nothing declared yet.
            </p>
          )}
          {declarations.map((d) => (
            <button
              key={d.id}
              onClick={() => open(d.id)}
              className={`w-full rounded-xl border p-4 text-left ${
                detail?.declaration.id === d.id
                  ? "border-brand-600 bg-brand-50"
                  : "border-gray-200 bg-white hover:border-brand-300"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <p className="truncate font-semibold text-gray-900">{d.title}</p>
                <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-gray-600">
                  {d.status}
                </span>
              </div>
              <p className="mt-1 text-sm text-gray-600">
                {formatCurrency(Number(d.payoutPool || 0))} ·{" "}
                {d.declarationDate ? formatDate(d.declarationDate) : ""}
              </p>
            </button>
          ))}
        </div>
      </div>

      {detail && (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-5 py-3">
            <div>
              <h2 className="font-semibold text-gray-900">{detail.declaration.title}</h2>
              <p className="text-xs text-gray-500">
                Pool {formatCurrency(Number(detail.declaration.payoutPool || 0))} · savings snapshot{" "}
                {formatCurrency(Number(detail.declaration.savingsPoolSnapshot || 0))}
              </p>
            </div>
            <button
              onClick={payAll}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              <Send size={16} /> Pay everyone
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-5 py-3">Member</th>
                  <th className="px-5 py-3 text-right">Equity at declaration</th>
                  <th className="px-5 py-3 text-right">Payout</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {detail.allocations.map((a) => (
                  <tr key={a.id}>
                    <td className="px-5 py-3 text-gray-800">{a.memberName}</td>
                    <td className="px-5 py-3 text-right text-gray-600">
                      {Number(a.equityPercentage || 0).toFixed(2)}%
                    </td>
                    <td className="px-5 py-3 text-right font-medium text-gray-900">
                      {formatCurrency(Number(a.amount || 0))}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                          a.paid ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {a.paid ? "PAID" : "PENDING"}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      {!a.paid && (
                        <button
                          onClick={() => payOne(a.id)}
                          className="text-sm font-semibold text-brand-700 hover:underline"
                        >
                          Pay
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal isOpen={isDeclareOpen} onClose={() => setDeclareOpen(false)} title="Declare a dividend">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm sm:col-span-2">
            <span className="mb-1 block font-medium text-gray-700">Title</span>
            <input
              className="field-input"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="2026 half-year payout"
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium text-gray-700">Source</span>
            <select
              className="field-input"
              value={form.investmentId}
              onChange={(e) => setForm({ ...form, investmentId: e.target.value })}
            >
              <option value="">All investments (pooled profit)</option>
              {investments.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium text-gray-700">Amount to share (KES)</span>
            <input
              type="number"
              className="field-input"
              value={form.payoutPool}
              onChange={(e) => setForm({ ...form, payoutPool: e.target.value })}
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium text-gray-700">Declaration date</span>
            <input
              type="date"
              className="field-input"
              value={form.declarationDate}
              onChange={(e) => setForm({ ...form, declarationDate: e.target.value })}
            />
          </label>
          <label className="text-sm sm:col-span-2">
            <span className="mb-1 block font-medium text-gray-700">Note</span>
            <input
              className="field-input"
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
            />
          </label>
        </div>
        <p className="mt-3 text-xs text-gray-500">
          Distributable profit right now: {formatCurrency(distributable)}
        </p>
        <div className="mt-5 flex justify-end gap-3">
          <button
            onClick={() => setDeclareOpen(false)}
            className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700"
          >
            Cancel
          </button>
          <button
            onClick={declare}
            className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
          >
            Declare & allocate
          </button>
        </div>
      </Modal>
    </div>
  );
}
