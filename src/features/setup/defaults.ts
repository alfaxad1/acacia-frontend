import { ChamaSetupPayload } from "../../services/saasApi";

export const DAYS = [
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
  { value: 7, label: "Sunday" },
];

export const WEEK_ORDINALS = [
  { value: 1, label: "First" },
  { value: 2, label: "Second" },
  { value: 3, label: "Third" },
  { value: 4, label: "Fourth" },
  { value: -1, label: "Last" },
];

export const today = () => new Date().toISOString().slice(0, 10);

/** Sensible Kenyan chama defaults so a founder can accept and move on. */
export const defaultSetup = (): ChamaSetupPayload => ({
  contribution: {
    enabled: true,
    model: "FIXED",
    penaltiesEnabled: true,
    name: "Monthly contribution",
    amount: 2000,
    frequency: "MONTHLY",
    anchor: "DAY_OF_MONTH",
    dayOfMonth: 5,
    dayOfWeek: 6,
    weekOrdinal: 1,
    customIntervalDays: 30,
    startDate: today(),
    gracePeriodDays: 3,
    fund: "GENERAL",
    blockAfterDays: 30,
    blockOnUnpaidFines: true,
    blockOnUnpaidContributions: true,
  },
  otherFines: [],
  lateFine: {
    enabled: true,
    calculation: "FIXED",
    amount: 200,
    percentage: 5,
    periodUnit: "WEEK",
    graceDays: 0,
  },
  meetings: {
    enabled: true,
    frequency: "MONTHLY",
    dayOfWeek: 6,
    weekOrdinal: 1,
    time: "14:00",
    venue: "",
    latenessGraceMinutes: 15,
    quorum: 0,
    absenceFine: 300,
    latenessFine: 100,
  },
  loans: {
    enabled: true,
    name: "Member loan",
    savingsMultiplier: 3,
    minAmount: 1000,
    maxAmount: 200000,
    interestRate: 10,
    interestMethod: "FLAT",
    maxDurationMonths: 3,
    minMembershipMonths: 3,
    requiredGuarantors: 2,
    requiredApprovals: 2,
    approverRoles: "CHAIRPERSON,TREASURER,SECRETARY",
    oneActiveLoanPerMember: true,
    arrearsFinePercentage: 5,
  },
  merryGoRound: {
    enabled: false,
    name: "Merry-go-round",
    amountPerMember: 1000,
    strategy: "RANDOM_BALLOT",
    frequency: "MONTHLY",
    startDate: today(),
  },
  welfare: {
    enabled: false,
    levyAmount: 200,
    benefits: [
      {
        name: "Bereavement",
        maxAmount: 20000,
        waitingPeriodDays: 90,
        claimsPerYear: 2,
        requiredApprovals: 2,
      },
    ],
  },
  loanDefaultPolicy: {
    enabled: true,
    frequency: "MONTHLY",
    mode: "PERCENT_OF_OUTSTANDING",
    percentage: 5,
    tiers: [
      { minAmount: 0, maxAmount: 20000, percentage: 3 },
      { minAmount: 20000, percentage: 5 },
    ],
  },
  invites: [],
});

export const scheduleSummary = (setup: ChamaSetupPayload): string => {
  const c = setup.contribution;
  if (!c?.enabled) return "No recurring contribution";
  const amount = `KES ${Number(c.amount || 0).toLocaleString()}`;
  switch (c.frequency) {
    case "WEEKLY":
      return `${amount} every ${DAYS.find((d) => d.value === c.dayOfWeek)?.label ?? "week"}`;
    case "BIWEEKLY":
      return `${amount} every other ${DAYS.find((d) => d.value === c.dayOfWeek)?.label ?? "week"}`;
    case "CUSTOM_DAYS":
      return `${amount} every ${c.customIntervalDays ?? 30} days`;
    case "QUARTERLY":
      return `${amount} every quarter, day ${c.dayOfMonth ?? 1}`;
    default:
      return c.anchor === "NTH_WEEKDAY"
        ? `${amount} on the ${
            WEEK_ORDINALS.find((w) => w.value === c.weekOrdinal)?.label.toLowerCase() ?? "first"
          } ${DAYS.find((d) => d.value === c.dayOfWeek)?.label ?? "Saturday"} monthly`
        : `${amount} on day ${c.dayOfMonth ?? 1} of every month`;
  }
};
