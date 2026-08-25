import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  KeyRound,
  ShieldCheck,
  Trash2,
  Copy,
  CheckCircle2,
  ArrowLeftRight,
  Smartphone,
  CreditCard,
} from "lucide-react";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { ErrorMessage } from "../components/ErrorMessage";
import { formatDateTime } from "../utils/format";
import { MpesaCredentialView, mpesaVaultApi } from "../services/saasApi";

type Provider = "MPESA" | "KCB";

export default function PaymentGateway() {
  const [view, setView] = useState<MpesaCredentialView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [ipnUrl, setIpnUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [form, setForm] = useState({
    provider: "MPESA" as Provider,
    sandbox: true,
    // Daraja / shared fields
    shortcode: "",
    paybill: "",
    b2cShortcode: "",
    initiatorName: "",
    consumerKey: "",
    consumerSecret: "",
    passkey: "",
    b2cSecurityCredential: "",
    // KCB-specific
    kcbInvoiceNumber: "",
    kcbOrgShortCode: "",
    kcbSharedShortCode: false,
  });

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await mpesaVaultApi.get();
      const provider: Provider = (data.provider as Provider) ?? "MPESA";
      setView(data);
      setForm((f) => ({
        ...f,
        provider,
        sandbox: data.sandbox,
        shortcode: data.shortcode ?? "",
        paybill: data.paybill ?? "",
        b2cShortcode: data.b2cShortcode ?? "",
        initiatorName: data.initiatorName ?? "",
        kcbInvoiceNumber: data.kcbInvoiceNumber ?? "",
        kcbOrgShortCode: data.kcbOrgShortCode ?? "",
        kcbSharedShortCode: data.kcbSharedShortCode ?? false,
      }));

      if (provider === "KCB") {
        try {
          const url = await mpesaVaultApi.getIpnUrl();
          setIpnUrl(url);
        } catch {
          /* non-critical */
        }
      }
    } catch {
      setError("Could not load the payment gateway settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  /** When provider changes, fetch IPN URL if KCB is selected */
  const handleProviderChange = async (p: Provider) => {
    setForm((f) => ({ ...f, provider: p }));
    if (p === "KCB" && !ipnUrl) {
      try {
        const url = await mpesaVaultApi.getIpnUrl();
        setIpnUrl(url);
      } catch {
        /* ok, will show after first save */
      }
    }
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await mpesaVaultApi.save(form);
      setView(updated);
      setForm((f) => ({
        ...f,
        consumerKey: "",
        consumerSecret: "",
        passkey: "",
        b2cSecurityCredential: "",
      }));
      toast.success("Credentials saved and encrypted");

      // Reload IPN URL after save if KCB
      if (form.provider === "KCB") {
        try {
          const url = await mpesaVaultApi.getIpnUrl();
          setIpnUrl(url);
        } catch {
          /* ok */
        }
      }
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
          ? "Gateway credentials verified successfully"
          : updated.lastVerificationError || "Verification failed",
      );
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Verification failed");
    }
  };

  const remove = async () => {
    if (!window.confirm("Remove all stored credentials for this chama?")) return;
    try {
      const updated = await mpesaVaultApi.remove();
      setView(updated);
      setIpnUrl(null);
      toast.success("Credentials removed");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Could not remove the credentials");
    }
  };

  const copyIpnUrl = () => {
    if (ipnUrl) {
      navigator.clipboard.writeText(ipnUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} onRetry={load} />;

  const isKcb = form.provider === "KCB";

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Payment gateway</h1>
        <p className="text-sm text-gray-500 mt-1">
          Configure how your chama collects and sends money. Credentials are encrypted and never
          exposed after saving.
        </p>
      </div>

      {/* Provider selector */}
      <div className="p-5 bg-white rounded-xl border border-gray-200 space-y-4">
        <p className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <ArrowLeftRight size={16} className="text-brand-600" />
          Active payment gateway
        </p>
        <div className="grid sm:grid-cols-2 gap-3">
          {(["MPESA", "KCB"] as Provider[]).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => handleProviderChange(p)}
              className={`flex items-center gap-3 rounded-xl border-2 p-4 transition-all text-left ${
                form.provider === p
                  ? "border-brand-600 bg-brand-50 text-brand-800"
                  : "border-gray-200 text-gray-600 hover:border-gray-300"
              }`}
            >
              {p === "MPESA" ? (
                <Smartphone size={22} className={form.provider === p ? "text-brand-600" : "text-gray-400"} />
              ) : (
                <CreditCard size={22} className={form.provider === p ? "text-brand-600" : "text-gray-400"} />
              )}
              <div>
                <p className="font-semibold text-sm">
                  {p === "MPESA" ? "Safaricom Daraja" : "KCB Buni"}
                </p>
                <p className="text-xs opacity-70">
                  {p === "MPESA" ? "M-Pesa STK push + B2C" : "Lipa na KCB + IPN + MO transfer"}
                </p>
              </div>
            </button>
          ))}
        </div>
        {form.provider !== (view?.provider ?? "MPESA") && (
          <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
            ⚠ Save the form below to switch gateway. This will affect how payments are collected.
          </p>
        )}
      </div>

      {/* Status strip */}
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

      {/* Credentials form */}
      <form onSubmit={save} className="p-5 bg-white rounded-xl border border-gray-200 space-y-5">
        <div className="flex items-center gap-2 text-gray-700 font-semibold">
          <KeyRound size={18} />
          {isKcb ? "KCB Buni credentials" : "Safaricom Daraja credentials"}
        </div>

        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={form.sandbox}
            onChange={(e) => setForm({ ...form, sandbox: e.target.checked })}
          />
          Sandbox / UAT environment (uncheck when going live)
        </label>

        {isKcb ? (
          /* ---- KCB-specific fields ---- */
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Invoice Number (bank account)</label>
                <input
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  placeholder="e.g. 1234567890"
                  value={form.kcbInvoiceNumber}
                  onChange={(e) => setForm({ ...form, kcbInvoiceNumber: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Org Short Code</label>
                <input
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  placeholder="e.g. 522522"
                  value={form.kcbOrgShortCode}
                  onChange={(e) => setForm({ ...form, kcbOrgShortCode: e.target.value })}
                />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={form.kcbSharedShortCode}
                onChange={(e) => setForm({ ...form, kcbSharedShortCode: e.target.checked })}
              />
              Use shared short code (KCB Paybill 522522)
            </label>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Consumer Key</label>
                <input
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  placeholder={view?.consumerKeyMasked ? `(${view.consumerKeyMasked})` : "Consumer key"}
                  value={form.consumerKey}
                  onChange={(e) => setForm({ ...form, consumerKey: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Consumer Secret</label>
                <input
                  type="password"
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  placeholder={view?.consumerSecretSet ? "(stored)" : "Consumer secret"}
                  value={form.consumerSecret}
                  onChange={(e) => setForm({ ...form, consumerSecret: e.target.value })}
                />
              </div>
            </div>

            {/* IPN URL panel */}
            {ipnUrl && (
              <div className="rounded-xl bg-blue-50 border border-blue-200 p-4 space-y-2">
                <p className="text-sm font-semibold text-blue-800">📋 Register this IPN URL with KCB Bank</p>
                <p className="text-xs text-blue-700">
                  Send this URL to KCB Buni support (buni@kcbgroup.com) when requesting go-live. It
                  includes your chama's unique identifier so payments are correctly attributed.
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <code className="flex-1 text-xs bg-white border border-blue-200 rounded px-2 py-1.5 break-all font-mono text-blue-900">
                    {ipnUrl}
                  </code>
                  <button
                    type="button"
                    onClick={copyIpnUrl}
                    className="shrink-0 flex items-center gap-1 px-2 py-1.5 text-xs rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                  >
                    {copied ? <CheckCircle2 size={14} /> : <Copy size={14} />}
                    {copied ? "Copied" : "Copy"}
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* ---- Daraja fields ---- */
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Till / Shortcode</label>
                <input
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  placeholder="e.g. 174379"
                  value={form.shortcode}
                  onChange={(e) => setForm({ ...form, shortcode: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Paybill</label>
                <input
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  placeholder="e.g. 247247"
                  value={form.paybill}
                  onChange={(e) => setForm({ ...form, paybill: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">B2C Shortcode (payouts)</label>
                <input
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  placeholder="B2C shortcode"
                  value={form.b2cShortcode}
                  onChange={(e) => setForm({ ...form, b2cShortcode: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Initiator name</label>
                <input
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  placeholder="API Operator"
                  value={form.initiatorName}
                  onChange={(e) => setForm({ ...form, initiatorName: e.target.value })}
                />
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Consumer key</label>
                <input
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  placeholder={view?.consumerKeyMasked ? `(${view.consumerKeyMasked})` : "Consumer key"}
                  value={form.consumerKey}
                  onChange={(e) => setForm({ ...form, consumerKey: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Consumer secret</label>
                <input
                  type="password"
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  placeholder={view?.consumerSecretSet ? "(stored)" : "Consumer secret"}
                  value={form.consumerSecret}
                  onChange={(e) => setForm({ ...form, consumerSecret: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">STK passkey</label>
                <input
                  type="password"
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  placeholder={view?.passkeySet ? "(stored)" : "STK passkey"}
                  value={form.passkey}
                  onChange={(e) => setForm({ ...form, passkey: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">B2C security credential</label>
                <input
                  type="password"
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  placeholder={view?.b2cSecurityCredentialSet ? "(stored)" : "B2C security credential"}
                  value={form.b2cSecurityCredential}
                  onChange={(e) => setForm({ ...form, b2cSecurityCredential: e.target.value })}
                />
              </div>
            </div>
          </div>
        )}

        <p className="text-xs text-gray-400">
          Leave secret fields blank to keep the ones already stored.
        </p>

        <button
          type="submit"
          disabled={saving}
          className="px-5 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-black disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save credentials"}
        </button>
      </form>
    </div>
  );
}
