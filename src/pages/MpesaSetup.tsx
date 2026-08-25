import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { KeyRound, ShieldCheck, Trash2 } from "lucide-react";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { ErrorMessage } from "../components/ErrorMessage";
import { formatDateTime } from "../utils/format";
import { MpesaCredentialView, mpesaVaultApi } from "../services/saasApi";

export default function MpesaSetup() {
  const [view, setView] = useState<MpesaCredentialView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    provider: "MPESA" as "MPESA" | "KCB",
    sandbox: true,
    shortcode: "",
    paybill: "",
    b2cShortcode: "",
    initiatorName: "",
    consumerKey: "",
    consumerSecret: "",
    passkey: "",
    b2cSecurityCredential: "",
    kcbInvoiceNumber: "",
    kcbOrgShortCode: "",
    kcbSharedShortCode: false,
  });

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await mpesaVaultApi.get();
      setView(data);
      setForm((f) => ({
        ...f,
        provider: data.provider ?? "MPESA",
        sandbox: data.sandbox,
        shortcode: data.shortcode ?? "",
        paybill: data.paybill ?? "",
        b2cShortcode: data.b2cShortcode ?? "",
        initiatorName: data.initiatorName ?? "",
        kcbInvoiceNumber: data.kcbInvoiceNumber ?? "",
        kcbOrgShortCode: data.kcbOrgShortCode ?? "",
        kcbSharedShortCode: data.kcbSharedShortCode ?? false,
      }));
    } catch {
      setError("Could not load the M-Pesa vault");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await mpesaVaultApi.save(form);
      setView(updated);
      setForm((f) => ({ ...f, consumerKey: "", consumerSecret: "", passkey: "", b2cSecurityCredential: "" }));
      toast.success("M-Pesa credentials saved and encrypted");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Could not save the credentials");
    } finally {
      setSaving(false);
    }
  };

  const verify = async () => {
    try {
      const updated = await mpesaVaultApi.verify();
      setView(updated);
      toast[updated.status === "VERIFIED" ? "success" : "error"](
        updated.status === "VERIFIED"
          ? "Daraja accepted these credentials"
          : updated.lastVerificationError || "Daraja rejected these credentials",
      );
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Verification failed");
    }
  };

  const remove = async () => {
    if (!window.confirm("Remove the stored M-Pesa credentials for this chama?")) return;
    try {
      const updated = await mpesaVaultApi.remove();
      setView(updated);
      toast.success("Credentials removed");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Could not remove the credentials");
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} onRetry={load} />;

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">M-Pesa setup</h1>
        <p className="text-sm text-gray-500">
          Your Daraja keys are encrypted before they are stored and are never shown again — you can only
          replace them.
        </p>
      </div>

      <div className="p-5 bg-white rounded-xl border border-gray-200 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-gray-500">Status</p>
          <p className="text-lg font-semibold text-gray-900">
            {view?.configured ? view.status ?? "SAVED" : "Not configured"}
          </p>
          {view?.lastVerifiedAt && (
            <p className="text-xs text-gray-500">last verified {formatDateTime(view.lastVerifiedAt)}</p>
          )}
          {view?.lastVerificationError && (
            <p className="text-xs text-rose-600">{view.lastVerificationError}</p>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={verify}
            disabled={!view?.configured}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
          >
            <ShieldCheck size={16} /> Test connection
          </button>
          <button
            onClick={remove}
            disabled={!view?.configured}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-rose-600 text-white rounded-lg hover:bg-rose-700 disabled:opacity-50"
          >
            <Trash2 size={16} /> Remove
          </button>
        </div>
      </div>

      <form onSubmit={save} className="p-5 bg-white rounded-xl border border-gray-200 space-y-4">
        <div className="flex items-center gap-4 text-gray-700 font-medium">
          <KeyRound size={18} /> Payment credentials
          
          <div className="ml-auto flex items-center gap-2">
            <span className="text-sm">Gateway:</span>
            <select
              value={form.provider}
              onChange={(e) => setForm({ ...form, provider: e.target.value as "MPESA" | "KCB" })}
              className="border rounded-md px-2 py-1 text-sm bg-gray-50"
            >
              <option value="MPESA">Safaricom Daraja</option>
              <option value="KCB">KCB Buni</option>
            </select>
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={form.sandbox}
            onChange={(e) => setForm({ ...form, sandbox: e.target.checked })}
          />
          Sandbox environment (uncheck once you go live)
        </label>

        <div className="grid sm:grid-cols-2 gap-3">
          {form.provider === "KCB" && (
            <>
              <input className="border rounded-lg px-3 py-2" placeholder="KCB Invoice Number"
                value={form.kcbInvoiceNumber} onChange={(e) => setForm({ ...form, kcbInvoiceNumber: e.target.value })} />
              <input className="border rounded-lg px-3 py-2" placeholder="KCB Org Short Code"
                value={form.kcbOrgShortCode} onChange={(e) => setForm({ ...form, kcbOrgShortCode: e.target.value })} />
              <label className="flex items-center gap-2 text-sm text-gray-700 sm:col-span-2">
                <input
                  type="checkbox"
                  checked={form.kcbSharedShortCode}
                  onChange={(e) => setForm({ ...form, kcbSharedShortCode: e.target.checked })}
                />
                Use KCB Shared Short Code
              </label>
            </>
          )}

          <input className="border rounded-lg px-3 py-2" placeholder="M-Pesa Till / shortcode"
            value={form.shortcode} onChange={(e) => setForm({ ...form, shortcode: e.target.value })} />
          <input className="border rounded-lg px-3 py-2" placeholder="M-Pesa Paybill"
            value={form.paybill} onChange={(e) => setForm({ ...form, paybill: e.target.value })} />
          <input className="border rounded-lg px-3 py-2" placeholder="M-Pesa B2C shortcode (payouts)"
            value={form.b2cShortcode} onChange={(e) => setForm({ ...form, b2cShortcode: e.target.value })} />
          <input className="border rounded-lg px-3 py-2" placeholder="M-Pesa Initiator name"
            value={form.initiatorName} onChange={(e) => setForm({ ...form, initiatorName: e.target.value })} />
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <input className="border rounded-lg px-3 py-2"
            placeholder={view?.consumerKeyMasked ? `Consumer key (${view.consumerKeyMasked})` : "Consumer key"}
            value={form.consumerKey} onChange={(e) => setForm({ ...form, consumerKey: e.target.value })} />
          <input type="password" className="border rounded-lg px-3 py-2"
            placeholder={view?.consumerSecretSet ? "Consumer secret (stored)" : "Consumer secret"}
            value={form.consumerSecret} onChange={(e) => setForm({ ...form, consumerSecret: e.target.value })} />
          <input type="password" className="border rounded-lg px-3 py-2"
            placeholder={view?.passkeySet ? "STK passkey (stored)" : "STK passkey"}
            value={form.passkey} onChange={(e) => setForm({ ...form, passkey: e.target.value })} />
          <input type="password" className="border rounded-lg px-3 py-2"
            placeholder={view?.b2cSecurityCredentialSet ? "B2C security credential (stored)" : "B2C security credential"}
            value={form.b2cSecurityCredential}
            onChange={(e) => setForm({ ...form, b2cSecurityCredential: e.target.value })} />
        </div>

        <p className="text-xs text-gray-500">
          Leave a secret blank to keep the one already stored.
        </p>

        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-black disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save credentials"}
        </button>
      </form>
    </div>
  );
}
