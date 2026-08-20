import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { CheckCircle2, ShieldAlert, Users } from "lucide-react";
import { InvitePreview, invitesApi } from "../services/saasApi";
import { Field, TextInput } from "../components/ui/Form";

export default function AcceptInvite() {
  const { token = "" } = useParams();
  const navigate = useNavigate();
  const [preview, setPreview] = useState<InvitePreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    invitesApi
      .preview(token)
      .then(setPreview)
      .catch((err: any) =>
        setError(err.response?.data?.message || "This invitation is no longer valid.")
      )
      .finally(() => setLoading(false));
  }, [token]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) return toast.error("Use at least 8 characters");
    if (password !== confirm) return toast.error("The passwords do not match");
    setSaving(true);
    try {
      await invitesApi.accept(token, password);
      setDone(true);
      toast.success("Welcome aboard");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Could not accept the invitation");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-50/60 px-4 py-10">
      <div className="card card-pad w-full max-w-md space-y-5">
        {loading && <div className="h-40 animate-pulse rounded-2xl bg-gray-100" />}

        {!loading && error && (
          <div className="space-y-4 text-center">
            <ShieldAlert className="mx-auto h-12 w-12 text-red-500" />
            <h1 className="font-display text-xl font-bold text-gray-900">Invitation unavailable</h1>
            <p className="muted">{error}</p>
            <Link to="/login" className="btn-secondary w-full justify-center">
              Go to sign in
            </Link>
          </div>
        )}

        {!loading && preview && done && (
          <div className="space-y-4 text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-brand-600" />
            <h1 className="font-display text-xl font-bold text-gray-900">You have joined {preview.chamaName}</h1>
            <p className="muted">Sign in with {preview.email} to see contributions, loans and meetings.</p>
            <button onClick={() => navigate("/login")} className="btn-primary w-full justify-center">
              Go to sign in
            </button>
          </div>
        )}

        {!loading && preview && !done && (
          <>
            <div className="text-center">
              <div className="mx-auto mb-3 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-100">
                <Users className="h-7 w-7 text-brand-700" />
              </div>
              <h1 className="font-display text-xl font-bold text-gray-900">
                Join {preview.chamaName}
              </h1>
              <p className="muted mt-1">
                {preview.fullName}, you have been invited as {preview.role.toLowerCase()}. Choose a password to
                finish.
              </p>
            </div>

            <form onSubmit={submit} className="space-y-4">
              <Field label="Email">
                <input className="field-input bg-gray-50" value={preview.email} readOnly />
              </Field>
              <Field label="Password" hint="At least 8 characters">
                <TextInput type="password" value={password} onChange={setPassword} />
              </Field>
              <Field label="Confirm password">
                <TextInput type="password" value={confirm} onChange={setConfirm} />
              </Field>
              <button type="submit" disabled={saving} className="btn-primary w-full justify-center disabled:opacity-60">
                {saving ? "Joining..." : "Join the chama"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
