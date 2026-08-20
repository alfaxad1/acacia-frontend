import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Save, Settings2 } from "lucide-react";
import { ChamaSetupPayload, loanDefaultPolicyApi, setupApi } from "../services/saasApi";
import { SectionCard } from "../components/ui/Form";
import { defaultSetup } from "../features/setup/defaults";
import {
  ContributionSection,
  FinesSection,
  LoanDefaultsSection,
  LoansSection,
  MeetingsSection,
  MgrSection,
  WelfareSection,
} from "../features/setup/SetupSections";

/** Catalogue entries the wizard mirrors from automatic rules. */
const AUTO_FINE_TYPES = [
  "LATE_PAYMENT",
  "MISSED_CONTRIBUTION",
  "MEETING_ABSENCE",
  "MEETING_LATENESS",
  "LOAN_ARREARS",
];

const isWelfareFund = (plan: any) => String(plan?.fund || "").toUpperCase() === "WELFARE";

export default function ChamaSettings() {

  const [setup, setSetup] = useState<ChamaSetupPayload>(defaultSetup);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const patch = (p: Partial<ChamaSetupPayload>) => setSetup((prev) => ({ ...prev, ...p }));

  const load = () =>
    Promise.all([setupApi.current(), loanDefaultPolicyApi.get().catch(() => undefined)])
      .then(([view, policy]) => {

        const base = defaultSetup();
        const record = view.setup;
        const plan = view.contributionPlans?.find((p: any) => !isWelfareFund(p)) ?? view.contributionPlans?.[0];
        const product = view.loanProducts?.[0];
        const cycle = view.mgrCycles?.[0];
        const rules = view.fineRules ?? [];
        const ruleFor = (trigger: string) =>
          rules.find((r: any) => r.trigger === trigger && r.active !== false);
        const lateRule = ruleFor("LATE_CONTRIBUTION");
        const absenceRule = ruleFor("MEETING_ABSENCE");
        const latenessRule = ruleFor("MEETING_LATENESS");
        const arrearsRule = ruleFor("LOAN_ARREARS");
        // Fine types mirrored from rules are managed above; the rest are the
        // chama's own manual fines and belong in the "other fines" editor.
        const otherFines = (view.fineTypes ?? [])
          .filter((t: any) => !AUTO_FINE_TYPES.includes(String(t.name || "").toUpperCase()))
          .map((t: any) => ({
            name: t.name,
            description: t.description ?? "",
            amount: t.amount ?? 0,
            percentage: t.percentage ?? undefined,
          }));

        setSetup({
          ...base,
          otherFines,
          contribution: {
            ...base.contribution!,
            enabled: record?.contributionsEnabled ?? base.contribution!.enabled,
            blockAfterDays: record?.contributionBlockAfterDays ?? base.contribution!.blockAfterDays,
            blockOnUnpaidFines: record?.blockOnUnpaidFines ?? base.contribution!.blockOnUnpaidFines,
            blockOnUnpaidContributions:
              record?.blockOnUnpaidContributions ?? base.contribution!.blockOnUnpaidContributions,
            ...(plan
              ? {
                  name: plan.name,
                  amount: plan.amount,
                  model: plan.model ?? base.contribution!.model,
                  penaltiesEnabled: plan.penaltiesEnabled ?? base.contribution!.penaltiesEnabled,
                  frequency: plan.frequency,
                  anchor: plan.anchor,
                  dayOfMonth: plan.dayOfMonth,
                  dayOfWeek: plan.dayOfWeek,
                  weekOrdinal: plan.weekOrdinal,
                  customIntervalDays: plan.customIntervalDays,
                  startDate: plan.startDate,
                  gracePeriodDays: plan.gracePeriodDays,
                }
              : {}),
          },
          lateFine: {
            ...base.lateFine!,
            enabled: lateRule ? true : record?.finesEnabled ?? base.lateFine!.enabled,
            ...(lateRule
              ? {
                  calculation: lateRule.calculation,
                  amount: lateRule.amount ?? undefined,
                  percentage: lateRule.percentage ?? undefined,
                  periodUnit: lateRule.periodUnit ?? base.lateFine!.periodUnit,
                  maxAmount: lateRule.maxAmount ?? undefined,
                  graceDays: lateRule.graceDays ?? base.lateFine!.graceDays,
                }
              : {}),
          },

          meetings: {
            ...base.meetings!,
            enabled: record?.meetingsEnabled ?? base.meetings!.enabled,
            frequency: record?.meetingFrequency ?? base.meetings!.frequency,
            dayOfWeek: record?.meetingDayOfWeek ?? base.meetings!.dayOfWeek,
            weekOrdinal: record?.meetingWeekOrdinal ?? base.meetings!.weekOrdinal,
            time: record?.meetingTime?.slice(0, 5) ?? base.meetings!.time,
            venue: record?.meetingVenue ?? base.meetings!.venue,
            latenessGraceMinutes:
              record?.meetingLatenessGraceMinutes ?? base.meetings!.latenessGraceMinutes,
            quorum: record?.meetingQuorum ?? base.meetings!.quorum,
            absenceFine: absenceRule ? absenceRule.amount ?? 0 : rules.length ? 0 : base.meetings!.absenceFine,
            latenessFine: latenessRule
              ? latenessRule.amount ?? 0
              : rules.length
              ? 0
              : base.meetings!.latenessFine,
          },
          loans: {
            ...base.loans!,
            enabled: record?.loansEnabled ?? base.loans!.enabled,
            arrearsFinePercentage: arrearsRule
              ? arrearsRule.percentage ?? 0
              : rules.length
              ? 0
              : base.loans!.arrearsFinePercentage,
            ...(product
              ? {
                  name: product.name,
                  savingsMultiplier: product.savingsMultiplier,
                  minAmount: product.minAmount,
                  maxAmount: product.maxAmount,
                  interestRate: product.interestRate,
                  interestMethod: product.interestMethod,
                  maxDurationMonths: product.maxDurationMonths,
                  minMembershipMonths: product.minMembershipMonths,
                  requiredGuarantors: product.requiredGuarantors,
                  requiredApprovals: product.requiredApprovals,
                  oneActiveLoanPerMember: product.oneActiveLoanPerMember,
                }
              : {}),
          },

          merryGoRound: {
            ...base.merryGoRound!,
            enabled: record?.merryGoRoundEnabled ?? base.merryGoRound!.enabled,
            ...(cycle
              ? {
                  name: cycle.name,
                  amountPerMember: cycle.contributionAmount,
                  strategy: cycle.rotationStrategy as any,
                  frequency: cycle.roundFrequency as any,
                  startDate: cycle.startDate,
                }
              : {}),
          },
          loanDefaultPolicy: {
            ...base.loanDefaultPolicy!,
            // Only keep the fields the API accepts - the entity also carries
            // ids and deprecated columns that must not be echoed back.
            ...(policy
              ? {
                  enabled: policy.enabled,
                  frequency: policy.frequency,
                  mode: policy.mode,
                  percentage: policy.percentage,
                  maxTotalPenalty: policy.maxTotalPenalty ?? undefined,
                  tiers: (policy.tiers ?? []).map((t) => ({
                    minAmount: t.minAmount,
                    maxAmount: t.maxAmount ?? undefined,
                    percentage: t.percentage,
                  })),
                }
              : {}),
          },
          welfare: {
            ...base.welfare!,
            enabled: record?.welfareEnabled ?? base.welfare!.enabled,
            levyAmount:
              view.contributionPlans?.find(isWelfareFund)?.amount ?? base.welfare!.levyAmount,

            benefits: view.welfareBenefits?.length
              ? view.welfareBenefits.map((b: any) => ({
                  name: b.name,
                  maxAmount: b.maxAmount,
                  waitingPeriodDays: b.waitingPeriodDays,
                  claimsPerYear: b.claimsPerYear,
                  requiredApprovals: b.requiredApprovals,
                }))
              : base.welfare!.benefits,
          },
        });
      })
      .catch(() => toast.error("Could not load the chama settings"))
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const save = async () => {
    const policy = setup.loanDefaultPolicy;
    if (policy?.enabled !== false && policy?.mode === "TIERED") {
      const tiers = (policy.tiers ?? []).filter(
        (t) => t.percentage !== undefined && t.percentage !== null && Number(t.percentage) > 0
      );
      if (tiers.length === 0) {
        toast.error("Add at least one penalty tier, each with a percentage");
        return;
      }
      policy.tiers = tiers;
    }

    // Blank rows would be rejected by the API; drop them before saving.
    const otherFines = (setup.otherFines ?? []).filter(
      (f) => f.name?.trim() && (Number(f.amount) > 0 || Number(f.percentage) > 0)
    );

    setSaving(true);
    try {
      await setupApi.apply({ ...setup, otherFines, invites: [], markComplete: true });
      // Read everything back so the screen shows exactly what was stored.
      await load();
      toast.success("Settings saved");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Could not save the settings");
    } finally {
      setSaving(false);

    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="card h-40 animate-pulse bg-gray-100" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
        <div className="min-w-0">
          <h1 className="font-display text-xl font-bold text-gray-900 sm:text-2xl">Chama settings</h1>
          <p className="muted mt-1 truncate">Contributions, fines, meetings, loans, merry-go-round and welfare.</p>
        </div>
        <button onClick={save} disabled={saving} className="btn-primary shrink-0 disabled:opacity-60">
          <Save size={16} />
          <span className="hidden sm:inline">{saving ? "Saving..." : "Save changes"}</span>
        </button>
      </header>

      <div className="rounded-2xl border border-brand-100 bg-brand-50 p-4">
        <p className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-3 text-sm text-brand-900">
          <Settings2 size={18} className="mt-0.5 shrink-0" />
          <span>
            Changes apply to bills raised from now on. Existing bills, fines and loans keep the terms they were
            created under.
          </span>
        </p>
      </div>

      <SectionCard title="Contributions" description="How much each member pays and how often.">
        <ContributionSection value={setup} patch={patch} />
      </SectionCard>
      <SectionCard title="Meetings" description="Schedule, quorum and lateness grace.">
        <MeetingsSection value={setup} patch={patch} />
      </SectionCard>
      <SectionCard title="Fines" description="Penalties for late payment, absence and lateness.">
        <FinesSection value={setup} patch={patch} />
      </SectionCard>
      <SectionCard title="Loans" description="Eligibility, interest and approvals.">
        <LoansSection value={setup} patch={patch} />
      </SectionCard>
      <SectionCard
        title="Loan default penalties"
        description="What is charged when a loan passes its due date, and how often."
      >
        <LoanDefaultsSection value={setup} patch={patch} />
      </SectionCard>
      <SectionCard title="Merry-go-round" description="Rotating payout cycle.">
        <MgrSection value={setup} patch={patch} />
      </SectionCard>
      <SectionCard title="Welfare fund" description="Ring-fenced emergency benefits.">
        <WelfareSection value={setup} patch={patch} />
      </SectionCard>

      <div className="flex justify-end">
        <button onClick={save} disabled={saving} className="btn-primary w-full sm:w-auto disabled:opacity-60">
          <Save size={16} /> {saving ? "Saving..." : "Save changes"}
        </button>
      </div>
    </div>
  );
}
