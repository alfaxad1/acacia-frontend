import { api } from "./api";

/**
 * Endpoints for the multi-chama SaaS modules (meetings, welfare and the
 * merry-go-round). They live under /api/v1/chama and are tenant-scoped by the
 * backend from the signed-in member's chama membership.
 */

const CHAMA = "/chama";

export type AttendanceStatus = "PRESENT" | "LATE" | "ABSENT" | "EXCUSED";

export interface ChamaEvent {
  id: number;
  title: string;
  agenda?: string;
  type: string;
  startsAt: string;
  endsAt?: string;
  venue?: string;
  latenessGraceMinutes?: number;
  quorum?: number;
  registerClosed: boolean;
  finesAppliedAt?: string;
}

export interface AttendanceLine {
  id: number;
  eventId: number;
  memberId: number;
  status: AttendanceStatus;
  checkedInAt?: string;
  note?: string;
}

export interface AttendanceSummary {
  eventId: number;
  present: number;
  late: number;
  absent: number;
  excused: number;
  quorumMet: boolean;
  registerClosed: boolean;
}

export const eventsApi = {
  upcoming: () => api.get<ChamaEvent[]>(`${CHAMA}/events`),
  get: (id: number) => api.get<ChamaEvent>(`${CHAMA}/events/${id}`),
  create: (event: Partial<ChamaEvent>) =>
    api.post<ChamaEvent>(`${CHAMA}/events`, event).then((r) => r.data),
  register: (id: number) => api.get<AttendanceLine[]>(`${CHAMA}/events/${id}/register`),
  summary: (id: number) => api.get<AttendanceSummary>(`${CHAMA}/events/${id}/summary`),
  checkIn: (id: number, memberId: number) =>
    api.post<AttendanceLine>(`${CHAMA}/events/${id}/check-in/${memberId}`).then((r) => r.data),
  mark: (id: number, memberId: number, status: AttendanceStatus, note?: string) =>
    api
      .put<AttendanceLine>(`${CHAMA}/events/${id}/attendance/${memberId}`, { status, note })
      .then((r) => r.data),
  close: (id: number) =>
    api.post<{ eventId: number; finesIssued: number }>(`${CHAMA}/events/${id}/close`).then((r) => r.data),
};

export interface WelfareBenefit {
  id: number;
  name: string;
  description?: string;
  maxAmount: number;
  waitingPeriodDays?: number;
  claimsPerYear?: number;
  requiredApprovals?: number;
  active: boolean;
}

export type WelfareClaimStatus = "SUBMITTED" | "APPROVED" | "REJECTED" | "PAID";

export interface WelfareClaim {
  id: number;
  memberId: number;
  benefitId: number;
  amountRequested: number;
  amountApproved?: number;
  reason?: string;
  evidenceRef?: string;
  status: WelfareClaimStatus;
  incidentDate: string;
  paidOn?: string;
  decisionNote?: string;
}

export const welfareApi = {
  balance: () => api.get<{ balance: number }>(`${CHAMA}/welfare/balance`),
  benefits: () => api.get<WelfareBenefit[]>(`${CHAMA}/welfare/benefits`),
  saveBenefit: (benefit: Partial<WelfareBenefit>) =>
    api.post<WelfareBenefit>(`${CHAMA}/welfare/benefits`, benefit).then((r) => r.data),
  contribute: (memberId: number, amount: number, receipt: string) =>
    api.post(`${CHAMA}/welfare/contributions`, { memberId, amount, receipt }).then((r) => r.data),
  claims: (status: WelfareClaimStatus = "SUBMITTED") =>
    api.get<WelfareClaim[]>(`${CHAMA}/welfare/claims`, { params: { status } }),
  myClaims: () => api.get<WelfareClaim[]>(`${CHAMA}/welfare/claims/mine`),
  submit: (payload: {
    benefitId: number;
    amount: number;
    incidentDate: string;
    reason: string;
    evidenceRef?: string;
  }) => api.post<WelfareClaim>(`${CHAMA}/welfare/claims`, payload).then((r) => r.data),
  decide: (id: number, approve: boolean, approvedAmount?: number, comment?: string) =>
    api
      .post<WelfareClaim>(`${CHAMA}/welfare/claims/${id}/decision`, { approve, approvedAmount, comment })
      .then((r) => r.data),
  pay: (id: number, receipt: string) =>
    api.post<WelfareClaim>(`${CHAMA}/welfare/claims/${id}/pay`, { receipt }).then((r) => r.data),
};

export interface MgrCycle {
  id: number;
  name: string;
  status: string;
  contributionAmount: number;
  roundFrequency: string;
  rotationStrategy: string;
  startDate: string;
}

export interface MgrSlot {
  id: number;
  cycleId: number;
  memberId: number;
  position: number;
  paidOut: boolean;
  payoutDate?: string;
  bidAmount?: number;
}

export const mgrApi = {
  cycles: () => api.get<MgrCycle[]>(`${CHAMA}/merry-go-round/cycles`),
  saveCycle: (cycle: Partial<MgrCycle>) =>
    api.post<MgrCycle>(`${CHAMA}/merry-go-round/cycles`, cycle).then((r) => r.data),
  start: (id: number, rankings: Record<number, number> = {}) =>
    api.post<MgrSlot[]>(`${CHAMA}/merry-go-round/cycles/${id}/start`, rankings).then((r) => r.data),
  slots: (id: number) => api.get<MgrSlot[]>(`${CHAMA}/merry-go-round/cycles/${id}/slots`),
  collect: (id: number, memberId: number, amount: number, receipt: string) =>
    api
      .post(`${CHAMA}/merry-go-round/cycles/${id}/collections`, { memberId, amount, receipt })
      .then((r) => r.data),
  payout: (id: number, receipt: string) =>
    api.post<MgrSlot>(`${CHAMA}/merry-go-round/cycles/${id}/payout`, { receipt }).then((r) => r.data),
};

export interface Chama {
  id: number;
  name: string;
  slug: string;
  registrationNumber?: string;
  county?: string;
  physicalAddress?: string;
  contactEmail?: string;
  contactPhone?: string;
  currency?: string;
  status: string;
}

export interface ChamaRegistrationRequest {
  name: string;
  slug?: string;
  registrationNumber?: string;
  county?: string;
  physicalAddress?: string;
  contactEmail?: string;
  contactPhone?: string;
  adminFullName: string;
  adminEmail: string;
  adminPhone?: string;
  adminPassword: string;
  setup?: ChamaSetupPayload;
}

export interface ChamaRegistrationResponse {
  chamaId: number;
  name: string;
  slug: string;
  status: string;
  adminMemberId: number;
  adminEmail: string;
  mpesaConfigured: boolean;
}

export const chamaApi = {
  register: (payload: ChamaRegistrationRequest) =>
    api.post<ChamaRegistrationResponse>("/chamas/register", payload).then((r) => r.data),
  slugAvailable: (slug: string) =>
    api.get<boolean>("/chamas/slug-available", { params: { slug } }).then((r) => r.data),
  mine: () => api.get<Chama[]>("/chamas/mine").then((r) => r.data),
};

export interface MpesaCredentialView {
  provider?: "MPESA" | "KCB";
  configured: boolean;
  sandbox: boolean;
  shortcode?: string;
  paybill?: string;
  b2cShortcode?: string;
  initiatorName?: string;
  consumerKeyMasked?: string;
  consumerSecretSet: boolean;
  passkeySet: boolean;
  b2cSecurityCredentialSet: boolean;
  kcbInvoiceNumber?: string;
  kcbOrgShortCode?: string;
  kcbSharedShortCode?: boolean;
  status?: string;
  lastVerifiedAt?: string;
  lastVerificationError?: string;
}

export interface MpesaCredentialRequest {
  provider?: "MPESA" | "KCB";
  sandbox: boolean;
  shortcode?: string;
  paybill?: string;
  b2cShortcode?: string;
  initiatorName?: string;
  consumerKey?: string;
  consumerSecret?: string;
  passkey?: string;
  b2cSecurityCredential?: string;
  kcbInvoiceNumber?: string;
  kcbOrgShortCode?: string;
  kcbSharedShortCode?: boolean;
}

export const mpesaVaultApi = {
  get: () => api.get<MpesaCredentialView>(`${CHAMA}/mpesa-credentials`).then((r) => r.data),
  save: (payload: MpesaCredentialRequest) =>
    api.put<MpesaCredentialView>(`${CHAMA}/mpesa-credentials`, payload).then((r) => r.data),
  verify: () => api.post<MpesaCredentialView>(`${CHAMA}/mpesa-credentials/verify`).then((r) => r.data),
  remove: () => api.delete<MpesaCredentialView>(`${CHAMA}/mpesa-credentials`).then((r) => r.data),
  getIpnUrl: () =>
    api.get<{ ipnUrl: string }>(`${CHAMA}/mpesa-credentials/kcb-ipn-url`).then((r) => r.data.ipnUrl),
};

/* ------------------------------------------------------------------ setup */

export interface ContributionSetup {
  enabled: boolean;
  model?: "FIXED" | "FREE_WILL";
  penaltiesEnabled?: boolean;
  name?: string;
  amount?: number;
  frequency?: "WEEKLY" | "BIWEEKLY" | "MONTHLY" | "QUARTERLY" | "CUSTOM_DAYS";
  anchor?: "DAY_OF_MONTH" | "NTH_WEEKDAY" | "DAY_OF_WEEK" | "FIXED_INTERVAL";
  dayOfMonth?: number;
  weekOrdinal?: number;
  dayOfWeek?: number;
  customIntervalDays?: number;
  startDate?: string;
  gracePeriodDays?: number;
  fund?: string;
  /** Days an old fine/arrear may age before new contributions are blocked. 0 = never. */
  blockAfterDays?: number;
  blockOnUnpaidFines?: boolean;
  blockOnUnpaidContributions?: boolean;
}

/** Extra, manually recorded fines that show up in the Fines screen. */
export interface OtherFineSetup {
  name: string;
  description?: string;
  amount?: number;
  percentage?: number;
}

export interface LateFineSetup {
  enabled: boolean;
  calculation?: "FIXED" | "PERCENTAGE" | "PER_PERIOD";
  amount?: number;
  percentage?: number;
  periodUnit?: "DAY" | "WEEK" | "MONTH";
  maxAmount?: number;
  graceDays?: number;
}

export interface MeetingsSetup {
  enabled: boolean;
  frequency?: string;
  dayOfWeek?: number;
  weekOrdinal?: number;
  time?: string;
  venue?: string;
  latenessGraceMinutes?: number;
  quorum?: number;
  absenceFine?: number;
  latenessFine?: number;
}

export interface LoansSetup {
  enabled: boolean;
  name?: string;
  savingsMultiplier?: number;
  minAmount?: number;
  maxAmount?: number;
  interestRate?: number;
  interestMethod?: "FLAT" | "REDUCING_BALANCE" | "ONE_OFF";
  maxDurationMonths?: number;
  minMembershipMonths?: number;
  requiredGuarantors?: number;
  requiredApprovals?: number;
  approverRoles?: string;
  oneActiveLoanPerMember?: boolean;
  arrearsFinePercentage?: number;
}

export interface MgrSetup {
  enabled: boolean;
  name?: string;
  amountPerMember?: number;
  strategy?: "SEQUENTIAL" | "RANDOM_BALLOT" | "MERIT" | "BIDDING";
  frequency?: "WEEKLY" | "BIWEEKLY" | "MONTHLY";
  startDate?: string;
}

export interface WelfareBenefitSetup {
  name: string;
  description?: string;
  maxAmount?: number;
  waitingPeriodDays?: number;
  claimsPerYear?: number;
  requiredApprovals?: number;
}

export interface WelfareSetup {
  enabled: boolean;
  levyAmount?: number;
  benefits?: WelfareBenefitSetup[];
}

export interface InviteSetup {
  fullName: string;
  email: string;
  phone?: string;
  role?: string;
}

export interface LoanDefaultTierSetup {
  minAmount?: number;
  maxAmount?: number;
  percentage?: number;
}

export interface LoanDefaultPolicySetup {
  enabled?: boolean;
  frequency?: "WEEKLY" | "MONTHLY";
  mode?: "PERCENT_OF_PRINCIPAL" | "PERCENT_OF_OUTSTANDING" | "TIERED";
  percentage?: number;
  maxTotalPenalty?: number;
  tiers?: LoanDefaultTierSetup[];
}

export interface ChamaSetupPayload {
  contribution?: ContributionSetup;
  lateFine?: LateFineSetup;
  otherFines?: OtherFineSetup[];
  meetings?: MeetingsSetup;
  loans?: LoansSetup;
  merryGoRound?: MgrSetup;
  welfare?: WelfareSetup;
  loanDefaultPolicy?: LoanDefaultPolicySetup;
  invites?: InviteSetup[];
  paymentProvider?: string;
  markComplete?: boolean;
}

export interface ChamaSetupRecord {
  id: number;
  meetingFrequency: string;
  meetingDayOfWeek: number;
  meetingWeekOrdinal: number;
  meetingTime: string;
  meetingVenue?: string;
  meetingLatenessGraceMinutes: number;
  meetingQuorum: number;
  contributionsEnabled: boolean;
  finesEnabled: boolean;
  loansEnabled: boolean;
  merryGoRoundEnabled: boolean;
  welfareEnabled: boolean;
  meetingsEnabled: boolean;
  currency: string;
  completedAt?: string;
  contributionModel?: string;
  contributionPenaltiesEnabled?: boolean;
  contributionBlockAfterDays?: number;
  blockOnUnpaidFines?: boolean;
  blockOnUnpaidContributions?: boolean;
  paymentProvider?: string;
}

export interface ChamaSetupView {
  setup?: ChamaSetupRecord;
  contributionPlans: any[];
  fineRules: any[];
  fineTypes: any[];
  loanProducts: any[];
  welfareBenefits: WelfareBenefit[];
  mgrCycles: MgrCycle[];
}

export const setupApi = {
  current: () => api.get<ChamaSetupView>(`${CHAMA}/setup`).then((r) => r.data),
  apply: (payload: ChamaSetupPayload) =>
    api.post<ChamaSetupView>(`${CHAMA}/setup`, payload).then((r) => r.data),
};

export const loanDefaultPolicyApi = {
  get: () =>
    api.get<LoanDefaultPolicySetup>(`${CHAMA}/loan-default-policy`).then((r) => r.data),
  save: (payload: LoanDefaultPolicySetup) =>
    api.put<LoanDefaultPolicySetup>(`${CHAMA}/loan-default-policy`, payload).then((r) => r.data),
  run: () =>
    api.post<{ penaltiesCharged: number }>(`${CHAMA}/loan-default-policy/run`).then((r) => r.data),
};

export interface ChamaInvite {
  id: number;
  fullName: string;
  email: string;
  phone?: string;
  role: string;
  token: string;
  status: "PENDING" | "ACCEPTED" | "REVOKED" | "EXPIRED";
  expiresAt?: string;
  acceptedAt?: string;
}

export interface InvitePreview {
  chamaName: string;
  chamaSlug: string;
  fullName: string;
  email: string;
  role: string;
}

export const invitesApi = {
  list: () => api.get<ChamaInvite[]>(`${CHAMA}/invites`).then((r) => r.data),
  create: (payload: InviteSetup) =>
    api.post<ChamaInvite>(`${CHAMA}/invites`, payload).then((r) => r.data),
  revoke: (id: number) => api.delete<ChamaInvite>(`${CHAMA}/invites/${id}`).then((r) => r.data),
  preview: (token: string) =>
    api.get<InvitePreview>(`/invites/${token}`).then((r) => r.data),
  accept: (token: string, password: string) =>
    api.post<InvitePreview>(`/invites/${token}/accept`, { password }).then((r) => r.data),
};


/* ------------------------------------------------- investments & dividends */

export type InvestmentEntryType = "ACQUISITION" | "EXPENSE" | "INCOME";

export interface InvestmentEntry {
  id: number;
  type: InvestmentEntryType;
  amount: number;
  entryDate: string;
  description?: string;
  reference?: string;
}

export interface InvestmentView {
  id: number;
  name: string;
  description?: string;
  category?: string;
  status: string;
  startDate?: string;
  exitDate?: string;
  currentValuation?: number;
  initialOutlay: number;
  operationalExpenses: number;
  totalCostBasis: number;
  totalIncome: number;
  netProfit: number;
  roiPercentage: number;
  entries: InvestmentEntry[];
}

export interface InvestmentRequest {
  name: string;
  description?: string;
  category?: string;
  status?: string;
  startDate?: string;
  exitDate?: string;
  currentValuation?: number;
  initialOutlay?: number;
  outlayDescription?: string;
  outlayReference?: string;
}

export interface InvestmentEntryRequest {
  type: InvestmentEntryType;
  amount: number;
  entryDate?: string;
  description?: string;
  reference?: string;
}

export const investmentsApi = {
  list: () => api.get<InvestmentView[]>(`${CHAMA}/investments`).then((r) => r.data),
  get: (id: number) => api.get<InvestmentView>(`${CHAMA}/investments/${id}`).then((r) => r.data),
  create: (payload: InvestmentRequest) =>
    api.post<InvestmentView>(`${CHAMA}/investments`, payload).then((r) => r.data),
  update: (id: number, payload: InvestmentRequest) =>
    api.put<InvestmentView>(`${CHAMA}/investments/${id}`, payload).then((r) => r.data),
  addEntry: (id: number, payload: InvestmentEntryRequest) =>
    api.post<InvestmentView>(`${CHAMA}/investments/${id}/entries`, payload).then((r) => r.data),
  deleteEntry: (id: number, entryId: number) =>
    api.delete(`${CHAMA}/investments/${id}/entries/${entryId}`).then((r) => r.data),
  profit: () =>
    api.get<{ netProfit: number }>(`${CHAMA}/investments/profit`).then((r) => r.data.netProfit),
};

export interface EquityShare {
  memberId: number;
  memberName: string;
  validSavings: number;
  equityPercentage: number;
  shareValue: number;
}

export interface DividendDeclaration {
  id: number;
  title: string;
  investmentId?: number;
  payoutPool: number;
  savingsPoolSnapshot: number;
  declarationDate: string;
  status: string;
  note?: string;
  paidAt?: string;
}

export interface DividendAllocation {
  id: number;
  declarationId: number;
  memberId: number;
  memberName: string;
  savingsSnapshot: number;
  equityPercentage: number;
  amount: number;
  paid: boolean;
  paidAt?: string;
  payoutReference?: string;
}

export interface DividendView {
  declaration: DividendDeclaration;
  allocations: DividendAllocation[];
}

export const dividendsApi = {
  list: () => api.get<DividendDeclaration[]>(`${CHAMA}/dividends`).then((r) => r.data),
  get: (id: number) => api.get<DividendView>(`${CHAMA}/dividends/${id}`).then((r) => r.data),
  distributable: (investmentId?: number) =>
    api
      .get<{ distributable: number }>(`${CHAMA}/dividends/distributable`, {
        params: investmentId ? { investmentId } : {},
      })
      .then((r) => r.data.distributable),
  equity: () => api.get<EquityShare[]>(`${CHAMA}/dividends/equity`).then((r) => r.data),
  declare: (payload: {
    title: string;
    investmentId?: number | null;
    payoutPool: number;
    declarationDate?: string;
    note?: string;
  }) => api.post<DividendView>(`${CHAMA}/dividends`, payload).then((r) => r.data),
  pay: (id: number, allocationId: number, reference?: string) =>
    api
      .post<DividendView>(`${CHAMA}/dividends/${id}/allocations/${allocationId}/pay`, null, {
        params: reference ? { reference } : {},
      })
      .then((r) => r.data),
  payAll: (id: number, reference?: string) =>
    api
      .post<DividendView>(`${CHAMA}/dividends/${id}/pay-all`, null, {
        params: reference ? { reference } : {},
      })
      .then((r) => r.data),
};

export interface MemberPortfolioView {
  memberId: number;
  memberName: string;
  memberNumber?: string;
  joinDate?: string;
  validSavings: number;
  equityPercentage: number;
  shareValue: number;
  chamaSavingsPool: number;
  dividendsEarned: number;
  dividendsPaid: number;
  dividendHistory: DividendAllocation[];
  finesAssessed: number;
  finesPaid: number;
  finesOutstanding: number;
  finesCount: number;
  totalBorrowed: number;
  totalRepaid: number;
  interestPaid: number;
  outstandingLoanBalance: number;
  activeLoans: number;
}

export const portfolioApi = {
  member: (memberId: number) =>
    api.get<MemberPortfolioView>(`${CHAMA}/portfolio/${memberId}`).then((r) => r.data),
  equity: () => api.get<EquityShare[]>(`${CHAMA}/portfolio/equity`).then((r) => r.data),
};
