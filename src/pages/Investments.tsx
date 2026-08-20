import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Building2, Plus, TrendingUp, Wallet, Receipt } from "lucide-react";
import { Modal } from "../components/Modal";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { ErrorMessage } from "../components/ErrorMessage";
import { StatCard } from "../components/StatCard";
import { formatCurrency, formatDate } from "../utils/format";
import {
  InvestmentEntryType,
  InvestmentView,
  investmentsApi,
} from "../services/saasApi";

const today = () => new Date().toISOString().slice(0, 10);

const STATUSES = ["PLANNED", "ACTIVE", "MATURED", "EXITED", "WRITTEN_OFF"];

export default function Investments() {
  const [items, setItems] = useState<InvestmentView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [isNewOpen, setNewOpen] = useState(false);
  const [isEntryOpen, setEntryOpen] = useState(false);

  const [form, setForm] = useState({
    name: "",
    category: "",
    description: "",
    status: "ACTIVE",
    startDate: today(),
    initialOutlay: "",
    outlayDescription: "",
  });

  const [entry, setEntry] = useState({
    type: "EXPENSE" as InvestmentEntryType,
    amount: "",
    entryDate: today(),
    description: "",
    reference: "",
  });

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await investmentsApi.list();
      setItems(data);
      if (data.length && selectedId === null) setSelectedId(data[0].id);
    } catch {
      setError("Could not load the investment register");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selected = useMemo(
    () => items.find((i) => i.id === selectedId) ?? null,
    [items, selectedId],
  );

  const totals = useMemo(
    () =>
      items.reduce(
        (acc, i) => ({
          cost: acc.cost + Number(i.totalCostBasis || 0),
          income: acc.income + Number(i.totalIncome || 0),
          profit: acc.profit + Number(i.netProfit || 0),
        }),
        { cost: 0, income: 0, profit: 0 },
      ),
    [items],
  );

  const groupRoi = totals.cost > 0 ? (totals.profit / totals.cost) * 100 : 0;

  const createInvestment = async () => {
    if (!form.name.trim()) {
      toast.error("Give the investment a name");
      return;
    }
    try {
      const created = await investmentsApi.create({
        name: form.name.trim(),
        category: form.category || undefined,
        description: form.description || undefined,
        status: form.status,
        startDate: form.startDate || undefined,
        initialOutlay: form.initialOutlay ? Number(form.initialOutlay) : undefined,
        outlayDescription: form.outlayDescription || undefined,
      });
      toast.success("Investment registered");
      setNewOpen(false);
      setForm({
        name: "",
        category: "",
        description: "",
        status: "ACTIVE",
        startDate: today(),
        initialOutlay: "",
        outlayDescription: "",
      });
      setSelectedId(created.id);
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Could not register the investment");
    }
  };

  const addEntry = async () => {
    if (!selected) return;
    if (!entry.amount || Number(entry.amount) <= 0) {
      toast.error("Enter an amount");
      return;
    }
    try {
      await investmentsApi.addEntry(selected.id, {
        type: entry.type,
        amount: Number(entry.amount),
        entryDate: entry.entryDate,
        description: entry.description || undefined,
        reference: entry.reference || undefined,
      });
      toast.success("Recorded");
      setEntryOpen(false);
      setEntry({ type: "EXPENSE", amount: "", entryDate: today(), description: "", reference: "" });
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Could not record the entry");
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} onRetry={load} />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">Investments</h1>
          <p className="text-sm text-gray-500">
            Land, projects and securities the chama owns, with live cost, income and ROI.
          </p>
        </div>
        <button
          onClick={() => setNewOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
        >
          <Plus size={18} /> New investment
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Assets" value={items.length} icon={Building2} />
        <StatCard title="Total cost basis" value={formatCurrency(totals.cost)} icon={Wallet} />
        <StatCard title="Income received" value={formatCurrency(totals.income)} icon={Receipt} />
        <StatCard
          title="Net profit"
          value={formatCurrency(totals.profit)}
          icon={TrendingUp}
          subtitle={`Group ROI ${groupRoi.toFixed(1)}%`}
        />
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center">
          <p className="text-sm text-gray-500">
            No investments yet. Register the first asset the chama has put money into.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[20rem_minmax(0,1fr)]">
          <div className="space-y-2">
            {items.map((i) => (
              <button
                key={i.id}
                onClick={() => setSelectedId(i.id)}
                className={`w-full rounded-xl border p-4 text-left transition-colors ${
                  i.id === selectedId
                    ? "border-brand-600 bg-brand-50"
                    : "border-gray-200 bg-white hover:border-brand-300"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="truncate font-semibold text-gray-900">{i.name}</p>
                  <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-600">
                    {i.status}
                  </span>
                </div>
                <p className="mt-1 text-xs text-gray-500">{i.category || "Uncategorised"}</p>
                <p
                  className={`mt-2 text-sm font-semibold ${
                    Number(i.netProfit) >= 0 ? "text-emerald-700" : "text-red-600"
                  }`}
                >
                  {formatCurrency(Number(i.netProfit || 0))}{" "}
                  <span className="text-xs font-normal text-gray-500">
                    ({Number(i.roiPercentage || 0).toFixed(1)}% ROI)
                  </span>
                </p>
              </button>
            ))}
          </div>

          {selected && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-gray-200 bg-white p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="font-display text-xl font-bold text-gray-900">{selected.name}</h2>
                    <p className="text-sm text-gray-500">
                      {selected.description || "No description"}
                    </p>
                  </div>
                  <button
                    onClick={() => setEntryOpen(true)}
                    className="inline-flex items-center gap-2 rounded-xl border border-brand-600 px-3 py-2 text-sm font-semibold text-brand-700 hover:bg-brand-50"
                  >
                    <Plus size={16} /> Log expense or income
                  </button>
                </div>

                <dl className="mt-5 grid gap-4 sm:grid-cols-3">
                  {[
                    ["Initial outlay", selected.initialOutlay],
                    ["Operating expenses", selected.operationalExpenses],
                    ["Total cost basis", selected.totalCostBasis],
                    ["Income received", selected.totalIncome],
                    ["Net profit", selected.netProfit],
                  ].map(([label, value]) => (
                    <div key={label as string} className="rounded-xl bg-gray-50 p-3">
                      <dt className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                        {label}
                      </dt>
                      <dd className="mt-1 font-semibold text-gray-900">
                        {formatCurrency(Number(value || 0))}
                      </dd>
                    </div>
                  ))}
                  <div className="rounded-xl bg-gray-50 p-3">
                    <dt className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                      ROI
                    </dt>
                    <dd className="mt-1 font-semibold text-gray-900">
                      {Number(selected.roiPercentage || 0).toFixed(1)}%
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
                <div className="border-b border-gray-200 px-5 py-3">
                  <h3 className="font-semibold text-gray-900">Cash-flow log</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                      <tr>
                        <th className="px-5 py-3">Date</th>
                        <th className="px-5 py-3">Type</th>
                        <th className="px-5 py-3">Description</th>
                        <th className="px-5 py-3 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {(selected.entries ?? []).length === 0 && (
                        <tr>
                          <td colSpan={4} className="px-5 py-6 text-center text-gray-400">
                            Nothing recorded yet.
                          </td>
                        </tr>
                      )}
                      {(selected.entries ?? []).map((e) => (
                        <tr key={e.id}>
                          <td className="px-5 py-3 text-gray-600">
                            {e.entryDate ? formatDate(e.entryDate) : "-"}
                          </td>
                          <td className="px-5 py-3">
                            <span
                              className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                                e.type === "INCOME"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-amber-100 text-amber-800"
                              }`}
                            >
                              {e.type}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-gray-700">
                            {e.description || e.reference || "-"}
                          </td>
                          <td className="px-5 py-3 text-right font-medium text-gray-900">
                            {formatCurrency(Number(e.amount || 0))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <Modal isOpen={isNewOpen} onClose={() => setNewOpen(false)} title="Register an investment">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm sm:col-span-2">
            <span className="mb-1 block font-medium text-gray-700">Name</span>
            <input
              className="field-input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Juja Land Plot A"
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium text-gray-700">Category</span>
            <input
              className="field-input"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              placeholder="Land / Poultry / T-Bills"
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium text-gray-700">Status</span>
            <select
              className="field-input"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium text-gray-700">Start date</span>
            <input
              type="date"
              className="field-input"
              value={form.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium text-gray-700">Initial outlay (KES)</span>
            <input
              type="number"
              className="field-input"
              value={form.initialOutlay}
              onChange={(e) => setForm({ ...form, initialOutlay: e.target.value })}
              placeholder="0"
            />
          </label>
          <label className="text-sm sm:col-span-2">
            <span className="mb-1 block font-medium text-gray-700">Notes</span>
            <textarea
              className="field-input"
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </label>
        </div>
        <div className="mt-5 flex justify-end gap-3">
          <button
            onClick={() => setNewOpen(false)}
            className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700"
          >
            Cancel
          </button>
          <button
            onClick={createInvestment}
            className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
          >
            Register
          </button>
        </div>
      </Modal>

      <Modal
        isOpen={isEntryOpen}
        onClose={() => setEntryOpen(false)}
        title={`Log against ${selected?.name ?? ""}`}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm">
            <span className="mb-1 block font-medium text-gray-700">Type</span>
            <select
              className="field-input"
              value={entry.type}
              onChange={(e) => setEntry({ ...entry, type: e.target.value as InvestmentEntryType })}
            >
              <option value="EXPENSE">Expense / maintenance</option>
              <option value="INCOME">Income / return</option>
              <option value="ACQUISITION">Additional capital outlay</option>
            </select>
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium text-gray-700">Amount (KES)</span>
            <input
              type="number"
              className="field-input"
              value={entry.amount}
              onChange={(e) => setEntry({ ...entry, amount: e.target.value })}
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium text-gray-700">Date</span>
            <input
              type="date"
              className="field-input"
              value={entry.entryDate}
              onChange={(e) => setEntry({ ...entry, entryDate: e.target.value })}
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium text-gray-700">Receipt / reference</span>
            <input
              className="field-input"
              value={entry.reference}
              onChange={(e) => setEntry({ ...entry, reference: e.target.value })}
            />
          </label>
          <label className="text-sm sm:col-span-2">
            <span className="mb-1 block font-medium text-gray-700">Description</span>
            <input
              className="field-input"
              value={entry.description}
              onChange={(e) => setEntry({ ...entry, description: e.target.value })}
              placeholder="Fencing materials, rent for March..."
            />
          </label>
        </div>
        <div className="mt-5 flex justify-end gap-3">
          <button
            onClick={() => setEntryOpen(false)}
            className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700"
          >
            Cancel
          </button>
          <button
            onClick={addEntry}
            className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
          >
            Record
          </button>
        </div>
      </Modal>
    </div>
  );
}
