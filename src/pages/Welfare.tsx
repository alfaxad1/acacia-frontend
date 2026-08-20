import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { HeartHandshake, Plus } from "lucide-react";
import { Modal } from "../components/Modal";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { ErrorMessage } from "../components/ErrorMessage";
import { formatCurrency, formatDate } from "../utils/format";
import {
  WelfareBenefit,
  WelfareClaim,
  WelfareClaimStatus,
  welfareApi,
} from "../services/saasApi";

const TABS: WelfareClaimStatus[] = ["SUBMITTED", "APPROVED", "PAID", "REJECTED"];

export default function Welfare() {
  const [balance, setBalance] = useState(0);
  const [benefits, setBenefits] = useState<WelfareBenefit[]>([]);
  const [claims, setClaims] = useState<WelfareClaim[]>([]);
  const [tab, setTab] = useState<WelfareClaimStatus>("SUBMITTED");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isClaimOpen, setClaimOpen] = useState(false);
  const [claimForm, setClaimForm] = useState({
    benefitId: "",
    amount: "",
    incidentDate: "",
    reason: "",
  });

  const load = async (status: WelfareClaimStatus = tab) => {
    try {
      setLoading(true);
      setError(null);
      const [balanceRes, benefitRes, claimRes] = await Promise.all([
        welfareApi.balance(),
        welfareApi.benefits(),
        welfareApi.claims(status),
      ]);
      setBalance(balanceRes.data.balance);
      setBenefits(benefitRes.data);
      setClaims(claimRes.data);
    } catch {
      setError("Could not load the welfare fund");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(tab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const benefitName = (id: number) => benefits.find((b) => b.id === id)?.name ?? `Benefit #${id}`;

  const submitClaim = async () => {
    if (!claimForm.benefitId || !claimForm.amount) {
      toast.error("Pick a benefit and an amount");
      return;
    }
    try {
      await welfareApi.submit({
        benefitId: Number(claimForm.benefitId),
        amount: Number(claimForm.amount),
        incidentDate: claimForm.incidentDate || new Date().toISOString().slice(0, 10),
        reason: claimForm.reason,
      });
      toast.success("Claim submitted");
      setClaimOpen(false);
      setClaimForm({ benefitId: "", amount: "", incidentDate: "", reason: "" });
      load("SUBMITTED");
      setTab("SUBMITTED");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Could not submit the claim");
    }
  };

  const decide = async (claim: WelfareClaim, approve: boolean) => {
    try {
      await welfareApi.decide(claim.id, approve, claim.amountRequested);
      toast.success(approve ? "Approval recorded" : "Claim rejected");
      load(tab);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Could not record the decision");
    }
  };

  const pay = async (claim: WelfareClaim) => {
    const receipt = window.prompt("M-Pesa receipt or payment reference");
    if (!receipt) return;
    try {
      await welfareApi.pay(claim.id, receipt);
      toast.success("Claim paid from the welfare fund");
      load(tab);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Payout failed");
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} onRetry={() => load(tab)} />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Welfare fund</h1>
          <p className="text-sm text-gray-500">
            Ring-fenced money for bereavement, hospital and other member emergencies.
          </p>
        </div>
        <button
          onClick={() => setClaimOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
        >
          <Plus size={18} /> New claim
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="p-5 bg-white rounded-xl border border-gray-200">
          <div className="flex items-center gap-2 text-gray-500 text-sm">
            <HeartHandshake size={16} /> Fund balance
          </div>
          <p className="text-3xl font-bold text-gray-900 mt-2">{formatCurrency(balance)}</p>
        </div>
        <div className="p-5 bg-white rounded-xl border border-gray-200">
          <p className="text-sm text-gray-500">Benefits offered</p>
          <ul className="mt-2 space-y-1 text-sm text-gray-700">
            {benefits.length === 0 && <li className="text-gray-400">None configured yet.</li>}
            {benefits.map((b) => (
              <li key={b.id} className="flex justify-between">
                <span>{b.name}</span>
                <span className="font-medium">up to {formatCurrency(b.maxAmount)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="flex gap-2">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-2 text-sm rounded-lg ${
              tab === t ? "bg-gray-900 text-white" : "bg-white border border-gray-200 text-gray-600"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 divide-y">
        {claims.length === 0 && <p className="p-6 text-sm text-gray-500">No {tab.toLowerCase()} claims.</p>}
        {claims.map((claim) => (
          <div key={claim.id} className="p-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-medium text-gray-900">{benefitName(claim.benefitId)}</p>
              <p className="text-xs text-gray-500">
                Member #{claim.memberId} · incident {formatDate(claim.incidentDate)}
              </p>
              {claim.reason && <p className="text-sm text-gray-600 mt-1">{claim.reason}</p>}
            </div>
            <div className="flex items-center gap-3">
              <span className="font-semibold text-gray-900">
                {formatCurrency(claim.amountApproved ?? claim.amountRequested)}
              </span>
              {claim.status === "SUBMITTED" && (
                <>
                  <button
                    onClick={() => decide(claim, true)}
                    className="px-3 py-1.5 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => decide(claim, false)}
                    className="px-3 py-1.5 text-sm bg-rose-600 text-white rounded-lg hover:bg-rose-700"
                  >
                    Reject
                  </button>
                </>
              )}
              {claim.status === "APPROVED" && (
                <button
                  onClick={() => pay(claim)}
                  className="px-3 py-1.5 text-sm bg-gray-900 text-white rounded-lg hover:bg-black"
                >
                  Pay out
                </button>
              )}
              {claim.status === "PAID" && claim.paidOn && (
                <span className="text-xs text-gray-500">paid {formatDate(claim.paidOn)}</span>
              )}
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={isClaimOpen} onClose={() => setClaimOpen(false)} title="Submit a welfare claim">
        <div className="space-y-4">
          <select
            className="w-full border rounded-lg px-3 py-2"
            value={claimForm.benefitId}
            onChange={(e) => setClaimForm({ ...claimForm, benefitId: e.target.value })}
          >
            <option value="">Select a benefit</option>
            {benefits.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} (max {formatCurrency(b.maxAmount)})
              </option>
            ))}
          </select>
          <input
            className="w-full border rounded-lg px-3 py-2"
            placeholder="Amount"
            value={claimForm.amount}
            onChange={(e) => setClaimForm({ ...claimForm, amount: e.target.value })}
          />
          <input
            type="date"
            className="w-full border rounded-lg px-3 py-2"
            value={claimForm.incidentDate}
            onChange={(e) => setClaimForm({ ...claimForm, incidentDate: e.target.value })}
          />
          <textarea
            className="w-full border rounded-lg px-3 py-2"
            placeholder="What happened?"
            value={claimForm.reason}
            onChange={(e) => setClaimForm({ ...claimForm, reason: e.target.value })}
          />
          <button
            onClick={submitClaim}
            className="w-full py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
          >
            Submit claim
          </button>
        </div>
      </Modal>
    </div>
  );
}
