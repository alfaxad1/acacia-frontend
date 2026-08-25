/* eslint-disable @typescript-eslint/no-explicit-any */
export enum MemberStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  SUSPENDED = "SUSPENDED",
}
export enum Role {
  MEMBER = "MEMBER",
  ADMIN = "ADMIN",
}

export enum LoanStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  DISBURSED = "DISBURSED",
  REPAID = "REPAID",
  REJECTED = "REJECTED",
  DEFAULTED = "DEFAULTED",
}

export enum ExtraType {
  ARREAR = "ARREAR",
  SURPLUS = "SURPLUS",
}

export enum ExtraStatus {
  ACTIVE = "ACTIVE",
  CLEARED = "CLEARED",
}

export enum VoteDecision {
  APPROVE = "APPROVE",
  REJECT = "REJECT",
}

export enum FineTyp {
  //LATE_PAYMENT = 'LATE_PAYMENT',
  LATE_MEETINGS = "LATE_MEETINGS",
  MEETING_ABSENTEEISM = "MEETING_ABSENTEEISM",
}

export enum FineStatus {
  PAID = "PAID",
  UNPAID = "UNPAID",
}

export interface DashboardSummary {
  saccoBalance: number;
  totalLoansIssued: number;
  activeLoans: number;
  paybillBalance: number;
  availableLoanAmount: number;
  members: number;
  totalContributions: number;
  recentTransactions: any[];
  personalStats: PersonalStats;
}

export interface PersonalStats {
  totalFinesAmount: number;
  numberOfFines: number;
  totalLoanAmount: number;
  numberOfLoans: number;
  missedContributionsAmount: number;
  numberOfMissedContributions: number;
  joinDate: string;
  premium: boolean;
  totalMemberContribution: number;
}

export interface LoanRequest {
  memberId: number;
  amount: number;
}

export interface ContributionRequest {
  memberId: number;
  periodId: number;
  amount: number;
  paymentDate?: string;
}

export interface MemberRequest {
  id?: number;
  fullName: string;
  phone: string;
  email: string;
  joinDate: string;
  password?: string;
  role: Role;
}

export interface BillDto {
  id: number;
  memberId: number;
  memberName: string | null;
  amountDue: number;
  amountPaid: number;
  status: string;
  settledAt: string | null;
}

export interface BillGroupDto {
  dueDate: string;
  totalTarget: number;
  collected: number;
  bills: BillDto[];
}

export interface PlanSummaryDto {
  planId: number;
  planName: string;
  billGroups: BillGroupDto[];
}

export interface Member {
  id: number;
  memberNumber: string;
  fullName: string;
  phone: string;
  email: string;
  joinDate: string;
  status: MemberStatus;
  role: Role;
  creditScore?: number;
}

export interface Period {
  id: number;
  name: string;
  expectedAmount: number;
}

export interface Loan {
  id: number;
  memberName: string;
  requestedAmount: number;
  approvedAmount: number;
  paidAmount: number;
  dueDate: string;
  interestAmount: number;
  status: LoanStatus;
  duration: number;
  requestDate: string;
  approvedDate?: string;
  eligibleAmount: number;
  memberNo: string;
  memberId: number;
  totalPayableAmount: number;
  balance: number;
  repaidDate: string;
  penalties?: any[];
  totalPenalties?: number;
}

export interface FineDto {
  id: number;
  memberName: string;
  memberId: number;
  amount: number;
  date: string;
  status: FineStatus;
  fineTypeName: string;
  fineTypeId: number;
  paidDate: string;
}

export interface FineRequest {
  memberId: number;
  fineTypeId: number;
  fineDate: string;
}

export interface FineTypeRequest {
  name: string;
  description: string;
  amount: number;
  percentage: number;
}

export interface FineType {
  id: number;
  name: string;
  type?: string;
  fineTypeName?: string;
}

export interface UserData {
  memberId: number;
  name: string;
  email: string;
  role: string;
  phone?: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string | null;
  expirationTime: number;
  userData: UserData;
}
export interface PageMetaData {
  page: number;
  totalPages: number;
  totalElements: number;
  limit: number;
}

export interface ApiResponse<T> {
  status: number;
  message: string;
  data: T;
  metaData?: PageMetaData;
}

export interface ExtraDto {
  id: number;
  memberName: string;
  amount: number;
  date: string;
  periodDate: string;
  extraType: ExtraType;
  status: ExtraStatus;
}

export interface Deferred<T> {
  resolve: (value: T | PromiseLike<T>) => void;
  reject: (reason?: any) => void;
}

export enum AdjustmentType {
  DEBIT = "DEBIT",
  CREDIT = "CREDIT",
}

export interface AccountAdjustment {
  id?: number;
  amount: number;
  transactionCost: number;
  totalCost: number;
  date: string;
  type: AdjustmentType;
  description: string;
}

export interface ContributionArrearDto {
  id: number;
  periodDate: string;
  memberName: string;
  arrearAmount: number;
  fineAmount: number;
}

export enum TransactionStatus {
  PENDING = "PENDING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
}

export interface B2cTransferDto {
  id: number;
  amount: number;
  recipientPhone: string;
  reason: string;
  status: TransactionStatus;
  initiatedById: number;
  initiatedByName: string;
  authorizedById: number | null;
  authorizedByName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LedgerAccountDto {
  id: number;
  code: string;
  name: string;
  type: string;
  fund: string;
  ownerMemberId: number | null;
  active: boolean;
  balance: number;
}
