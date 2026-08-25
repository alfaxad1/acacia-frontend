import { Plus, Trash2 } from "lucide-react";
import { ChamaSetupPayload, InviteSetup, LoanDefaultTierSetup, WelfareBenefitSetup } from "../../services/saasApi";
import { Field, NumberInput, Select, TextInput, Toggle } from "../../components/ui/Form";
import { DAYS, WEEK_ORDINALS } from "./defaults";

type Patch = (patch: Partial<ChamaSetupPayload>) => void;

interface Props {
  value: ChamaSetupPayload;
  patch: Patch;
}

const grid = "grid gap-4 sm:grid-cols-2";

export function ContributionSection({ value, patch }: Props) {
  const c = value.contribution!;
  const set = (p: Partial<typeof c>) => patch({ contribution: { ...c, ...p } });

  return (
    <div className="space-y-4">
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <Field label="Mobile Money Integration" hint="Which payment gateway will this chama use?">
          <Select
            value={value.paymentProvider ?? "MPESA"}
            onChange={(provider) => patch({ paymentProvider: provider })}
            options={[
              { value: "MPESA", label: "Safaricom Daraja" },
              { value: "KCB", label: "KCB Buni" },
            ]}
          />
        </Field>
      </div>

      <Toggle
        checked={c.enabled}
        onChange={(enabled) => set({ enabled })}
        label="Members contribute on a schedule"
        description="Bills are raised automatically each period and reconciled against M-Pesa or KCB."
      />
      {c.enabled && (
        <div className="space-y-4">
          <div className={grid}>
            <Field
              label="How do members contribute"
              hint="Fixed bills every cycle, or free-will amounts whenever members can"
            >
              <Select
                value={c.model ?? "FIXED"}
                onChange={(model) => set({ model: model as typeof c.model })}
                options={[
                  { value: "FIXED", label: "Fixed amount each cycle" },
                  { value: "FREE_WILL", label: "Free-will (any amount, any time)" },
                ]}
              />
            </Field>
            <Field label="What is it called">
              <TextInput value={c.name} onChange={(name) => set({ name })} placeholder="Monthly contribution" />
            </Field>
            <Field
              label={
                (c.model ?? "FIXED") === "FIXED"
                  ? "Amount per member (KES)"
                  : "Suggested amount (KES)"
              }
            >
              <NumberInput value={c.amount} onChange={(amount) => set({ amount })} />
            </Field>
            <Field label="How often">
              <Select
                value={c.frequency}
                onChange={(frequency) =>
                  set({
                    frequency: frequency as typeof c.frequency,
                    anchor:
                      frequency === "WEEKLY" || frequency === "BIWEEKLY"
                        ? "DAY_OF_WEEK"
                        : frequency === "CUSTOM_DAYS"
                        ? "FIXED_INTERVAL"
                        : "DAY_OF_MONTH",
                  })
                }
                options={[
                  { value: "WEEKLY", label: "Weekly" },
                  { value: "BIWEEKLY", label: "Every two weeks" },
                  { value: "MONTHLY", label: "Monthly" },
                  { value: "QUARTERLY", label: "Quarterly" },
                  { value: "CUSTOM_DAYS", label: "Every N days" },
                ]}
              />
            </Field>

            {(c.frequency === "MONTHLY" || c.frequency === "QUARTERLY") && (
              <Field label="Due day">
                <Select
                  value={c.anchor}
                  onChange={(anchor) => set({ anchor: anchor as typeof c.anchor })}
                  options={[
                    { value: "DAY_OF_MONTH", label: "A date in the month" },
                    { value: "NTH_WEEKDAY", label: "A weekday of the month" },
                  ]}
                />
              </Field>
            )}

            {c.anchor === "DAY_OF_MONTH" && (
              <Field label="Day of the month" hint="Clamped for short months">
                <NumberInput value={c.dayOfMonth} min={1} onChange={(dayOfMonth) => set({ dayOfMonth })} />
              </Field>
            )}

            {c.anchor === "NTH_WEEKDAY" && (
              <>
                <Field label="Which week">
                  <Select
                    value={c.weekOrdinal}
                    onChange={(v) => set({ weekOrdinal: Number(v) })}
                    options={WEEK_ORDINALS}
                  />
                </Field>
                <Field label="Which day">
                  <Select value={c.dayOfWeek} onChange={(v) => set({ dayOfWeek: Number(v) })} options={DAYS} />
                </Field>
              </>
            )}

            {c.anchor === "DAY_OF_WEEK" && (
              <Field label="Which day">
                <Select value={c.dayOfWeek} onChange={(v) => set({ dayOfWeek: Number(v) })} options={DAYS} />
              </Field>
            )}

            {c.frequency === "CUSTOM_DAYS" && (
              <Field label="Every how many days">
                <NumberInput
                  value={c.customIntervalDays}
                  min={1}
                  onChange={(customIntervalDays) => set({ customIntervalDays })}
                />
              </Field>
            )}

            <Field label="First due date">
              <TextInput type="date" value={c.startDate} onChange={(startDate) => set({ startDate })} />
            </Field>
            <Field label="Grace days before a fine" hint="0 means a fine the moment it is late">
              <NumberInput value={c.gracePeriodDays} onChange={(gracePeriodDays) => set({ gracePeriodDays })} />
            </Field>
          </div>
          <Toggle
            checked={c.penaltiesEnabled ?? true}
            onChange={(penaltiesEnabled) => set({ penaltiesEnabled })}
            label="Fine members who fall behind"
            description={
              (c.model ?? "FIXED") === "FIXED"
                ? "Late bills are penalised using the fine rule you set next."
                : "Members who contribute nothing in a cycle get a penalty. Turn off for a penalty-free fund."
            }
          />
        </div>
      )}
    </div>
  );
}

export function FinesSection({ value, patch }: Props) {
  const f = value.lateFine!;
  const set = (p: Partial<typeof f>) => patch({ lateFine: { ...f, ...p } });
  const m = value.meetings!;
  const setMeetings = (p: Partial<typeof m>) => patch({ meetings: { ...m, ...p } });

  return (
    <div className="space-y-4">
      <Toggle
        checked={f.enabled}
        onChange={(enabled) => set({ enabled })}
        label="Penalise late contributions"
        description="Applied automatically once the grace window closes."
      />
      {f.enabled && (
        <div className={grid}>
          <Field label="How it is charged">
            <Select
              value={f.calculation}
              onChange={(calculation) => set({ calculation: calculation as typeof f.calculation })}
              options={[
                { value: "FIXED", label: "Flat amount" },
                { value: "PERCENTAGE", label: "Percent of what is owed" },
                { value: "PER_PERIOD", label: "Percent per period overdue" },
              ]}
            />
          </Field>
          {f.calculation === "FIXED" ? (
            <Field label="Fine amount (KES)">
              <NumberInput value={f.amount} onChange={(amount) => set({ amount })} />
            </Field>
          ) : (
            <Field label="Percentage">
              <NumberInput value={f.percentage} step={0.5} onChange={(percentage) => set({ percentage })} />
            </Field>
          )}
          {f.calculation === "PER_PERIOD" && (
            <>
              <Field label="Charged every">
                <Select
                  value={f.periodUnit}
                  onChange={(periodUnit) => set({ periodUnit: periodUnit as typeof f.periodUnit })}
                  options={[
                    { value: "DAY", label: "Day" },
                    { value: "WEEK", label: "Week" },
                    { value: "MONTH", label: "Month" },
                  ]}
                />
              </Field>
              <Field label="Cap the total fine at (KES)" hint="Leave blank for no ceiling">
                <NumberInput value={f.maxAmount} onChange={(maxAmount) => set({ maxAmount })} />
              </Field>
            </>
          )}
        </div>
      )}

      <div className={grid}>
        <Field label="Missing a meeting costs (KES)" hint="0 turns the fine off">
          <NumberInput value={m.absenceFine} onChange={(absenceFine) => setMeetings({ absenceFine })} />
        </Field>
        <Field label="Arriving late costs (KES)">
          <NumberInput value={m.latenessFine} onChange={(latenessFine) => setMeetings({ latenessFine })} />
        </Field>
      </div>

      <OtherFinesEditor value={value} patch={patch} />
      <ContributionBlockEditor value={value} patch={patch} />
    </div>
  );
}

/**
 * Extra fines the chama charges by hand (dirty shoes, phone ringing, whatever
 * the constitution says). Each one shows up in the Fines screen so a treasurer
 * can record it against a member.
 */
function OtherFinesEditor({ value, patch }: Props) {
  const fines = value.otherFines ?? [];
  const update = (i: number, p: Partial<(typeof fines)[number]>) =>
    patch({ otherFines: fines.map((f, idx) => (idx === i ? { ...f, ...p } : f)) });

  return (
    <div className="space-y-3 rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-900">Other fines your chama charges</p>
          <p className="text-xs text-gray-500">
            These appear in the Fines screen so they can be recorded against a member.
          </p>
        </div>
        <button
          type="button"
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50"
          onClick={() => patch({ otherFines: [...fines, { name: "", description: "", amount: 0 }] })}
        >
          Add a fine
        </button>
      </div>

      {fines.length === 0 ? (
        <p className="text-xs text-gray-400">No extra fines yet.</p>
      ) : (
        fines.map((f, i) => (
          <div key={i} className={grid}>
            <Field label="Name">
              <TextInput value={f.name} onChange={(name) => update(i, { name })} />
            </Field>
            <Field label="Amount (KES)">
              <NumberInput value={f.amount} onChange={(amount) => update(i, { amount })} />
            </Field>
            <Field label="Note" hint="Shown to members on the fine">
              <TextInput value={f.description ?? ""} onChange={(description) => update(i, { description })} />
            </Field>
            <div className="flex items-end">
              <button
                type="button"
                className="rounded-md border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
                onClick={() => patch({ otherFines: fines.filter((_, idx) => idx !== i) })}
              >
                Remove
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

/** When old debts should stop a member from starting a new contribution. */
function ContributionBlockEditor({ value, patch }: Props) {
  const c = value.contribution!;
  const set = (p: Partial<typeof c>) => patch({ contribution: { ...c, ...p } });
  const days = c.blockAfterDays ?? 30;

  return (
    <div className="space-y-3 rounded-lg border border-gray-200 p-4">
      <p className="text-sm font-medium text-gray-900">Blocking members with old debts</p>
      <div className={grid}>
        <Field
          label="Block new contributions after (days)"
          hint="0 never blocks. Paying off the old debt is always allowed."
        >
          <NumberInput value={days} min={0} onChange={(blockAfterDays) => set({ blockAfterDays })} />
        </Field>
      </div>
      <Toggle
        checked={c.blockOnUnpaidFines ?? true}
        onChange={(blockOnUnpaidFines) => set({ blockOnUnpaidFines })}
        label="Unpaid fines block new contributions"
        description={`A fine older than ${days} day(s) must be settled first.`}
      />
      <Toggle
        checked={c.blockOnUnpaidContributions ?? true}
        onChange={(blockOnUnpaidContributions) => set({ blockOnUnpaidContributions })}
        label="Missed contributions block new contributions"
        description={`An arrear older than ${days} day(s) must be settled first.`}
      />
    </div>
  );
}


export function MeetingsSection({ value, patch }: Props) {
  const m = value.meetings!;
  const set = (p: Partial<typeof m>) => patch({ meetings: { ...m, ...p } });

  return (
    <div className="space-y-4">
      <Toggle
        checked={m.enabled}
        onChange={(enabled) => set({ enabled })}
        label="The chama holds meetings"
        description="Attendance registers, quorum checks and absence fines."
      />
      {m.enabled && (
        <div className={grid}>
          <Field label="How often">
            <Select
              value={m.frequency}
              onChange={(frequency) => set({ frequency })}
              options={[
                { value: "WEEKLY", label: "Weekly" },
                { value: "BIWEEKLY", label: "Every two weeks" },
                { value: "MONTHLY", label: "Monthly" },
                { value: "QUARTERLY", label: "Quarterly" },
              ]}
            />
          </Field>
          {(m.frequency === "MONTHLY" || m.frequency === "QUARTERLY") && (
            <Field label="Which week">
              <Select
                value={m.weekOrdinal}
                onChange={(v) => set({ weekOrdinal: Number(v) })}
                options={WEEK_ORDINALS}
              />
            </Field>
          )}
          <Field label="Which day">
            <Select value={m.dayOfWeek} onChange={(v) => set({ dayOfWeek: Number(v) })} options={DAYS} />
          </Field>
          <Field label="Start time">
            <TextInput type="time" value={m.time} onChange={(time) => set({ time })} />
          </Field>
          <Field label="Usual venue">
            <TextInput value={m.venue} onChange={(venue) => set({ venue })} placeholder="Members' homes, rotating" />
          </Field>
          <Field label="Lateness grace (minutes)">
            <NumberInput
              value={m.latenessGraceMinutes}
              onChange={(latenessGraceMinutes) => set({ latenessGraceMinutes })}
            />
          </Field>
          <Field label="Quorum" hint="Members needed for decisions. 0 means no quorum rule">
            <NumberInput value={m.quorum} onChange={(quorum) => set({ quorum })} />
          </Field>
        </div>
      )}
    </div>
  );
}

export function LoansSection({ value, patch }: Props) {
  const l = value.loans!;
  const set = (p: Partial<typeof l>) => patch({ loans: { ...l, ...p } });

  return (
    <div className="space-y-4">
      <Toggle
        checked={l.enabled}
        onChange={(enabled) => set({ enabled })}
        label="The chama lends to members"
        description="Eligibility comes from each member's savings in the ledger."
      />
      {l.enabled && (
        <div className={grid}>
          <Field label="Product name">
            <TextInput value={l.name} onChange={(name) => set({ name })} />
          </Field>
          <Field label="Borrow up to x savings">
            <NumberInput
              value={l.savingsMultiplier}
              step={0.5}
              onChange={(savingsMultiplier) => set({ savingsMultiplier })}
            />
          </Field>
          <Field label="Minimum loan (KES)">
            <NumberInput value={l.minAmount} onChange={(minAmount) => set({ minAmount })} />
          </Field>
          <Field label="Maximum loan (KES)">
            <NumberInput value={l.maxAmount} onChange={(maxAmount) => set({ maxAmount })} />
          </Field>
          <Field label="Interest rate (% per month)">
            <NumberInput value={l.interestRate} step={0.5} onChange={(interestRate) => set({ interestRate })} />
          </Field>
          <Field label="Interest method">
            <Select
              value={l.interestMethod}
              onChange={(interestMethod) => set({ interestMethod: interestMethod as typeof l.interestMethod })}
              options={[
                { value: "FLAT", label: "Flat on the principal" },
                { value: "REDUCING_BALANCE", label: "Reducing balance" },
                { value: "ONE_OFF", label: "Charged once" },
              ]}
            />
          </Field>
          <Field label="Longest term (months)">
            <NumberInput value={l.maxDurationMonths} onChange={(maxDurationMonths) => set({ maxDurationMonths })} />
          </Field>
          <Field label="Membership before borrowing (months)">
            <NumberInput
              value={l.minMembershipMonths}
              onChange={(minMembershipMonths) => set({ minMembershipMonths })}
            />
          </Field>
          <Field label="Guarantors required">
            <NumberInput value={l.requiredGuarantors} onChange={(requiredGuarantors) => set({ requiredGuarantors })} />
          </Field>
          <Field label="Officer approvals required">
            <NumberInput value={l.requiredApprovals} onChange={(requiredApprovals) => set({ requiredApprovals })} />
          </Field>
          <Field label="Late repayment penalty (% per month)">
            <NumberInput
              value={l.arrearsFinePercentage}
              step={0.5}
              onChange={(arrearsFinePercentage) => set({ arrearsFinePercentage })}
            />
          </Field>
          <div className="sm:col-span-2">
            <Toggle
              checked={l.oneActiveLoanPerMember ?? true}
              onChange={(oneActiveLoanPerMember) => set({ oneActiveLoanPerMember })}
              label="One active loan per member"
              description="Block a new loan until the current one is cleared."
            />
          </div>
        </div>
      )}
    </div>
  );
}

export function MgrSection({ value, patch }: Props) {
  const g = value.merryGoRound!;
  const set = (p: Partial<typeof g>) => patch({ merryGoRound: { ...g, ...p } });

  return (
    <div className="space-y-4">
      <Toggle
        checked={g.enabled}
        onChange={(enabled) => set({ enabled })}
        label="Run a merry-go-round"
        description="Everyone pays in each round and one member takes the pot."
      />
      {g.enabled && (
        <div className={grid}>
          <Field label="Cycle name">
            <TextInput value={g.name} onChange={(name) => set({ name })} />
          </Field>
          <Field label="Amount per member each round (KES)">
            <NumberInput value={g.amountPerMember} onChange={(amountPerMember) => set({ amountPerMember })} />
          </Field>
          <Field label="Rotation order">
            <Select
              value={g.strategy}
              onChange={(strategy) => set({ strategy: strategy as typeof g.strategy })}
              options={[
                { value: "SEQUENTIAL", label: "Fixed order" },
                { value: "RANDOM_BALLOT", label: "Random ballot (verifiable)" },
                { value: "MERIT", label: "By merit ranking" },
                { value: "BIDDING", label: "Bidding for early payout" },
              ]}
            />
          </Field>
          <Field label="Round frequency">
            <Select
              value={g.frequency}
              onChange={(frequency) => set({ frequency: frequency as typeof g.frequency })}
              options={[
                { value: "WEEKLY", label: "Weekly" },
                { value: "BIWEEKLY", label: "Every two weeks" },
                { value: "MONTHLY", label: "Monthly" },
              ]}
            />
          </Field>
          <Field label="First round starts">
            <TextInput type="date" value={g.startDate} onChange={(startDate) => set({ startDate })} />
          </Field>
        </div>
      )}
    </div>
  );
}

export function WelfareSection({ value, patch }: Props) {
  const w = value.welfare!;
  const set = (p: Partial<typeof w>) => patch({ welfare: { ...w, ...p } });
  const benefits = w.benefits ?? [];

  const updateBenefit = (index: number, p: Partial<WelfareBenefitSetup>) =>
    set({ benefits: benefits.map((b, i) => (i === index ? { ...b, ...p } : b)) });

  return (
    <div className="space-y-4">
      <Toggle
        checked={w.enabled}
        onChange={(enabled) => set({ enabled })}
        label="Keep a welfare fund"
        description="Ring-fenced money for bereavement, hospital bills and similar events."
      />
      {w.enabled && (
        <div className="space-y-4">
          <Field label="Welfare levy per member each period (KES)" className="sm:max-w-xs">
            <NumberInput value={w.levyAmount} onChange={(levyAmount) => set({ levyAmount })} />
          </Field>

          <div className="space-y-3">
            {benefits.map((b, index) => (
              <div key={index} className="rounded-2xl border border-gray-200 p-4">
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
                  <p className="truncate text-sm font-semibold text-gray-900">
                    {b.name || "New benefit"}
                  </p>
                  <button
                    type="button"
                    onClick={() => set({ benefits: benefits.filter((_, i) => i !== index) })}
                    className="shrink-0 rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600"
                    aria-label="Remove benefit"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className={`${grid} mt-3`}>
                  <Field label="Benefit">
                    <TextInput value={b.name} onChange={(name) => updateBenefit(index, { name })} />
                  </Field>
                  <Field label="Maximum payout (KES)">
                    <NumberInput value={b.maxAmount} onChange={(maxAmount) => updateBenefit(index, { maxAmount })} />
                  </Field>
                  <Field label="Waiting period (days)">
                    <NumberInput
                      value={b.waitingPeriodDays}
                      onChange={(waitingPeriodDays) => updateBenefit(index, { waitingPeriodDays })}
                    />
                  </Field>
                  <Field label="Claims allowed per year">
                    <NumberInput
                      value={b.claimsPerYear}
                      onChange={(claimsPerYear) => updateBenefit(index, { claimsPerYear })}
                    />
                  </Field>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={() =>
                set({
                  benefits: [
                    ...benefits,
                    { name: "", maxAmount: 10000, waitingPeriodDays: 30, claimsPerYear: 1, requiredApprovals: 2 },
                  ],
                })
              }
              className="btn-secondary w-full sm:w-auto"
            >
              <Plus size={16} /> Add a benefit
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function InvitesSection({ value, patch }: Props) {
  const invites = value.invites ?? [];
  const update = (index: number, p: Partial<InviteSetup>) =>
    patch({ invites: invites.map((i, idx) => (idx === index ? { ...i, ...p } : i)) });

  return (
    <div className="space-y-3">
      {invites.length === 0 && (
        <p className="muted">
          Add the people who run the chama now, or skip and invite everyone later from the members area.
        </p>
      )}
      {invites.map((invite, index) => (
        <div key={index} className="rounded-2xl border border-gray-200 p-4">
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_10rem_auto] sm:items-end">
            <Field label="Full name">
              <TextInput value={invite.fullName} onChange={(fullName) => update(index, { fullName })} />
            </Field>
            <Field label="Email">
              <TextInput type="email" value={invite.email} onChange={(email) => update(index, { email })} />
            </Field>
            <Field label="Role">
              <Select
                value={invite.role}
                onChange={(role) => update(index, { role })}
                options={[
                  { value: "MEMBER", label: "Member" },
                  { value: "CHAIRPERSON", label: "Chairperson" },
                  { value: "TREASURER", label: "Treasurer" },
                  { value: "SECRETARY", label: "Secretary" },
                  { value: "ADMIN", label: "Administrator" },
                ]}
              />
            </Field>
            <button
              type="button"
              onClick={() => patch({ invites: invites.filter((_, i) => i !== index) })}
              className="btn-secondary sm:w-11 sm:px-0"
              aria-label="Remove invite"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={() => patch({ invites: [...invites, { fullName: "", email: "", role: "MEMBER" }] })}
        className="btn-secondary w-full sm:w-auto"
      >
        <Plus size={16} /> Add someone
      </button>
    </div>
  );
}

export function LoanDefaultsSection({ value, patch }: Props) {
  const p = value.loanDefaultPolicy ?? {};
  const set = (next: Partial<typeof p>) => patch({ loanDefaultPolicy: { ...p, ...next } });
  const tiers = p.tiers ?? [];
  const setTier = (index: number, next: Partial<LoanDefaultTierSetup>) =>
    set({ tiers: tiers.map((t, i) => (i === index ? { ...t, ...next } : t)) });

  return (
    <div className="space-y-4">
      <Toggle
        checked={p.enabled ?? true}
        onChange={(enabled) => set({ enabled })}
        label="Penalise loans that pass their due date"
        description="The first penalty is charged the moment a loan falls into default, then again every cycle counted from that same day until it is cleared."
      />
      {(p.enabled ?? true) && (
        <div className="space-y-4">
          <div className={grid}>
            <Field
              label="How often is the penalty charged"
              hint="Counted from the day the loan defaults, not a fixed calendar day"
            >
              <Select
                value={p.frequency ?? "MONTHLY"}
                onChange={(frequency) => set({ frequency: frequency as typeof p.frequency })}
                options={[
                  { value: "WEEKLY", label: "Every week after default" },
                  { value: "MONTHLY", label: "Every month after default" },
                ]}
              />
            </Field>


            <Field label="How is the penalty worked out">
              <Select
                value={p.mode ?? "PERCENT_OF_OUTSTANDING"}
                onChange={(mode) => set({ mode: mode as typeof p.mode })}
                options={[
                  { value: "PERCENT_OF_PRINCIPAL", label: "Percentage of the original loan" },
                  {
                    value: "PERCENT_OF_OUTSTANDING",
                    label: "Percentage of what is still owed (principal + interest)",
                  },
                  { value: "TIERED", label: "Tiered by the overdue amount" },
                ]}
              />
            </Field>

            {(p.mode ?? "PERCENT_OF_OUTSTANDING") !== "TIERED" && (
              <Field label="Penalty percentage each cycle">
                <NumberInput step={0.5} value={p.percentage} onChange={(percentage) => set({ percentage })} />
              </Field>
            )}

            <Field label="Maximum total penalty (KES)" hint="Leave blank for no ceiling">
              <NumberInput
                value={p.maxTotalPenalty}
                onChange={(maxTotalPenalty) => set({ maxTotalPenalty })}
              />
            </Field>
          </div>

          {(p.mode ?? "PERCENT_OF_OUTSTANDING") === "TIERED" && (
            <div className="space-y-3">
              <p className="text-sm font-semibold text-gray-900">Tiers</p>
              <p className="muted">
                Each tier needs a percentage. Tiers are stored when you press “Save changes”.
              </p>
              {tiers.map((t, index) => (
                <div key={index} className="rounded-2xl border border-gray-200 p-4">
                  <div className="grid gap-3 sm:grid-cols-[repeat(3,minmax(0,1fr))_auto] sm:items-end">
                    <Field label="From (KES)">
                      <NumberInput value={t.minAmount} onChange={(minAmount) => setTier(index, { minAmount })} />
                    </Field>
                    <Field label="Up to (KES)" hint="Blank means and above">
                      <NumberInput value={t.maxAmount} onChange={(maxAmount) => setTier(index, { maxAmount })} />
                    </Field>
                    <Field label="Penalty %">
                      <NumberInput
                        step={0.5}
                        value={t.percentage}
                        onChange={(percentage) => setTier(index, { percentage })}
                      />
                    </Field>
                    <button
                      type="button"
                      onClick={() => set({ tiers: tiers.filter((_, i) => i !== index) })}
                      className="btn-secondary sm:w-11 sm:px-0"
                      aria-label="Remove tier"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() => set({ tiers: [...tiers, { minAmount: 0, percentage: 5 }] })}
                className="btn-secondary w-full sm:w-auto"
              >
                <Plus size={16} /> Add a tier
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
