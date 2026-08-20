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
    sandbox: true,
    shortcode: "",
    paybill: "",
    b2cShortcode: "",
    initiatorName: "",
    consumerKey: "",
    consumerSecret: "",
    passkey: "",
    b2cSecurityCredential: "",
  });

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await mpesaVaultApi.get();
      setView(data);
      setForm((f) => ({
        ...f,
        sandbox: data.sandbox,
        shortcode: data.shortcode ?? "",
        paybill: data.paybill ?? "",
        b2cShortcode: data.b2cShortcode ?? "",
        initiatorName: data.initiatorName ?? "",
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
        <div className="flex items-center gap-2 text-gray-700 font-medium">
          <KeyRound size={18} /> Daraja credentials
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
          <input className="border rounded-lg px-3 py-2" placeholder="Till / shortcode"
            value={form.shortcode} onChange={(e) => setForm({ ...form, shortcode: e.target.value })} />
          <input className="border rounded-lg px-3 py-2" placeholder="Paybill"
            value={form.paybill} onChange={(e) => setForm({ ...form, paybill: e.target.value })} />
          <input className="border rounded-lg px-3 py-2" placeholder="B2C shortcode (payouts)"
            value={form.b2cShortcode} onChange={(e) => setForm({ ...form, b2cShortcode: e.target.value })} />
          <input className="border rounded-lg px-3 py-2" placeholder="Initiator name"
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
