import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Copy, Mail, Plus, UserPlus, X } from "lucide-react";
import { ChamaInvite, invitesApi } from "../services/saasApi";
import { Modal } from "../components/Modal";
import { Field, Select, TextInput } from "../components/ui/Form";

const ROLES = [
  { value: "MEMBER", label: "Member" },
  { value: "CHAIRPERSON", label: "Chairperson" },
  { value: "TREASURER", label: "Treasurer" },
  { value: "SECRETARY", label: "Secretary" },
  { value: "ADMIN", label: "Administrator" },
];

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-700",
  ACCEPTED: "bg-brand-50 text-brand-700",
  REVOKED: "bg-gray-100 text-gray-600",
  EXPIRED: "bg-red-50 text-red-700",
};

export default function Invites() {
  const [invites, setInvites] = useState<ChamaInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ fullName: "", email: "", phone: "", role: "MEMBER" });

  const load = () =>
    invitesApi
      .list()
      .then(setInvites)
      .catch(() => toast.error("Could not load invitations"))
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
  }, []);

  const linkFor = (invite: ChamaInvite) => `${window.location.origin}/join/${invite.token}`;

  const copy = async (invite: ChamaInvite) => {
    try {
      await navigator.clipboard.writeText(linkFor(invite));
      toast.success("Invitation link copied");
    } catch {
      toast.error("Copy failed — select the link manually");
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const created = await invitesApi.create(form);
      setInvites((prev) => [created, ...prev]);
      setOpen(false);
      setForm({ fullName: "", email: "", phone: "", role: "MEMBER" });
      toast.success(`Invitation ready for ${created.fullName}`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Could not create the invitation");
    } finally {
      setSaving(false);
    }
  };

  const revoke = async (invite: ChamaInvite) => {
    try {
      await invitesApi.revoke(invite.id);
      setInvites((prev) => prev.map((i) => (i.id === invite.id ? { ...i, status: "REVOKED" } : i)));
      toast.success("Invitation revoked");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Could not revoke the invitation");
    }
  };

  return (
    <div className="space-y-6">
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
        <div className="min-w-0">
          <h1 className="font-display text-xl font-bold text-gray-900 sm:text-2xl">Invitations</h1>
          <p className="muted mt-1 truncate">Invite members and officers to join this chama.</p>
        </div>
        <button onClick={() => setOpen(true)} className="btn-primary shrink-0">
          <Plus size={16} />
          <span className="hidden sm:inline">Invite someone</span>
        </button>
      </header>

      {loading ? (
        <div className="card h-48 animate-pulse bg-gray-100" />
      ) : invites.length === 0 ? (
        <div className="card card-pad text-center">
          <UserPlus className="mx-auto h-10 w-10 text-brand-500" />
          <h2 className="surface-title mt-3">No invitations yet</h2>
          <p className="muted mx-auto mt-1 max-w-sm">
            Send an invitation and the person sets their own password, then lands straight in this chama.
          </p>
          <button onClick={() => setOpen(true)} className="btn-primary mx-auto mt-4">
            <Plus size={16} /> Invite someone
          </button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {invites.map((invite) => (
            <article key={invite.id} className="card card-pad space-y-3">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                <div className="min-w-0">
                  <h3 className="truncate font-semibold text-gray-900">{invite.fullName}</h3>
                  <p className="mt-0.5 grid grid-cols-[auto_minmax(0,1fr)] items-center gap-1.5 text-sm text-gray-500">
                    <Mail size={14} className="shrink-0" />
                    <span className="truncate">{invite.email}</span>
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
                    STATUS_STYLES[invite.status] ?? "bg-gray-100 text-gray-600"
                  }`}
                >
                  {invite.status.toLowerCase()}
                </span>
              </div>

              <p className="text-xs uppercase tracking-wide text-gray-400">{invite.role.toLowerCase()}</p>

              {invite.status === "PENDING" && (
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => copy(invite)} className="btn-secondary">
                    <Copy size={14} /> Copy link
                  </button>
                  <button onClick={() => revoke(invite)} className="btn-danger">
                    <X size={14} /> Revoke
                  </button>
                </div>
              )}
            </article>
          ))}
        </div>
      )}

      <Modal isOpen={open} onClose={() => setOpen(false)} title="Invite someone">
        <form onSubmit={submit} className="space-y-4">
          <Field label="Full name">
            <TextInput value={form.fullName} onChange={(fullName) => setForm({ ...form, fullName })} />
          </Field>
          <Field label="Email" hint="The invitation link is tied to this address">
            <TextInput type="email" value={form.email} onChange={(email) => setForm({ ...form, email })} />
          </Field>
          <Field label="Phone">
            <TextInput value={form.phone} onChange={(phone) => setForm({ ...form, phone })} placeholder="2547..." />
          </Field>
          <Field label="Role in the chama">
            <Select value={form.role} onChange={(role) => setForm({ ...form, role })} options={ROLES} />
          </Field>
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button type="button" onClick={() => setOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary disabled:opacity-60">
              {saving ? "Creating..." : "Create invitation"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
