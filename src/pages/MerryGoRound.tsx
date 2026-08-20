import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { RefreshCcw, Repeat } from "lucide-react";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { ErrorMessage } from "../components/ErrorMessage";
import { formatCurrency, formatDate } from "../utils/format";
import { MgrCycle, MgrSlot, mgrApi } from "../services/saasApi";

export default function MerryGoRound() {
  const [cycles, setCycles] = useState<MgrCycle[]>([]);
  const [selected, setSelected] = useState<MgrCycle | null>(null);
  const [slots, setSlots] = useState<MgrSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await mgrApi.cycles();
      setCycles(res.data);
      if (res.data.length > 0) {
        await open(res.data[0]);
      }
    } catch {
      setError("Could not load merry-go-round cycles");
    } finally {
      setLoading(false);
    }
  };

  const open = async (cycle: MgrCycle) => {
    setSelected(cycle);
    const res = await mgrApi.slots(cycle.id);
    setSlots(res.data);
  };

  useEffect(() => {
    load();
  }, []);

  const start = async () => {
    if (!selected) return;
    try {
      const drawn = await mgrApi.start(selected.id);
      setSlots(drawn);
      toast.success("Rotation order drawn and frozen");
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Could not start the cycle");
    }
  };

  const payout = async () => {
    if (!selected) return;
    const receipt = window.prompt("M-Pesa receipt or payment reference");
    if (!receipt) return;
    try {
      const slot = await mgrApi.payout(selected.id, receipt);
      toast.success(`Paid out to member #${slot.memberId}`);
      await open(selected);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Payout failed");
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} onRetry={load} />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Merry-go-round</h1>
        <p className="text-sm text-gray-500">
          The rotation order is drawn once and frozen, so every member can see their turn upfront.
        </p>
      </div>

      {cycles.length === 0 && (
        <div className="p-8 bg-white rounded-xl border border-dashed text-center text-gray-500">
          No cycles yet. An officer can create one from the chama settings.
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-3">
          {cycles.map((cycle) => (
            <button
              key={cycle.id}
              onClick={() => open(cycle)}
              className={`w-full text-left p-4 rounded-xl border transition ${
                selected?.id === cycle.id
                  ? "border-emerald-500 bg-emerald-50"
                  : "border-gray-200 bg-white hover:border-emerald-300"
              }`}
            >
              <div className="flex items-center gap-2 font-semibold text-gray-900">
                <Repeat size={16} /> {cycle.name}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {cycle.status} · {cycle.rotationStrategy} · {formatCurrency(cycle.contributionAmount)} per round
              </p>
            </button>
          ))}
        </div>

        <div className="lg:col-span-2">
          {selected && (
            <div className="bg-white rounded-xl border border-gray-200">
              <div className="p-4 border-b flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-semibold text-gray-900">{selected.name}</h2>
                  <p className="text-xs text-gray-500">
                    Starts {selected.startDate ? formatDate(selected.startDate) : "-"} ·{" "}
                    {selected.roundFrequency}
                  </p>
                </div>
                <div className="flex gap-2">
                  {slots.length === 0 && (
                    <button
                      onClick={start}
                      className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                    >
                      <RefreshCcw size={16} /> Draw order
                    </button>
                  )}
                  {slots.some((s) => !s.paidOut) && (
                    <button
                      onClick={payout}
                      className="px-3 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-black"
                    >
                      Pay next in line
                    </button>
                  )}
                </div>
              </div>

              <div className="divide-y">
                {slots.map((slot) => (
                  <div key={slot.id} className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-semibold">
                        {slot.position}
                      </span>
                      <div>
                        <p className="font-medium text-gray-900">Member #{slot.memberId}</p>
                        {slot.bidAmount != null && Number(slot.bidAmount) > 0 && (
                          <p className="text-xs text-gray-500">bid {formatCurrency(slot.bidAmount)}</p>
                        )}
                      </div>
                    </div>
                    <span
                      className={`px-2 py-1 rounded-md text-xs font-semibold ${
                        slot.paidOut ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {slot.paidOut ? `paid ${slot.payoutDate ? formatDate(slot.payoutDate) : ""}` : "waiting"}
                    </span>
                  </div>
                ))}
                {slots.length === 0 && (
                  <p className="p-6 text-sm text-gray-500">
                    The order has not been drawn yet.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
