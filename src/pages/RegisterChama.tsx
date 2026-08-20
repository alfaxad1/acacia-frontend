import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  ArrowRight,
  Banknote,
  Building2,
  CalendarDays,
  CheckCircle2,
  Gavel,
  HeartHandshake,
  Repeat,
  ShieldAlert,
  ShieldCheck,
  UserPlus,
  Users,
} from "lucide-react";
import { chamaApi, ChamaRegistrationResponse, ChamaSetupPayload } from "../services/saasApi";
import { Field, SectionCard, TextInput } from "../components/ui/Form";
import { defaultSetup, scheduleSummary } from "../features/setup/defaults";
import {
  ContributionSection,
  FinesSection,
  InvitesSection,
  LoanDefaultsSection,
  LoansSection,
  MeetingsSection,
  MgrSection,
  WelfareSection,
} from "../features/setup/SetupSections";

const EMPTY = {
  name: "",
  slug: "",
  registrationNumber: "",
  county: "",
  physicalAddress: "",
  contactEmail: "",
  contactPhone: "",
  adminFullName: "",
  adminEmail: "",
  adminPhone: "",
  adminPassword: "",
};

const STEPS = [
  { key: "chama", title: "The chama", blurb: "Name and registration details", icon: Building2 },
  { key: "admin", title: "You", blurb: "The first administrator", icon: ShieldCheck },
  { key: "contribution", title: "Contributions", blurb: "How much and how often", icon: Banknote },
  { key: "meetings", title: "Meetings", blurb: "When you meet", icon: CalendarDays },
  { key: "fines", title: "Fines", blurb: "Penalties for late or absent", icon: Gavel },
  { key: "loans", title: "Loans", blurb: "Lending rules", icon: Users },
  { key: "loanDefaults", title: "Loan penalties", blurb: "What happens when a loan goes past due", icon: ShieldAlert },
  { key: "mgr", title: "Merry-go-round", blurb: "Rotating payouts", icon: Repeat },
  { key: "welfare", title: "Welfare", blurb: "Emergency fund", icon: HeartHandshake },
  { key: "invites", title: "Members", blurb: "Invite the others", icon: UserPlus },
  { key: "review", title: "Review", blurb: "Confirm and create", icon: CheckCircle2 },
] as const;

export default function RegisterChama() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(EMPTY);
  const [setup, setSetup] = useState<ChamaSetupPayload>(defaultSetup);
  const [saving, setSaving] = useState(false);
  const [created, setCreated] = useState<ChamaRegistrationResponse | null>(null);
  const navigate = useNavigate();

  const patch = (p: Partial<ChamaSetupPayload>) => setSetup((prev) => ({ ...prev, ...p }));
  const setField = (key: keyof typeof EMPTY) => (v: string) => setForm((f) => ({ ...f, [key]: v }));

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  const stepValid = useMemo(() => {
    if (current.key === "chama") return form.name.trim().length > 1;
    if (current.key === "admin")
      return (
        form.adminFullName.trim().length > 1 &&
        /\S+@\S+\.\S+/.test(form.adminEmail) &&
        form.adminPassword.length >= 8
      );
    if (current.key === "invites")
      return (setup.invites ?? []).every((i) => i.fullName.trim() && /\S+@\S+\.\S+/.test(i.email));
    return true;
  }, [current.key, form, setup.invites]);

  const next = () => {
    if (!stepValid) {
      toast.error("Fill in the required details before continuing");
      return;
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const back = () => {
    setStep((s) => Math.max(s - 1, 0));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const submit = async () => {
    setSaving(true);
    try {
      const result = await chamaApi.register({ ...form, setup: { ...setup, markComplete: true } });
      setCreated(result);
      localStorage.setItem("activeChamaId", String(result.chamaId));
      localStorage.setItem("activeChamaName", result.name);
      toast.success(`${result.name} is ready`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Could not register the chama");
    } finally {
      setSaving(false);
    }
  };

  if (created) {
    return (
      <div className="min-h-screen bg-brand-50 px-4 py-12">
        <div className="card card-pad mx-auto max-w-lg space-y-5 text-center">
          <CheckCircle2 className="mx-auto h-14 w-14 text-brand-600" />
          <h1 className="font-display text-2xl font-bold text-gray-900">{created.name} is registered</h1>
          <p className="text-gray-600">
            Your workspace address is <span className="font-mono">{created.slug}</span>. Sign in as{" "}
            {created.adminEmail} to connect M-Pesa and start collecting.
          </p>
          <div className="rounded-2xl bg-brand-50 p-4 text-left text-sm text-brand-900">
            <p className="font-semibold">Already set up for you</p>
            <ul className="mt-2 space-y-1">
              <li>• {scheduleSummary(setup)}</li>
              {setup.meetings?.enabled && <li>• Meetings {String(setup.meetings.frequency).toLowerCase()}</li>}
              {setup.loans?.enabled && <li>• Loans up to {setup.loans.savingsMultiplier}x savings</li>}
              {(setup.invites?.length ?? 0) > 0 && <li>• {setup.invites!.length} invitation(s) sent</li>}
            </ul>
          </div>
          <button onClick={() => navigate("/login")} className="btn-primary w-full">
            Go to sign in
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-50/60 px-4 py-8 sm:py-12">
      <div className="mx-auto w-full max-w-5xl space-y-6">
        <header className="text-center">
          <div className="mx-auto mb-3 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-100">
            <Building2 className="h-7 w-7 text-brand-700" />
          </div>
          <h1 className="font-display text-2xl font-bold text-gray-900 sm:text-3xl">Set up your chama</h1>
          <p className="muted mx-auto mt-1 max-w-xl">
            A few short steps. Everything here can be changed later from Settings.
          </p>
        </header>

        {/* progress */}
        <div className="card p-4">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
            <p className="truncate text-sm font-semibold text-gray-900">
              Step {step + 1} of {STEPS.length} · {current.title}
            </p>
            <span className="shrink-0 text-xs text-gray-500">
              {Math.round(((step + 1) / STEPS.length) * 100)}%
            </span>
          </div>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-brand-600 transition-all duration-300"
              style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
            />
          </div>
          <div className="mt-4 hidden flex-wrap gap-2 lg:flex">
            {STEPS.map((s, i) => (
              <button
                key={s.key}
                type="button"
                onClick={() => i <= step && setStep(i)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  i === step
                    ? "bg-brand-600 text-white"
                    : i < step
                    ? "bg-brand-50 text-brand-700 hover:bg-brand-100"
                    : "bg-gray-100 text-gray-400"
                }`}
              >
                {s.title}
              </button>
            ))}
          </div>
        </div>

        <SectionCard title={current.title} description={current.blurb}>
          {current.key === "chama" && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Chama name" className="sm:col-span-2">
                <TextInput value={form.name} onChange={setField("name")} placeholder="Umoja Investment Group" />
              </Field>
              <Field label="Web address" hint="Optional. We generate one from the name if left blank">
                <TextInput value={form.slug} onChange={setField("slug")} placeholder="umoja-investment" />
              </Field>
              <Field label="Registration number">
                <TextInput value={form.registrationNumber} onChange={setField("registrationNumber")} />
              </Field>
              <Field label="County">
                <TextInput value={form.county} onChange={setField("county")} placeholder="Nairobi" />
              </Field>
              <Field label="Physical address">
                <TextInput value={form.physicalAddress} onChange={setField("physicalAddress")} />
              </Field>
              <Field label="Chama email">
                <TextInput type="email" value={form.contactEmail} onChange={setField("contactEmail")} />
              </Field>
              <Field label="Chama phone">
                <TextInput value={form.contactPhone} onChange={setField("contactPhone")} placeholder="2547..." />
              </Field>
            </div>
          )}

          {current.key === "admin" && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full name" className="sm:col-span-2">
                <TextInput value={form.adminFullName} onChange={setField("adminFullName")} />
              </Field>
              <Field label="Email" hint="This is how you sign in">
                <TextInput type="email" value={form.adminEmail} onChange={setField("adminEmail")} />
              </Field>
              <Field label="Phone">
                <TextInput value={form.adminPhone} onChange={setField("adminPhone")} placeholder="2547..." />
              </Field>
              <Field label="Password" hint="At least 8 characters" className="sm:col-span-2">
                <TextInput type="password" value={form.adminPassword} onChange={setField("adminPassword")} />
              </Field>
            </div>
          )}

          {current.key === "contribution" && <ContributionSection value={setup} patch={patch} />}
          {current.key === "meetings" && <MeetingsSection value={setup} patch={patch} />}
          {current.key === "fines" && <FinesSection value={setup} patch={patch} />}
          {current.key === "loans" && <LoansSection value={setup} patch={patch} />}
          {current.key === "loanDefaults" && <LoanDefaultsSection value={setup} patch={patch} />}
          {current.key === "mgr" && <MgrSection value={setup} patch={patch} />}
          {current.key === "welfare" && <WelfareSection value={setup} patch={patch} />}
          {current.key === "invites" && <InvitesSection value={setup} patch={patch} />}

          {current.key === "review" && (
            <dl className="divide-y divide-gray-100">
              {[
                ["Chama", form.name || "—"],
                ["Administrator", `${form.adminFullName} · ${form.adminEmail}`],
                ["Contributions", scheduleSummary(setup)],
                [
                  "Meetings",
                  setup.meetings?.enabled
                    ? `${String(setup.meetings.frequency).toLowerCase()} at ${setup.meetings.time}`
                    : "Not tracked",
                ],
                [
                  "Late fines",
                  setup.lateFine?.enabled
                    ? setup.lateFine.calculation === "FIXED"
                      ? `KES ${setup.lateFine.amount}`
                      : `${setup.lateFine.percentage}%`
                    : "Off",
                ],
                [
                  "Loans",
                  setup.loans?.enabled
                    ? `${setup.loans.savingsMultiplier}x savings at ${setup.loans.interestRate}% ${String(
                        setup.loans.interestMethod
                      )
                        .toLowerCase()
                        .replace("_", " ")}`
                    : "Off",
                ],
                [
                  "Loan penalties",
                  setup.loanDefaultPolicy?.enabled === false
                    ? "Off"
                    : setup.loanDefaultPolicy?.mode === "TIERED"
                    ? `Tiered, ${String(setup.loanDefaultPolicy.frequency ?? "MONTHLY").toLowerCase()}`
                    : `${setup.loanDefaultPolicy?.percentage ?? 5}% ${String(
                        setup.loanDefaultPolicy?.frequency ?? "MONTHLY"
                      ).toLowerCase()}`,
                ],
                [
                  "Merry-go-round",
                  setup.merryGoRound?.enabled
                    ? `KES ${setup.merryGoRound.amountPerMember} per round, ${String(
                        setup.merryGoRound.strategy
                      )
                        .toLowerCase()
                        .replace("_", " ")}`
                    : "Off",
                ],
                [
                  "Welfare",
                  setup.welfare?.enabled
                    ? `${setup.welfare.benefits?.length ?? 0} benefit(s), levy KES ${setup.welfare.levyAmount}`
                    : "Off",
                ],
                ["Invitations", `${setup.invites?.length ?? 0} to send`],
              ].map(([label, val]) => (
                <div key={label} className="grid grid-cols-[9rem_minmax(0,1fr)] gap-3 py-3 text-sm">
                  <dt className="text-gray-500">{label}</dt>
                  <dd className="min-w-0 font-medium text-gray-900">{val}</dd>
                </div>
              ))}
            </dl>
          )}
        </SectionCard>

        <div className="grid grid-cols-2 gap-3 sm:flex sm:justify-between">
          <button type="button" onClick={back} disabled={step === 0} className="btn-secondary disabled:opacity-40">
            <ArrowLeft size={16} /> Back
          </button>
          {isLast ? (
            <button type="button" onClick={submit} disabled={saving} className="btn-primary disabled:opacity-60">
              {saving ? "Creating your workspace..." : "Create chama"}
            </button>
          ) : (
            <button type="button" onClick={next} className="btn-primary">
              Continue <ArrowRight size={16} />
            </button>
          )}
        </div>

        <p className="text-center text-sm text-gray-500">
          Already registered?{" "}
          <Link to="/login" className="font-medium text-brand-700">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
